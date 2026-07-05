import type { AttendanceStatus, Attendee, InvitedAttendee } from './mockAttendees';

export interface Recommendation {
  timeLabel: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
  isFallback: boolean;
}

interface CandidateSlot {
  timeLabel: string;
  // 참석자 id → 해당 슬롯에서의 참석 상태. 테이블에 없는 인물(새로 추가된 참석자)은 full로 간주.
  availability: Record<string, AttendanceStatus>;
}

const CANDIDATE_SLOTS: CandidateSlot[] = [
  {
    timeLabel: '화요일 오후 2:00 - 3:00',
    availability: { 'opt-2': 'partial', 'opt-3': 'none' },
  },
  {
    timeLabel: '목요일 오전 10:00 - 11:00',
    availability: { 'req-4': 'none', 'opt-2': 'none', 'opt-3': 'none' },
  },
];

function statusAt(slot: CandidateSlot, attendee: InvitedAttendee): AttendanceStatus {
  const raw = slot.availability[attendee.id] ?? 'full';
  // 필수는 1시간 전체 참석이 전제 — 부분 가능(▲)은 선택 참석자 전용이므로 불참으로 간주
  if (attendee.role === 'required' && raw === 'partial') return 'none';
  return raw;
}

export function recommendTime(attendees: InvitedAttendee[]): Recommendation {
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
      timeLabel: slot.timeLabel,
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

  const best = scored[0];
  return {
    timeLabel: best.timeLabel,
    requiredAttendees: best.requiredAttendees,
    optionalAttendees: best.optionalAttendees,
    isFallback: !best.allRequired,
  };
}
