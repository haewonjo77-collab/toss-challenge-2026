import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { RecommendationCard } from '../components/RecommendationCard';
import { RecommendationTabBar } from '../components/RecommendationTabBar';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { recommendTimes } from '../data/recommendation';
import { listRangeDays } from '../data/schedule';
import { useScreenMeasure } from '../utils/measure';
import './RecommendationPage.css';

export function RecommendationPage() {
  const { title, attendees, settings, confirmMeeting } = useMeeting();
  const navigate = useNavigate();
  const { show } = useToast();
  const [activeLabel, setActiveLabel] = useState<string | null>(null);
  useScreenMeasure('화면③ 추천 결과');

  if (!title) return <Navigate to="/" replace />;

  // 순위는 정렬 위치에서 파생 — 탭 라벨과 카드 내용 모두 여기서 나온다.
  // 참석자 목록은 모든 옵션이 같은 attendees 배열에서 파생되므로 표시 순서가 항상 동일하게 유지된다.
  const rangeDays = listRangeDays(
    settings.rangeStart,
    settings.rangeEnd,
    settings.includeWeekends,
    settings.selectedDates,
  );
  const ranked = recommendTimes(
    attendees,
    settings.durationMinutes,
    rangeDays,
    settings.dayStartMinutes,
    settings.dayEndMinutes,
  )
    .slice(0, 4)
    .map((option, index) => ({ ...option, rankLabel: index === 0 ? '추천' : `대안 ${index}` }));
  const fallbackName = ranked[0]?.requiredAttendees.find((attendee) => attendee.status !== 'full')?.name;
  const fallbackCount = fallbackName
    ? ranked.filter(
        (option) =>
          option.isFallback &&
          option.requiredAttendees.filter((attendee) => attendee.status !== 'full').length === 1 &&
          option.requiredAttendees.some(
            (attendee) => attendee.name === fallbackName && attendee.status !== 'full',
          ),
      ).length
    : 0;
  const active = ranked.find((option) => option.timeLabel === activeLabel) ?? ranked[0];

  if (!active) {
    return (
      <div className="recommendation-page">
        <div className="recommendation-page__empty card">
          <p className="text-title-md">추천할 수 있는 시간이 없어요</p>
          <p className="text-body-sm">회의 가능 기간이나 시간대를 넓혀 다시 확인해주세요</p>
        </div>
      </div>
    );
  }

  const confirm = (option = active) => {
    confirmMeeting({
      timeLabel: option.timeLabel,
      requiredAttendees: option.requiredAttendees,
      optionalAttendees: option.optionalAttendees,
    });
    navigate('/confirmed');
  };

  // 재확인 요청은 필수 참석자 중 불가 응답자에게만 전송된다는 것을 토스트로 명시
  const requestRecheck = (option = active) => {
    const missingRequired = option.requiredAttendees
      .filter((attendee) => attendee.status === 'none')
      .map((attendee) => attendee.name);
    show(
      missingRequired.length > 0
        ? `${missingRequired.join(', ')}님에게 재확인 요청을 보냈어요`
        : '재확인 요청을 보냈어요',
    );
  };

  return (
    <div className="recommendation-page">
      <div className="recommendation-page__mobile">
        {active.isFallback && fallbackName && (
          <div className="recommendation-page__fallback card">
            <p className="text-title-sm">필수 참석자 전원이 가능한 시간은 없어요</p>
            <p className="text-body-sm">
              {fallbackName}님만 다시 확인하면 확정할 수 있는 시간이 {fallbackCount}개 있어요
            </p>
          </div>
        )}
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
          onConfirm={() => confirm(active)}
          onRequestRecheck={() => requestRecheck(active)}
        />
      </div>

      <div className="recommendation-page__desktop">
        {ranked[0]?.isFallback && fallbackName && (
          <div className="recommendation-page__fallback recommendation-page__fallback--desktop card">
            <p className="text-title-sm">필수 참석자 전원이 가능한 시간은 없어요</p>
            <p className="text-body-sm">
              {fallbackName}님만 다시 확인하면 확정할 수 있는 시간이 {fallbackCount}개 있어요
            </p>
          </div>
        )}
        {ranked.map((option) => (
          <RecommendationCard
            key={option.timeLabel}
            timeLabel={`${option.rankLabel} · ${option.timeLabel}`}
            requiredAttendees={option.requiredAttendees}
            optionalAttendees={option.optionalAttendees}
            variant={option.isFallback ? 'fallback' : 'primary'}
            onConfirm={() => confirm(option)}
            onRequestRecheck={() => requestRecheck(option)}
          />
        ))}
      </div>
    </div>
  );
}
