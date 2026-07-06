import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { RecommendationCard } from '../components/RecommendationCard';
import { RecommendationTabBar } from '../components/RecommendationTabBar';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { recommendTimes } from '../data/recommendation';
import { useScreenMeasure } from '../utils/measure';

export function RecommendationPage() {
  const { title, attendees, durationMinutes, weeksAhead, confirmMeeting } = useMeeting();
  const navigate = useNavigate();
  const { show } = useToast();
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  useScreenMeasure('화면③ 추천 결과');

  if (!title) return <Navigate to="/" replace />;

  // 순위는 정렬 위치에서 파생 — 탭 라벨과 카드 내용 모두 여기서 나온다.
  // 참석자 목록은 모든 옵션이 같은 attendees 배열에서 파생되므로 표시 순서가 항상 동일하게 유지된다.
  const ranked = recommendTimes(attendees, durationMinutes, weeksAhead)
    .slice(0, 4)
    .map((option, index) => ({ ...option, rankLabel: index === 0 ? '추천' : `대안 ${index}` }));
  const active = ranked.find((option) => option.timeLabel === activeLabel) ?? ranked[0];

  const confirm = () => {
    confirmMeeting({
      timeLabel: active.timeLabel,
      requiredAttendees: active.requiredAttendees,
      optionalAttendees: active.optionalAttendees,
    });
    navigate('/confirmed');
  };

  return (
    <>
      {ranked.length > 1 && (
        <RecommendationTabBar
          options={ranked.map((option) => ({ key: option.timeLabel, label: option.rankLabel }))}
          activeKey={active.timeLabel}
          onSelect={setActiveLabel}
        />
      )}
      <RecommendationCard
        timeLabel={active.timeLabel}
        requiredAttendees={active.requiredAttendees}
        optionalAttendees={active.optionalAttendees}
        variant={active.isFallback ? 'fallback' : 'primary'}
        onConfirm={confirm}
        onRequestRecheck={() => show('재확인 요청을 보냈어요')}
      />
    </>
  );
}
