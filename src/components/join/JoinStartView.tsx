import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useMeeting } from '../../context/MeetingContext';
import { useJoin } from '../../context/JoinContext';
import { initialInvitedAttendees } from '../../data/mockAttendees';
import type { ResponseStatus } from '../../data/mockAttendees';
import { organizationMembers } from '../../data/organizationMembers';
import './join.css';

interface JoinStartViewProps {
  onAdvance: () => void;
}

const ORGANIZER_PROFILE = {
  name: '조해원',
};

export function JoinStartView({ onAdvance }: JoinStartViewProps) {
  const location = useLocation();
  const { title, attendees, responses } = useMeeting();
  const { startJoin } = useJoin();

  // 초대 링크 단독 접속 시나리오 — 주최자 세션이 없으면 mock 제목 사용
  const meetingTitle = title || '디자인팀 회의';

  // 주최자가 등록한 참석자 목록을 초대 링크의 이름 선택지로 그대로 사용한다.
  // 응답 여부만 responses에서 덧씌우고, 단독 접속 목업에서는 기존 기본 명단을 사용한다.
  const roster: ResponseStatus[] = useMemo(() => {
    const responseById = new Map(responses.map((response) => [response.id, response]));
    return attendees.length > 0
      ? attendees.map((attendee) => {
          const response = responseById.get(attendee.id);
          return {
            id: attendee.id,
            name: attendee.name,
            responded: response?.responded ?? false,
            availabilityState: response?.availabilityState ?? 'pending',
          };
        })
      : initialInvitedAttendees.map((attendee, index) => {
          const responded = index < initialInvitedAttendees.length - 2;
          return {
            id: attendee.id,
            name: attendee.name,
            responded,
            availabilityState: responded ? 'available' : 'pending',
          };
        });
  }, [attendees, responses]);
  const respondedCount = roster.filter((member) => member.responded).length;

  useEffect(() => {
    const attendeeId = new URLSearchParams(location.search).get('attendee');
    const linkedMember =
      roster.find((member) => member.id === attendeeId) ??
      organizationMembers.find((member) => member.id === attendeeId);
    const fallbackMember = roster.find((member) => !member.responded) ?? roster[0];
    const participantName = linkedMember?.name ?? fallbackMember?.name ?? '조해원';

    startJoin(participantName);
    onAdvance();
  }, [location.search, onAdvance, roster, startJoin]);

  return (
    <div className="card">
      <p className="join__eyebrow text-caption">회의 초대</p>
      <div className="join__organizer">
        <p className="join__organizer-title text-body-md">
          {ORGANIZER_PROFILE.name}님이 회의 시간을 맞추고 있어요
        </p>
      </div>
      <p className="join__title text-title-lg">'{meetingTitle}'에 초대됐어요</p>
      <p className="join__progress text-caption">
        {roster.length}명 중 {respondedCount}명이 안 되는 시간을 골랐어요
      </p>
    </div>
  );
}
