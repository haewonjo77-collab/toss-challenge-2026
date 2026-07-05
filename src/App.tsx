import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { MeetingProvider } from './context/MeetingContext';
import { ToastProvider } from './components/Toast';
import { CreateMeetingPage } from './pages/CreateMeetingPage';
import { WaitingPage } from './pages/WaitingPage';
import { RecommendationPage } from './pages/RecommendationPage';
import { ConfirmedPage } from './pages/ConfirmedPage';
import './App.css';

export function App() {
  return (
    <BrowserRouter>
      <MeetingProvider>
        <div className="app">
          <div className="phone-frame">
            <ToastProvider>
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
