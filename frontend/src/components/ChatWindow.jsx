import React, { useState, useEffect, useRef } from "react";
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { FaPaperPlane, FaSmile, FaUserCircle } from "react-icons/fa";

const emojiOptions = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ChatWindow = ({ groupId }) => {
  const { axiosInstance, user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);

  const fetchMessages = async () => {
    try {
      const res = await axiosInstance.get(`/api/groups/${groupId}/messages`);
      setMessages(res.data);
    } catch (error) {
      console.error("Failed to fetch messages : ", error);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchMessages();
    }
  }, [groupId]);

  useEffect(() => {
    if (socket) {
      socket.on("message:new", (message) => {
        setMessages(prevMessages => [...prevMessages, message]);
      });

      const reactionHandler = (updatedMessage) => {
        setMessages(prev => prev.map(msg =>
          msg._id === updatedMessage._id ? updatedMessage : msg
        ));
      };

      socket.on("message:reaction:added", reactionHandler);
      socket.on("message:reaction:removed", reactionHandler);
    }
    return () => {
      if (socket) {
        socket.off("message:new");
        socket.off("message:reaction:added");
        socket.off("message:reaction:removed");
      }
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await axiosInstance.post(`/api/groups/${groupId}/messages`, { content: newMessage });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message : ", error);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-full">
      <h2 className="text-2xl font-semibold mb-4">Group Chat</h2>
      <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-700 rounded-lg space-y-4" style={{ height: "500px" }}>
        {messages.map(msg => {
          const isOwnMessage = msg.sender._id === user._id;

          return (
            <div
              key={msg._id}
              className={`flex relative group ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end space-x-2 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                {/* Avatar: show on left for others, right for own messages */}
                {!isOwnMessage ? (
                  msg.sender.avatar ? (
                    <img src={msg.sender.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <FaUserCircle size={32} className="text-gray-400" />
                  )
                ) : null}

                <div className={`p-3 rounded-lg max-w-[70%] ${isOwnMessage ? 'bg-blue-600 text-white self-end' : 'bg-gray-600 text-white self-start'}`}>
                  <span className="font-bold text-sm block">{isOwnMessage ? 'You' : msg.sender.name}</span>
                  <p className="text-sm mt-1">{msg.content}</p>

                  {/* Place your reactions code here as needed */}
                </div>

                {/* Avatar: show on right for self messages */}
                {isOwnMessage ? (
                  user.avatar ? (
                    <img src={user.avatar} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <FaUserCircle size={32} className="text-gray-400" />
                  )
                ) : null}
              </div>

              {/* Place your emoji picker and reaction UI code here as needed */}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="flex mt-4 space-x-2">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded"
          required
        />
        <button type="submit" className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700">
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
