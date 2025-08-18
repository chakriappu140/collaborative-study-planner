import React, { useState, useEffect, useRef } from "react";
import { FaBell, FaTrash, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { useNavigate } from "react-router-dom";
import moment from "moment";

const NotificationBell = () => {
  const { axiosInstance, user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);

  // Count of unread notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Fetch notifications (consider fetching only unread or recent ones)
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.get("/notifications?limit=20&unread=true"); // Adjust your backend for query params if available
      if (Array.isArray(res.data)) {
        setNotifications(res.data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  useEffect(() => {
    if (socket && user) {
      socket.emit("join", user._id);

      socket.on("notification:new", (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
      });

      return () => {
        socket.emit("leave", user._id);
        socket.off("notification:new");
      };
    }
  }, [socket, user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification, e) => {
    if (e.target.closest('button')) return; // Prevent firing on delete button click

    if (!notification.isRead) {
      try {
        await axiosInstance.put(`/notifications/${notification._id}`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, isRead: true } : n))
        );
      } catch (err) {
        console.error("Failed to mark notification as read:", err);
      }
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  const handleClearAll = async () => {
    if (!notifications.length) return;
    if (window.confirm("Are you sure you want to delete all notifications?")) {
      try {
        await axiosInstance.delete("/notifications");
        setNotifications([]);
      } catch (err) {
        console.error("Failed to delete all notifications:", err);
      }
    }
  };

  const handleDeleteSingle = async (e, id) => {
    e.stopPropagation(); // Avoid triggering notification click
    try {
      await axiosInstance.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        className="relative p-2 rounded-full text-white bg-gray-700 hover:bg-gray-600"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-red-100 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg max-h-96 overflow-y-auto z-10">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-red-400 hover:text-red-600"
                aria-label="Clear all notifications"
              >
                <FaTrash />
              </button>
            )}
          </div>

          {!notifications.length ? (
            <p className="p-4 text-gray-400">No new notifications.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={(e) => handleNotificationClick(n, e)}
                className={`p-4 border-b border-gray-700 cursor-pointer flex justify-between items-start gap-2 ${
                  n.isRead ? "bg-gray-800" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                <div>
                  <p className={`text-sm ${n.isRead ? "text-gray-400" : "text-white font-semibold"}`}>
                    {n.message}
                  </p>
                  <span className="block text-xs text-gray-500 mt-1">
                    {moment(n.createdAt).fromNow()}
                  </span>
                </div>

                <button
                  onClick={(e) => handleDeleteSingle(e, n._id)}
                  className="text-gray-400 hover:text-red-600 flex-shrink-0"
                  aria-label="Dismiss notification"
                >
                  <FaTimes />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
