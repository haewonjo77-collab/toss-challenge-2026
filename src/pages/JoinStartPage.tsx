import { useNavigate } from 'react-router-dom';
import { JoinStartView } from '../components/join/JoinStartView';

export function JoinStartPage() {
  const navigate = useNavigate();
  return <JoinStartView onAdvance={() => navigate('/join/times')} />;
}
