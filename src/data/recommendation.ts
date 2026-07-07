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
  // 참석자 id → 해당 후보에서의 참석 상태. 테이블에 없는 인물(새로 추가된 참석자)은 full로 간주.
  availability: Record<string, AttendanceStatus>;
}

// 실제 가용시간 수집이 없는 목업이므로, 후보별 참석 상태를 고정 패턴으로 재현 (가설 C 시연용)
const CANDIDATE_PATTERNS: CandidatePattern[] = [
  { startMinutes: 14 * 60, availability: { 'opt-2': 'partial', 'opt-3': 'none' } },
  { startMinutes: 11 * 60, availability: { 'req-2': 'none', 'opt-3': 'none' } },
  { startMinutes: 10 * 60, availability: { 'req-4': 'none', 'opt-2': 'none', 'opt-3': 'none' } },
  { startMinutes: 16 * 60, availability: { 'opt-1': 'none', 'opt-2': 'none', 'opt-3': 'none' } },
];

function statusAt(pattern: CandidatePattern, attendee: InvitedAttendee): AttendanceStatus {
  const raw = pattern.availability[attendee.id] ?? 'full';
  // 필수는 전체 시간 참석이 전제 — 부분 가능(◐)은 선택 참석자 전용이므로 불참으로 간주
  if (attendee.role === 'required' && raw === 'partial') return 'none';
  return raw;
}

// 정렬 1위가 메인 추천, 나머지는 대안 후보. 화면 ①에서 정한 가능 기간의 실제 날짜에 매핑한다.
export function recommendTimes(
  attendees: InvitedAttendee[],
  durationMinutes: number,
  rangeDays: Date[],
  dayStartMinutes = 9 * 60,
  dayEndMinutes = 18 * 60,
): Recommendation[] {
  const latestStart = Math.max(dayStartMinutes, dayEndMinutes - durationMinutes);

  const scored = CANDIDATE_PATTERNS.map((pattern, index) => {
    // 범위 안에서 후보를 날짜별로 분산 (기존 화~금 분포와 동일하게 2번째 날부터)
    const day = rangeDays[Math.min(index + 1, rangeDays.length - 1)];
    const startMinutes = Math.min(Math.max(pattern.startMinutes, dayStartMinutes), latestStart);
    const toAttendee = (attendee: InvitedAttendee): Attendee => ({
      id: attendee.id,
      name: attendee.name,
      status: statusAt(pattern, attendee),
    });
    const requiredAttendees = attendees.filter((a) => a.role === 'required').map(toAttendee);
    const optionalAttendees = attendees.filter((a) => a.role === 'optional').map(toAttendee);
    const requiredFull = requiredAttendees.filter((a) => a.status === 'full').length;
    const optionalFull = optionalAttendees.filter((a) => a.status === 'full').length;
    return {
      // 예: "7/14 화요일 오후 2:00 - 3:00" — 요일만으로는 어느 주인지 모호해 실제 날짜를 병기
      timeLabel: `${formatMonthDay(day)} ${formatTimeRange(fullWeekdayName(day), startMinutes, durationMinutes)}`,
      requiredAttendees,
      optionalAttendees,
      allRequired: requiredFull === requiredAttendees.length,
      requiredFull,
      optionalFull,
    };
  });

  scored.sort((a, b) => {
    if (a.allRequired !== b.allRequired) return a.allRequired ? -1 : 1;
    if (a.requiredFull !== b.requiredFull) return b.requiredFull - a.requiredFull;
    return b.optionalFull - a.optionalFull;
  });

  // 좁은 기간·시간대에서 후보가 같은 시각으로 수렴하면 중복 라벨 제거 (탭 키 충돌 방지)
  const seen = new Set<string>();
  return scored
    .filter((slot) => !seen.has(slot.timeLabel) && Boolean(seen.add(slot.timeLabel)))
    .map((slot) => ({
      timeLabel: slot.timeLabel,
      requiredAttendees: slot.requiredAttendees,
      optionalAttendees: slot.optionalAttendees,
      isFallback: !slot.allRequired,
    }));
}
