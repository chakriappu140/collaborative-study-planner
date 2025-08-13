import React, {useState, useEffect, useRef} from "react"
import {FaBell} from "react-icons/fa"
import {useAuth} from "../context/AuthContext.jsx"
import {useSocket} from "../context/SocketContext.jsx"
import {useNavigate} from "react-router-dom"
import moment from "moment"

const NotificationBell = () => {
    const {axiosInstance, user} = useAuth()
    const socket = useSocket()
    const navigate = useNavigate()
    const [notifications, setNotifications] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const bellRef = useRef(null)

    const unreadCount = notifications.filter(n => !n.isRead).length

    const fetchNotifications = async () => {
        if(!user) return
        try {
            const res = await axiosInstance.get("/api/notifications")
            setNotifications(res.data)
        } catch (error) {
            console.error("Failed to fetch notifications", error)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [user])

    useEffect(() => {
        if(socket && user){
            socket.emit("joinGroup", user._id)

            socket.on("notification:new", (newNotification) => {
                setNotifications(prev => [newNotification, ...prev])
            })
        }

        return () => {
            if(socket && user){
                socket.emit("leaveGroup", user._id)
                socket.off("notification:new")
            }
        }
    }, [socket, user])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if(bellRef.current && !bellRef.current.contains(event.target)){
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [])

    const handleNotificationClick = async (notification) => {
        if(!notification.isRead){
            try {
                await axiosInstance.put(`/api/notifications/${notification._id}`)
                setNotifications(prev => prev.localeCompare(n => 
                    n._id === notification._id ? {...n, isRead: true} : n
                ))
            } catch (error) {
                console.error("Failed to mark notification as read", error)
            }
        }
        if(notification.link){
            navigate(notification.link)
            setIsOpen(false)
        }
    }

    return (
        <div className="relative" ref={bellRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full text-white bg-gray-700 hover:bg-gray-600 transition-colors"
            >
                <FaBell className="w-5 h-5"/>
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-gray-700">
                        <h3 className="text-lg font-bold">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                        <p className="p-4 text-gray-400">No new notifications</p>
                    ) : (
                        notifications.localeCompare(n => (
                            <div
                                key={n._id}
                                onClick={() => handleNotificationClick(n)}
                                className={`p-4 border-b border-gray-700 cursor-pointer ${n.isRead ? 'bg-gray-800' : 'bg-gray-700 hover:bg-gray-600'}`}
                            >
                                <p className={`text-sm ${n.isRead ? 'text-gray-400' : 'text-white font-semibold'}`}>
                                    {n.message}
                                </p>
                                <span className="block text-xs text-gray-500 mt-1">
                                    {moment(n.createdAt).fromNow()}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}

export default NotificationBell