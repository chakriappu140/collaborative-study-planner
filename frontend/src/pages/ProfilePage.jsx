import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaSpinner } from "react-icons/fa";
import { toast } from "react-toastify"; // Make sure to install react-toastify

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

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        try {
          const res = await axiosInstance.get("/api/users/profile");
          setName(res.data.name);
          setEmail(res.data.email);
          setAvatarPreview(res.data.avatar);
        } catch {
          toast.error("Failed to load profile data.");
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
    if (!avatarFile) return toast.error("Please select an image first.");
    setLoading(true);
    const formData = new FormData();
    formData.append("avatar", avatarFile);
    try {
      await axiosInstance.put("/api/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Avatar updated!");
      setTimeout(() => navigate("/dashboard"), 1500); // redirect after success
    } catch {
      toast.error("Failed to update avatar.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInfo = async () => {
    setLoading(true);
    try {
      await axiosInstance.put(
        "/api/users/profile",
        { name, email },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success("Profile info updated!");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch {
      toast.error("Failed to update profile info.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.put("/api/users/profile", {
        oldPassword,
        password,
      });
      toast.success("Password updated!");
      setPassword("");
      setOldPassword("");
      setConfirmPassword("");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch {
      toast.error("Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAllAndLogout = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    if (password) formData.append("password", password);
    if (avatarFile) formData.append("avatar", avatarFile);

    try {
      await axiosInstance.put("/api/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Profile updated! Please log in again.");
      logout();
      navigate("/login");
    } catch {
      toast.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-6">
      <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full shadow-lg">
        <h2 className="text-3xl font-bold mb-6 text-center">User Profile</h2>

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
            disabled={loading}
            className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? <FaSpinner className="animate-spin" /> : "Update Avatar"}
          </button>

          {/* Info */}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            placeholder="Name"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600"
            placeholder="Email"
          />
          <button
            onClick={handleUpdateInfo}
            disabled={loading}
            className="w-full py-2 rounded bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {loading ? <FaSpinner className="animate-spin" /> : "Update Info"}
          </button>

          {/* Password */}
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
            {loading ? (
              <FaSpinner className="animate-spin" />
            ) : (
              "Change Password"
            )}
          </button>

          {/* Update all & logout */}
          <button
            type="button"
            onClick={handleUpdateAllAndLogout}
            disabled={loading}
            className="mt-6 w-full py-2 rounded bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? <FaSpinner className="animate-spin" /> : "Update All & Logout"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="w-full px-4 py-2 mt-2 text-gray-300 bg-gray-600 hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
