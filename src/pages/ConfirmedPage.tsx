import { Navigate } from 'react-router-dom';
import { ConfirmedMeeting } from '../components/ConfirmedMeeting';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { durationLabel } from '../data/time';

export function ConfirmedPage() {
  const { title, durationMinutes, confirmed } = useMeeting();
  const { show } = useToast();

  if (!confirmed) return <Navigate to="/" replace />;

  return (
    <ConfirmedMeeting
      meetingTitle={title}
      timeLabel={confirmed.timeLabel}
      durationText={durationLabel(durationMinutes)}
      requiredAttendees={confirmed.requiredAttendees}
      optionalAttendees={confirmed.optionalAttendees}
      onShare={() => show('참석자에게 보낼 링크가 복사됐어요')}
    />
  );
}
