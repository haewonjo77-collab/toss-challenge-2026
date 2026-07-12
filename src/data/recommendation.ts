import type { AttendanceStatus, Attendee, InvitedAttendee } from './mockAttendees';
import { formatTimeRange } from './time';
import { formatMonthDay, fullWeekdayName } from './schedule';

export interface Recommendation {
  timeLabel: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
  isFallback: boolean;
}

interface CandidatePattern {
  startMinutes: number; // 선호 시작 시각 — 화면 ①의 시간대 범위로 클램프됨
  // 참석자 id → 해당 후보에서의 참석 상태. 테이블에 없는 인물은 역할 내 순서로 목업 상태를 적용.
  availability: Record<string, AttendanceStatus>;
  requiredNoneIndexes?: number[];
  optionalPartialIndexes?: number[];
  optionalNoneIndexes?: number[];
}

// 실제 가용시간 수집이 없는 목업이므로, 후보별 참석 상태를 고정 패턴으로 재현 (가설 C 시연용)
const CANDIDATE_PATTERNS: CandidatePattern[] = [
  {
    startMinutes: 14 * 60,
    availability: { 'opt-2': 'partial', 'opt-3': 'none' },
    requiredNoneIndexes: [0],
    optionalPartialIndexes: [1],
    optionalNoneIndexes: [2],
  },
  {
    startMinutes: 11 * 60,
    availability: { 'req-2': 'none', 'opt-3': 'none' },
    requiredNoneIndexes: [1],
    optionalNoneIndexes: [2],
  },
  {
    startMinutes: 15 * 60,
    availability: { 'req-2': 'none', 'opt-2': 'partial' },
    requiredNoneIndexes: [2],
    optionalPartialIndexes: [1],
  },
  {
    startMinutes: 10 * 60,
    availability: { 'req-4': 'none', 'opt-2': 'none', 'opt-3': 'none' },
    requiredNoneIndexes: [3],
    optionalNoneIndexes: [1, 2],
  },
  {
    startMinutes: 16 * 60,
    availability: { 'opt-1': 'none', 'opt-2': 'none', 'opt-3': 'none' },
    requiredNoneIndexes: [0],
    optionalNoneIndexes: [0, 1, 2],
  },
];

function statusAt(pattern: CandidatePattern, attendee: InvitedAttendee, roleIndex: number): AttendanceStatus {
  const fallback =
    attendee.role === 'required'
      ? pattern.requiredNoneIndexes?.includes(roleIndex)
        ? 'none'
        : 'full'
      : pattern.optionalNoneIndexes?.includes(roleIndex)
        ? 'none'
        : pattern.optionalPartialIndexes?.includes(roleIndex)
          ? 'partial'
          : 'full';
  const raw = pattern.availability[attendee.id] ?? fallback;
  // 필수는 전체 시간 참석이 전제 — 부분 가능(◐)은 선택 참석자 전용이므로 불참으로 간주
  if (attendee.role === 'required' && raw === 'partial') return 'none';
  return raw;
}

function optionalScore(attendees: Attendee[]): number {
  return attendees.reduce((score, attendee) => {
    if (attendee.status === 'full') return score + 2;
    if (attendee.status === 'partial') return score + 1;
    return score;
  }, 0);
}

function requiredMissingCount(attendees: Attendee[]): number {
  return attendees.filter((attendee) => attendee.status !== 'full').length;
}

// 정렬 1위가 메인 추천, 나머지는 대안 후보. 필수 참석자 전원 가능 후보만 추천 자격을 가진다.
export function recommendTimes(
  attendees: InvitedAttendee[],
  durationMinutes: number,
  rangeDays: Date[],
  dayStartMinutes = 9 * 60,
  dayEndMinutes = 18 * 60,
): Recommendation[] {
  const latestStart = Math.max(dayStartMinutes, dayEndMinutes - durationMinutes);
  const requiredSource = attendees.filter((a) => a.role === 'required');
  const optionalSource = attendees.filter((a) => a.role === 'optional');

  const scored = CANDIDATE_PATTERNS.map((pattern, index) => {
    // 범위 안에서 후보를 날짜별로 분산 (기존 화~금 분포와 동일하게 2번째 날부터)
    const day = rangeDays[Math.min(index + 1, rangeDays.length - 1)];
    const startMinutes = Math.min(Math.max(pattern.startMinutes, dayStartMinutes), latestStart);
    const toAttendee = (attendee: InvitedAttendee, roleIndex: number): Attendee => ({
      id: attendee.id,
      name: attendee.name,
      team: attendee.team,
      status: statusAt(pattern, attendee, roleIndex),
    });
    const requiredAttendees = requiredSource.map(toAttendee);
    const optionalAttendees = optionalSource.map(toAttendee);
    const requiredFull = requiredAttendees.filter((a) => a.status === 'full').length;
    const optionalFull = optionalAttendees.filter((a) => a.status === 'full').length;
    const optionalPartial = optionalAttendees.filter((a) => a.status === 'partial').length;
    const missingRequired = requiredMissingCount(requiredAttendees);
    return {
      // 예: "7/14 화요일 오후 2:00 - 3:00" — 요일만으로는 어느 주인지 모호해 실제 날짜를 병기
      timeLabel: `${formatMonthDay(day)} ${formatTimeRange(fullWeekdayName(day), startMinutes, durationMinutes)}`,
      startMinutes,
      dayTime: day.getTime(),
      requiredAttendees,
      optionalAttendees,
      allRequired: requiredFull === requiredAttendees.length,
      missingRequired,
      optionalFull,
      optionalPartial,
      optionalScore: optionalScore(optionalAttendees),
    };
  });

  const strictCandidates = scored.filter((slot) => slot.allRequired);
  const fallbackCandidates =
    strictCandidates.length > 0
      ? []
      : scored.filter((slot) => slot.missingRequired === 1);
  const rankedCandidates = strictCandidates.length > 0 ? strictCandidates : fallbackCandidates;

  rankedCandidates.sort((a, b) => {
    if (a.optionalScore !== b.optionalScore) return b.optionalScore - a.optionalScore;
    if (a.optionalFull !== b.optionalFull) return b.optionalFull - a.optionalFull;
    if (a.optionalPartial !== b.optionalPartial) return b.optionalPartial - a.optionalPartial;
    if (a.dayTime !== b.dayTime) return a.dayTime - b.dayTime;
    return a.startMinutes - b.startMinutes;
  });

  // 좁은 기간·시간대에서 후보가 같은 시각으로 수렴하면 중복 라벨 제거 (탭 키 충돌 방지)
  const seen = new Set<string>();
  return rankedCandidates
    .filter((slot) => !seen.has(slot.timeLabel) && Boolean(seen.add(slot.timeLabel)))
    .map((slot) => ({
      timeLabel: slot.timeLabel,
      requiredAttendees: slot.requiredAttendees,
      optionalAttendees: slot.optionalAttendees,
      isFallback: !slot.allRequired,
    }));
}
