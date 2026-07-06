import { Navigate } from 'react-router-dom';
import { JoinDoneView } from '../components/join/JoinDoneView';
import { useJoin } from '../context/JoinContext';

export function JoinDonePage() {
  const { submitted } = useJoin();

  if (!submitted) return <Navigate to="/join" replace />;

  return <JoinDoneView />;
}
