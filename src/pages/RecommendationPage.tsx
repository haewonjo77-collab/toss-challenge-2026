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
  const { title, attendees, responses, settings, confirmMeeting } = useMeeting();
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
  const decidedResponseIds = new Set(
    responses
      .filter((response) => response.availabilityState !== 'pending')
      .map((response) => response.id),
  );
  const pendingRequiredCount = attendees.filter(
    (attendee) => attendee.role === 'required' && !decidedResponseIds.has(attendee.id),
  ).length;
  const recommendationAttendees =
    pendingRequiredCount === 0
      ? attendees.filter(
          (attendee) => attendee.role === 'required' || decidedResponseIds.has(attendee.id),
        )
      : [];
  const recommendedOptions =
    pendingRequiredCount === 0
      ? recommendTimes(
          recommendationAttendees,
          settings.durationMinutes,
          rangeDays,
          settings.dayStartMinutes,
          settings.dayEndMinutes,
        ).slice(0, 2)
      : [];
  const hasPerfectRecommendation = recommendedOptions[0] && !recommendedOptions[0].isFallback;
  const ranked = recommendedOptions.map((option, index) => ({
    ...option,
    rankLabel: hasPerfectRecommendation
      ? index === 0
        ? '추천'
        : `대안 ${index}`
      : `대안 ${index + 1}`,
  }));
  const visibleOptions = hasPerfectRecommendation ? ranked.slice(0, 1) : ranked;
  const fallbackName = ranked[0]?.requiredAttendees.find((attendee) => attendee.status !== 'full')?.name;
  const active = visibleOptions.find((option) => option.timeLabel === activeLabel) ?? visibleOptions[0];

  if (!active) {
    return (
      <div className="recommendation-page">
        <div className="recommendation-page__empty card">
          {pendingRequiredCount > 0 ? (
            <>
              <p className="text-title-lg">필수 참석자 응답을 기다리고 있어요</p>
              <p className="text-body-md">
                필수 참석자 {pendingRequiredCount}명이 응답하면 추천 시간을 볼 수 있어요
              </p>
            </>
          ) : (
            <>
              <p className="text-title-lg">추천할 시간이 없어요</p>
              <p className="text-body-md">후보 날짜나 시간을 더 넓혀주세요</p>
            </>
          )}
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
    navigate('/confirmed', { state: { confirmationNotice: true } });
  };

  const requestRecheck = (option = active) => {
    const names = option.requiredAttendees
      .filter((attendee) => attendee.status !== 'full')
      .map((attendee) => `${attendee.name}님`);
    show(
      names.length > 0
        ? `${names.join(', ')}에게 재확인 요청을 보냈어요`
        : '재확인 요청을 보냈어요',
    );
  };

  return (
    <div className="recommendation-page">
      <div className="recommendation-page__mobile">
        {active.isFallback && fallbackName && (
          <div className="recommendation-page__fallback">
            <p className="text-title-lg">
              필수 전원이 겹치는 시간은 없지만, {visibleOptions.length}가지 방법을 찾았어요
            </p>
            <p className="text-body-md">대안마다 빠지는 사람이 달라요</p>
          </div>
        )}
        {!hasPerfectRecommendation && visibleOptions.length > 1 && (
          <RecommendationTabBar
            options={visibleOptions.map((option) => ({ key: option.timeLabel, label: option.rankLabel }))}
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
          <div className="recommendation-page__fallback recommendation-page__fallback--desktop">
            <p className="text-title-lg">
              필수 전원이 겹치는 시간은 없지만, {visibleOptions.length}가지 방법을 찾았어요
            </p>
            <p className="text-body-md">대안마다 빠지는 사람이 달라요</p>
          </div>
        )}
        {visibleOptions.map((option) => (
          <RecommendationCard
            key={option.timeLabel}
            timeLabel={hasPerfectRecommendation ? option.timeLabel : `${option.rankLabel} · ${option.timeLabel}`}
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
