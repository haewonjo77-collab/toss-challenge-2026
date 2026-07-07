import { useEffect, useRef, useState } from 'react';
import { Avatar } from './Avatar';
import { RoleToggle } from './RoleToggle';
import { RangeCalendar } from './RangeCalendar';
import { rememberAttendeeGroups, loadFavoriteGroups } from '../data/favorites';
import type { AttendeeRole, InvitedAttendee } from '../data/mockAttendees';
import { DURATION_OPTIONS, formatClock24Label } from '../data/time';
import type { FavoriteAttendee, FavoriteGroup } from '../data/favorites';
import { isWeekend, nextWeekRange, parseISODate, selectedDatesForRange, thisWeekRange } from '../data/schedule';
import { defaultMeetingSettings } from '../context/MeetingContext';
import type { MeetingSettings } from '../context/MeetingContext';
import { useLongPressDrag } from '../utils/useLongPressDrag';
import './CreateMeeting.css';

const DAY_TIME_OPTIONS = Array.from({ length: 31 }, (_, index) => 7 * 60 + index * 30);
type RangeMode = 'this' | 'next' | 'custom';

function personKey(person: { name: string; team?: string }) {
  return `${person.name}|${person.team ?? ''}`;
}

function dateListsEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  return a.every((date, index) => date === b[index]);
}

function attendeePreview(attendees: FavoriteAttendee[]) {
  const names = attendees.slice(0, 3).map((attendee) => attendee.name.trim().charAt(0));
  const rest = attendees.length - names.length;
  return rest > 0 ? `${names.join(' ')} +${rest}` : names.join(' ');
}

