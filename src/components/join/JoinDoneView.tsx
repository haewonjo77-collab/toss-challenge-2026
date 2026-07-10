import { useJoin } from '../../context/JoinContext';
import './join.css';

export function JoinDoneView() {
  const { participantName } = useJoin();

  return (
    <div className="card">
      <div className="join__check" aria-hidden="true">
        ✓
      </div>
      <p className="join__title text-title-md">응답이 제출됐어요</p>
      <p className="join__headline text-title-lg">{participantName}님 응답을 저장했어요</p>
      <p className="join__footer-hint text-body-sm">모든 참석자가 응답하면 주최자가 시간을 확정해요</p>
    </div>
  );
}
