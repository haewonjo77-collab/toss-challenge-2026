import { Avatar } from './Avatar';
import type { ResponseStatus } from '../data/mockAttendees';
import './ResponseList.css';

interface ResponseListProps {
  responses: ResponseStatus[];
  // AS-IS(가설 A 비교군)에서는 응답 여부를 서로 공개하지 않으므로 상태 라벨을 숨긴다
  showStatus?: boolean;
}

export function ResponseList({ responses, showStatus = true }: ResponseListProps) {
  return (
    <div className="response-list">
      {responses.map((response) => (
        <div key={response.id} className="response-list__row">
          <Avatar name={response.name} />
          <span className="response-list__name text-body-md">{response.name}</span>
          {showStatus && (
            <span
              className={`response-list__status text-caption${
                response.responded ? '' : ' response-list__status--pending'
              }`}
            >
              {response.responded ? '응답완료' : '대기중'}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
