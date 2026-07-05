export type AttendanceStatus = 'full' | 'none' | 'partial';

export interface Attendee {
  id: string;
  name: string;
  status: AttendanceStatus;
}

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
