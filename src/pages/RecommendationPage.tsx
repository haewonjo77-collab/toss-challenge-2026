import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { RecommendationCard } from '../components/RecommendationCard';
import { AlternativeTimes } from '../components/AlternativeTimes';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { recommendTimes } from '../data/recommendation';
import { useScreenMeasure } from '../utils/measure';

export function RecommendationPage() {
  const { title, attendees, durationMinutes, confirmMeeting } = useMeeting();
  const navigate = useNavigate();
  const { show } = useToast();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  useScreenMeasure('화면③ 추천 결과');

  // 대안 카드를 최상단 자리로 교체했을 때, 교체된 카드가 보이도록 스크롤을 따라 올린다
  useEffect(() => {
    if (selectedLabel) {
      mainCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedLabel]);

  if (!title) return <Navigate to="/" replace />;

  // 순위는 정렬 위치에서 파생 — 대안을 미리보기로 올려도 자기 순위 라벨을 유지한다
  const ranked = recommendTimes(attendees, durationMinutes).map((option, index) => ({
    ...option,
    rankLabel: index === 0 ? '추천' : `대안 ${index}`,
  }));
  const main = ranked.find((option) => option.timeLabel === selectedLabel) ?? ranked[0];
  const alternatives = ranked.filter((option) => option.timeLabel !== main.timeLabel).slice(0, 3);

  const confirm = () => {
    confirmMeeting({
      timeLabel: main.timeLabel,
      requiredAttendees: main.requiredAttendees,
      optionalAttendees: main.optionalAttendees,
    });
    navigate('/confirmed');
  };

  return (
    <>
      <div ref={mainCardRef}>
        <RecommendationCard
          timeLabel={main.timeLabel}
          requiredAttendees={main.requiredAttendees}
          optionalAttendees={main.optionalAttendees}
          variant={main.isFallback ? 'fallback' : 'primary'}
          rankLabel={main.rankLabel}
          onConfirm={confirm}
          onRequestRecheck={() => show('재확인 요청을 보냈어요')}
        />
      </div>
      <AlternativeTimes
        options={alternatives}
        onPreview={(option) => setSelectedLabel(option.timeLabel)}
      />
    </>
  );
}
