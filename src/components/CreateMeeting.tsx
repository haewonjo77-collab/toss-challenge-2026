import { useState } from 'react';
import { Avatar } from './Avatar';
import { RoleToggle } from './RoleToggle';
import { initialInvitedAttendees } from '../data/mockAttendees';
import type { AttendeeRole, InvitedAttendee } from '../data/mockAttendees';
import { DURATION_OPTIONS } from '../data/time';
import './CreateMeeting.css';

interface CreateMeetingProps {
  initialTitle?: string;
  initialAttendees?: InvitedAttendee[];
  initialDuration?: number;
  onSubmit: (title: string, attendees: InvitedAttendee[], durationMinutes: number) => void;
}

export function CreateMeeting({
  initialTitle,
  initialAttendees,
  initialDuration,
  onSubmit,
}: CreateMeetingProps) {
  const [title, setTitle] = useState(initialTitle ?? '');
  const [attendees, setAttendees] = useState<InvitedAttendee[]>(
    initialAttendees ?? initialInvitedAttendees,
  );
  const [durationMinutes, setDurationMinutes] = useState(initialDuration ?? 60);
  const [newName, setNewName] = useState('');

  const requiredCount = attendees.filter((attendee) => attendee.role === 'required').length;
  const optionalCount = attendees.length - requiredCount;

  const changeRole = (id: string, role: AttendeeRole) => {
    setAttendees(attendees.map((attendee) => (attendee.id === id ? { ...attendee, role } : attendee)));
  };

  const removeAttendee = (id: string) => {
    setAttendees(attendees.filter((attendee) => attendee.id !== id));
  };

  const addAttendee = () => {
    const name = newName.trim();
    if (!name) return;
    setAttendees([...attendees, { id: `new-${Date.now()}`, name, role: 'optional' }]);
    setNewName('');
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
        <div className="create-meeting__section-head">
          <span className="text-title-sm">참석자</span>
          <span className="create-meeting__count text-caption">
            필수 {requiredCount}명 · 선택 {optionalCount}명
          </span>
        </div>

        {attendees.map((attendee) => (
          <div key={attendee.id} className="create-meeting__row">
            <Avatar name={attendee.name} />
            <span className="create-meeting__name text-body-md">{attendee.name}</span>
            <RoleToggle value={attendee.role} onChange={(role) => changeRole(attendee.id, role)} />
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

        <div className="create-meeting__add">
          <input
            className="text-input create-meeting__input"
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              // 한글 IME 조합 중 Enter는 조합 확정 키이므로 무시 (조합 미종료 상태에서 추가되면 이름이 분리됨)
              if (event.nativeEvent.isComposing) return;
              if (event.key === 'Enter') addAttendee();
            }}
            placeholder="이름 입력"
          />
          <button type="button" className="button button--secondary" onClick={addAttendee}>
            추가
          </button>
        </div>
      </div>

      <button
        type="button"
        className="button button--primary create-meeting__cta"
        disabled={title.trim() === '' || attendees.length === 0}
        onClick={() => onSubmit(title.trim(), attendees, durationMinutes)}
      >
        초대 링크 보내기
      </button>
    </div>
  );
}
