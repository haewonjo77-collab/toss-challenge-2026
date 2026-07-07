import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { WaitingRoom } from '../components/WaitingRoom';
import { JoinPreviewModal } from '../components/JoinPreviewModal';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { rememberAttendeeGroups } from '../data/favorites';
import { useScreenMeasure } from '../utils/measure';

export function WaitingPage() {
  const { title, attendees, responses, markNextResponded } = useMeeting();
  const { show } = useToast();
  const navigate = useNavigate();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rememberOpen, setRememberOpen] = useState(false);
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
      setRememberOpen(true);
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') show('초대 링크 공유를 다시 시도해주세요');
    }
  };

  const rememberAttendees = () => {
    rememberAttendeeGroups(attendees);
    setRememberOpen(false);
    show('다음 회의에서 폴더로 불러올 수 있어요');
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
      {rememberOpen && (
        <div className="modal-overlay" onClick={() => setRememberOpen(false)}>
          <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-sheet__close"
              aria-label="닫기"
              onClick={() => setRememberOpen(false)}
            >
              ✕
            </button>
            <p className="waiting-room__remember-title text-title-md">이 회의의 참석자를 기억할까요?</p>
            <p className="waiting-room__remember-hint text-body-sm">
              부서/팀별 폴더로 저장해 다음 회의에서 한 번에 불러올 수 있어요
            </p>
            <div className="waiting-room__remember-actions">
              <button type="button" className="button button--secondary" onClick={() => setRememberOpen(false)}>
                나중에
              </button>
              <button type="button" className="button button--primary" onClick={rememberAttendees}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
