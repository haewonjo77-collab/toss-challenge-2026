import { useState } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useJoin } from '../../context/JoinContext';
import { initialInvitedAttendees } from '../../data/mockAttendees';
import './join.css';

interface JoinStartViewProps {
  onAdvance: () => void;
}

const ORGANIZER_PROFILE = {
  name: '조해원',
  team: '프로덕트 디자인팀',
};

export function JoinStartView({ onAdvance }: JoinStartViewProps) {
  const { title, responses } = useMeeting();
  const { startJoin } = useJoin();
  const [name, setName] = useState('');

  // 초대 링크 단독 접속 시나리오 — 주최자 세션이 없으면 mock 제목 사용
  const meetingTitle = title || '주간 제품 리뷰';

  // 가설 A(오픈폴): 응답 제출 전에도 현재 응답 현황을 공개해 참여를 유도한다.
  // 주최자 세션이 있으면 실제 응답 데이터, 없으면 mock 로스터(마지막 2명 미응답 규칙) 사용.
  const roster =
    responses.length > 0
      ? responses
      : initialInvitedAttendees.map((attendee, index) => ({
          id: attendee.id,
          name: attendee.name,
          responded: index < initialInvitedAttendees.length - 2,
        }));
  const respondedCount = roster.filter((member) => member.responded).length;

  const start = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    startJoin(trimmed);
    onAdvance();
  };

  return (
    <div className="card">
      <p className="join__eyebrow text-caption">회의 초대</p>
      <div className="join__organizer">
        <p className="join__organizer-title text-body-sm">
          {ORGANIZER_PROFILE.name}님이 회의 일정을 조율하고 있어요
        </p>
        <p className="join__organizer-team text-caption">{ORGANIZER_PROFILE.team}</p>
      </div>
      <p className="join__title text-title-lg">'{meetingTitle}' 회의에 초대됐어요</p>
      <p className="join__hint text-body-sm">로그인 없이 이름만 입력하면 바로 시작할 수 있어요</p>
      <p className="join__progress text-caption">
        지금까지 {roster.length}명 중 {respondedCount}명이 응답했어요
      </p>
      <input
        className="text-input join__name-input"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing) return;
          if (event.key === 'Enter') start();
        }}
        placeholder="이름"
      />
      <button
        type="button"
        className="button button--primary join__cta"
        disabled={name.trim() === ''}
        onClick={start}
      >
        시작하기
      </button>
    </div>
  );
}
