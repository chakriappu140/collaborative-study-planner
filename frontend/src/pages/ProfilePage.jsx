import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSpinner } from "react-icons/fa";

const ProfilePage = () => {
  const { user, axiosInstance, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [uploadedAvatarUrl, setUploadedAvatarUrl] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const res = await axiosInstance.get("/api/users/profile");
          setName(res.data.name);
          setEmail(res.data.email);
          setAvatarPreview(res.data.avatar);
          setUploadedAvatarUrl(res.data.avatar);
        } catch {
          setError("Failed to load profile data.");
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
  };

  const handleUpdateAvatar = async () => {
    if (!avatarFile) {
      setError("Please select an image first.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    try {
      const res = await axiosInstance.put("/api/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage("Avatar updated!");
      setUploadedAvatarUrl(res.data.avatar);
      setAvatarPreview(res.data.avatar);
    } catch {
      setError("Failed to update avatar.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.put("/api/users/profile", {
        oldPassword,
        password,
      });
      setMessage("Password updated successfully!");
      setPassword("");
      setOldPassword("");
      setConfirmPassword("");
    } catch {
      setError("Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">User Profile</h2>
        {message && <p className="text-green-500 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex justify-center mb-4">
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="avatar"
              className="w-32 h-32 rounded-full object-cover"
            />
          ) : (
            <div className="w-32 h-32 flex items-center justify-center bg-gray-600 rounded-full text-6xl">
              <FaUserCircle />
            </div>
          )}
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {/* Avatar Upload */}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-white bg-gray-700 border border-gray-600 rounded p-2"
          />
          <button
            onClick={handleUpdateAvatar}
            disabled={!avatarFile || loading}
            className={`w-full py-2 rounded ${
              loading ? "bg-gray-600 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            } text-white`}
          >
            {loading && avatarFile ? <FaSpinner className="animate-spin" /> : "Update Avatar"}
          </button>

          {/* Info inputs */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          />

          {/* Old & New Password */}
          <input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          />
          <input
            type="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
          />
          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? <FaSpinner className="animate-spin" /> : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
