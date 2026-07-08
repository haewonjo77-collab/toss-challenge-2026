import { Avatar } from './Avatar';
import type { ResponseStatus } from '../data/mockAttendees';
import './ResponseList.css';

interface ResponseListProps {
  responses: ResponseStatus[];
}

export function ResponseList({ responses }: ResponseListProps) {
  return (
    <div className="response-list">
      {responses.map((response) => (
        <div key={response.id} className="response-list__row">
          <Avatar name={response.name} />
          <span className="response-list__name text-body-md">{response.name}</span>
          {response.responded ? (
            <span className="response-list__status text-caption">응답완료</span>
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
