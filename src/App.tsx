import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { MeetingProvider } from './context/MeetingContext';
import { JoinProvider } from './context/JoinContext';
import { VariantProvider, useVariant } from './context/VariantContext';
import type { Variant } from './context/VariantContext';
import { ToastProvider } from './components/Toast';
import { CreateMeetingPage } from './pages/CreateMeetingPage';
import { WaitingPage } from './pages/WaitingPage';
import { RecommendationPage } from './pages/RecommendationPage';
import { ConfirmedPage } from './pages/ConfirmedPage';
import { JoinStartPage } from './pages/JoinStartPage';
import { JoinTimesPage } from './pages/JoinTimesPage';
import { JoinDonePage } from './pages/JoinDonePage';
import './App.css';

// 사용성 테스트 진행자용 컨트롤 — 실사용자에게 노출되는 UI가 아님.
// 가설 A/B/C의 AS-IS/TO-BE 비교 시연을 위해 프레임 우측 상단에 상시 표시한다.
function VariantSwitch() {
  const { variant, setVariant } = useVariant();
  const options: { value: Variant; label: string }[] = [
    { value: 'as-is', label: 'AS-IS' },
    { value: 'to-be', label: 'TO-BE' },
  ];

  return (
    <div className="variant-switch" role="radiogroup" aria-label="AS-IS/TO-BE 전환 (테스트용)">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={variant === option.value}
          className={`variant-switch__option${
            variant === option.value ? ' variant-switch__option--selected' : ''
          }`}
          onClick={() => setVariant(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function BackBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isRoot = location.pathname === '/';

  // '/'에서도 바 높이를 유지해 화면 전환 시 카드 위치가 튀지 않게 한다
  return (
    <div className="back-bar">
      <div className="back-bar__left">
        {!isRoot && (
          <button
            type="button"
            className="back-bar__button"
            aria-label="뒤로가기"
            onClick={() => navigate(-1)}
          >
            ←
          </button>
        )}
      </div>
      <VariantSwitch />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <VariantProvider>
        <MeetingProvider>
          <JoinProvider>
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
                      <Route path="/join" element={<JoinStartPage />} />
                      <Route path="/join/times" element={<JoinTimesPage />} />
                      <Route path="/join/done" element={<JoinDonePage />} />
                    </Routes>
                  </div>
                </ToastProvider>
              </div>
            </div>
          </JoinProvider>
        </MeetingProvider>
      </VariantProvider>
    </BrowserRouter>
  );
}
