export interface OrganizationMember {
  id: string;
  name: string;
  team: string;
}

export const organizationMembers: OrganizationMember[] = [
  { id: 'org-jo-haewon', name: '조해원', team: '프로덕트 디자인' },
  { id: 'org-kim-doyoon', name: '김도윤', team: '프로덕트 디자인' },
  { id: 'org-park-seoyeon', name: '박서연', team: '콘텐츠 디자인' },
  { id: 'org-lee-junho', name: '이준호', team: '서버개발' },
  { id: 'org-choi-mina', name: '최민아', team: '데이터' },
  { id: 'org-jung-haneul', name: '정하늘', team: '마케팅' },
  { id: 'org-kang-jihoon', name: '강지훈', team: '프론트엔드' },
  { id: 'org-oh-yerin', name: '오예린', team: '브랜드' },
  { id: 'org-bang-suin', name: '배수임', team: '프로덕트 디자인' },
  { id: 'org-kang-nakyeong', name: '강나미', team: '마케팅' },
  { id: 'org-jung-haeyoon', name: '정하은', team: '프론트엔드' },
  { id: 'org-yoon-seojin', name: '윤서진', team: '프로덕트' },
  { id: 'org-han-yujin', name: '한유진', team: '백엔드' },
  { id: 'org-lim-taeho', name: '임태호', team: '서버개발' },
];
