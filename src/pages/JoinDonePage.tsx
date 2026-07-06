import { Navigate } from 'react-router-dom';
import { ResponseList } from '../components/ResponseList';
import { useJoin } from '../context/JoinContext';
import { initialInvitedAttendees } from '../data/mockAttendees';
import './join.css';

export function JoinDonePage() {
  const { participantName, submitted } = useJoin();

  if (!submitted) return <Navigate to="/join" replace />;

  // 초대 링크 단독 접속 시나리오 — 주최자 세션과 분리된 mock 로스터 (마지막 2명 미응답 규칙 재사용)
  const baseRoster = initialInvitedAttendees.map((attendee, index) => ({
    id: attendee.id,
    name: attendee.name,
    responded: index < initialInvitedAttendees.length - 2,
  }));
  const name = participantName.trim();
  const inRoster = baseRoster.some((member) => member.name === name);
  const roster = inRoster
    ? baseRoster.map((member) => (member.name === name ? { ...member, responded: true } : member))
    : [...baseRoster, { id: 'participant', name, responded: true }];
  const respondedCount = roster.filter((member) => member.responded).length;

  return (
    <div className="card">
      <div className="join__check" aria-hidden="true">
        ✓
      </div>
      <p className="join__title text-title-md">응답이 제출됐어요</p>
      <p className="join__headline text-title-lg">
        {roster.length}명 중 {respondedCount}명 응답완료
      </p>
      <ResponseList responses={roster} />
      <p className="join__footer-hint text-body-sm">모든 참석자가 응답하면 주최자가 시간을 확정해요</p>
    </div>
  );
}
