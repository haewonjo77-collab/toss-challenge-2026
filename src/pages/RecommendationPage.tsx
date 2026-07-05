import { Navigate, useNavigate } from 'react-router-dom';
import { RecommendationCard } from '../components/RecommendationCard';
import { AlternativeTimes } from '../components/AlternativeTimes';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { recommendTimes } from '../data/recommendation';
import type { Recommendation } from '../data/recommendation';

export function RecommendationPage() {
  const { title, attendees, durationMinutes, confirmMeeting } = useMeeting();
  const navigate = useNavigate();
  const { show } = useToast();

  if (!title) return <Navigate to="/" replace />;

  const [main, ...alternatives] = recommendTimes(attendees, durationMinutes);

  const confirmSelection = (recommendation: Recommendation) => {
    confirmMeeting({
      timeLabel: recommendation.timeLabel,
      requiredAttendees: recommendation.requiredAttendees,
      optionalAttendees: recommendation.optionalAttendees,
    });
    navigate('/confirmed');
  };

  return (
    <>
      <RecommendationCard
        timeLabel={main.timeLabel}
        requiredAttendees={main.requiredAttendees}
        optionalAttendees={main.optionalAttendees}
        variant={main.isFallback ? 'fallback' : 'primary'}
        onConfirm={() => confirmSelection(main)}
        onRequestRecheck={() => show('재확인 요청을 보냈어요')}
      />
      <AlternativeTimes options={alternatives.slice(0, 3)} onSelect={confirmSelection} />
    </>
  );
}
