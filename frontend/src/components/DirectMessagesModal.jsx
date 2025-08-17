import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { FaPaperPlane, FaUserCircle, FaTimes, FaSpinner } from "react-icons/fa";

const DirectMessagesModal = ({ onClose, onUnreadCountChange, initialUnreadCounts }) => {
    const { axiosInstance, user } = useAuth();
    const socket = useSocket();
    const [allUsers, setAllUsers] = useState([]);
    const [recipient, setRecipient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [unreadCounts, setUnreadCounts] = useState(initialUnreadCounts); // Use the prop for initial state
    const messagesEndRef = useRef(null);

    const fetchAllUsers = async () => {
        try {
            const res = await axiosInstance.get('/api/users');
            setAllUsers(res.data.filter(u => u._id !== user._id));
        } catch (err) {
            console.error("Failed to fetch users:", err);
        } finally {
            setLoading(false);
        }
    };
    
    // We no longer need this function as the parent handles the initial fetch
    // const fetchUnreadCounts = async () => {
    //     try {
    //         const res = await axiosInstance.get('/api/messages/direct/unread-counts');
    //         const counts = res.data.reduce((acc, curr) => {
    //             acc[curr._id] = curr.count;
    //             return acc;
    //         }, {});
    //         setUnreadCounts(counts);
    //         const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    //         onUnreadCountChange(total);
    //     } catch (err) {
    //         console.error("Failed to fetch unread DM counts:", err);
    //     }
    // };

    const fetchMessages = async (recipientId) => {
        try {
            const res = await axiosInstance.get(`/api/messages/direct/${recipientId}`);
            setMessages(res.data);
            const oldUnreadCount = unreadCounts[recipientId] || 0;
            if (oldUnreadCount > 0) {
                await axiosInstance.put(`/api/messages/direct/read/${recipientId}`);
                setUnreadCounts(prev => ({ ...prev, [recipientId]: 0 }));
                onUnreadCountChange(prevTotal => prevTotal - oldUnreadCount);
            }
        } catch (err) {
            console.error("Failed to fetch messages:", err);
        }
    };

    useEffect(() => {
        fetchAllUsers();
    }, []);

    useEffect(() => {
        if (recipient) {
            fetchMessages(recipient._id);
        }
        if (socket && user) {
            const dmHandler = (newDM) => {
                if (recipient && newDM.sender._id === recipient._id) {
                    setMessages(prev => [...prev, newDM]);
                    axiosInstance.put(`/api/messages/direct/read/${recipient._id}`);
                } else {
                    setUnreadCounts(prev => {
                        const newCount = (prev[newDM.sender._id] || 0) + 1;
                        onUnreadCountChange(prevTotal => prevTotal + 1);
                        return {
                            ...prev,
                            [newDM.sender._id]: newCount
                        };
                    });
                }
            };
            socket.on('dm:new', dmHandler);
            return () => {
                socket.off('dm:new', dmHandler);
            };
        }
    }, [recipient, socket, user, onUnreadCountChange]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !recipient) return;

        try {
            const res = await axiosInstance.post('/api/messages/direct', {
                recipientId: recipient._id,
                content: newMessage,
            });
            setMessages(prev => [...prev, { ...res.data, sender: { _id: user._id, name: user.name } }]);
            setNewMessage('');
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
                <FaSpinner className="animate-spin text-white" size={30} />
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
                        {allUsers.map(u => (
                            <div 
                                key={u._id} 
                                onClick={() => handleRecipientSelect(u)}
                                className={`p-3 rounded-lg flex items-center space-x-3 cursor-pointer ${recipient?._id === u._id ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'} relative`}
                            >
                                <FaUserCircle size={20} />
                                <span className="font-semibold">{u.name}</span>
                                {unreadCounts[u._id] > 0 && (
                                    <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                                        {unreadCounts[u._id]}
                                    </span>
                                )}
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
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-700 rounded-lg space-y-4">
                                {messages.map(msg => (
                                    <div
                                        key={msg._id}
                                        className={`flex ${msg.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`p-3 rounded-lg max-w-[70%] ${
                                                msg.sender._id === user._id
                                                    ? 'bg-blue-600 text-white self-end'
                                                    : 'bg-gray-600 text-white self-start'
                                            }`}
                                        >
                                            <p className="text-sm">{msg.content}</p>
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <form onSubmit={handleSendMessage} className="flex mt-4 space-x-2">
                                <input
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