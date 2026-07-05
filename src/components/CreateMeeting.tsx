import { useState } from 'react';
import { Avatar } from './Avatar';
import { RoleToggle } from './RoleToggle';
import { initialInvitedAttendees } from '../data/mockAttendees';
import type { AttendeeRole, InvitedAttendee } from '../data/mockAttendees';
import './CreateMeeting.css';

interface CreateMeetingProps {
  onSubmit: (title: string, attendees: InvitedAttendee[]) => void;
}

export function CreateMeeting({ onSubmit }: CreateMeetingProps) {
  const [title, setTitle] = useState('');
  const [attendees, setAttendees] = useState<InvitedAttendee[]>(initialInvitedAttendees);
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
        <span className="create-meeting__label text-caption">회의 시간</span>
        <div className="create-meeting__fixed text-body-md">1시간</div>
        <p className="create-meeting__hint text-body-sm">회의 시간은 1시간으로 고정돼요</p>
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
        onClick={() => onSubmit(title.trim(), attendees)}
      >
        초대 링크 보내기
      </button>
    </div>
  );
}
