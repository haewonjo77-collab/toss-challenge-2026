import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JoinTimesView } from '../components/join/JoinTimesView';
import { useJoin } from '../context/JoinContext';

export function HostTimesPage() {
  const navigate = useNavigate();
  const { participantName, startJoin } = useJoin();

  useEffect(() => {
    if (!participantName) startJoin('조해원');
  }, [participantName, startJoin]);

  return (
    <JoinTimesView
      participantRole="required"
      advanceOnConfirm
      onAdvance={() => navigate('/waiting')}
    />
  );
}
