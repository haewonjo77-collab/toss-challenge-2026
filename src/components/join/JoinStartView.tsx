import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useMeeting } from '../../context/MeetingContext';
import { useJoin } from '../../context/JoinContext';
import { ResponseList } from '../ResponseList';
import { initialInvitedAttendees } from '../../data/mockAttendees';
import type { AttendeeRole, ResponseStatus } from '../../data/mockAttendees';
import { organizationMembers } from '../../data/organizationMembers';
import { formatMonthDay, listRangeDays } from '../../data/schedule';
import './join.css';

interface JoinStartViewProps {
  onAdvance: () => void;
}

const ORGANIZER_PROFILE = {
  name: '조해원',
};

export function JoinStartView({ onAdvance }: JoinStartViewProps) {
  const location = useLocation();
  const { title, attendees, responses, settings } = useMeeting();
  const { startJoin } = useJoin();

  // 초대 링크 단독 접속 시나리오 — 주최자 세션이 없으면 mock 제목 사용
  const meetingTitle = title || '디자인팀 회의';

  // 주최자가 등록한 참석자 목록을 초대 링크의 이름 선택지로 그대로 사용한다.
  // 응답 여부만 responses에서 덧씌우고, 단독 접속 목업에서는 기존 기본 명단을 사용한다.
  const roster: Array<ResponseStatus & { role: AttendeeRole }> = useMemo(() => {
    const responseById = new Map(responses.map((response) => [response.id, response]));
    return attendees.length > 0
      ? attendees.map((attendee) => {
          const response = responseById.get(attendee.id);
          return {
            id: attendee.id,
            name: attendee.name,
            role: attendee.role,
            responded: response?.responded ?? false,
            availabilityState: response?.availabilityState ?? 'pending',
          };
        })
      : initialInvitedAttendees.map((attendee, index) => {
          const responded = index < initialInvitedAttendees.length - 2;
          return {
            id: attendee.id,
            name: attendee.name,
            role: attendee.role,
            responded,
            availabilityState: responded ? 'available' : 'pending',
          };
        });
  }, [attendees, responses]);
  const respondedCount = roster.filter((member) => member.responded).length;

  // 초대 링크로 접속한 참석자 본인을 식별한다(응답 안 한 사람 우선, 없으면 첫 번째).
  const participantName = useMemo(() => {
    const attendeeId = new URLSearchParams(location.search).get('attendee');
    const linkedMember =
      roster.find((member) => member.id === attendeeId) ??
      organizationMembers.find((member) => member.id === attendeeId);
    const fallbackMember = roster.find((member) => !member.responded) ?? roster[0];
    return linkedMember?.name ?? fallbackMember?.name ?? '조해원';
  }, [location.search, roster]);

  const resolvedRole: AttendeeRole =
    attendees.find((attendee) => attendee.name === participantName)?.role ?? 'required';

  // 시간 고르기 화면이 참석자 이름을 알 수 있도록 세션만 열어두고, 이동은 버튼으로 넘긴다.
  // startJoin은 매 렌더 새 함수 + unavailable 초기화라 의존성에 넣으면 무한 루프가 나므로,
  // 참석자 이름당 한 번만 세션을 연다.
  const startedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (startedForRef.current === participantName) return;
    startedForRef.current = participantName;
    startJoin(participantName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantName]);

  const rangeDays = listRangeDays(
    settings.rangeStart,
    settings.rangeEnd,
    settings.includeWeekends,
    settings.selectedDates,
  );

  return (
    <div className="join join--start">
      <section className="join__meeting-info" aria-label="회의 초대">
        <p className="join__intro-title text-title-md">
          <strong>{ORGANIZER_PROFILE.name}님</strong>이 <strong>&apos;{meetingTitle}&apos;</strong>{' '}
          시간을 맞추고 있어요
        </p>
        <span className="join__meeting-role">
          {resolvedRole === 'required' ? '필수 참석자로 초대됐어요' : '선택 참석자로 초대됐어요'}
        </span>

        <hr className="join__meeting-divider" />

        <div className="join__date-summary">
          <span className="join__date-summary-label text-caption">후보 날짜</span>
          <span className="join__date-summary-value text-body-sm">
            {formatMonthDay(rangeDays[0])} ~ {formatMonthDay(rangeDays[rangeDays.length - 1])}
          </span>
        </div>
      </section>

      <section className="join__response-status" aria-label="응답 현황">
        <div className="join__response-status-head">
          <h2 className="join__response-status-title text-title-sm">응답 현황</h2>
          <span className="join__response-status-count text-caption">
            {roster.length}명 중 {respondedCount}명 응답
          </span>
        </div>
        {/* 참석자 플로우에서는 필수/선택 토글·참석자 추가를 숨긴다(콜백 미전달) */}
        <ResponseList responses={roster} />
      </section>

      <div className="join__actions">
        <button type="button" className="button button--primary" onClick={onAdvance}>
          안 되는 시간 고르기
        </button>
      </div>
    </div>
  );
}
