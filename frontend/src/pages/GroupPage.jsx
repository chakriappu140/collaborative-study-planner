import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import TaskBoard from '../components/TaskBoard.jsx';
import CalendarView from '../components/CalendarView.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import AddMemberModal from '../components/AddMemberModal.jsx';
import InviteModal from '../components/InviteModal.jsx';
import ManageMembersModal from '../components/ManageMembersModal.jsx';
import FileManagement from '../components/FileManagement.jsx';
import ProgressDashboard from '../components/ProgressDashboard.jsx';
import MembersList from '../components/MembersList.jsx';
import Whiteboard from '../components/Whiteboard.jsx';

const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { axiosInstance, user } = useAuth();
  const socket = useSocket();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false);

  // Read 'tab' query param to set initial active tab
  const queryParams = new URLSearchParams(location.search);
  const tabFromUrl = queryParams.get('tab');

  const [activeTab, setActiveTab] = useState(tabFromUrl || 'tasks');

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

  }, [groupId, axiosInstance, navigate, socket]);

  // Update activeTab if URL changes
  useEffect(() => {
    const newTab = new URLSearchParams(location.search).get('tab');
    if (newTab && newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.search]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleGroupDeleted = (deletedGroupId) => {
      if (deletedGroupId === groupId) {
        alert('This group has been deleted by the admin.');
        navigate('/dashboard');
      }
    };

    const handleMemberAdded = ({ group: updatedGroup }) => {
      setGroup(updatedGroup); // updatedGroup already has populated members
    };

    const handleMemberRemoved = ({ memberId, group: updatedGroup }) => {
      setGroup(updatedGroup); // updatedGroup with updated member list

      if (memberId === user._id) {
        alert('You have been removed from this group.');
        navigate('/dashboard');
      }
    };

    socket.on('group:deleted', handleGroupDeleted);
    socket.on('group:member_added', handleMemberAdded);
    socket.on('group:member_removed', handleMemberRemoved);

    return () => {
      socket.off('group:deleted', handleGroupDeleted);
      socket.off('group:member_added', handleMemberAdded);
      socket.off('group:member_removed', handleMemberRemoved);
    };
  }, [socket, groupId, navigate, user]);


  const handleDeleteGroup = async () => {
    if (
      window.confirm(
        'Are you sure you want to delete this group? All tasks and events will be permanently removed.'
      )
    ) {
      try {
        await axiosInstance.delete(`/api/groups/${groupId}`);
      } catch (err) {
        console.error('Failed to delete group:', err);
      }
    }
  };

  const handleMembersUpdated = (updatedMembers) => {
    setGroup((prevGroup) => ({
      ...prevGroup,
      members: updatedMembers,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Loading group details...
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        Group not found.
      </div>
    );
  }

  const isUserAdmin = user && group.admin.toString() === user._id;

  const renderContent = () => {
    switch (activeTab) {
      case 'tasks':
        return <TaskBoard groupId={groupId} members={group.members} />;
      case 'calendar':
        return <CalendarView groupId={groupId} />;
      case 'chat':
        return <ChatWindow groupId={groupId} />;
      case 'files':
        return <FileManagement groupId={groupId} isUserAdmin={isUserAdmin} />;
      case 'progress':
        return <ProgressDashboard groupId={groupId} />;
      case 'members':
        return <MembersList members={group.members} />;
      case 'whiteboard':
        return <Whiteboard groupId={groupId} />;
      default:
        return null;
    }
  };

  const tabClasses = (tabName) =>
    `px-4 py-2 font-semibold ${
      activeTab === tabName ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'
    }`;

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
              <>
                <button
                  onClick={() => setIsManageMembersModalOpen(true)}
                  className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700 transition-colors"
                >
                  Manage Members
                </button>
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-4 py-2 bg-sky-600 rounded hover:bg-sky-700 transition-colors"
                >
                  Invite Member
                </button>
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 transition-colors"
                >
                  Add Member
                </button>
                <button
                  onClick={handleDeleteGroup}
                  className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 transition-colors"
                >
                  Delete Group
                </button>
              </>
            )}
          </div>
        </div>
        <p className="text-gray-400 mb-8">{group.description}</p>

        <div className="flex border-b border-gray-700 mb-6">
          <button onClick={() => setActiveTab('tasks')} className={tabClasses('tasks')}>
            Tasks
          </button>
          <button onClick={() => setActiveTab('calendar')} className={tabClasses('calendar')}>
            Calendar
          </button>
          <button onClick={() => setActiveTab('chat')} className={tabClasses('chat')}>
            Chat
          </button>
          <button onClick={() => setActiveTab('files')} className={tabClasses('files')}>
            Files
          </button>
          <button onClick={() => setActiveTab('progress')} className={tabClasses('progress')}>
            Progress
          </button>
          <button onClick={() => setActiveTab('members')} className={tabClasses('members')}>
            Members
          </button>
          <button onClick={() => setActiveTab('whiteboard')} className={tabClasses('whiteboard')}>
            Whiteboard
          </button>
        </div>

        <div>{renderContent()}</div>

        {isAddMemberModalOpen && (
          <AddMemberModal
            groupId={groupId}
            onClose={() => setIsAddMemberModalOpen(false)}
            onMemberAdded={(updatedGroup) => setGroup(updatedGroup)}
          />
        )}
        {isInviteModalOpen && (
          <InviteModal groupId={groupId} onClose={() => setIsInviteModalOpen(false)} />
        )}
        {isManageMembersModalOpen && (
          <ManageMembersModal
            group={group}
            onClose={() => setIsManageMembersModalOpen(false)}
            onMembersUpdated={handleMembersUpdated}
          />
        )}
      </div>
    </div>
  );
};

export default GroupPage;
