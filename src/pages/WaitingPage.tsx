import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { WaitingRoom } from '../components/WaitingRoom';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { useScreenMeasure } from '../utils/measure';

const RESPONSE_SIMULATION_DELAY_MS = 7000;

export function WaitingPage() {
  const { title, settings, responses, markNextResponded } = useMeeting();
  const { show } = useToast();
  const navigate = useNavigate();
  const [responseNotice, setResponseNotice] = useState<string | null>(null);
  const hasPending = responses.some((response) => !response.responded);
  useScreenMeasure('화면② 대기');

  useEffect(() => {
    if (!hasPending) return;
    const timer = window.setInterval(() => {
      const name = markNextResponded();
      if (name && settings.responseNotificationsEnabled) {
        const remaining = responses.filter((response) => !response.responded).length - 1;
        setResponseNotice(
          remaining > 0
            ? `${name}님 응답 완료 · ${remaining}명 남았어요`
            : `${name}님 응답 완료 · 모두 응답했어요`,
        );
      }
    }, RESPONSE_SIMULATION_DELAY_MS);
    return () => window.clearInterval(timer);
  }, [hasPending, responses, settings.responseNotificationsEnabled]);

  useEffect(() => {
    if (!responseNotice) return;
    const timer = window.setTimeout(() => setResponseNotice(null), 3600);
    return () => window.clearTimeout(timer);
  }, [responseNotice]);

  if (!title) return <Navigate to="/" replace />;

  const shareInvite = async () => {
    const joinUrl = `${window.location.origin}/join`;
    const text = `${title} 회의 가능 시간을 표시해주세요`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: joinUrl });
        show('초대 링크가 공유됐어요');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(joinUrl);
        show('초대 링크가 복사됐어요');
      } else {
        show('초대 링크를 준비했어요');
      }
    } catch {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(joinUrl);
        show('초대 링크가 복사됐어요');
        return;
      }
      show('초대 링크 공유를 다시 시도해주세요');
    }
  };

  return (
    <>
      {responseNotice && (
        <div className="waiting-page__alert text-body-sm" role="status">
          <span className="waiting-page__alert-label text-caption">응답 알림</span>
          <span className="waiting-page__alert-message">{responseNotice}</span>
        </div>
      )}
      <WaitingRoom
        attendees={responses}
        onViewRecommendation={() => navigate('/recommendation')}
        onShareInvite={shareInvite}
        onNotifyPending={() => {
          const pendingCount = responses.filter((response) => !response.responded).length;
          show(`미응답자 ${pendingCount}명에게 알림을 보냈어요`);
        }}
      />
    </>
  );
}
