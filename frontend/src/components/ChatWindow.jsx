import React, {useState, useEffect, useRef} from "react"
import {useAuth} from "../context/AuthContext.jsx"
import {useSocket} from "../context/SocketContext.jsx"
import {FaPaperPlane} from "react-icons/fa"
import axios from "axios"

const ChatWindow = ({groupId}) => {
    const {axiosInstance, user} = useAuth()
    const socket = useSocket()
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState("")
    const messagesEndRef = useRef(null)

    const fetchMessages = async () => {
        try {
            const res = await axiosInstance.get(`/api/groups/${groupId}/messages`)
            setMessages(res.data)
        } catch (error) {
            console.error("Failed to fetch messages : ", error)
        }
    }

    useEffect(() => {
        if(groupId){
            fetchMessages()
        }
    }, [groupId])

    useEffect(() => {
        if(socket){
            socket.on("message:new", (message) => {
                setMessages((prevMessages) => [...prevMessages, message])
            })
        }
        return () => {
            if(socket){
                socket.off("message:new")
            }
        }
    }, [socket])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"})
    }, [messages])

    const handleSendMessage = async (e) => {
        e.preventDefault()
        if(!newMessage.trim()) return 

        try {
            await axiosInstance.post(`/api/groups/${groupId}/messages`, {content: newMessage})
            setNewMessage("")
        } catch (error) {
            console.error("Failed to send message : ", error)
        }
    }

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-full">
            <h2 className="text-2xl font-semibold mb-4">Group Chat</h2>
            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-700 rounded-lg space-y-4" style={{height: "500px"}}>
                {messages.map((msg) => (
                    <div
                        key={msg._id}
                        className={`flex ${msg.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            classname={`p-3 rounded-lg max-w-[70%] ${
                                msg.sender._id === user._id ? 'bg-blue-600 text-white self-end' : 'bg-gray-600 text-white self-start'
                            }`}
                        >
                            <span className="font-bold text-sm block">
                                {msg.sender._id === user._id ? 'You' : msg.sender.name}
                            </span>
                            <p className="text-sm mt-1">{msg.content}</p>
                        </div>
                    </div>
                ))}
            <div ref={messagesEndRef}/>
        </div>
        <form onSubmit={handleSendMessage} className="flex mt-4 space-x-2">
            <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded"
                required
            />
            <button type="submit" className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-700">
                <FaPaperPlane/>
            </button>
        </form>
    </div>
    )
}

export default ChatWindow;


import React, { useState, useEffect, useRef } from "react";
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { FaPaperPlane, FaSmile, FaUserCircle } from "react-icons/fa"; // NEW IMPORT

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

    const handleEmojiClick = async (messageId, emoji) => {
        setShowEmojiPicker(null);
        try {
            await axiosInstance.post(`/api/groups/${groupId}/messages/${messageId}/react`, { emoji });
        } catch (err) {
            if (err.response?.status === 400) {
                await axiosInstance.delete(`/api/groups/${groupId}/messages/${messageId}/react`, { data: { emoji } });
            } else {
                console.error("Failed to add reaction:", err);
            }
        }
    };

    const groupReactions = (reactions) => {
        const grouped = {};
        if (!reactions) return grouped;
        reactions.forEach(r => {
            if (!grouped[r.emoji]) {
                grouped[r.emoji] = { count: 0, users: [], reactedByCurrentUser: false };
            }
            grouped[r.emoji].count++;
            grouped[r.emoji].users.push(r.user.name);
            if (r.user._id === user._id) grouped[r.emoji].reactedByCurrentUser = true;
        });
        return grouped;
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col h-full">
            <h2 className="text-2xl font-semibold mb-4">Group Chat</h2>
            <div className="flex-1 overflow-y-auto mb-4 p-4 bg-gray-700 rounded-lg space-y-4" style={{ height: "500px" }}>
                {messages.map(msg => {
                    const isOwnMessage = msg.sender._id === user._id;
                    const grouped = groupReactions(msg.reactions || []);

                    return (
                        <div key={msg._id} className={`flex relative group ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                            <div className="flex items-start space-x-2">
                                {/* Display avatar on the left for messages from others */}
                                {!isOwnMessage && (
                                    msg.sender.avatar ? (
                                        <img src={msg.sender.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <FaUserCircle size={32} className="text-gray-400" />
                                    )
                                )}
                                <div className={`p-3 rounded-lg max-w-[70%] relative ${isOwnMessage ? 'bg-blue-600 text-white self-end' : 'bg-gray-600 text-white self-start'}`}>
                                    <span className="font-bold text-sm block">{isOwnMessage ? 'You' : msg.sender.name}</span>
                                    <p className="text-sm mt-1">{msg.content}</p>

                                    {Object.entries(grouped).length > 0 && (
                                        <div className="mt-2 flex space-x-2 flex-wrap">
                                            {Object.entries(grouped).map(([emoji, data]) => {
                                                const tooltip = data.users.join(", ");
                                                const isReacted = data.reactedByCurrentUser;
                                                const buttonStyle = isReacted ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-300';
                                                return (
                                                    <button
                                                        key={emoji}
                                                        title={tooltip}
                                                        onClick={() => handleEmojiClick(msg._id, emoji)}
                                                        className={`flex items-center space-x-1 px-1 rounded select-none cursor-pointer ${buttonStyle}`}
                                                    >
                                                        <span>{emoji}</span>
                                                        <span>{data.count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                {/* Display avatar on the right for messages from self */}
                                {isOwnMessage && (
                                    user.avatar ? (
                                        <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full object-cover" />
                                    ) : (
                                        <FaUserCircle size={32} className="text-gray-400" />
                                    )
                                )}
                            </div>

                            <div className="relative group-hover:block hidden">
                                <button
                                    onClick={() => setShowEmojiPicker(showEmojiPicker === msg._id ? null : msg._id)}
                                    className={`absolute -top-2 ${isOwnMessage ? '-left-6' : '-right-4'} text-gray-400 hover:text-white`}
                                >
                                    <FaSmile size={14} />
                                </button>
                                {showEmojiPicker === msg._id && (
                                    <div className={`absolute z-50 ${isOwnMessage ? 'top-0 right-full mr-2' : 'top-0 left-full ml-2'} bg-gray-700 p-2 rounded-lg shadow-lg flex space-x-1`}>
                                        {emojiOptions.map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => handleEmojiClick(msg._id, emoji)}
                                                className="text-lg p-1 hover:bg-gray-600 rounded"
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
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