interface CreateMeetingProps {
  initialTitle?: string;
  initialAttendees?: InvitedAttendee[];
  initialSettings?: MeetingSettings;
  onSubmit: (title: string, attendees: InvitedAttendee[], settings: MeetingSettings) => void;
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
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('');
  // 부서/팀은 선택 입력이라 기본 숨김 — 한 번 펼치면 연속 입력을 위해 계속 열어둔다
  const [showTeamField, setShowTeamField] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  const [customRangeOpen, setCustomRangeOpen] = useState(false);
  const [rememberOpen, setRememberOpen] = useState(false);
  const [favoriteGroups, setFavoriteGroups] = useState<FavoriteGroup[]>([]);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFavoriteGroups(loadFavoriteGroups());
  }, []);

  // 제목 미입력 시 disabled로 침묵하는 대신, 클릭에 반응해 이유를 보여주고 입력 위치로 데려간다
  const handleSubmit = () => {
    if (title.trim() === '') {
      setTitleError(true);
      titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      titleInputRef.current?.focus({ preventScroll: true });
      return;
    }
    setRememberOpen(true);
  };

  const submitMeeting = () => {
    setRememberOpen(false);
    onSubmit(title.trim(), attendees, settings);
  };

  const requiredCount = attendees.filter((attendee) => attendee.role === 'required').length;
  const optionalCount = attendees.length - requiredCount;
  const timeRangeLabel = `${formatClock24Label(settings.dayStartMinutes)}–${formatClock24Label(
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
  const visibleRangeMode: RangeMode = customRangeOpen ? 'custom' : activeRangeMode;
  const applyRangeMode = (mode: RangeMode) => {
    if (mode === 'custom') {
      setCustomRangeOpen(true);
      return;
    }

    const range = mode === 'this' ? thisWeekRange(settings.includeWeekends) : nextWeekRange(settings.includeWeekends);
    setCustomRangeOpen(false);
    patchSettings(range);
  };

  const changeIncludeWeekends = (includeWeekends: boolean) => {
    if (customRangeOpen || activeRangeMode === 'custom') {
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
      activeRangeMode === 'this' ? thisWeekRange(includeWeekends) : nextWeekRange(includeWeekends);
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

  // 함수형 업데이트 — 드래그 중 연속 이벤트가 리렌더보다 빠를 때 이전 변경 유실 방지
  const changeRole = (id: string, role: AttendeeRole) => {
    setAttendees((prev) =>
      prev.map((attendee) =>
        attendee.id === id && attendee.role !== role ? { ...attendee, role } : attendee,
      ),
    );
  };

  // 세그먼트 드래그: 누른 세그먼트의 값을 지나가는 참석자 행에 그대로 적용한다.
  // TimeGrid와 달리 드래그 후 클릭이 다시 발생해도 같은 값이 적용될 뿐이라 클릭 억제가 필요 없다.
  const roleDrag = useLongPressDrag();

  const handleOptionPointerDown = (
    id: string,
    role: AttendeeRole,
    event: React.PointerEvent<HTMLButtonElement>,
  ) => {
    roleDrag.startPress(
      event,
      () => changeRole(id, role),
      (moveEvent) => {
        const row = (
          document.elementFromPoint(moveEvent.clientX, moveEvent.clientY) as HTMLElement | null
        )?.closest('[data-attendee-id]') as HTMLElement | null;
        const rowId = row?.dataset.attendeeId;
        if (rowId) changeRole(rowId, role);
      },
    );
  };

  const removeAttendee = (id: string) => {
    setAttendees(attendees.filter((attendee) => attendee.id !== id));
  };

  const addPeople = (people: FavoriteAttendee[], source: string) => {
    const now = Date.now();
    setAttendees((prev) => {
      const names = new Set(prev.map((attendee) => attendee.name));
      const additions = people
        .filter((person) => !names.has(person.name))
        .map((person, index) => ({
          id: `${source}-${now}-${index}`,
          name: person.name,
          role: person.role,
          team: person.team,
        }));
      return [...prev, ...additions];
    });
    setNewName('');
    setNewTeam('');
    nameInputRef.current?.focus();
  };

  const addAttendeeWithTeam = (teamOverride?: string) => {
    const name = newName.trim();
    if (!name) return false;
    const team = (teamOverride ?? newTeam).trim();
    // 기본값 필수 — 대부분의 초대가 필수 인원이므로, '선택'으로 낮추는 액션만 요구되게 한다
    setAttendees((prev) => [
      ...prev,
      { id: `new-${Date.now()}`, name, role: 'required', team: team || undefined },
    ]);
    setNewName('');
    setNewTeam('');
    setShowTeamField(false);
    // 연속 입력 편의 — 추가 버튼 클릭으로 빠진 포커스를 이름 입력으로 되돌려
    // 리스트가 길어져도 다시 스크롤해 입력창을 찾지 않아도 되게 한다
    nameInputRef.current?.focus();
    return true;
  };

  const addAttendee = () => {
    addAttendeeWithTeam();
  };

  const handleAddKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 IME 조합 중 Enter는 조합 확정 키이므로 무시 (조합 미종료 상태에서 추가되면 이름이 분리됨)
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter') addAttendee();
  };

  const existingNames = new Set(attendees.map((attendee) => attendee.name));
  const searchQuery = newName.trim();
  const savedPeople = Array.from(
    new Map(
      favoriteGroups
        .flatMap((group) => group.attendees)
        .filter((person) => !existingNames.has(person.name))
        .map((person) => [personKey(person), person]),
    ).values(),
  );
  const savedPersonMatches =
    searchQuery.length > 0
      ? savedPeople
          .filter((person) => person.name.includes(searchQuery) || person.team?.includes(searchQuery))
          .slice(0, 4)
      : [];
  const savedTeamMatches =
    searchQuery.length > 0
      ? favoriteGroups
          .filter((group) => group.name !== '최근 회의 전체' && group.name.includes(searchQuery))
          .map((group) => ({
            ...group,
            attendees: group.attendees.filter((person) => !existingNames.has(person.name)),
          }))
          .filter((group) => group.attendees.length > 0)
          .slice(0, 3)
      : [];
  const savedTeamByName = new Map(
    favoriteGroups
      .filter((group) => group.name !== '최근 회의 전체')
      .map((group) => [
        group.name,
        {
          ...group,
          attendees: group.attendees.filter((person) => !existingNames.has(person.name)),
        },
      ]),
  );
  const sameTeamSuggestions = Array.from(
    new Set(attendees.map((attendee) => attendee.team).filter((team): team is string => !!team)),
  )
    .filter((team) => team !== newTeam.trim())
    .slice(0, 4);
  const typedTeamSuggestions = showTeamField
    ? sameTeamSuggestions.filter((team) => newTeam.trim() === '' || team.includes(newTeam.trim()))
    : sameTeamSuggestions;
  const namePlaceholder =
    favoriteGroups.length > 0 ? '이름 입력 또는 저장한 참석자 찾기' : '이름 입력';

  return (
    <div className="create-meeting">
      <p className="create-meeting__title text-title-lg">회의 만들기</p>

      <div className="create-meeting__field">
        <label className="create-meeting__label text-caption" htmlFor="meeting-title">
          회의 제목
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
          placeholder="예: 주간 제품 리뷰"
        />
        {titleError && <p className="create-meeting__error text-body-sm">회의 제목을 입력해주세요</p>}
      </div>

      <div className="create-meeting__field">
        <label className="create-meeting__label text-caption" htmlFor="meeting-duration">
          회의 시간
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

      <div className="create-meeting__field">
        <div className="create-meeting__section-head">
          <span className="create-meeting__label create-meeting__label--inline text-caption">
            회의 가능 범위
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
        <div className="create-meeting__range-options" role="group" aria-label="회의 가능 기간">
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
            onChange={(rangeStart, rangeEnd, selectedDates) =>
              patchSettings({ rangeStart, rangeEnd, selectedDates })
            }
          />
        )}
        <button
          type="button"
          className="create-meeting__time-range text-body-md"
          onClick={() => setTimeSheetOpen(true)}
        >
          <span className="create-meeting__time-range-label text-caption">시간대</span>
          <span>{timeRangeLabel}</span>
        </button>
      </div>

      <div className="create-meeting__field">
        <div className="create-meeting__section-head">
          <span className="text-title-sm">참석자</span>
          <span className="create-meeting__count text-caption">
            필수 {requiredCount}명 · 선택 {optionalCount}명
          </span>
        </div>

        {attendees.map((attendee) => (
          <div key={attendee.id} className="create-meeting__row" data-attendee-id={attendee.id}>
            <Avatar name={attendee.name} />
            <span className="create-meeting__person">
              <span className="create-meeting__name text-body-md">{attendee.name}</span>
              {attendee.team && <span className="create-meeting__team text-caption">{attendee.team}</span>}
            </span>
            <RoleToggle
              value={attendee.role}
              onChange={(role) => changeRole(attendee.id, role)}
              onOptionPointerDown={(role, event) => handleOptionPointerDown(attendee.id, role, event)}
              onOptionPointerMove={roleDrag.movePress}
            />
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

        {favoriteGroups.length > 0 && (
          <div className="create-meeting__recent">
            <span className="create-meeting__recent-label text-caption">저장한 참석자</span>
            <div className="create-meeting__chips">
              {favoriteGroups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className="create-meeting__chip text-caption"
                  onClick={() => {
                    addPeople(group.attendees, `favorite-${group.id}`);
                  }}
                >
                  {group.name} {group.attendees.length}명
                  <span className="create-meeting__chip-preview">{attendeePreview(group.attendees)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="create-meeting__add">
          <input
            ref={nameInputRef}
            className="text-input create-meeting__add-input"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder={namePlaceholder}
          />
          {(savedPersonMatches.length > 0 || savedTeamMatches.length > 0) && (
            <div className="create-meeting__suggestions">
              {savedTeamMatches.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className="create-meeting__suggestion text-caption"
                  onClick={() => addPeople(group.attendees, `team-${group.id}`)}
                >
                  <span>{group.name}</span>
                  <span>{group.attendees.length}명</span>
                </button>
              ))}
              {savedPersonMatches.map((person) => (
                <button
                  key={personKey(person)}
                  type="button"
                  className="create-meeting__suggestion text-caption"
                  onClick={() => addPeople([person], `person-${person.name}`)}
                >
                  <span>{person.name}</span>
                  {person.team && <span>{person.team}</span>}
                </button>
              ))}
            </div>
          )}
          {typedTeamSuggestions.length > 0 && (
            <div className="create-meeting__chips">
              {typedTeamSuggestions.map((team) => (
                <button
                  key={team}
                  type="button"
                  className="create-meeting__chip text-caption"
                  onClick={() => {
                    if (addAttendeeWithTeam(team)) return;
                    const savedTeam = savedTeamByName.get(team);
                    if (savedTeam && savedTeam.attendees.length > 0) {
                      addPeople(savedTeam.attendees, `same-team-${team}`);
                      return;
                    }
                    setNewTeam(team);
                    setShowTeamField(true);
                  }}
                >
                  {team}
                  {savedTeamByName.get(team)?.attendees.length ? (
                    <span className="create-meeting__chip-preview">
                      {savedTeamByName.get(team)!.attendees.length}명
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
          {showTeamField ? (
            <input
              className="text-input create-meeting__add-input"
              value={newTeam}
              onChange={(event) => setNewTeam(event.target.value)}
              onKeyDown={handleAddKeyDown}
              placeholder="부서/팀 (선택)"
            />
          ) : (
            <button
              type="button"
              className="create-meeting__team-toggle text-caption"
              onClick={() => setShowTeamField(true)}
            >
              + 부서/팀 추가
            </button>
          )}
          <button
            type="button"
            className="button button--secondary create-meeting__add-button"
            onClick={addAttendee}
          >
            참석자 추가
          </button>
        </div>
      </div>

      <button
        type="button"
        className="button button--primary create-meeting__cta"
        disabled={attendees.length === 0}
        onClick={handleSubmit}
      >
        초대 링크 보내기
      </button>

      {rememberOpen && (
        <div className="modal-overlay" onClick={() => setRememberOpen(false)}>
          <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="modal-sheet__close"
              aria-label="닫기"
              onClick={() => setRememberOpen(false)}
            >
              ✕
            </button>
            <p className="create-meeting__sheet-title text-title-md">이 회의 참석자를 저장할까요?</p>
            <p className="create-meeting__sheet-hint text-body-sm">다음 회의에서 바로 불러올 수 있어요</p>
            <div className="create-meeting__remember-actions">
              <button type="button" className="button button--secondary" onClick={submitMeeting}>
                아니요
              </button>
              <button
                type="button"
                className="button button--primary"
                onClick={() => {
                  rememberAttendeeGroups(attendees);
                  submitMeeting();
                }}
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

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
            <p className="create-meeting__sheet-title text-title-md">시간대</p>
            <div className="create-meeting__time-selects">
              <label className="create-meeting__time-select text-caption">
                시작
                <select
                  className="text-input"
                  value={settings.dayStartMinutes}
                  onChange={(event) => changeDayStart(Number(event.target.value))}
                >
                  {DAY_TIME_OPTIONS.filter(
                    (option) => option + settings.durationMinutes <= settings.dayEndMinutes,
                  ).map((option) => (
                    <option key={option} value={option}>
                      {formatClock24Label(option)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="create-meeting__time-select text-caption">
                종료
                <select
                  className="text-input"
                  value={settings.dayEndMinutes}
                  onChange={(event) => changeDayEnd(Number(event.target.value))}
                >
                  {DAY_TIME_OPTIONS.filter(
                    (option) => option >= settings.dayStartMinutes + settings.durationMinutes,
                  ).map((option) => (
                    <option key={option} value={option}>
                      {formatClock24Label(option)}
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
              적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
