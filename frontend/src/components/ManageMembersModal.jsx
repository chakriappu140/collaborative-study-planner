import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { FaUserTimes, FaSpinner, FaTimes } from "react-icons/fa";

const ManageMembersModal = ({ group, onClose, onMembersUpdated }) => {
    const [members, setMembers] = useState(group.members);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { axiosInstance, user } = useAuth();

    useEffect(() => {
        setMembers(group.members);
    }, [group.members]);

    const handleRemoveMember = async (memberId) => {
        if (!window.confirm("Are you sure you want to remove this member?")) {
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await axiosInstance.delete(`/api/groups/${group._id}/members/${memberId}`);
            // Optimistically update the UI
            const updatedMembers = members.filter(member => member._id !== memberId);
            setMembers(updatedMembers);
            onMembersUpdated(updatedMembers); // Notify parent component
            //ok
        } catch (err) {
            setError(err.response?.data?.message || "Failed to remove member");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-white">Group Members ({members.length})</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <FaTimes size={20} />
                    </button>
                </div>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                
                <div className="max-h-80 overflow-y-auto space-y-3">
                    {members.map(member => (
                        <div key={member._id} className="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                            <div>
                                <p className="text-white font-semibold">{member.name}</p>
                                <p className="text-gray-400 text-sm">{member.email}</p>
                            </div>
                            {/* Only show the remove button if the member is not the admin */}
                            {group.admin.toString() !== member._id.toString() && (
                                <button
                                    onClick={() => handleRemoveMember(member._id)}
                                    className="p-2 text-red-400 hover:text-red-600 rounded-full transition-colors"
                                    disabled={loading}
                                >
                                    {loading ? <FaSpinner className="animate-spin" /> : <FaUserTimes />}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManageMembersModal;
