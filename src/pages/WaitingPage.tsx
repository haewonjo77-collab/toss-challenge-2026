import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { WaitingRoom } from '../components/WaitingRoom';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { useScreenMeasure } from '../utils/measure';

const RESPONSE_SIMULATION_DELAYS_MS = [2400, 4000, 5600, 7200];

interface ResponseNotice {
  name: string;
  remainingCount: number;
}

export function WaitingPage() {
  const {
    title,
    attendees,
    settings,
    responses,
    addAttendee,
    updateAttendeeRole,
    markNextResponded,
  } = useMeeting();
  const { show } = useToast();
  const navigate = useNavigate();
  const [responseNotice, setResponseNotice] = useState<ResponseNotice | null>(null);
  const [simulatedResponseCount, setSimulatedResponseCount] = useState(0);
  const hasPending = responses.some((response) => !response.responded);
  useScreenMeasure('화면② 대기');

  useEffect(() => {
    if (!hasPending) {
      setSimulatedResponseCount(0);
      return;
    }

    const delay =
      RESPONSE_SIMULATION_DELAYS_MS[
        Math.min(simulatedResponseCount, RESPONSE_SIMULATION_DELAYS_MS.length - 1)
      ];
    const timer = window.setTimeout(() => {
      const result = markNextResponded();
      if (result) {
        setSimulatedResponseCount((count) => count + 1);
      }
      if (result && settings.responseNotificationsEnabled) {
        setResponseNotice(result);
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [hasPending, markNextResponded, settings.responseNotificationsEnabled, simulatedResponseCount]);

  useEffect(() => {
    if (!responseNotice) return;
    const timer = window.setTimeout(() => setResponseNotice(null), 3200);
    return () => window.clearTimeout(timer);
  }, [responseNotice]);

  if (!title) return <Navigate to="/" replace />;

  const responseById = new Map(responses.map((response) => [response.id, response.responded]));
  const waitingAttendees = attendees.map((attendee) => ({
    id: attendee.id,
    name: attendee.name,
    team: attendee.team,
    role: attendee.role,
    responded: responseById.get(attendee.id) ?? false,
  }));
  const notifyPending = async () => {
    const pendingNames = responses
      .filter((response) => !response.responded)
      .map((response) => response.name);
    if (pendingNames.length === 0) {
      show('모두 응답했어요');
      return;
    }

    const joinUrl = `${window.location.origin}/join`;
    const nameText = pendingNames.map((name) => `${name}님`).join(', ');
    const text = `${nameText}, 아직 회의 응답 전이에요`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${title} 회의 응답 요청`,
          text,
          url: joinUrl,
        });
        show('미응답자에게 응답 요청을 보냈어요');
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${joinUrl}`);
        show('알림 메시지가 복사됐어요');
        return;
      }
      show('응답 요청 메시지를 준비했어요');
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${text}\n${joinUrl}`);
        show('알림 메시지가 복사됐어요');
        return;
      }
      show('응답 요청을 다시 시도해주세요');
    }
  };

  const addAndShareAttendee = async (name: string, team?: string) => {
    const attendee = addAttendee(name, team);
    const joinUrl = `${window.location.origin}/join?attendee=${encodeURIComponent(attendee.id)}`;
    const text = `${attendee.name}님, ${title}에서 안 되는 시간을 골라주세요`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${title} 회의 초대`,
          text,
          url: joinUrl,
        });
        show(`${attendee.name}님에게 초대 링크를 보냈어요`);
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(joinUrl);
        show(`${attendee.name}님 전용 링크가 복사됐어요`);
        return;
      }
      show(`${attendee.name}님을 참석자에 추가했어요`);
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(joinUrl);
        show(`${attendee.name}님 전용 링크가 복사됐어요`);
        return;
      }
      show('초대 링크 공유를 다시 시도해주세요');
    }
  };

  return (
    <div className="waiting-page">
      {responseNotice && (
        <div
          key={`${responseNotice.name}-${responseNotice.remainingCount}`}
          className="waiting-page__alert"
          role="status"
        >
          <span className="waiting-page__alert-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          </span>
          <span className="waiting-page__alert-copy">
            <span className="waiting-page__alert-label text-caption">새 응답</span>
            <span className="waiting-page__alert-title text-body-md">
              {responseNotice.name}님이 응답했어요
            </span>
            <span className="waiting-page__alert-message text-caption">
              {responseNotice.remainingCount > 0
                ? `${responseNotice.remainingCount}명 남았어요`
                : '모두 응답했어요'}
            </span>
          </span>
        </div>
      )}
      <WaitingRoom
        attendees={waitingAttendees}
        onChangeRole={updateAttendeeRole}
        onAddAttendee={addAndShareAttendee}
        onViewRecommendation={() => navigate('/recommendation')}
        onNotifyPending={notifyPending}
      />
    </div>
  );
}
