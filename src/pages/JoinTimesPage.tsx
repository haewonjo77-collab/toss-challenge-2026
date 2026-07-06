import { Navigate, useNavigate } from 'react-router-dom';
import { JoinTimesView } from '../components/join/JoinTimesView';
import { useJoin } from '../context/JoinContext';

export function JoinTimesPage() {
  const { participantName } = useJoin();
  const navigate = useNavigate();

  if (!participantName) return <Navigate to="/join" replace />;

  return <JoinTimesView onAdvance={() => navigate('/join/done')} />;
}
