import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { WaitingRoom } from '../components/WaitingRoom';
import { useToast } from '../components/Toast';
import { useJoin } from '../context/JoinContext';
import { useMeeting } from '../context/MeetingContext';
import { useScreenMeasure } from '../utils/measure';

const RESPONSE_SIMULATION_DELAYS_MS = [1200, 2000, 2800, 3600];

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
  const { startJoin } = useJoin();
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
    availabilityState:
      responses.find((response) => response.id === attendee.id)?.availabilityState ?? 'pending',
  }));
  const addAndNotifyAttendee = (name: string, team?: string) => {
    const attendee = addAttendee(name, team);
    show(`${attendee.name}님에게 초대를 보냈어요`);
  };

  const notifyPending = () => {
    const pendingCount = responses.filter((response) => !response.responded).length;
    show(pendingCount === 0 ? '모두 응답했어요' : `${pendingCount}명에게 응답 요청을 보냈어요`);
  };

  const registerHostTime = () => {
    startJoin('조해원');
    navigate('/host/times');
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
        onAddAttendee={addAndNotifyAttendee}
        onViewRecommendation={() => navigate('/recommendation')}
        onRegisterHostTime={registerHostTime}
        onNotifyPending={notifyPending}
      />
    </div>
  );
}
