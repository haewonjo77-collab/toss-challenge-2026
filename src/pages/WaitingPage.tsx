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
  const hasPending = responses.some((response) => !response.responded);
  useScreenMeasure('화면② 대기');

  useEffect(() => {
    if (!hasPending) return;
    const timer = window.setInterval(markNextResponded, 1400);
    return () => window.clearInterval(timer);
  }, [hasPending]);

  if (!title) return <Navigate to="/" replace />;

  return (
    <>
      <WaitingRoom
        attendees={responses}
        onViewRecommendation={() => navigate('/recommendation')}
        onNudge={(name) => show(`${name}님에게 응답 요청 알림을 보냈어요`)}
      />
      <button type="button" className="link-button text-caption" onClick={() => setPreviewOpen(true)}>
        참석자 응답 화면 미리보기 →
      </button>
      {previewOpen && <JoinPreviewModal onClose={() => setPreviewOpen(false)} />}
    </>
  );
}
