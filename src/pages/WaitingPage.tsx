import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { WaitingRoom } from '../components/WaitingRoom';
import { useMeeting } from '../context/MeetingContext';

export function WaitingPage() {
  const { title, responses, markNextResponded } = useMeeting();
  const navigate = useNavigate();
  const hasPending = responses.some((response) => !response.responded);

  useEffect(() => {
    if (!hasPending) return;
    const timer = window.setInterval(markNextResponded, 1400);
    return () => window.clearInterval(timer);
  }, [hasPending]);

  if (!title) return <Navigate to="/" replace />;

  return (
    <WaitingRoom attendees={responses} onViewRecommendation={() => navigate('/recommendation')} />
  );
}
