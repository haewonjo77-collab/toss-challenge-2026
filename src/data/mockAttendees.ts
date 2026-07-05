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

export const responsesInProgress: ResponseStatus[] = [
  { id: 'req-1', name: '김도윤', responded: true },
  { id: 'req-2', name: '박서연', responded: true },
  { id: 'req-3', name: '이준호', responded: false },
  { id: 'req-4', name: '최민아', responded: true },
  { id: 'opt-1', name: '정하늘', responded: true },
  { id: 'opt-2', name: '강지훈', responded: false },
  { id: 'opt-3', name: '오예린', responded: true },
];

export const responsesComplete: ResponseStatus[] = responsesInProgress.map((response) => ({
  ...response,
  responded: true,
}));

export const case1RequiredAttendees: Attendee[] = [
  { id: 'req-1', name: '김도윤', status: 'full' },
  { id: 'req-2', name: '박서연', status: 'full' },
  { id: 'req-3', name: '이준호', status: 'full' },
  { id: 'req-4', name: '최민아', status: 'full' },
];

export const case1OptionalAttendees: Attendee[] = [
  { id: 'opt-1', name: '정하늘', status: 'full' },
  { id: 'opt-2', name: '강지훈', status: 'partial' },
  { id: 'opt-3', name: '오예린', status: 'none' },
];

export const case2RequiredAttendees: Attendee[] = [
  { id: 'req-1', name: '김도윤', status: 'full' },
  { id: 'req-2', name: '박서연', status: 'full' },
  { id: 'req-3', name: '이준호', status: 'full' },
  { id: 'req-4', name: '최민아', status: 'none' },
];

export const case2OptionalAttendees: Attendee[] = [
  { id: 'opt-1', name: '정하늘', status: 'full' },
  { id: 'opt-2', name: '강지훈', status: 'none' },
  { id: 'opt-3', name: '오예린', status: 'none' },
];
