import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaUserEdit, FaSpinner, FaUserCircle } from 'react-icons/fa';

const ProfilePage = () => {
    const { user, axiosInstance, logout } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState('');
    const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState('');

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                try {
                    const res = await axiosInstance.get('/api/users/profile');
                    setName(res.data.name);
                    setEmail(res.data.email);
                    setAvatarPreview(res.data.avatar);
                    setUploadedAvatarUrl(res.data.avatar);
                } catch (e) {
                    setError('Failed to load profile data.');
                }
            }
        };
        fetchProfile();
    }, [user, axiosInstance]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setMessage('');
        setError('');
    };

    const handleUpdateAvatar = async () => {
        if (!avatarFile) {
            setError('Please select an image first.');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        const formData = new FormData();
        formData.append('avatar', avatarFile);

        try {
            const res = await axiosInstance.put('/api/users/profile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage('Avatar uploaded successfully!');
            const updatedUserData = res.data;
            if (updatedUserData.token) {
                localStorage.setItem('token', updatedUserData.token);
            }
            setUploadedAvatarUrl(updatedUserData.avatar);
            setAvatarFile(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload avatar.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleUpdateInfo = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            const res = await axiosInstance.put('/api/users/profile', { name, email }, { headers: { 'Content-Type': 'application/json' } });
            const updatedUserData = res.data;
            if (updatedUserData.token) {
                localStorage.setItem('token', updatedUserData.token);
            }
            setMessage('Profile information updated successfully.');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile information.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await axiosInstance.put('/api/users/profile', { password }, { headers: { 'Content-Type': 'application/json' } });
            const updatedUserData = res.data;
            if (updatedUserData.token) {
                localStorage.setItem('token', updatedUserData.token);
            }
            setMessage('Password updated successfully.');
            setPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAllAndLogout = async () => {
        setLoading(true);
        setError('');
        setMessage('');

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
        if (avatarFile) {
            formData.append('avatar', avatarFile);
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
            setError(err.response?.data?.message || 'Failed to update profile.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
            <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full shadow-lg">
                <h2 className="text-3xl font-bold mb-6 text-center">User Profile</h2>
                {message && <p className="text-green-500 mb-4 text-center">{message}</p>}
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

                <div className="flex justify-center mb-4">
                    {avatarPreview ? (
                        <img src={avatarPreview} alt="avatar" className="w-32 h-32 rounded-full object-cover" />
                    ) : (
                        <div className="w-32 h-32 flex items-center justify-center bg-gray-600 rounded-full text-6xl">
                            <FaUserCircle />
                        </div>
                    )}
                </div>

                <form onSubmit={e => e.preventDefault()} className="space-y-4">
                    <div className="mb-4">
                        <label className="block mb-2 text-gray-400">Profile Picture</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full text-white bg-gray-700 border border-gray-600 rounded p-2"
                        />
                        <button
                            onClick={handleUpdateAvatar}
                            disabled={!avatarFile || loading}
                            className={`mt-2 w-full py-2 rounded ${!avatarFile || loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                        >
                            {loading && avatarFile ? <FaSpinner className="animate-spin inline-block" /> : 'Update Avatar'}
                        </button>
                    </div>

                    <div className="mb-4">
                        <label className="block mb-2 text-gray-400">Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                            required
                        />
                        <label className="block mb-2 text-gray-400">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                            required
                        />
                        <button
                            onClick={handleUpdateInfo}
                            disabled={loading}
                            className={`mt-4 w-full py-2 rounded ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                        >
                            {loading ? <FaSpinner className="animate-spin inline-block" /> : 'Update Name & Email'}
                        </button>
                    </div>

                    <div>
                        <label className="block mb-2 text-gray-400">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                            placeholder="Leave blank to keep current password"
                        />
                        <label className="block mb-2 text-gray-400">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="w-full px-3 py-2 rounded bg-gray-700 border border-gray-600 text-white"
                        />
                        <button
                            onClick={handleUpdatePassword}
                            disabled={loading}
                            className={`mt-4 w-full py-2 rounded ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'} text-white`}
                        >
                            {loading ? <FaSpinner className="animate-spin inline-block" /> : 'Change Password'}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleUpdateAllAndLogout}
                        disabled={loading}
                        className={`mt-6 w-full py-2 rounded ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white`}
                    >
                        {loading ? <FaSpinner className="animate-spin inline-block" /> : 'Update All & Logout'}
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
