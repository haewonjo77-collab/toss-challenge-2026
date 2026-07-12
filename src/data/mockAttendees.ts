export type AttendanceStatus = 'full' | 'none' | 'partial';

export interface Attendee {
  id: string;
  name: string;
  status: AttendanceStatus;
  team?: string;
}

export type AttendeeRole = 'required' | 'optional';

export interface InvitedAttendee {
  id: string;
  name: string;
  role: AttendeeRole;
  team?: string;
}

export const initialInvitedAttendees: InvitedAttendee[] = [
  { id: 'req-1', name: '김도윤', role: 'required', team: '프로덕트' },
  { id: 'req-2', name: '박서연', role: 'required', team: '디자인' },
  { id: 'req-3', name: '이준호', role: 'required', team: '서버개발' },
  { id: 'req-4', name: '최민아', role: 'required', team: '데이터' },
  { id: 'opt-1', name: '정하늘', role: 'optional', team: '마케팅' },
  { id: 'opt-2', name: '강지훈', role: 'optional', team: '프론트엔드' },
  { id: 'opt-3', name: '오예린', role: 'optional' },
];

export type ResponseAvailabilityState = 'pending' | 'available' | 'unavailable';

export interface ResponseStatus {
  id: string;
  name: string;
  responded: boolean;
  availabilityState: ResponseAvailabilityState;
}
