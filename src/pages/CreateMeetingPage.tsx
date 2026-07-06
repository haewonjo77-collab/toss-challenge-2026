import { useNavigate } from 'react-router-dom';
import { CreateMeeting } from '../components/CreateMeeting';
import { useMeeting } from '../context/MeetingContext';
import { useScreenMeasure } from '../utils/measure';

export function CreateMeetingPage() {
  const { title, attendees, durationMinutes, weekScope, createMeeting } = useMeeting();
  const navigate = useNavigate();
  useScreenMeasure('화면① 회의 만들기');

  return (
    <CreateMeeting
      initialTitle={title}
      initialAttendees={attendees.length > 0 ? attendees : undefined}
      initialDuration={durationMinutes}
      initialWeekScope={weekScope}
      onSubmit={(newTitle, newAttendees, newDuration, newWeekScope) => {
        createMeeting(newTitle, newAttendees, newDuration, newWeekScope);
        navigate('/waiting');
      }}
    />
  );
}
