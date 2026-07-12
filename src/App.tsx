import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { MeetingProvider } from './context/MeetingContext';
import { JoinProvider } from './context/JoinContext';
import { ToastProvider } from './components/Toast';
import { CreateMeetingPage } from './pages/CreateMeetingPage';
import { WaitingPage } from './pages/WaitingPage';
import { RecommendationPage } from './pages/RecommendationPage';
import { ConfirmedPage } from './pages/ConfirmedPage';
import { HostTimesPage } from './pages/HostTimesPage';
import { JoinStartPage } from './pages/JoinStartPage';
import { JoinTimesPage } from './pages/JoinTimesPage';
import { JoinDonePage } from './pages/JoinDonePage';
import './App.css';

// 각 플로우의 진입점 — 호스트는 회의 만들기 첫 화면(/), 참석자는 응답 입력 첫 화면(/join).
// 이 프로토타입 범위 밖의 홈 화면으로 이어지는 앱이므로, 진입점에서는 뒤로갈 대상이 없어 버튼을 숨긴다.
const ENTRY_POINT_PATHS = ['/', '/join'];

function BackBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isEntryPoint = ENTRY_POINT_PATHS.includes(location.pathname);

  // 진입점에서도 바 높이를 유지해 화면 전환 시 카드 위치가 튀지 않게 한다
  return (
    <div className="back-bar">
      {!isEntryPoint && (
        <button type="button" className="back-bar__button" aria-label="뒤로가기" onClick={() => navigate(-1)}>
          ←
        </button>
      )}
    </div>
  );
}

function AppFrame() {
  const location = useLocation();
  const isParticipantFlow = location.pathname.startsWith('/join');

  return (
    <div className="app">
      <div className={`phone-frame${isParticipantFlow ? ' phone-frame--participant' : ' phone-frame--organizer'}`}>
        <ToastProvider>
          <BackBar />
          <div className="phone-frame__screen">
            <Routes>
              <Route path="/" element={<CreateMeetingPage />} />
              <Route path="/waiting" element={<WaitingPage />} />
              <Route path="/recommendation" element={<RecommendationPage />} />
              <Route path="/confirmed" element={<ConfirmedPage />} />
              <Route path="/host/times" element={<HostTimesPage />} />
              <Route path="/join" element={<JoinStartPage />} />
              <Route path="/join/times" element={<JoinTimesPage />} />
              <Route path="/join/done" element={<JoinDonePage />} />
            </Routes>
          </div>
        </ToastProvider>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <MeetingProvider>
        <JoinProvider>
          <AppFrame />
        </JoinProvider>
      </MeetingProvider>
    </BrowserRouter>
  );
}
