import { Avatar } from './Avatar';
import type { ResponseStatus } from '../data/mockAttendees';
import './ResponseList.css';

interface ResponseListProps {
  responses: ResponseStatus[];
  // 주최자 화면에서만 전달 — 미응답자에게 알림을 보내는 mock 액션 (참석자 요약에는 없음)
  onNudge?: (name: string) => void;
}

export function ResponseList({ responses, onNudge }: ResponseListProps) {
  return (
    <div className="response-list">
      {responses.map((response) => (
        <div key={response.id} className="response-list__row">
          <Avatar name={response.name} />
          <span className="response-list__name text-body-md">{response.name}</span>
          {response.responded ? (
            <span className="response-list__status text-caption">응답완료</span>
          ) : onNudge ? (
            <button
              type="button"
              className="response-list__nudge text-caption"
              onClick={() => onNudge(response.name)}
            >
              알림 보내기
            </button>
          ) : (
            <span className="response-list__status response-list__status--pending text-caption">
              대기중
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
