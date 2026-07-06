import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { RecommendationCard } from '../components/RecommendationCard';
import { AlternativeTimes } from '../components/AlternativeTimes';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { recommendTimes } from '../data/recommendation';

export function RecommendationPage() {
  const { title, attendees, durationMinutes, confirmMeeting } = useMeeting();
  const navigate = useNavigate();
  const { show } = useToast();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  if (!title) return <Navigate to="/" replace />;

  const options = recommendTimes(attendees, durationMinutes);
  const main = options.find((option) => option.timeLabel === selectedLabel) ?? options[0];
  const alternatives = options.filter((option) => option.timeLabel !== main.timeLabel).slice(0, 3);

  const confirm = () => {
    confirmMeeting({
      timeLabel: main.timeLabel,
      requiredAttendees: main.requiredAttendees,
      optionalAttendees: main.optionalAttendees,
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
        onConfirm={confirm}
        onRequestRecheck={() => show('재확인 요청을 보냈어요')}
      />
      <AlternativeTimes
        options={alternatives}
        onPreview={(option) => setSelectedLabel(option.timeLabel)}
      />
    </>
  );
}
