import { useRef, useState } from 'react';
import { Avatar } from './Avatar';
import { RoleToggle } from './RoleToggle';
import { WeekScopeToggle } from './WeekScopeToggle';
import { initialInvitedAttendees, recentAttendees } from '../data/mockAttendees';
import type { AttendeeRole, InvitedAttendee } from '../data/mockAttendees';
import { DURATION_OPTIONS } from '../data/time';
import { useLongPressDrag } from '../utils/useLongPressDrag';
import './CreateMeeting.css';

interface CreateMeetingProps {
  initialTitle?: string;
  initialAttendees?: InvitedAttendee[];
  initialDuration?: number;
  initialWeeksAhead?: number;
  onSubmit: (
    title: string,
    attendees: InvitedAttendee[],
    durationMinutes: number,
    weeksAhead: number,
  ) => void;
}

export function CreateMeeting({
  initialTitle,
  initialAttendees,
  initialDuration,
  initialWeeksAhead,
  onSubmit,
}: CreateMeetingProps) {
  const [title, setTitle] = useState(initialTitle ?? '');
  const [attendees, setAttendees] = useState<InvitedAttendee[]>(initialAttendees ?? []);
  const [durationMinutes, setDurationMinutes] = useState(initialDuration ?? 60);
  // SPEC.md 시나리오("1주일 내 회의를 잡는다")와 일치하도록 기본값은 '다음 주'(1)
  const [weeksAhead, setWeeksAhead] = useState(initialWeeksAhead ?? 1);
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('');
  // 부서/팀은 선택 입력이라 기본 숨김 — 한 번 펼치면 연속 입력을 위해 계속 열어둔다
  const [showTeamField, setShowTeamField] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 제목 미입력 시 disabled로 침묵하는 대신, 클릭에 반응해 이유를 보여주고 입력 위치로 데려간다
  const handleSubmit = () => {
    if (title.trim() === '') {
      setTitleError(true);
      titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      titleInputRef.current?.focus({ preventScroll: true });
      return;
    }
    onSubmit(title.trim(), attendees, durationMinutes, weeksAhead);
  };

  const requiredCount = attendees.filter((attendee) => attendee.role === 'required').length;
  const optionalCount = attendees.length - requiredCount;

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

  const addAttendee = () => {
    const name = newName.trim();
    if (!name) return;
    const team = newTeam.trim();
    setAttendees([
      ...attendees,
      { id: `new-${Date.now()}`, name, role: 'optional', team: team || undefined },
    ]);
    setNewName('');
    setNewTeam('');
  };

  const handleAddKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // 한글 IME 조합 중 Enter는 조합 확정 키이므로 무시 (조합 미종료 상태에서 추가되면 이름이 분리됨)
    if (event.nativeEvent.isComposing) return;
    if (event.key === 'Enter') addAttendee();
  };

  // 이미 목록에 있는 이름은 칩에서 숨긴다
  const availableRecent = recentAttendees.filter(
    (recent) => !attendees.some((attendee) => attendee.name === recent.name),
  );

  const addRecent = (recent: { name: string; team?: string }) => {
    setAttendees([
      ...attendees,
      { id: `recent-${recent.name}`, name: recent.name, role: 'optional', team: recent.team },
    ]);
  };

  // 개발/시연 중 화면 ②③④를 빠르게 확인하기 위한 단축 — 실제 시연은 빈 화면에서 시작
  const fillWithMockData = () => {
    setAttendees(initialInvitedAttendees);
  };

  // 부서/팀 자동완성 — 이미 등록된 참석자들의 부서명 중 입력값과 겹치는 것을 추천 (보조, 강제 아님)
  const teamSuggestions = showTeamField
    ? Array.from(
        new Set(attendees.map((attendee) => attendee.team).filter((team): team is string => !!team)),
      )
        .filter((team) => team !== newTeam.trim() && team.includes(newTeam.trim()))
        .slice(0, 4)
    : [];

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
          value={durationMinutes}
          onChange={(event) => setDurationMinutes(Number(event.target.value))}
        >
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="create-meeting__field">
        <span className="create-meeting__label text-caption">회의 가능 기간</span>
        <WeekScopeToggle value={weeksAhead} onChange={setWeeksAhead} />
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

        {availableRecent.length > 0 && (
          <div className="create-meeting__recent">
            <span className="create-meeting__recent-label text-caption">최근 참석자</span>
            <div className="create-meeting__chips">
              {availableRecent.map((recent) => (
                <button
                  key={recent.name}
                  type="button"
                  className="create-meeting__chip text-caption"
                  onClick={() => addRecent(recent)}
                >
                  + {recent.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="create-meeting__add">
          <input
            className="text-input create-meeting__add-input"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={handleAddKeyDown}
            placeholder="이름"
          />
          {showTeamField ? (
            <>
              <input
                className="text-input create-meeting__add-input"
                value={newTeam}
                onChange={(event) => setNewTeam(event.target.value)}
                onKeyDown={handleAddKeyDown}
                placeholder="부서/팀 (선택)"
              />
              {teamSuggestions.length > 0 && (
                <div className="create-meeting__chips">
                  {teamSuggestions.map((team) => (
                    <button
                      key={team}
                      type="button"
                      className="create-meeting__chip text-caption"
                      onClick={() => setNewTeam(team)}
                    >
                      {team}
                    </button>
                  ))}
                </div>
              )}
            </>
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

      <button type="button" className="link-button text-caption create-meeting__fill" onClick={fillWithMockData}>
        예시 데이터로 빠르게 채우기
      </button>

      <button
        type="button"
        className="button button--primary create-meeting__cta"
        disabled={attendees.length === 0}
        onClick={handleSubmit}
      >
        초대 링크 보내기
      </button>
    </div>
  );
}
