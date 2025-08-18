import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { FaPaperPlane, FaUserCircle, FaTimes } from "react-icons/fa";

const DirectMessagesModal = ({ onClose, initialRecipientId  }) => {
  const { axiosInstance, user } = useAuth();
  const socket = useSocket();
  const [allUsers, setAllUsers] = useState([]);
  const [recipient, setRecipient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messageRefs = useRef({});
  const [replyToMessage, setReplyToMessage] = useState(null);

  useEffect(() => {
    if (replyToMessage && inputRef.current) {
      inputRef.current.focus();
    }
  }, [replyToMessage]);

  const fetchAllUsers = async () => {
    try {
      const res = await axiosInstance.get("/api/users");
      setAllUsers(res.data.filter((u) => u._id !== user._id));
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (recipientId) => {
    try {
      const res = await axiosInstance.get(`/api/messages/direct/${recipientId}`);
      setMessages(res.data);
      await axiosInstance.put(`/api/messages/direct/read/${recipientId}`);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  };

  const scrollToMessage = (messageId) => {
    const el = messageRefs.current[messageId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("highlighted-message");
      setTimeout(() => el.classList.remove("highlighted-message"), 2000);
    }
  };

  useEffect(() => {
    fetchAllUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allUsers.length > 0 && initialRecipientId) {
      const found = allUsers.find(u => u._id === initialRecipientId);
      if (found) setRecipient(found);
    }
  }, [allUsers, initialRecipientId]);

  useEffect(() => {
    if (recipient) {
      fetchMessages(recipient._id);
      setReplyToMessage(null);
    }

    if (socket && user) {
      const dmHandler = (newDM) => {
        if (recipient && newDM.sender._id === recipient._id) {
          setMessages((prev) => [...prev, newDM]);
          axiosInstance.put(`/api/messages/direct/read/${recipient._id}`);
        }
      };
      const reactionAddedHandler = (updatedMessage) => {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === updatedMessage._id ? updatedMessage : msg))
        );
      };
      const reactionRemovedHandler = reactionAddedHandler;

      socket.on("dm:new", dmHandler);
      socket.on("dm:reaction:added", reactionAddedHandler);
      socket.on("dm:reaction:removed", reactionRemovedHandler);

      return () => {
        socket.off("dm:new", dmHandler);
        socket.off("dm:reaction:added", reactionAddedHandler);
        socket.off("dm:reaction:removed", reactionRemovedHandler);
      };
    }
  }, [recipient, socket, user, axiosInstance]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !recipient) return;

    try {
      const res = await axiosInstance.post("/api/messages/direct", {
        recipientId: recipient._id,
        content: newMessage,
        replyTo: replyToMessage?._id || null,
      });
      setMessages((prev) => [...prev, { ...res.data, sender: { _id: user._id, name: user.name, avatar: user.avatar } }]);
      setNewMessage("");
      setReplyToMessage(null);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleRecipientSelect = (selectedRecipient) => {
    setRecipient(selectedRecipient);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
        <FaPaperPlane className="animate-spin text-white" size={30} />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-8 w-full max-w-4xl h-5/6 shadow-lg flex">
        <div className="w-1/3 border-r border-gray-700 pr-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white">Direct Messages</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <FaTimes size={20} />
            </button>
          </div>
          <div className="max-h-[calc(100%-60px)] overflow-y-auto space-y-2">
            {allUsers.map((u) => (
              <div
                key={u._id}
                onClick={() => handleRecipientSelect(u)}
                className={`p-3 rounded-lg flex items-center space-x-3 cursor-pointer ${
                  recipient?._id === u._id ? "bg-indigo-600" : "bg-gray-700 hover:bg-gray-600"
                }`}
              >
                {u.avatar ? (
                  <img src={u.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <FaUserCircle size={32} className="text-gray-400" />
                )}
                <span className="font-semibold">{u.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="w-2/3 flex flex-col pl-4">
          {!recipient ? (
            <div className="flex flex-1 items-center justify-center text-gray-400">
              Select a user to start a conversation.
            </div>
          ) : (
            <>
              <h3 className="text-xl font-bold mb-4">{recipient.name}</h3>

              {replyToMessage && (
                <div className="mb-2 p-2 bg-gray-700 rounded relative">
                  <button
                    onClick={() => setReplyToMessage(null)}
                    className="absolute top-1 right-1 text-gray-400 hover:text-white"
                    title="Cancel reply"
                  >
                    &times;
                  </button>
                  <p className="italic text-sm text-gray-300">
                    Replying to <b>{replyToMessage.sender.name}</b>:{" "}
                    {replyToMessage.content.length > 80
                      ? replyToMessage.content.slice(0, 80) + "..."
                      : replyToMessage.content}
                  </p>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 bg-gray-700 rounded-lg space-y-4">
                {messages.map((msg) => {
                  const isOwnMessage = msg.sender._id === user._id;
                  return (
                    <div
                      key={msg._id}
                      ref={(el) => (messageRefs.current[msg._id] = el)}
                      className={`flex relative group ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      {/* Avatar on left */}
                      {!isOwnMessage ? (
                        msg.sender.avatar ? (
                          <img
                            src={msg.sender.avatar}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover mr-2"
                          />
                        ) : (
                          <FaUserCircle size={32} className="text-gray-400 mr-2" />
                        )
                      ) : null}

                      <div
                        className={`p-3 rounded-lg max-w-[70%] ${
                          isOwnMessage ? "bg-blue-600 text-white" : "bg-gray-600 text-white"
                        }`}
                      >
                        {msg.replyTo && (
                          <div
                            onClick={() => scrollToMessage(msg.replyTo._id)}
                            className="mb-1 p-1 bg-gray-500 rounded text-xs italic cursor-pointer select-none"
                            title="Jump to replied message"
                          >
                            Reply to <b>{msg.replyTo.sender.name}:</b>{" "}
                            {msg.replyTo.content.length > 60
                              ? msg.replyTo.content.slice(0, 60) + "..."
                              : msg.replyTo.content}
                          </div>
                        )}
                        <span className="font-bold text-sm block">
                          {isOwnMessage ? "You" : msg.sender.name}
                        </span>
                        <p className="text-sm mt-1">{msg.content}</p>
                        <button
                          className="mt-1 text-xs text-indigo-300 underline hover:text-indigo-400"
                          onClick={() => setReplyToMessage(msg)}
                          type="button"
                        >
                          Reply
                        </button>
                      </div>

                      {/* Avatar on right */}
                      {isOwnMessage ? (
                        user.avatar ? (
                          <img
                            src={user.avatar}
                            alt="avatar"
                            className="w-8 h-8 rounded-full object-cover ml-2"
                          />
                        ) : (
                          <FaUserCircle size={32} className="text-gray-400 ml-2" />
                        )
                      ) : null}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="flex mt-4 space-x-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded-lg"
                  required
                />
                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-lg hover:bg-indigo-700">
                  <FaPaperPlane />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectMessagesModal;
