import { useNavigate } from 'react-router-dom';
import { CreateMeeting } from '../components/CreateMeeting';
import { useToast } from '../components/Toast';
import { useMeeting } from '../context/MeetingContext';
import { rememberAttendeeGroups } from '../data/favorites';
import { useScreenMeasure } from '../utils/measure';

export function CreateMeetingPage() {
  const { title, attendees, settings, createMeeting } = useMeeting();
  const navigate = useNavigate();
  const { show } = useToast();
  useScreenMeasure('화면① 회의 만들기');

  const invitePayload = (meetingTitle: string) => {
    const joinUrl = `${window.location.origin}/join`;
    const text = `${meetingTitle}에서 안 되는 시간을 골라주세요`;
    return { joinUrl, text };
  };

  const shareInvite = async (meetingTitle: string) => {
    const { joinUrl, text } = invitePayload(meetingTitle);
    try {
      if (navigator.share) {
        await navigator.share({ title: meetingTitle, text, url: joinUrl });
        show('초대 링크를 공유했어요');
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

  return (
    <CreateMeeting
      initialTitle={title}
      initialAttendees={attendees.length > 0 ? attendees : undefined}
      initialSettings={settings}
      onSubmit={async (newTitle, newAttendees, newSettings, rememberAttendees) => {
        const sent = await shareInvite(newTitle);
        if (!sent) return false;
        if (rememberAttendees) rememberAttendeeGroups(newAttendees);
        createMeeting(newTitle, newAttendees, newSettings);
        navigate('/waiting');
        return true;
      }}
    />
  );
}
