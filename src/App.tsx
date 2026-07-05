import { CreateMeeting } from './components/CreateMeeting';
import { WaitingRoom } from './components/WaitingRoom';
import { RecommendationCard } from './components/RecommendationCard';
import {
  case1RequiredAttendees,
  case1OptionalAttendees,
  case2RequiredAttendees,
  case2OptionalAttendees,
  responsesInProgress,
  responsesComplete,
} from './data/mockAttendees';
import './App.css';

export function App() {
  return (
    <main className="app">
      <section className="app__screen">
        <p className="app__label text-caption">화면 ① — 회의 만들기</p>
        <CreateMeeting onSubmit={(title) => alert(`'${title}' 회의의 초대 링크를 보냈습니다`)} />
      </section>

      <section className="app__screen">
        <p className="app__label text-caption">화면 ② — 대기 · 응답 진행 중</p>
        <WaitingRoom
          attendees={responsesInProgress}
          onViewRecommendation={() => alert('추천 시간으로 이동합니다')}
        />
      </section>

      <section className="app__screen">
        <p className="app__label text-caption">화면 ② — 대기 · 전원 응답 완료</p>
        <WaitingRoom
          attendees={responsesComplete}
          onViewRecommendation={() => alert('추천 시간으로 이동합니다')}
        />
      </section>

      <section className="app__screen">
        <p className="app__label text-caption">화면 ③ — 추천 결과 · CASE 1 (필수 전원가능)</p>
        <RecommendationCard
          timeLabel="화요일 오후 2:00 - 3:00"
          requiredAttendees={case1RequiredAttendees}
          optionalAttendees={case1OptionalAttendees}
          variant="primary"
          onConfirm={() => alert('확정되었습니다')}
        />
      </section>

      <section className="app__screen">
        <p className="app__label text-caption">화면 ③ — 추천 결과 · CASE 2 (차선책)</p>
        <RecommendationCard
          timeLabel="목요일 오전 10:00 - 11:00"
          requiredAttendees={case2RequiredAttendees}
          optionalAttendees={case2OptionalAttendees}
          variant="fallback"
          onConfirm={() => alert('이대로 확정되었습니다')}
          onRequestRecheck={() => alert('재확인 요청을 보냈습니다')}
        />
      </section>
    </main>
  );
}
