import type { InvitedAttendee } from './mockAttendees';

const FAVORITE_GROUPS_KEY = 'toss-meeting-favorite-groups';

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

// "이 회의 참석자 저장" 토글이 켜져 있는 동안 회의명을 키로 실시간 upsert —
// 팀별로 쪼개는 rememberAttendeeGroups와 달리 회의 하나당 칩 하나를 유지한다.
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

export function rememberAttendeeGroups(attendees: InvitedAttendee[]): FavoriteGroup[] {
  const saved = loadFavoriteGroups();
  const validAttendees = attendees.filter((attendee) => attendee.name.trim() !== '');
  if (validAttendees.length === 0) return saved;

  let next = upsertGroup(saved, {
    id: 'all',
    name: '최근 회의 전체',
    attendees: validAttendees.map(normalizeAttendee),
  });

  const teams = Array.from(new Set(validAttendees.map((attendee) => attendee.team).filter(Boolean)));
  teams.forEach((team) => {
    const teamName = team as string;
    const members = validAttendees.filter((attendee) => attendee.team === teamName);
    next = upsertGroup(next, {
      id: `team-${teamName}`,
      name: teamName,
      attendees: members.map(normalizeAttendee),
    });
  });

  saveFavoriteGroups(next);
  return next;
}
