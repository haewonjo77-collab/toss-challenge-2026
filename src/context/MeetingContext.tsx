import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Attendee, InvitedAttendee, ResponseStatus } from '../data/mockAttendees';
import { nextWeekRange } from '../data/schedule';

export interface ConfirmedResult {
  timeLabel: string;
  requiredAttendees: Attendee[];
  optionalAttendees: Attendee[];
}

// 회의 조건 묶음 — 화면 ①에서 정하고 ②③④·참석자 플로우가 공유
export interface MeetingSettings {
  durationMinutes: number;
  rangeStart: string; // 'YYYY-MM-DD'
  rangeEnd: string;
  includeWeekends: boolean;
  dayStartMinutes: number;
  dayEndMinutes: number;
}

// SPEC 시나리오("1주일 내 회의를 잡는다") 기본값 — 다음 주 월~금, 09:00~18:00, 1시간
export function defaultMeetingSettings(): MeetingSettings {
  const defaultRange = nextWeekRange(false);
  return {
    durationMinutes: 60,
    rangeStart: defaultRange.rangeStart,
    rangeEnd: defaultRange.rangeEnd,
    includeWeekends: false,
    dayStartMinutes: 9 * 60,
    dayEndMinutes: 18 * 60,
  };
}

interface MeetingContextValue {
  title: string;
  attendees: InvitedAttendee[];
  settings: MeetingSettings;
  responses: ResponseStatus[];
  confirmed: ConfirmedResult | null;
  createMeeting: (title: string, attendees: InvitedAttendee[], settings: MeetingSettings) => void;
  markNextResponded: () => string | null;
  confirmMeeting: (result: ConfirmedResult) => void;
  resetMeeting: () => void;
}

const MeetingContext = createContext<MeetingContextValue | null>(null);

export function MeetingProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState('');
  const [attendees, setAttendees] = useState<InvitedAttendee[]>([]);
  const [settings, setSettings] = useState<MeetingSettings>(defaultMeetingSettings);
  const [responses, setResponses] = useState<ResponseStatus[]>([]);
  const responsesRef = useRef<ResponseStatus[]>([]);
  const [confirmed, setConfirmed] = useState<ConfirmedResult | null>(null);

  useEffect(() => {
    responsesRef.current = responses;
  }, [responses]);

  const createMeeting = (
    newTitle: string,
    newAttendees: InvitedAttendee[],
    newSettings: MeetingSettings,
  ) => {
    setTitle(newTitle);
    setAttendees(newAttendees);
    setSettings(newSettings);
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
    const nextIndex = responsesRef.current.findIndex((response) => !response.responded);
    if (nextIndex === -1) return null;
    const respondedName = responsesRef.current[nextIndex].name;
    const nextResponses = responsesRef.current.map((response, index) =>
      index === nextIndex ? { ...response, responded: true } : response,
    );
    responsesRef.current = nextResponses;
    setResponses(nextResponses);
    return respondedName;
  };

  const confirmMeeting = (result: ConfirmedResult) => {
    setConfirmed(result);
  };

  // 화면 ④ "새 회의 만들기" — 화면 ①이 빈 상태(기본값)에서 다시 시작하도록 전부 초기화
  const resetMeeting = () => {
    setTitle('');
    setAttendees([]);
    setSettings(defaultMeetingSettings());
    setResponses([]);
    setConfirmed(null);
  };

  return (
    <MeetingContext.Provider
      value={{
        title,
        attendees,
        settings,
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
