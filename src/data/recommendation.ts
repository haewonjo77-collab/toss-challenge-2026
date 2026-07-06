import type { AttendanceStatus, Attendee, InvitedAttendee } from './mockAttendees';
import { formatTimeRange } from './time';
import { dateForWeekday, formatMonthDay } from './schedule';

export interface Recommendation {
  timeLabel: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
  isFallback: boolean;
}

interface CandidateSlot {
  day: string;
  startMinutes: number;
  // 참석자 id → 해당 슬롯에서의 참석 상태. 테이블에 없는 인물(새로 추가된 참석자)은 full로 간주.
  availability: Record<string, AttendanceStatus>;
}

const CANDIDATE_SLOTS: CandidateSlot[] = [
  {
    day: '화요일',
    startMinutes: 14 * 60,
    availability: { 'opt-2': 'partial', 'opt-3': 'none' },
  },
  {
    day: '수요일',
    startMinutes: 11 * 60,
    availability: { 'req-2': 'none', 'opt-3': 'none' },
  },
  {
    day: '목요일',
    startMinutes: 10 * 60,
    availability: { 'req-4': 'none', 'opt-2': 'none', 'opt-3': 'none' },
  },
  {
    day: '금요일',
    startMinutes: 16 * 60,
    availability: { 'opt-1': 'none', 'opt-2': 'none', 'opt-3': 'none' },
  },
];

function statusAt(slot: CandidateSlot, attendee: InvitedAttendee): AttendanceStatus {
  const raw = slot.availability[attendee.id] ?? 'full';
  // 필수는 1시간 전체 참석이 전제 — 부분 가능(▲)은 선택 참석자 전용이므로 불참으로 간주
  if (attendee.role === 'required' && raw === 'partial') return 'none';
  return raw;
}

// 정렬 1위가 메인 추천, 나머지는 대안 후보. weeksAhead(화면 ①의 가능 기간)로 실제 날짜를 계산한다.
export function recommendTimes(
  attendees: InvitedAttendee[],
  durationMinutes: number,
  weeksAhead: number,
): Recommendation[] {
  const scored = CANDIDATE_SLOTS.map((slot) => {
    const toAttendee = (attendee: InvitedAttendee): Attendee => ({
      id: attendee.id,
      name: attendee.name,
      status: statusAt(slot, attendee),
    });
    const requiredAttendees = attendees.filter((a) => a.role === 'required').map(toAttendee);
    const optionalAttendees = attendees.filter((a) => a.role === 'optional').map(toAttendee);
    const requiredFull = requiredAttendees.filter((a) => a.status === 'full').length;
    const optionalFull = optionalAttendees.filter((a) => a.status === 'full').length;
    return {
      // 예: "7/14 화요일 오후 2:00 - 3:00" — 요일만으로는 어느 주인지 모호해 실제 날짜를 병기
      timeLabel: `${formatMonthDay(dateForWeekday(slot.day, weeksAhead))} ${formatTimeRange(
        slot.day,
        slot.startMinutes,
        durationMinutes,
      )}`,
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

  return scored.map((slot) => ({
    timeLabel: slot.timeLabel,
    requiredAttendees: slot.requiredAttendees,
    optionalAttendees: slot.optionalAttendees,
    isFallback: !slot.allRequired,
  }));
}
