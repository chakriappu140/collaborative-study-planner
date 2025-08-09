import React from "react"
import {useAuth} from "../context/AuthContext.jsx"
import {useNavigate} from "react-router-dom"

const Dashboard = () => {
    const {user, logout} = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate("/login")
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
            <h1 className="text-4xl font-bold mb-4">Welcome, {user?.name}!</h1>
            <p className="text-lg mb-8">This is your collaborative study planner dashboard.</p>
            <button
                onClick={handleLogout}    
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
            >
                Logout
            </button>
        </div>
    )
}

export default Dashboard;