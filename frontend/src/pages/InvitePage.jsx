import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { FaSpinner } from "react-icons/fa";

const InvitePage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth(); // Removed axiosInstance and socket as they are no longer needed here.

    useEffect(() => {
        // This useEffect now only handles the initial logic.
        if (user) {
            // If the user is already logged in, they can't join again this way.
            // A more complex app would handle this, but for now we'll send them to dashboard.
            // The LoginPage handles the join process for unauthenticated users.
            navigate("/dashboard");
        } else if (token) {
            // If no user and a token exists, store it and redirect to login.
            localStorage.setItem("pendingInviteToken", token);
            navigate("/login");
        }
    }, [user, token, navigate]);

    // The component now only displays a loading state as the redirects happen quickly.
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-3xl font-bold mb-4">Group Invitation</h2>
                <div className="flex items-center justify-center space-x-2 text-gray-400">
                    <FaSpinner className="animate-spin" />
                    <p>Redirecting...</p>
                </div>
            </div>
        </div>
    );
};

export default InvitePage;
