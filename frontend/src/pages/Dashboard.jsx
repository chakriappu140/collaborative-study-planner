import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import CreateGroupModal from '../components/CreateGroupModal.jsx';
import JoinGroupModal from '../components/JoinGroupModal.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import DirectMessagesModal from '../components/DirectMessagesModal.jsx';
import { FaUserCircle, FaPaperPlane } from 'react-icons/fa';

const Dashboard = () => {
    const { user, logout, axiosInstance } = useAuth();
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isDMsModalOpen, setIsDMsModalOpen] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [initialInviteToken, setInitialInviteToken] = useState(null);
    const [totalUnreadDMs, setTotalUnreadDMs] = useState(0); // NEW STATE

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await axiosInstance.get('/api/groups/my-groups');
                setGroups(res.data);
            } catch (error) {
                console.error('Failed to fetch groups:', error);
            } finally {
                setLoadingGroups(false);
            }
        };

        if (user) {
            fetchGroups();
            const pendingInviteToken = localStorage.getItem('pendingInviteToken');
            if (pendingInviteToken) {
                setInitialInviteToken(pendingInviteToken);
                setIsJoinModalOpen(true);
            }
        }
    }, [user, axiosInstance]);

    // NEW: Fetch and update total unread DMs
    useEffect(() => {
        const fetchUnreadCount = async () => {
            if (!user) return;
            try {
                const res = await axiosInstance.get('/api/messages/direct/unread-counts');
                const totalCount = res.data.reduce((sum, item) => sum + item.count, 0);
                setTotalUnreadDMs(totalCount);
            } catch (err) {
                console.error("Failed to fetch total unread DMs:", err);
            }
        };

        const dmReadHandler = (readByUserId) => {
            if (readByUserId === user._id) {
                fetchUnreadCount();
            }
        };

        if (user && socket) {
            fetchUnreadCount();
            socket.on('dm:read', dmReadHandler);
            return () => {
                socket.off('dm:read', dmReadHandler);
            }
        }
    }, [user, axiosInstance, socket]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleGroupCreated = (newGroup) => {
        setGroups([...groups, newGroup]);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-8">
            <div className="w-full max-w-4xl flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Welcome, {user?.name}!</h1>
                <div className="flex space-x-4 items-center">
                    <NotificationBell />
                    <Link to="/profile" className="p-2 rounded-full text-white bg-gray-700 hover:bg-gray-600 transition-colors">
                        <FaUserCircle className="w-5 h-5" />
                    </Link>
                    <button
                        onClick={() => setIsDMsModalOpen(true)}
                        className="relative p-2 rounded-full text-white bg-gray-700 hover:bg-gray-600 transition-colors"
                        title="Direct Messages"
                    >
                        <FaPaperPlane className="w-5 h-5" />
                        {totalUnreadDMs > 0 && (
                            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                                {totalUnreadDMs}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>

            <div className="w-full max-w-4xl mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">My Groups</h2>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setIsJoinModalOpen(true)}
                            className="px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
                        >
                            Join Group
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                        >
                            Create New Group
                        </button>
                    </div>
                </div>
                {loadingGroups ? (
                    <p>Loading groups...</p>
                ) : groups.length === 0 ? (
                    <p className="text-gray-400">You are not a member of any groups yet.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {groups.map((group) => (
                            <Link to={`/groups/${group._id}`} key={group._id}>
                                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                                    <h3 className="text-xl font-bold mb-2">{group.name}</h3>
                                    <p className="text-gray-400">{group.description || 'No description provided.'}</p>
                                    <p className="text-sm mt-2">Members: {group.members.length}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
            {isCreateModalOpen && (
                <CreateGroupModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onGroupCreated={handleGroupCreated}
                />
            )}
            {isJoinModalOpen && (
                <JoinGroupModal
                    onClose={() => {
                        setIsJoinModalOpen(false);
                        localStorage.removeItem('pendingInviteToken');
                    }}
                    initialToken={initialInviteToken}
                />
            )}
            {isDMsModalOpen && (
                <DirectMessagesModal onClose={() => setIsDMsModalOpen(false)} />
            )}
        </div>
    );
};

export default Dashboard;