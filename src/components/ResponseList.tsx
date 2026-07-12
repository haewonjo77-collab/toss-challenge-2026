import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { AttendanceIcon } from './AttendanceIcon';
import { RoleToggle } from './RoleToggle';
import { Badge } from './Badge';
import type { AttendeeRole, ResponseStatus } from '../data/mockAttendees';
import { organizationMembers } from '../data/organizationMembers';
import type { OrganizationMember } from '../data/organizationMembers';
import { memberMatchesQuery } from '../utils/koreanSearch';
import './ResponseList.css';

interface ResponseListItem extends ResponseStatus {
  role?: AttendeeRole;
  team?: string;
}

interface ResponseListProps {
  responses: ResponseListItem[];
  onChangeRole?: (id: string, role: AttendeeRole) => void;
  onAddAttendee?: (name: string, team?: string) => void | Promise<void>;
}

export function ResponseList({ responses, onChangeRole, onAddAttendee }: ResponseListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [activeMemberIndex, setActiveMemberIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const memberResultsRef = useRef<HTMLDivElement>(null);
  const shouldScrollActiveMemberRef = useRef(false);
  const normalizedMemberQuery = memberQuery.trim().toLowerCase();
  const addedNames = new Set(responses.map((response) => response.name));
  const searchResults = useMemo(
    () =>
      normalizedMemberQuery
        ? organizationMembers
            .filter((member) => memberMatchesQuery(member, normalizedMemberQuery))
            .sort((a, b) => Number(b.id === 'org-jo-haewon') - Number(a.id === 'org-jo-haewon'))
            .slice(0, 8)
        : [],
    [normalizedMemberQuery],
  );

  const startAdding = () => {
    setIsAdding(true);
    window.setTimeout(() => searchInputRef.current?.focus(), 0);
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setMemberQuery('');
    setActiveMemberIndex(0);
  };

  useEffect(() => {
    if (memberResultsRef.current) memberResultsRef.current.scrollTop = 0;
  }, [isAdding, normalizedMemberQuery, searchResults.length]);

  useEffect(() => {
    if (!shouldScrollActiveMemberRef.current) return;
    shouldScrollActiveMemberRef.current = false;
    if (!normalizedMemberQuery || searchResults.length === 0) return;
    const activeOption = document.querySelector(
      `[data-response-member-result-index="${activeMemberIndex}"]`,
    );
    activeOption?.scrollIntoView({ block: 'nearest' });
  }, [activeMemberIndex, normalizedMemberQuery, searchResults.length]);

  const addMember = async (member: OrganizationMember) => {
    if (!onAddAttendee || isSubmitting || addedNames.has(member.name)) return;
    setIsSubmitting(true);
    try {
      await onAddAttendee(member.name, member.team);
      cancelAdding();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing || searchResults.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      shouldScrollActiveMemberRef.current = true;
      setActiveMemberIndex((index) => (index + 1) % searchResults.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      shouldScrollActiveMemberRef.current = true;
      setActiveMemberIndex((index) => (index - 1 + searchResults.length) % searchResults.length);
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      addMember(searchResults[activeMemberIndex] ?? searchResults[0]);
      return;
    }
    if (event.key === 'Escape') {
      cancelAdding();
    }
  };

  return (
    <div className="response-list">
      {responses.map((response) => (
        <div
          key={response.id}
          className={`response-list__row${
            response.responded ? ' response-list__row--responded' : ' response-list__row--pending'
          }`}
        >
          {response.responded ? (
            <AttendanceIcon status="full" />
          ) : (
            <span className="response-list__pending-dot" role="img" aria-label="응답 대기" />
          )}
          <span className="response-list__copy">
            <span className="response-list__name text-body-md">{response.name}</span>
            {response.team && (
              <span className="response-list__team text-caption">{response.team}</span>
            )}
          </span>
          {response.role &&
            (onChangeRole ? (
              // 주최자: 필수/선택을 직접 바꿀 수 있는 토글
              <RoleToggle value={response.role} onChange={(role) => onChangeRole(response.id, role)} />
            ) : (
              // 참석자: 읽기 전용 칩으로 필수/선택만 표시
              <Badge variant={response.role} />
            ))}
        </div>
      ))}
      {onAddAttendee &&
        (isAdding ? (
          <div className="response-list__add-panel">
            <label className="response-list__member-search" aria-label="참석자 검색">
              <span className="response-list__member-search-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m16.5 16.5 4 4" />
                </svg>
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={memberQuery}
                onChange={(event) => {
                  setMemberQuery(event.target.value);
                  setActiveMemberIndex(0);
                }}
                onKeyDown={handleInputKeyDown}
                placeholder="이름, 부서 검색"
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <button
                type="button"
                className="response-list__member-search-clear"
                aria-label="참석자 추가 닫기"
                onClick={cancelAdding}
              >
                ×
              </button>
            </label>
            {normalizedMemberQuery && (
              <div
                ref={memberResultsRef}
                className="response-list__member-results"
                aria-label="조직 멤버 검색 결과"
              >
                {searchResults.length > 0 ? (
                  searchResults.map((member, index) => {
                    const checked = addedNames.has(member.name);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        data-response-member-result-index={index}
                        className={`response-list__member-result${
                          checked ? ' response-list__member-result--selected' : ''
                        }${
                          index === activeMemberIndex ? ' response-list__member-result--active' : ''
                        }`}
                        disabled={checked || isSubmitting}
                        onMouseEnter={() => setActiveMemberIndex(index)}
                        onClick={() => addMember(member)}
                      >
                        <span className="response-list__member-check" aria-hidden="true">
                          {checked ? '✓' : ''}
                        </span>
                        <span className="response-list__member-copy">
                          <span className="response-list__member-name text-body-sm">
                            {member.name}
                          </span>
                          <span className="response-list__member-meta text-caption">
                            {member.team}
                          </span>
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="response-list__member-empty text-caption">
                    일치하는 사람이 없어요
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="response-list__row response-list__row--add"
            onClick={startAdding}
          >
            <span className="response-list__add-icon" aria-hidden="true">
              ＋
            </span>
            <span className="response-list__name text-body-md">참석자 추가</span>
          </button>
        ))}
    </div>
  );
}
