import { useState } from 'react';
import { useMeeting } from '../../context/MeetingContext';
import { useJoin } from '../../context/JoinContext';
import './join.css';

interface JoinStartViewProps {
  onAdvance: () => void;
}

export function JoinStartView({ onAdvance }: JoinStartViewProps) {
  const { title } = useMeeting();
  const { startJoin } = useJoin();
  const [name, setName] = useState('');

  // 초대 링크 단독 접속 시나리오 — 주최자 세션이 없으면 mock 제목 사용
  const meetingTitle = title || '주간 제품 리뷰';

  const start = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    startJoin(trimmed);
    onAdvance();
  };

  return (
    <div className="card">
      <p className="join__eyebrow text-caption">회의 초대</p>
      <p className="join__title text-title-lg">'{meetingTitle}' 회의에 초대됐어요</p>
      <p className="join__hint text-body-sm">로그인 없이 이름만 입력하면 바로 시작할 수 있어요</p>
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
