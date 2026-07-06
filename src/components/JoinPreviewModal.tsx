import { useState } from 'react';
import { JoinStartView } from './join/JoinStartView';
import { JoinTimesView } from './join/JoinTimesView';
import { JoinDoneView } from './join/JoinDoneView';
import './JoinPreviewModal.css';

type Step = 'start' | 'times' | 'done';

interface JoinPreviewModalProps {
  onClose: () => void;
}

export function JoinPreviewModal({ onClose }: JoinPreviewModalProps) {
  const [step, setStep] = useState<Step>('start');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="modal-sheet__close" aria-label="닫기" onClick={onClose}>
          ✕
        </button>
        {step === 'start' && <JoinStartView onAdvance={() => setStep('times')} />}
        {step === 'times' && <JoinTimesView onAdvance={() => setStep('done')} />}
        {step === 'done' && <JoinDoneView />}
      </div>
    </div>
  );
}
