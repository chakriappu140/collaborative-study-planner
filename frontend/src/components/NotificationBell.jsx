import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaTrash, FaTimes } from "react-icons/fa";
import { useNotifications } from "../context/NotificationContext.jsx";
import { useNavigate } from "react-router-dom";
import moment from "moment";

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, deleteNotification, clearAll } =
    useNotifications();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification, isDeleteClick = false) => {
    if (isDeleteClick) return;
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    if (notification.link) {
      navigate(notification.link);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-white bg-gray-700 hover:bg-gray-600 transition-colors"
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <FaBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
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
                onClick={() => {
                  if (
                    window.confirm("Are you sure you want to delete all notifications?")
                  ) {
                    clearAll();
                  }
                }}
                className="text-red-400 hover:text-red-600"
                title="Clear All Notifications"
                aria-label="Clear all notifications"
              >
                <FaTrash />
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="p-4 text-gray-400">No new notifications.</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => handleNotificationClick(n)}
                className={`p-4 border-b border-gray-700 cursor-pointer flex justify-between items-start gap-2 ${
                  n.isRead ? "bg-gray-800" : "bg-gray-700 hover:bg-gray-600"
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleNotificationClick(n);
                }}
              >
                <div>
                  <p
                    className={`text-sm ${
                      n.isRead ? "text-gray-400" : "text-white font-semibold"
                    }`}
                  >
                    {n.message}
                  </p>
                  <span className="block text-xs text-gray-500 mt-1">
                    {moment(n.createdAt).fromNow()}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(n._id);
                  }}
                  className="text-gray-400 hover:text-red-600 flex-shrink-0"
                  title="Dismiss"
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
