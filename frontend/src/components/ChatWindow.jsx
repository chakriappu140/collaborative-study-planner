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