import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import axios from "axios"; // <-- NEW IMPORT

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { login } = useAuth(); // Removed axiosInstance from useAuth

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // First, perform the login to get a new token
            await login({ email, password });

            const pendingInviteToken = localStorage.getItem("pendingInviteToken");
            if (pendingInviteToken) {
                // If an invite token exists, we'll try to join the group
                localStorage.removeItem("pendingInviteToken");

                try {
                    // Create a new axios instance with the freshly acquired token
                    const token = localStorage.getItem('token');
                    const authAxios = axios.create({
                        baseURL: import.meta.env.VITE_API_BASE_URL,
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    const res = await authAxios.post(`/api/groups/join/${pendingInviteToken}`);
                    alert(res.data.message);
                    navigate(`/groups/${res.data.group._id}`);
                } catch (inviteError) {
                    alert(inviteError.response?.data?.message || "Failed to join group after login.");
                    navigate("/dashboard");
                }
            } else {
                // If no invite token, proceed to the dashboard as normal
                navigate("/dashboard");
            }
        } catch (authError) {
            setError(authError.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <form onSubmit={handleSubmit} className="p-8 bg-gray-800 rounded shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-6 text-center text-white">Login</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <div className="mb-4">
                    <label className="block text-gray-400">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-400">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                        required
                    />
                </div>
                <button type="submit" className="w-full px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700">
                    Login
                </button>
                <p className="mt-4 text-center text-gray-400">
                    Don't have an account? <a href="/signup" className="text-indigo-400 hover:underline">Sign up</a>
                </p>
            </form>
        </div>
    );
};

export default LoginPage;
