import { useJoin } from '../../context/JoinContext';
import './join.css';

export function JoinDoneView() {
  const { participantName } = useJoin();

  return (
    <div className="card">
      <div className="join__check" aria-hidden="true">
        ✓
      </div>
      <p className="join__headline text-title-lg">응답이 제출됐어요</p>
      <p className="join__title text-body-md">{participantName}님이 고른 시간을 저장했어요</p>
      <p className="join__footer-hint text-body-md">모두 응답하면 주최자가 회의 시간을 확정해요</p>
    </div>
  );
}
