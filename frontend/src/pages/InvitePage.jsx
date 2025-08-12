import React, {useEffect, useState} from "react"
import {useParams, useNavigate} from "react-router-dom"
import {useAuth} from "../context/AuthContext.jsx"
import {useSocket} from "../context/SocketContext.jsx"
import {FaSpinner} from "react-icons/fa"

const InvitePage = () => {
    const {token} = useParams()
    const navigate = useNavigate()
    const {axiosInstance, user} = useAuth()
    const socket = useSocket()
    const [message, setMessage] = useState("Joining group...")
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const joinGroup = async () => {
            if(!user){
                localStorage.setItem("pendingInviteToken", token)
                navigate("/login")
                return
            }

            try {
                const res = await axiosInstance.post(`/api/groups/join/${token}`)
                setMessage(res.data.message)

                if(socket){
                    socket.emit("joinGroup", res.data.group._id)
                }

                setTimeout(() => {
                    navigate(`/groups/${res.data.group._id}`)
                }, 2000)
            } catch (error) {
                setError(error.response?.data?.message || "Failed to join group.")
                setMessage("Failed to join group.")
                setTimeout(() => navigate("/dashboard"), 3000)
            }finally{
                setLoading(false)
            }
        }
        if(token){
            joinGroup()
        }
    }, [token, user, navigate, axiosInstance, socket])

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-8">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-3xl font-bold mb-4">Group Invitation</h2>
                {loading ? (
                    <div className="flex items-center justify-center space-x-2 text-gray-400">
                        <FaSpinner className="animate-spin"/>
                        <p>{message}</p>
                    </div>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : (
                    <p className="text-green-500">{message}</p>
                )}
            </div>
        </div>
    )
}

export default InvitePage