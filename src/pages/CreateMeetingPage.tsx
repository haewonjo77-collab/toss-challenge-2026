import { useNavigate } from 'react-router-dom';
import { CreateMeeting } from '../components/CreateMeeting';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { useScreenMeasure } from '../utils/measure';

export function CreateMeetingPage() {
  const { title, attendees, settings, createMeeting } = useMeeting();
  const navigate = useNavigate();
  const { show } = useToast();
  useScreenMeasure('화면① 회의 만들기');

  // 참석자는 앱 푸시로 초대를 받는 전제라 공유 시트를 열 필요가 없음 —
  // 탭 즉시 발송 확인 상태로 전환한다 (iOS 네이티브 공유 시트 제거)
  const notifyInvite = (attendeeCount: number) => {
    show(`${attendeeCount}명에게 알림을 보냈어요`);
    return true;
  };

  return (
    <CreateMeeting
      initialTitle={title}
      initialAttendees={attendees.length > 0 ? attendees : undefined}
      initialSettings={settings}
      onSubmit={(newTitle, newAttendees, newSettings) => {
        // 참석자 그룹 저장은 화면 ①의 토글이 켜져 있는 동안 upsertMeetingGroup으로
        // 실시간 처리되므로, 제출 시점에 별도로 다시 저장할 필요가 없다.
        notifyInvite(newAttendees.length);
        createMeeting(newTitle, newAttendees, newSettings);
        navigate('/waiting');
        return true;
      }}
    />
  );
}
