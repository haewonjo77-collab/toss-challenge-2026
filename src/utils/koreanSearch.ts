import type { OrganizationMember } from '../data/organizationMembers';

const CHOSEONG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

const JUNGSEONG = [
  'ㅏ',
  'ㅐ',
  'ㅑ',
  'ㅒ',
  'ㅓ',
  'ㅔ',
  'ㅕ',
  'ㅖ',
  'ㅗ',
  'ㅘ',
  'ㅙ',
  'ㅚ',
  'ㅛ',
  'ㅜ',
  'ㅝ',
  'ㅞ',
  'ㅟ',
  'ㅠ',
  'ㅡ',
  'ㅢ',
  'ㅣ',
];

const JONGSEONG = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

function decomposeHangul(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < 0xac00 || code > 0xd7a3) return char;
      const offset = code - 0xac00;
      const choseong = Math.floor(offset / 588);
      const jungseong = Math.floor((offset % 588) / 28);
      const jongseong = offset % 28;
      return `${CHOSEONG[choseong]}${JUNGSEONG[jungseong]}${JONGSEONG[jongseong]}`;
    })
    .join('');
}

function initials(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      if (code < 0xac00 || code > 0xd7a3) return char;
      return CHOSEONG[Math.floor((code - 0xac00) / 588)];
    })
    .join('');
}

function splitSearchTokens(value: string): string[] {
  const compact = value.replace(/\s+/g, '');
  const tokens = value
    .split(/[\s·,/()_-]+/)
    .map((token) => token.trim())
    .filter(Boolean);
  return Array.from(new Set([value.trim(), compact, ...tokens].filter(Boolean)));
}

function matchesPrefix(query: string, target: string): boolean {
  const normalizedTarget = target.toLowerCase();
  return (
    normalizedTarget.startsWith(query) ||
    normalizedTarget.includes(query) ||
    decomposeHangul(normalizedTarget).startsWith(decomposeHangul(query)) ||
    decomposeHangul(normalizedTarget).includes(decomposeHangul(query)) ||
    initials(normalizedTarget).startsWith(initials(query))
  );
}

export function matchesKoreanPrefix(query: string, values: Array<string | undefined>): boolean {
  const rawQuery = query.trim().toLowerCase();
  if (!rawQuery) return false;

  return values.some((value) => {
    if (!value) return false;
    return splitSearchTokens(value).some((token) => matchesPrefix(rawQuery, token));
  });
}

export function memberMatchesQuery(member: OrganizationMember, query: string): boolean {
  return matchesKoreanPrefix(query, [
    member.name,
    member.team,
    member.project,
    member.team ? `${member.team}팀` : undefined,
    member.project ? `${member.project} 프로젝트` : undefined,
  ]);
}
