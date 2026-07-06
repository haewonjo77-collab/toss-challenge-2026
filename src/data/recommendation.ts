import type { AttendanceStatus, Attendee, InvitedAttendee } from './mockAttendees';
import { formatTimeRange } from './time';

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

// AS-IS(가설 C 비교군)는 필수/선택을 무시하고 전체 참석 가능 수로만 정렬 — 기존 도구 재현
export type RecommendMode = 'priority' | 'headcount';

// 정렬 1위가 메인 추천, 나머지는 "다른 시간 보기" 대안 후보
export function recommendTimes(
  attendees: InvitedAttendee[],
  durationMinutes: number,
  mode: RecommendMode = 'priority',
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
      timeLabel: formatTimeRange(slot.day, slot.startMinutes, durationMinutes),
      requiredAttendees,
      optionalAttendees,
      allRequired: requiredFull === requiredAttendees.length,
      requiredFull,
      optionalFull,
    };
  });

  scored.sort((a, b) => {
    if (mode === 'headcount') {
      return b.requiredFull + b.optionalFull - (a.requiredFull + a.optionalFull);
    }
    if (a.allRequired !== b.allRequired) return a.allRequired ? -1 : 1;
    if (a.requiredFull !== b.requiredFull) return b.requiredFull - a.requiredFull;
    return b.optionalFull - a.optionalFull;
  });

  return scored.map((slot) => ({
    timeLabel: slot.timeLabel,
    requiredAttendees: slot.requiredAttendees,
    optionalAttendees: slot.optionalAttendees,
    // 차선책(필수 빠짐 경고) 개념 자체가 TO-BE 기능 — headcount 모드에서는 항상 일반 추천으로 취급
    isFallback: mode === 'priority' && !slot.allRequired,
  }));
}
