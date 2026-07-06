import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { RecommendationCard } from '../components/RecommendationCard';
import { AlternativeTimes } from '../components/AlternativeTimes';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { useVariant } from '../context/VariantContext';
import { recommendTimes } from '../data/recommendation';
import { useScreenMeasure } from '../utils/measure';

export function RecommendationPage() {
  const { title, attendees, durationMinutes, confirmMeeting } = useMeeting();
  const { variant } = useVariant();
  const navigate = useNavigate();
  const { show } = useToast();
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  useScreenMeasure('화면③ 추천 결과');

  if (!title) return <Navigate to="/" replace />;

  // AS-IS(가설 C 비교군): 필수/선택 무시, 전체 참석 가능 수로만 정렬·표시
  const mode = variant === 'to-be' ? 'priority' : 'headcount';

  // 순위는 정렬 위치에서 파생 — 대안을 미리보기로 올려도 자기 순위 라벨을 유지한다
  const ranked = recommendTimes(attendees, durationMinutes, mode).map((option, index) => ({
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
      <RecommendationCard
        timeLabel={main.timeLabel}
        requiredAttendees={main.requiredAttendees}
        optionalAttendees={main.optionalAttendees}
        variant={main.isFallback ? 'fallback' : 'primary'}
        rankLabel={main.rankLabel}
        mode={mode}
        onConfirm={confirm}
        onRequestRecheck={() => show('재확인 요청을 보냈어요')}
      />
      <AlternativeTimes
        options={alternatives}
        onPreview={(option) => setSelectedLabel(option.timeLabel)}
        mode={mode}
      />
    </>
  );
}
