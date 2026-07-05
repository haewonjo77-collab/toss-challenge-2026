import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { MeetingProvider } from './context/MeetingContext';
import { ToastProvider } from './components/Toast';
import { CreateMeetingPage } from './pages/CreateMeetingPage';
import { WaitingPage } from './pages/WaitingPage';
import { RecommendationPage } from './pages/RecommendationPage';
import { ConfirmedPage } from './pages/ConfirmedPage';
import './App.css';

function BackBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isRoot = location.pathname === '/';

  // '/'에서도 바 높이를 유지해 화면 전환 시 카드 위치가 튀지 않게 한다
  return (
    <div className="back-bar">
      {!isRoot && (
        <button type="button" className="back-bar__button" aria-label="뒤로가기" onClick={() => navigate(-1)}>
          ←
        </button>
      )}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <MeetingProvider>
        <div className="app">
          <div className="phone-frame">
            <ToastProvider>
              <BackBar />
              <div className="phone-frame__screen">
                <Routes>
                  <Route path="/" element={<CreateMeetingPage />} />
                  <Route path="/waiting" element={<WaitingPage />} />
                  <Route path="/recommendation" element={<RecommendationPage />} />
                  <Route path="/confirmed" element={<ConfirmedPage />} />
                </Routes>
              </div>
            </ToastProvider>
          </div>
        </div>
      </MeetingProvider>
    </BrowserRouter>
  );
}
