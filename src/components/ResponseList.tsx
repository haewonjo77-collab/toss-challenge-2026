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
          <span
            className={`response-list__status text-caption${
              response.responded ? '' : ' response-list__status--pending'
            }`}
          >
            {response.responded ? '응답완료' : '대기중'}
          </span>
        </div>
      ))}
    </div>
  );
}
