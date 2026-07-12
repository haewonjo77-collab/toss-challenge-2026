import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ConfirmedMeeting } from '../components/ConfirmedMeeting';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { durationLabel } from '../data/time';
import { useScreenMeasure } from '../utils/measure';

export function ConfirmedPage() {
  const { title, settings, confirmed, resetMeeting } = useMeeting();
  const { show } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const showConfirmationNotice =
    typeof location.state === 'object' &&
    location.state !== null &&
    'confirmationNotice' in location.state &&
    location.state.confirmationNotice === true;
  useScreenMeasure('화면④ 확정');

  if (!confirmed) return <Navigate to="/" replace />;

  return (
    <ConfirmedMeeting
      meetingTitle={title}
      timeLabel={confirmed.timeLabel}
      durationText={durationLabel(settings.durationMinutes)}
      requiredAttendees={confirmed.requiredAttendees}
      optionalAttendees={confirmed.optionalAttendees}
      showConfirmationNotice={showConfirmationNotice}
      onShare={() => show('확정된 회의 링크가 복사됐어요')}
      onNewMeeting={() => {
        resetMeeting();
        navigate('/');
      }}
    />
  );
}
