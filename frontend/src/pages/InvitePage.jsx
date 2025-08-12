import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const InvitePage = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            localStorage.setItem("pendingInviteToken", token);
            navigate("/dashboard");
        } else {
            // If the token is invalid or missing, just go to the dashboard
            navigate("/dashboard");
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-3xl font-bold mb-4">Group Invitation</h2>
                <p className="text-gray-400">Redirecting to dashboard...</p>
            </div>
        </div>
    );
};

export default InvitePage;
