import { useNavigate } from 'react-router-dom';
import { CreateMeeting } from '../components/CreateMeeting';
import type { InviteDelivery } from '../components/CreateMeeting';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { useScreenMeasure } from '../utils/measure';

export function CreateMeetingPage() {
  const { title, attendees, settings, createMeeting } = useMeeting();
  const navigate = useNavigate();
  const { show } = useToast();
  useScreenMeasure('화면① 회의 만들기');

  const invitePayload = (meetingTitle: string) => {
    const joinUrl = `${window.location.origin}/join`;
    const text = `${meetingTitle} 회의 가능 시간을 표시해주세요`;
    return { joinUrl, text };
  };

  const shareInvite = async (meetingTitle: string) => {
    const { joinUrl, text } = invitePayload(meetingTitle);
    try {
      if (navigator.share) {
        await navigator.share({ title: meetingTitle, text, url: joinUrl });
        show('초대 링크가 공유됐어요');
        return true;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(joinUrl);
        show('초대 링크가 복사됐어요');
        return true;
      }
      show('초대 링크를 준비했어요');
      return true;
    } catch {
      return false;
    }
  };

  const copyInvite = async (meetingTitle: string) => {
    const { joinUrl } = invitePayload(meetingTitle);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(joinUrl);
        show('초대 링크가 복사됐어요');
        return true;
      }
      show('초대 링크를 준비했어요');
      return true;
    } catch {
      show('초대 링크 복사를 다시 시도해주세요');
      return false;
    }
  };

  return (
    <CreateMeeting
      initialTitle={title}
      initialAttendees={attendees.length > 0 ? attendees : undefined}
      initialSettings={settings}
      onSubmit={async (newTitle, newAttendees, newSettings, delivery: InviteDelivery) => {
        const sent = delivery === 'share' ? await shareInvite(newTitle) : await copyInvite(newTitle);
        if (!sent) return false;
        createMeeting(newTitle, newAttendees, newSettings);
        navigate('/waiting');
        return true;
      }}
    />
  );
}
