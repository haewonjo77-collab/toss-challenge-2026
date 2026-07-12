export interface OrganizationMember {
  id: string;
  name: string;
  team: string;
  project?: string;
}

export const organizationMembers: OrganizationMember[] = [
  { id: 'org-jo-haewon', name: '조해원', team: '프로덕트 디자인', project: '회의 조율' },
  { id: 'org-kim-doyoon', name: '김도윤', team: '프로덕트 디자인', project: '일정 추천' },
  { id: 'org-park-seoyeon', name: '박서연', team: '콘텐츠 디자인', project: '초대 경험' },
  { id: 'org-lee-junho', name: '이준호', team: '서버개발', project: '응답 수집' },
  { id: 'org-choi-mina', name: '최민아', team: '데이터', project: '추천 로직' },
  { id: 'org-jung-haneul', name: '정하늘', team: '마케팅', project: '사용자 리서치' },
  { id: 'org-kang-jihoon', name: '강지훈', team: '프론트엔드', project: '프로토타입' },
  { id: 'org-oh-yerin', name: '오예린', team: '브랜드', project: '브랜드 경험' },
  { id: 'org-bang-suin', name: '문서연', team: '프로덕트 디자인', project: '모바일 응답' },
  { id: 'org-kang-nakyeong', name: '오지민', team: '마케팅', project: '런칭 캠페인' },
  { id: 'org-jung-haeyoon', name: '하유빈', team: '프론트엔드', project: '상태 알림' },
  { id: 'org-yoon-seojin', name: '윤서진', team: '프로덕트', project: '운영 정책' },
  { id: 'org-han-yujin', name: '한유진', team: '백엔드', project: '초대 링크' },
  { id: 'org-lim-taeho', name: '임태호', team: '서버개발', project: '캘린더 연동' },
];
