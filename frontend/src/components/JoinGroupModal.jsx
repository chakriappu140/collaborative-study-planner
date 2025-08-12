import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { FaUserPlus, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const JoinGroupModal = ({ onClose, initialToken }) => {
    const [link, setLink] = useState(initialToken ? `${window.location.origin}/invite/${initialToken}` : "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { axiosInstance } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        let tokenToJoin = null;
        
        // Try to parse the URL and extract the token
        try {
            const url = new URL(link);
            const pathSegments = url.pathname.split('/');
            tokenToJoin = pathSegments[pathSegments.length - 1];

            if (!tokenToJoin) {
                throw new Error("Invalid invite link format.");
            }
        } catch (urlError) {
            // If it's not a valid URL, assume the user just pasted the token
            tokenToJoin = link;
        }

        try {
            const res = await axiosInstance.post(`/api/groups/join/${tokenToJoin}`);
            alert(res.data.message);
            // After successful join, redirect to the new group's page
            navigate(`/groups/${res.data.group._id}`);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to join group.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">Join Group with Link</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400">Invite Link or Token</label>
                        <input
                            type="text"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            placeholder="Paste your invite link or token here"
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                            required
                        />
                    </div>
                    <div className="flex justify-between space-x-4">
                        <button 
                            type="submit" 
                            className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center justify-center"
                            disabled={loading}
                        >
                            {loading ? <FaSpinner className="animate-spin" /> : <><FaUserPlus className="mr-2" /> Join Group</>}
                        </button>
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-300 bg-gray-600 rounded hover:bg-gray-700">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default JoinGroupModal;
