import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Attendee, InvitedAttendee, ResponseStatus } from '../data/mockAttendees';

export interface ConfirmedResult {
  timeLabel: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
}

interface MeetingContextValue {
  title: string;
  attendees: InvitedAttendee[];
  durationMinutes: number;
  weeksAhead: number; // 0=이번 주, 1=다음 주, 2 이상=직접 선택한 N주 후
  responses: ResponseStatus[];
  confirmed: ConfirmedResult | null;
  createMeeting: (
    title: string,
    attendees: InvitedAttendee[],
    durationMinutes: number,
    weeksAhead: number,
  ) => void;
  markNextResponded: () => void;
  confirmMeeting: (result: ConfirmedResult) => void;
  resetMeeting: () => void;
}

const MeetingContext = createContext<MeetingContextValue | null>(null);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('');
  const [attendees, setAttendees] = useState<InvitedAttendee[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(60);
  // SPEC.md 시나리오("1주일 내 회의를 잡는다")와 일치하도록 기본값은 '다음 주'(1)
  const [weeksAhead, setWeeksAhead] = useState(1);
  const [responses, setResponses] = useState<ResponseStatus[]>([]);
  const [confirmed, setConfirmed] = useState<ConfirmedResult | null>(null);

  const createMeeting = (
    newTitle: string,
    newAttendees: InvitedAttendee[],
    newDuration: number,
    newWeeksAhead: number,
  ) => {
    setTitle(newTitle);
    setAttendees(newAttendees);
    setDurationMinutes(newDuration);
    setWeeksAhead(newWeeksAhead);
    // 참석자 플로우가 범위 밖이라 마지막 2명을 미응답으로 시작, 화면 ②에서 도착을 시뮬레이션
    setResponses(
      newAttendees.map((attendee, index) => ({
        id: attendee.id,
        name: attendee.name,
        responded: index < newAttendees.length - 2,
      })),
    );
    setConfirmed(null);
  };

  const markNextResponded = () => {
    setResponses((prev) => {
      const nextIndex = prev.findIndex((response) => !response.responded);
      if (nextIndex === -1) return prev;
      return prev.map((response, index) =>
        index === nextIndex ? { ...response, responded: true } : response,
      );
    });
  };

  const confirmMeeting = (result: ConfirmedResult) => {
    setConfirmed(result);
  };

  // 화면 ④ "새 회의 만들기" — 화면 ①이 빈 상태(기본값)에서 다시 시작하도록 전부 초기화
  const resetMeeting = () => {
    setTitle('');
    setAttendees([]);
    setDurationMinutes(60);
    setWeeksAhead(1);
    setResponses([]);
    setConfirmed(null);
  };

  return (
    <MeetingContext.Provider
      value={{
        title,
        attendees,
        durationMinutes,
        weeksAhead,
        responses,
        confirmed,
        createMeeting,
        markNextResponded,
        confirmMeeting,
        resetMeeting,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting(): MeetingContextValue {
  const context = useContext(MeetingContext);
  if (!context) throw new Error('useMeeting must be used within MeetingProvider');
  return context;
}
