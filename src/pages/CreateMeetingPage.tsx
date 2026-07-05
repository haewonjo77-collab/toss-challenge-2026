import { useNavigate } from 'react-router-dom';
import { CreateMeeting } from '../components/CreateMeeting';
import { useMeeting } from '../context/MeetingContext';

export function CreateMeetingPage() {
  const { title, attendees, durationMinutes, createMeeting } = useMeeting();
  const navigate = useNavigate();

  return (
    <CreateMeeting
      initialTitle={title}
      initialAttendees={attendees.length > 0 ? attendees : undefined}
      initialDuration={durationMinutes}
      onSubmit={(newTitle, newAttendees, newDuration) => {
        createMeeting(newTitle, newAttendees, newDuration);
        navigate('/waiting');
      }}
    />
  );
}
