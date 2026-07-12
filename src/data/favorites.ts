import type { InvitedAttendee } from './mockAttendees';

// v2 — 부서별로 쪼개던 이전 저장 방식(rememberAttendeeGroups)이 남긴 칩을
// 정리하기 위해 키를 교체 (기존 키의 데이터는 더 이상 읽지 않아 자연히 사라짐)
const FAVORITE_GROUPS_KEY = 'toss-meeting-favorite-groups-v2';

export interface FavoriteAttendee {
  name: string;
  role: InvitedAttendee['role'];
  team?: string;
}

export interface FavoriteGroup {
  id: string;
  name: string;
  attendees: FavoriteAttendee[];
}

function safeParseGroups(raw: string | null): FavoriteGroup[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as FavoriteGroup[];
    return Array.isArray(parsed) ? parsed.filter((group) => group.attendees?.length > 0) : [];
  } catch {
    return [];
  }
}

export function loadFavoriteGroups(): FavoriteGroup[] {
  if (typeof window === 'undefined') return [];
  return safeParseGroups(window.localStorage.getItem(FAVORITE_GROUPS_KEY));
}

export function saveFavoriteGroups(groups: FavoriteGroup[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(FAVORITE_GROUPS_KEY, JSON.stringify(groups));
}

function normalizeAttendee(attendee: InvitedAttendee): FavoriteAttendee {
  return {
    name: attendee.name,
    role: attendee.role,
    team: attendee.team,
  };
}

function upsertGroup(groups: FavoriteGroup[], group: FavoriteGroup): FavoriteGroup[] {
  const rest = groups.filter((existing) => existing.id !== group.id);
  return [group, ...rest].slice(0, 8);
}

// "참석자 세트로 저장" 토글이 켜져 있는 동안 회의명을 키로 실시간 upsert —
// 회의 하나당 칩 하나를 유지한다 (부서별로 쪼개던 이전 방식은 제거).
export function upsertMeetingGroup(title: string, attendees: InvitedAttendee[]): FavoriteGroup[] {
  const meetingName = title.trim();
  const validAttendees = attendees.filter((attendee) => attendee.name.trim() !== '');
  if (meetingName === '' || validAttendees.length === 0) return loadFavoriteGroups();

  const next = upsertGroup(loadFavoriteGroups(), {
    id: `meeting-${meetingName}`,
    name: meetingName,
    attendees: validAttendees.map(normalizeAttendee),
  });
  saveFavoriteGroups(next);
  return next;
}
