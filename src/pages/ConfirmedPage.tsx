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
  // location.state는 라우터 히스토리에 계속 남아 있어, 이 값을 그대로 렌더링에 쓰면
  // 시간이 지나도 알림이 사라지지 않는다 — 로컬 state로 옮겨 타이머로 직접 해제한다.
  const [showConfirmationNotice, setShowConfirmationNotice] = useState(arrivedWithNotice);
  useScreenMeasure('화면④ 확정');

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
