import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FaUserEdit, FaSpinner, FaUserCircle } from 'react-icons/fa';

const ProfilePage = () => {
    const { user, axiosInstance, logout } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user) {
                try {
                    const res = await axiosInstance.get('/api/users/profile');
                    setName(res.data.name);
                    setEmail(res.data.email);
                    setAvatarPreview(res.data.avatar);
                } catch (err) {
                    console.error('Failed to fetch user profile:', err);
                    setError('Failed to load profile data.');
                }
            }
        };
        fetchUserProfile();
    }, [user, axiosInstance]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setAvatar(file);
        if (file) {
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (password && password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('email', email);
        if (password) {
            formData.append('password', password);
        }
        if (avatar) {
            formData.append('avatar', avatar);
        }

        try {
            await axiosInstance.put('/api/users/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            logout();
            setMessage('Profile updated successfully! Please log in again.');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            console.error('Failed to update user profile:', err);
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold mb-6 text-center">User Profile</h2>
                {message && <p className="text-green-500 text-center mb-4">{message}</p>}
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex justify-center mb-4">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="Avatar" className="w-32 h-32 rounded-full object-cover" />
                        ) : (
                            <FaUserCircle size={128} className="text-gray-500" />
                        )}
                    </div>
                    <div>
                        <label className="block text-gray-400">Profile Picture</label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="w-full text-white bg-gray-700 border border-gray-600 rounded p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Leave blank to keep current password"
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center justify-center space-x-2"
                        disabled={loading}
                    >
                        {loading ? <FaSpinner className="animate-spin" /> : <><FaUserEdit /> Update Profile</>}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard')}
                        className="w-full px-4 py-2 text-gray-300 bg-gray-600 rounded hover:bg-gray-700 mt-2"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;
