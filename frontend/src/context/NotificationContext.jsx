import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user, axiosInstance } = useAuth();
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const res = await axiosInstance.get("/api/notifications");
        if (Array.isArray(res.data)) {
          setNotifications(res.data);
        } else {
          setNotifications([]);
          console.error("Notifications response not array:", res.data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
  }, [user, axiosInstance]);

  useEffect(() => {
    if (socket && user) {
      socket.emit("joinNotification", user._id);

      const handleNewNotification = (newNotification) => {
        setNotifications((prev) => [newNotification, ...prev]);
      };
      socket.on("notification:new", handleNewNotification);

      return () => {
        socket.emit("leaveNotification", user._id);
        socket.off("notification:new", handleNewNotification);
      };
    }
  }, [socket, user]);

  const markAsRead = async (notificationId) => {
    try {
      await axiosInstance.put(`/api/notifications/${notificationId}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await axiosInstance.delete(`/api/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const clearAll = async () => {
    try {
      await axiosInstance.delete("/api/notifications");
      setNotifications([]);
    } catch (err) {
      console.error("Failed to delete all notifications:", err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount: notifications.filter((n) => !n.isRead).length,
        markAsRead,
        deleteNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
