import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { WaitingRoom } from '../components/WaitingRoom';
import { JoinPreviewModal } from '../components/JoinPreviewModal';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { useScreenMeasure } from '../utils/measure';

export function WaitingPage() {
  const { title, responses, markNextResponded } = useMeeting();
  const { show } = useToast();
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const hasPending = responses.some((response) => !response.responded);
  useScreenMeasure('화면② 대기');

  useEffect(() => {
    if (!hasPending) return;
    const timer = window.setInterval(() => {
      const name = markNextResponded();
      if (name && notificationsEnabled) show(`${name}님이 응답했어요`);
    }, 1400);
    return () => window.clearInterval(timer);
  }, [hasPending, notificationsEnabled]);

  if (!title) return <Navigate to="/" replace />;

  const shareInvite = async () => {
    const joinUrl = `${window.location.origin}/join`;
    const text = `${title} 회의 가능 시간을 표시해주세요`;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url: joinUrl });
        show('초대 링크를 공유했어요');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(joinUrl);
        show('초대 링크가 복사됐어요');
      } else {
        show('초대 링크를 준비했어요');
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') show('초대 링크 공유를 다시 시도해주세요');
    }
  };

  return (
    <>
      <WaitingRoom
        attendees={responses}
        onViewRecommendation={() => navigate('/recommendation')}
        onShareInvite={shareInvite}
        onNudge={(name) => show(`${name}님에게 응답 요청 알림을 보냈어요`)}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={setNotificationsEnabled}
      />
      <button type="button" className="link-button text-caption" onClick={() => setPreviewOpen(true)}>
        참석자 응답 화면 미리보기 →
      </button>
      {previewOpen && <JoinPreviewModal onClose={() => setPreviewOpen(false)} />}
    </>
  );
}
