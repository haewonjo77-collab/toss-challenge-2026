import { useNavigate } from 'react-router-dom';
import { CreateMeeting } from '../components/CreateMeeting';
import { useMeeting } from '../context/MeetingContext';

export function CreateMeetingPage() {
  const { createMeeting } = useMeeting();
  const navigate = useNavigate();

  return (
    <CreateMeeting
      onSubmit={(title, attendees) => {
        createMeeting(title, attendees);
        navigate('/waiting');
      }}
    />
  );
}
