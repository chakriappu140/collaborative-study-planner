import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx'; // Import the socket hook
import TaskBoard from '../components/TaskBoard.jsx';
import CalendarView from '../components/CalendarView.jsx';

const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { axiosInstance, user } = useAuth();
  const socket = useSocket(); // Use the socket hook
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      try {
        const res = await axiosInstance.get(`/api/groups/${groupId}`);
        setGroup(res.data);
        if (socket) {
          socket.emit('joinGroup', groupId);
        }
      } catch (err) {
        console.error('Failed to fetch group details:', err);
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (groupId && socket) {
      fetchGroupDetails();
    }

    return () => {
      if (socket) {
        socket.emit('leaveGroup', groupId);
      }
    };
  }, [groupId, axiosInstance, navigate, socket]);

  if (loading) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading group details...</div>;
  }

  if (!group) {
    return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Group not found.</div>;
  }
  
  const isUserAdmin = group.admin === user._id;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="w-full max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">{group.name}</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
            >
              Back to Dashboard
            </button>
            {isUserAdmin && (
              <button className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700 transition-colors">
                Manage Group
              </button>
            )}
          </div>
        </div>
        <p className="text-gray-400 mb-8">{group.description}</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <TaskBoard groupId={groupId} members={group.members} />
          <CalendarView groupId={groupId} />
        </div>
      </div>
    </div>
  );
};

export default GroupPage;
