import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import CreateGroupModal from '../components/CreateGroupModal.jsx';
import JoinGroupModal from '../components/JoinGroupModal.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import { FaUserCircle } from 'react-icons/fa'; // NEW IMPORT

const Dashboard = () => {
    const { user, logout, axiosInstance } = useAuth();
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(true);
    const [initialInviteToken, setInitialInviteToken] = useState(null);

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
        </div>
    );
};

export default Dashboard;
