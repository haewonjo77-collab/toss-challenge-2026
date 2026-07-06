import { useNavigate } from 'react-router-dom';
import { CreateMeeting } from '../components/CreateMeeting';
import { useMeeting } from '../context/MeetingContext';

export function CreateMeetingPage() {
  const { title, attendees, durationMinutes, weekScope, createMeeting } = useMeeting();
  const navigate = useNavigate();

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
