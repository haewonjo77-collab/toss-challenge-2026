import { useEffect, useRef, useState } from 'react';
import { Avatar } from './Avatar';
import { RoleToggle } from './RoleToggle';
import { WeekScopeToggle } from './WeekScopeToggle';
import { initialInvitedAttendees, recentAttendees } from '../data/mockAttendees';
import type { AttendeeRole, InvitedAttendee } from '../data/mockAttendees';
import { DURATION_OPTIONS } from '../data/time';
import type { WeekScope } from '../data/schedule';
import './CreateMeeting.css';

interface CreateMeetingProps {
  initialTitle?: string;
  initialAttendees?: InvitedAttendee[];
  initialDuration?: number;
  initialWeekScope?: WeekScope;
  onSubmit: (
    title: string,
    attendees: InvitedAttendee[],
    durationMinutes: number,
    weekScope: WeekScope,
  ) => void;
}

export function CreateMeeting({
  initialTitle,
  initialAttendees,
  initialDuration,
  initialWeekScope,
  onSubmit,
}: CreateMeetingProps) {
  const [title, setTitle] = useState(initialTitle ?? '');
  const [attendees, setAttendees] = useState<InvitedAttendee[]>(initialAttendees ?? []);
  const [durationMinutes, setDurationMinutes] = useState(initialDuration ?? 60);
  // SPEC.md 시나리오("1주일 내 회의를 잡는다")와 일치하도록 기본값은 '다음 주'
  const [weekScope, setWeekScope] = useState<WeekScope>(initialWeekScope ?? 'next');
  const [newName, setNewName] = useState('');
  const [newTeam, setNewTeam] = useState('');
  // 부서/팀은 선택 입력이라 기본 숨김 — 한 번 펼치면 연속 입력을 위해 계속 열어둔다
  const [showTeamField, setShowTeamField] = useState(false);

  const requiredCount = attendees.filter((attendee) => attendee.role === 'required').length;
  const optionalCount = attendees.length - requiredCount;

  // 함수형 업데이트 — 드래그 중 연속 이벤트가 리렌더보다 빠를 때 이전 변경 유실 방지
  const changeRole = (id: string, role: AttendeeRole) => {
    setAttendees((prev) =>
      prev.map((attendee) => (attendee.id === id ? { ...attendee, role } : attendee)),
    );
  };

  // 세그먼트 드래그: 누른 세그먼트의 값을 목표값으로 고정하고 지나가는 행에 일괄 적용
  const dragRoleRef = useRef<AttendeeRole | null>(null);

  useEffect(() => {
    const stopDrag = () => {
      dragRoleRef.current = null;
    };
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchend', stopDrag);
    };
  }, []);

  const beginRoleDrag = (id: string, role: AttendeeRole) => {
    dragRoleRef.current = role;
    changeRole(id, role);
  };

  const applyDragToRow = (id: string) => {
    if (dragRoleRef.current) changeRole(id, dragRoleRef.current);
  };

  const handleRoleDragMove = (clientX: number, clientY: number) => {
    if (!dragRoleRef.current) return;
    const row = (document.elementFromPoint(clientX, clientY) as HTMLElement | null)?.closest(
      '[data-attendee-id]',
    ) as HTMLElement | null;
    const id = row?.dataset.attendeeId;
    if (id) changeRole(id, dragRoleRef.current);
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

  return (
    <div className="create-meeting">
      <p className="create-meeting__title text-title-lg">회의 만들기</p>

      <div className="create-meeting__field">
        <label className="create-meeting__label text-caption" htmlFor="meeting-title">
          회의 제목
        </label>
        <input
          id="meeting-title"
          className="text-input create-meeting__input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="예: 주간 제품 리뷰"
        />
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
        <WeekScopeToggle value={weekScope} onChange={setWeekScope} />
      </div>

      <div className="create-meeting__field">
        <div className="create-meeting__section-head">
          <span className="text-title-sm">참석자</span>
          <span className="create-meeting__count text-caption">
            필수 {requiredCount}명 · 선택 {optionalCount}명
          </span>
        </div>

        {attendees.map((attendee) => (
          <div
            key={attendee.id}
            className="create-meeting__row"
            data-attendee-id={attendee.id}
            onMouseEnter={() => applyDragToRow(attendee.id)}
          >
            <Avatar name={attendee.name} />
            <span className="create-meeting__person">
              <span className="create-meeting__name text-body-md">{attendee.name}</span>
              {attendee.team && <span className="create-meeting__team text-caption">{attendee.team}</span>}
            </span>
            <RoleToggle
              value={attendee.role}
              onChange={(role) => changeRole(attendee.id, role)}
              onBeginDrag={(role) => beginRoleDrag(attendee.id, role)}
              onDragMove={handleRoleDragMove}
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
            추가
          </button>
        </div>
      </div>

      <button type="button" className="link-button text-caption create-meeting__fill" onClick={fillWithMockData}>
        예시 데이터로 빠르게 채우기
      </button>

      <button
        type="button"
        className="button button--primary create-meeting__cta"
        disabled={title.trim() === '' || attendees.length === 0}
        onClick={() => onSubmit(title.trim(), attendees, durationMinutes, weekScope)}
      >
        초대 링크 보내기
      </button>
    </div>
  );
}
