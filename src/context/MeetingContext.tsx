import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Attendee, InvitedAttendee, ResponseStatus } from '../data/mockAttendees';
import type { WeekScope } from '../data/schedule';

export interface ConfirmedResult {
  timeLabel: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
}

interface MeetingContextValue {
  title: string;
  attendees: InvitedAttendee[];
  durationMinutes: number;
  weekScope: WeekScope;
  responses: ResponseStatus[];
  confirmed: ConfirmedResult | null;
  createMeeting: (
    title: string,
    attendees: InvitedAttendee[],
    durationMinutes: number,
    weekScope: WeekScope,
  ) => void;
  markNextResponded: () => void;
  confirmMeeting: (result: ConfirmedResult) => void;
}

const MeetingContext = createContext<MeetingContextValue | null>(null);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('');
  const [attendees, setAttendees] = useState<InvitedAttendee[]>([]);
  const [durationMinutes, setDurationMinutes] = useState(60);
  // SPEC.md 시나리오("1주일 내 회의를 잡는다")와 일치하도록 기본값은 '다음 주'
  const [weekScope, setWeekScope] = useState<WeekScope>('next');
  const [responses, setResponses] = useState<ResponseStatus[]>([]);
  const [confirmed, setConfirmed] = useState<ConfirmedResult | null>(null);

  const createMeeting = (
    newTitle: string,
    newAttendees: InvitedAttendee[],
    newDuration: number,
    newWeekScope: WeekScope,
  ) => {
    setTitle(newTitle);
    setAttendees(newAttendees);
    setDurationMinutes(newDuration);
    setWeekScope(newWeekScope);
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

  return (
    <MeetingContext.Provider
      value={{
        title,
        attendees,
        durationMinutes,
        weekScope,
        responses,
        confirmed,
        createMeeting,
        markNextResponded,
        confirmMeeting,
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
