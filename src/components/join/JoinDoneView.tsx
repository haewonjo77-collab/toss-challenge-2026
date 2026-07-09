import { ResponseList } from '../ResponseList';
import { useJoin } from '../../context/JoinContext';
import { useMeeting } from '../../context/MeetingContext';
import { initialInvitedAttendees } from '../../data/mockAttendees';
import type { ResponseStatus } from '../../data/mockAttendees';
import './join.css';

export function JoinDoneView() {
  const { participantName } = useJoin();
  const { responses: meetingResponses } = useMeeting();

  // 실제 회의 세션이 있으면 대기 화면과 동일한 응답 목록을 그대로 써서 인원수를 일치시킨다.
  // 초대 링크 단독 접속(세션 없음) 시나리오에서만 별도 mock 로스터로 대체.
  const baseRoster: ResponseStatus[] =
    meetingResponses.length > 0
      ? meetingResponses
      : initialInvitedAttendees.map((attendee, index) => ({
          id: attendee.id,
          name: attendee.name,
          responded: index < initialInvitedAttendees.length - 2,
        }));

  const name = participantName.trim();
  const inRoster = baseRoster.some((member) => member.name === name);
  const submittedRoster = inRoster
    ? baseRoster.map((member) => (member.name === name ? { ...member, responded: true } : member))
    : [...baseRoster, { id: 'participant', name, responded: true }];
  const roster = [
    ...submittedRoster.filter((member) => member.name === name),
    ...submittedRoster.filter((member) => member.name !== name),
  ];
  const respondedCount = roster.filter((member) => member.responded).length;
  const remainingCount = roster.length - respondedCount;

  return (
    <div className="card">
      <div className="join__check" aria-hidden="true">
        ✓
      </div>
      <p className="join__title text-title-md">응답이 제출됐어요</p>
      <p className="join__headline text-title-lg">
        {roster.length}명 중 {respondedCount}명 응답완료
      </p>
      {remainingCount > 0 && remainingCount <= 2 && (
        <p className="join__nudge text-body-sm">{remainingCount}명만 응답하면 회의 시간이 정해져요</p>
      )}
      <ResponseList responses={roster} />
      <p className="join__footer-hint text-body-sm">모든 참석자가 응답하면 주최자가 시간을 확정해요</p>
    </div>
  );
}
