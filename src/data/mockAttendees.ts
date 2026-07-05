export type AttendanceStatus = 'full' | 'none' | 'partial';

export interface Attendee {
  id: string;
  name: string;
  status: AttendanceStatus;
}

export type AttendeeRole = 'required' | 'optional';

export interface InvitedAttendee {
  id: string;
  name: string;
  role: AttendeeRole;
}

export const initialInvitedAttendees: InvitedAttendee[] = [
  { id: 'req-1', name: '김도윤', role: 'required' },
  { id: 'req-2', name: '박서연', role: 'required' },
  { id: 'req-3', name: '이준호', role: 'required' },
  { id: 'req-4', name: '최민아', role: 'required' },
  { id: 'opt-1', name: '정하늘', role: 'optional' },
  { id: 'opt-2', name: '강지훈', role: 'optional' },
  { id: 'opt-3', name: '오예린', role: 'optional' },
];

export interface ResponseStatus {
  id: string;
  name: string;
  responded: boolean;
}
