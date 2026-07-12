import { useEffect, useMemo, useRef, useState } from 'react';
import { RangeCalendar } from './RangeCalendar';
import type { InvitedAttendee } from '../data/mockAttendees';
import { organizationMembers } from '../data/organizationMembers';
import type { OrganizationMember } from '../data/organizationMembers';
import { DURATION_OPTIONS, formatClockLabel } from '../data/time';
import { isWeekend, nextWeekRange, parseISODate, selectedDatesForRange, thisWeekRange } from '../data/schedule';
import { defaultMeetingSettings } from '../context/MeetingContext';
import type { MeetingSettings } from '../context/MeetingContext';
import './CreateMeeting.css';

const DAY_TIME_OPTIONS = Array.from({ length: 31 }, (_, index) => 7 * 60 + index * 30);
type RangeMode = 'this' | 'next' | 'custom';

function dateListsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((date, index) => date === b[index]);
}

interface CreateMeetingProps {
  initialTitle?: string;
  initialAttendees?: InvitedAttendee[];
  initialSettings?: MeetingSettings;
  onSubmit: (
    title: string,
    attendees: InvitedAttendee[],
    settings: MeetingSettings,
    rememberAttendees: boolean,
  ) => boolean | Promise<boolean>;
}

export function CreateMeeting({
  initialTitle,
  initialAttendees,
  initialSettings,
  onSubmit,
}: CreateMeetingProps) {
  const [title, setTitle] = useState(initialTitle ?? '');
  const [attendees, setAttendees] = useState<InvitedAttendee[]>(initialAttendees ?? []);
  const [settings, setSettings] = useState<MeetingSettings>(initialSettings ?? defaultMeetingSettings());
  const patchSettings = (partial: Partial<MeetingSettings>) =>
    setSettings((prev) => ({ ...prev, ...partial }));
  const [memberQuery, setMemberQuery] = useState('');
  const [activeMemberIndex, setActiveMemberIndex] = useState(0);
  const [titleError, setTitleError] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [selectedRangeMode, setSelectedRangeMode] = useState<RangeMode | null>('next');
  const [rememberAttendees, setRememberAttendees] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const shouldScrollActiveMemberRef = useRef(false);

  // 제목 미입력 시 disabled로 침묵하는 대신, 클릭에 반응해 이유를 보여주고 입력 위치로 데려간다
  const handleSubmit = async () => {
    if (submitting) return;
    if (title.trim() === '') {
      setTitleError(true);
      titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      titleInputRef.current?.focus({ preventScroll: true });
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(title.trim(), attendees, settings, rememberAttendees);
    } finally {
      setSubmitting(false);
    }
  };

  const timeRangeLabel = `${formatClockLabel(settings.dayStartMinutes)}–${formatClockLabel(
    settings.dayEndMinutes,
  )}`;
  const thisWeek = thisWeekRange(settings.includeWeekends);
  const nextWeek = nextWeekRange(settings.includeWeekends);
  const activeRangeMode: RangeMode =
    settings.rangeStart === thisWeek.rangeStart &&
    settings.rangeEnd === thisWeek.rangeEnd &&
    dateListsEqual(settings.selectedDates, thisWeek.selectedDates)
      ? 'this'
      : settings.rangeStart === nextWeek.rangeStart &&
          settings.rangeEnd === nextWeek.rangeEnd &&
          dateListsEqual(settings.selectedDates, nextWeek.selectedDates)
        ? 'next'
        : 'custom';
  const visibleRangeMode: RangeMode = customRangeOpen ? 'custom' : (selectedRangeMode ?? activeRangeMode);
  const applyRangeMode = (mode: RangeMode) => {
    setSelectedRangeMode(mode);
    if (mode === 'custom') {
      setCustomRangeOpen(true);
      patchSettings({ selectedDates: [] });
      return;
    }

    const range = mode === 'this' ? thisWeekRange(settings.includeWeekends) : nextWeekRange(settings.includeWeekends);
    setCustomRangeOpen(false);
    patchSettings(range);
  };

  const changeIncludeWeekends = (includeWeekends: boolean) => {
    const effectiveRangeMode = selectedRangeMode ?? activeRangeMode;
    if (customRangeOpen || effectiveRangeMode === 'custom') {
      setSettings((prev) => {
        const selectedDates = includeWeekends
          ? prev.selectedDates
          : prev.selectedDates.filter((date) => !isWeekend(parseISODate(date)));
        const nextDates =
          selectedDates.length > 0
            ? selectedDates
            : selectedDatesForRange(prev.rangeStart, prev.rangeEnd, includeWeekends);
        return {
          ...prev,
          includeWeekends,
          selectedDates: nextDates,
          rangeStart: nextDates[0],
          rangeEnd: nextDates[nextDates.length - 1],
        };
      });
      return;
    }

    const range =
      effectiveRangeMode === 'this' ? thisWeekRange(includeWeekends) : nextWeekRange(includeWeekends);
    setSettings((prev) => ({ ...prev, includeWeekends, ...range }));
  };

  const changeDuration = (durationMinutes: number) => {
    setSettings((prev) => ({
      ...prev,
      durationMinutes,
      dayEndMinutes:
        prev.dayStartMinutes + durationMinutes > prev.dayEndMinutes
          ? prev.dayStartMinutes + durationMinutes
          : prev.dayEndMinutes,
    }));
  };

  const changeDayStart = (dayStartMinutes: number) => {
    setSettings((prev) => ({
      ...prev,
      dayStartMinutes,
      dayEndMinutes:
        dayStartMinutes + prev.durationMinutes > prev.dayEndMinutes
          ? dayStartMinutes + prev.durationMinutes
          : prev.dayEndMinutes,
    }));
  };

  const changeDayEnd = (dayEndMinutes: number) => {
    setSettings((prev) => ({
      ...prev,
      dayEndMinutes,
      dayStartMinutes:
        prev.dayStartMinutes + prev.durationMinutes > dayEndMinutes
          ? dayEndMinutes - prev.durationMinutes
          : prev.dayStartMinutes,
    }));
  };

  const removeAttendee = (id: string) => {
    setAttendees(attendees.filter((attendee) => attendee.id !== id));
  };

  const normalizedMemberQuery = memberQuery.trim().toLowerCase();
  const searchResults = useMemo(
    () =>
      normalizedMemberQuery
        ? organizationMembers
            .filter((member) => {
              return (
                member.name.toLowerCase().includes(normalizedMemberQuery) ||
                member.team.toLowerCase().includes(normalizedMemberQuery)
              );
            })
            .sort((a, b) => Number(b.id === 'org-jo-haewon') - Number(a.id === 'org-jo-haewon'))
            .slice(0, 8)
        : [],
    [normalizedMemberQuery],
  );
  const selectedIds = new Set(attendees.map((attendee) => attendee.id));
  const allSearchResultsSelected =
    searchResults.length > 0 && searchResults.every((member) => selectedIds.has(member.id));

  useEffect(() => {
    if (!shouldScrollActiveMemberRef.current) return;
    shouldScrollActiveMemberRef.current = false;
    if (!normalizedMemberQuery || searchResults.length === 0) return;
    const activeOption = document.querySelector(
      `[data-member-result-index="${activeMemberIndex}"]`,
    );
    activeOption?.scrollIntoView({ block: 'nearest' });
  }, [activeMemberIndex, normalizedMemberQuery, searchResults.length]);

  const toggleMember = (member: OrganizationMember) => {
    setAttendees((prev) =>
      prev.some((attendee) => attendee.id === member.id)
        ? prev.filter((attendee) => attendee.id !== member.id)
        : [
            ...prev,
            {
              id: member.id,
              name: member.name,
              role: 'required',
              team: member.team,
            },
          ],
    );
  };

  const toggleSearchResults = () => {
    if (searchResults.length === 0) return;
    setAttendees((prev) => {
      if (searchResults.every((member) => prev.some((attendee) => attendee.id === member.id))) {
        const resultIds = new Set(searchResults.map((member) => member.id));
        return prev.filter((attendee) => !resultIds.has(attendee.id));
      }
      const existingIds = new Set(prev.map((attendee) => attendee.id));
      const nextAttendees = searchResults
        .filter((member) => !existingIds.has(member.id))
        .map((member) => ({
          id: member.id,
          name: member.name,
          role: 'required' as const,
          team: member.team,
        }));
      return [...prev, ...nextAttendees];
    });
  };

  const handleMemberSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || searchResults.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      shouldScrollActiveMemberRef.current = true;
      setActiveMemberIndex((index) => (index + 1) % searchResults.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      shouldScrollActiveMemberRef.current = true;
      setActiveMemberIndex((index) => (index - 1 + searchResults.length) % searchResults.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      toggleMember(searchResults[activeMemberIndex] ?? searchResults[0]);
    }
  };

  const attendeeSection = (
    <div className="create-meeting__field">
      <div className="create-meeting__section-head">
        <span className="text-title-sm">참석자</span>
        <span className="create-meeting__count text-caption">{attendees.length}명</span>
      </div>

      <div className="create-meeting__add">
        <label className="create-meeting__member-search" aria-label="참석자 검색">
          <span className="create-meeting__member-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <circle cx="11" cy="11" r="7" />
              <path d="m16.5 16.5 4 4" />
            </svg>
          </span>
          <input
            type="text"
            value={memberQuery}
            onChange={(event) => {
              setMemberQuery(event.target.value);
              setActiveMemberIndex(0);
            }}
            onKeyDown={handleMemberSearchKeyDown}
            placeholder="이름, 부서, 프로젝트 검색"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {memberQuery && (
            <button
              type="button"
              className="create-meeting__member-search-clear"
              aria-label="검색어 지우기"
              onClick={() => {
                setMemberQuery('');
                setActiveMemberIndex(0);
              }}
            >
              ×
            </button>
          )}
        </label>
        {normalizedMemberQuery && (
          <div className="create-meeting__member-results" aria-label="조직 멤버 검색 결과">
            {searchResults.length > 0 ? (
              <>
                <div className="create-meeting__member-results-head">
                  <span className="create-meeting__member-results-title text-caption">
                    선택할 사람 {searchResults.length}명
                  </span>
                  <label className="create-meeting__member-select-all text-caption">
                    <input
                      type="checkbox"
                      checked={allSearchResultsSelected}
                      onChange={toggleSearchResults}
                    />
                    전체 선택
                  </label>
                </div>
                {searchResults.map((member, index) => {
                  const checked = selectedIds.has(member.id);
                  return (
                    <label
                      key={member.id}
                      data-member-result-index={index}
                      className={`create-meeting__member-result${
                        checked ? ' create-meeting__member-result--selected' : ''
                      }${
                        index === activeMemberIndex ? ' create-meeting__member-result--active' : ''
                      }`}
                      onMouseEnter={() => setActiveMemberIndex(index)}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleMember(member)}
                      />
                      <span className="create-meeting__member-copy">
                        <span className="create-meeting__member-name text-body-sm">
                          {member.name}
                        </span>
                        <span className="create-meeting__member-meta text-caption">
                          {member.team}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </>
            ) : (
              <p className="create-meeting__member-empty text-caption">
                일치하는 사람이 없어요
              </p>
            )}
          </div>
        )}
        {attendees.length > 0 && (
          <div className="create-meeting__selected-list" aria-label="선택한 참석자">
            {attendees.map((attendee) => (
              <div key={attendee.id} className="create-meeting__selected-row">
                <span className="create-meeting__selected-copy">
                  <span className="create-meeting__selected-name text-body-sm">
                    {attendee.name}
                  </span>
                  {attendee.team && (
                    <span className="create-meeting__selected-team text-caption">
                      {attendee.team}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="create-meeting__remove"
                  aria-label={`${attendee.name} 제거`}
                  onClick={() => removeAttendee(attendee.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="create-meeting">
      <p className="create-meeting__title text-title-lg">회의 만들기</p>
      <p className="create-meeting__subtitle text-body-md">
        <strong>해원님</strong>, 참석자를 선택해주세요
      </p>

      <div className="create-meeting__field">
        <label className="create-meeting__label text-title-sm" htmlFor="meeting-title">
          회의 이름
        </label>
        <input
          id="meeting-title"
          ref={titleInputRef}
          className={`text-input create-meeting__input${titleError ? ' text-input--error' : ''}`}
          value={title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (titleError) setTitleError(false);
          }}
          placeholder="예: 디자인팀 회의"
        />
        {titleError && <p className="create-meeting__error text-body-sm">회의 이름을 입력해주세요</p>}
      </div>

      {attendeeSection}

      <div className="create-meeting__field">
        <div className="create-meeting__section-head">
          <span className="create-meeting__label create-meeting__label--inline text-title-sm">
            후보 날짜
          </span>
          <label className="create-meeting__weekend text-caption">
            <input
              type="checkbox"
              checked={settings.includeWeekends}
              onChange={(event) => changeIncludeWeekends(event.target.checked)}
            />
            주말 포함
          </label>
        </div>
        <div className="create-meeting__range-options" role="group" aria-label="후보 날짜">
          {[
            ['this', '이번 주'],
            ['next', '다음 주'],
            ['custom', '직접 선택'],
          ].map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              className={`create-meeting__range-option text-caption${
                visibleRangeMode === mode ? ' create-meeting__range-option--selected' : ''
              }`}
              onClick={() => applyRangeMode(mode as RangeMode)}
            >
              {label}
            </button>
          ))}
        </div>
        {customRangeOpen && (
          <RangeCalendar
            rangeStart={settings.rangeStart}
            rangeEnd={settings.rangeEnd}
            selectedDates={settings.selectedDates}
            includeWeekends={settings.includeWeekends}
            onChange={(rangeStart, rangeEnd, selectedDates) => {
              setSelectedRangeMode('custom');
              patchSettings({ rangeStart, rangeEnd, selectedDates });
            }}
          />
        )}
        <button
          type="button"
          className="create-meeting__time-range text-body-md"
          onClick={() => setTimeSheetOpen(true)}
        >
          <span className="create-meeting__time-range-label text-caption">가능 시간대</span>
          <span>{timeRangeLabel} 사이</span>
        </button>
      </div>

      <div className="create-meeting__field">
        <label className="create-meeting__label text-title-sm" htmlFor="meeting-duration">
          회의 길이
        </label>
        <select
          id="meeting-duration"
          className="text-input create-meeting__input"
          value={settings.durationMinutes}
          onChange={(event) => changeDuration(Number(event.target.value))}
        >
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="create-meeting__options">
        <p className="create-meeting__options-title text-title-sm">추가 옵션</p>
        <label className="create-meeting__option-row text-body-sm">
          <span className="create-meeting__option-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M10 21h4" />
            </svg>
          </span>
          <span className="create-meeting__option-copy">
            <span className="create-meeting__option-title">참석자 응답 시 알림</span>
          </span>
          <span className="create-meeting__switch">
            <input
              type="checkbox"
              checked={settings.responseNotificationsEnabled}
              onChange={(event) =>
                patchSettings({ responseNotificationsEnabled: event.target.checked })
              }
            />
            <span className="create-meeting__switch-track" aria-hidden="true" />
          </span>
        </label>
        <label className="create-meeting__option-row text-body-sm">
          <span className="create-meeting__option-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M6 4h12v17l-6-4-6 4z" />
            </svg>
          </span>
          <span className="create-meeting__option-copy">
            <span className="create-meeting__option-title">이 회의 참석자 저장</span>
            <span className="create-meeting__option-hint text-caption">
              다음 회의에서 바로 불러올 수 있어요
            </span>
          </span>
          <span className="create-meeting__switch">
            <input
              type="checkbox"
              checked={rememberAttendees}
              onChange={(event) => setRememberAttendees(event.target.checked)}
            />
            <span className="create-meeting__switch-track" aria-hidden="true" />
          </span>
        </label>
      </div>

      <button
        type="button"
        className="button button--primary create-meeting__cta"
        disabled={attendees.length === 0 || submitting}
        onClick={handleSubmit}
      >
        {submitting ? '초대 보내는 중' : '초대 보내기'}
      </button>

      {timeSheetOpen && (
        <div className="modal-overlay" onClick={() => setTimeSheetOpen(false)}>
          <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-sheet__close"
              aria-label="닫기"
              onClick={() => setTimeSheetOpen(false)}
            >
              ✕
            </button>
            <p className="create-meeting__sheet-title text-title-md">참석자가 고를 시간대</p>
            <p className="create-meeting__sheet-hint text-body-md">
              가능 시간대의 시작과 끝을 정해주세요
            </p>
            <div className="create-meeting__time-selects">
              <label className="create-meeting__time-select text-caption">
                시작 시간
                <select
                  className="text-input"
                  value={settings.dayStartMinutes}
                  onChange={(event) => changeDayStart(Number(event.target.value))}
                >
                  {DAY_TIME_OPTIONS.filter(
                    (option) => option + settings.durationMinutes <= settings.dayEndMinutes,
                  ).map((option) => (
                    <option key={option} value={option}>
                      {formatClockLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="create-meeting__time-select text-caption">
                끝 시간
                <select
                  className="text-input"
                  value={settings.dayEndMinutes}
                  onChange={(event) => changeDayEnd(Number(event.target.value))}
                >
                  {DAY_TIME_OPTIONS.filter(
                    (option) => option >= settings.dayStartMinutes + settings.durationMinutes,
                  ).map((option) => (
                    <option key={option} value={option}>
                      {formatClockLabel(option)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              type="button"
              className="button button--primary create-meeting__sheet-cta"
              onClick={() => setTimeSheetOpen(false)}
            >
              저장
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
