import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import TaskBoard from '../components/TaskBoard.jsx';
import CalendarView from '../components/CalendarView.jsx';
import AddMemberModal from '../components/AddMemberModal.jsx';
import ChatWindow from '../components/ChatWindow.jsx';
import InviteModal from '../components/InviteModal.jsx';
import ManageMembersModal from '../components/ManageMembersModal.jsx'; // NEW IMPORT

const GroupPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { axiosInstance, user } = useAuth();
    const socket = useSocket();
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isManageMembersModalOpen, setIsManageMembersModalOpen] = useState(false); // NEW STATE

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

        if (socket) {
            socket.on('group:deleted', (deletedGroupId) => {
                if (deletedGroupId === groupId) {
                    alert('This group has been deleted by the admin.');
                    navigate('/dashboard');
                }
            });
            socket.on('group:member_added', ({ group: updatedGroup }) => {
                setGroup(prevGroup => ({
                    ...prevGroup,
                    members: updatedGroup.members
                }));
            });
            // NEW: Socket listener for when a member is removed
            socket.on('group:member_removed', ({ memberId, group: updatedGroup }) => {
                setGroup(prevGroup => ({
                    ...prevGroup,
                    members: updatedGroup.members.filter(m => m._id !== memberId)
                }));
                // If the current user was removed, redirect them
                if (memberId === user._id) {
                    alert("You have been removed from this group.");
                    navigate("/dashboard");
                }
            });
        }

        return () => {
            if (socket) {
                socket.emit('leaveGroup', groupId);
                socket.off('group:deleted');
                socket.off('group:member_added');
                socket.off('group:member_removed'); // Clean up
            }
        };
    }, [groupId, axiosInstance, navigate, socket, user]);

    const handleDeleteGroup = async () => {
        if (window.confirm('Are you sure you want to delete this group? All tasks and events will be permanently removed.')) {
            try {
                await axiosInstance.delete(`/api/groups/${groupId}`);
            } catch (err) {
                console.error('Failed to delete group:', err);
            }
        }
    };
    
    // NEW: Function to handle member list updates
    const handleMembersUpdated = (updatedMembers) => {
        setGroup(prevGroup => ({
            ...prevGroup,
            members: updatedMembers
        }));
    };

    if (loading) {
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading group details...</div>;
    }

    if (!group) {
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Group not found.</div>;
    }
  
    const isUserAdmin = user && group.admin.toString() === user._id;

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
                                    onClick={() => setIsManageMembersModalOpen(true)} // NEW ONCLICK HANDLER
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
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <TaskBoard groupId={groupId} members={group.members} />
                    <CalendarView groupId={groupId} />
                    <ChatWindow groupId={groupId} />
                </div>
            </div>
            {isAddMemberModalOpen && (
                <AddMemberModal
                    groupId={groupId}
                    onClose={() => setIsAddMemberModalOpen(false)}
                    onMemberAdded={(updatedGroup) => setGroup(updatedGroup)}
                />
            )}
            {isInviteModalOpen && (
                <InviteModal
                    groupId={groupId}
                    onClose={() => setIsInviteModalOpen(false)}
                />
            )}
            {isManageMembersModalOpen && (
                <ManageMembersModal // NEW MODAL
                    group={group}
                    onClose={() => setIsManageMembersModalOpen(false)}
                    onMembersUpdated={handleMembersUpdated}
                />
            )}
        </div>
    );
};

export default GroupPage;
