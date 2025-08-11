// frontend/src/components/CalendarView.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { FaPlus } from 'react-icons/fa';

const localizer = momentLocalizer(moment);

const CalendarView = ({ groupId }) => {
  const { axiosInstance } = useAuth();
  const socket = useSocket();
  const [events, setEvents] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await axiosInstance.get(`/api/groups/${groupId}/calendar`);
      // Format events for react-big-calendar
      const formattedEvents = res.data.map(event => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end),
      }));
      setEvents(formattedEvents);
    } catch (err) {
      console.error('Failed to fetch calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchEvents();
    }
  }, [groupId]);

  // Set up socket listeners for events
  useEffect(() => {
    if (socket) {
      socket.on('event:created', (newEvent) => {
        const formattedEvent = {
          ...newEvent,
          start: new Date(newEvent.start),
          end: new Date(newEvent.end),
        };
        setEvents((prevEvents) => [...prevEvents, formattedEvent]);
      });
    }
    
    return () => {
      if (socket) {
        socket.off('event:created');
      }
    };
  }, [socket]);

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // For simplicity, we'll create a 1-hour event now.
    const now = new Date();
    const eventData = {
      title,
      description: '',
      start: now,
      end: moment(now).add(1, 'hour').toDate(),
    };

    try {
      const res = await axiosInstance.post(`/api/groups/${groupId}/calendar`, eventData);
      setEvents([...events, { ...res.data.event, start: new Date(res.data.event.start), end: new Date(res.data.event.end) }]);
      setTitle('');
    } catch (err) {
      console.error('Failed to create event:', err);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-4">Group Calendar</h2>
      {loading ? (
        <p className="text-gray-400">Loading calendar...</p>
      ) : (
        <>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 500 }}
            className="bg-gray-700 p-4 rounded-lg text-white"
          />
          <form onSubmit={handleCreateEvent} className="mt-6 flex space-x-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a new event"
              className="flex-1 px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded"
              required
            />
            <button type="submit" className="px-4 py-2 bg-emerald-600 rounded hover:bg-emerald-700">
              <FaPlus />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default CalendarView;
