import { Navigate, useNavigate } from 'react-router-dom';
import { RecommendationCard } from '../components/RecommendationCard';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { recommendTime } from '../data/recommendation';

export function RecommendationPage() {
  const { title, attendees, durationMinutes, confirmMeeting } = useMeeting();
  const navigate = useNavigate();
  const { show } = useToast();

  if (!title) return <Navigate to="/" replace />;

  const recommendation = recommendTime(attendees, durationMinutes);

  const handleConfirm = () => {
    confirmMeeting({
      timeLabel: recommendation.timeLabel,
      requiredAttendees: recommendation.requiredAttendees,
      optionalAttendees: recommendation.optionalAttendees,
    });
    navigate('/confirmed');
  };

  return (
    <RecommendationCard
      timeLabel={recommendation.timeLabel}
      requiredAttendees={recommendation.requiredAttendees}
      optionalAttendees={recommendation.optionalAttendees}
      variant={recommendation.isFallback ? 'fallback' : 'primary'}
      onConfirm={handleConfirm}
      onRequestRecheck={() => show('재확인 요청을 보냈어요')}
    />
  );
}
