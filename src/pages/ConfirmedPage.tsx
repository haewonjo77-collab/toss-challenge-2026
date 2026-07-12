import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ConfirmedMeeting } from '../components/ConfirmedMeeting';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { durationLabel } from '../data/time';
import { useScreenMeasure } from '../utils/measure';

const CONFIRMATION_NOTICE_DURATION_MS = 3200;

export function ConfirmedPage() {
  const { title, settings, confirmed, resetMeeting } = useMeeting();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const arrivedWithNotice =
    typeof location.state === 'object' &&
    location.state !== null &&
    'confirmationNotice' in location.state &&
    location.state.confirmationNotice === true;
  const [showConfirmationNotice, setShowConfirmationNotice] = useState(false);
  useScreenMeasure('화면④ 확정');

  useEffect(() => {
    if (!arrivedWithNotice) return;
    setShowConfirmationNotice(true);
    navigate('.', { replace: true, state: null });
  }, [arrivedWithNotice, navigate]);

  useEffect(() => {
    if (!showConfirmationNotice) return;
    const timer = window.setTimeout(() => setShowConfirmationNotice(false), CONFIRMATION_NOTICE_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [showConfirmationNotice]);

  if (!confirmed) return <Navigate to="/" replace />;

  return (
    <ConfirmedMeeting
      meetingTitle={title}
      timeLabel={confirmed.timeLabel}
      durationText={durationLabel(settings.durationMinutes)}
      requiredAttendees={confirmed.requiredAttendees}
      optionalAttendees={confirmed.optionalAttendees}
      showConfirmationNotice={showConfirmationNotice}
      // 참석자는 앱 푸시로 알림을 받는 전제라 공유 시트 없이 바로 발송 확인 상태로 전환
      onNotifyAgain={() => show('참석자에게 확정 알림을 다시 보냈어요')}
      onNewMeeting={() => {
        resetMeeting();
        navigate('/');
      }}
    />
  );
}
