import React, {useState} from "react"
import {useNavigate} from "react-router-dom"
import {useAuth} from "../context/AuthContext.jsx"

const SignupPage = () => {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const navigate = useNavigate()
    const {signup} = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await signup({name, email, password})
            navigate("/dashboard")
        } catch (error) {
            setError(error.message)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <form onSubmit={handleSubmit} className="p-8 bg-gray-800 rounded shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-6 text-center text-white">Sign Up</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <div className="mb-4">
                    <label className="block text-gray-400">Name</label>
                    <input 
                        type="text" 
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-400">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-400">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                    />
                </div>
                <button type="submit" className="w-full px-4 py-2  text-white bg-indigo-600 rounded hover:bg-indigo-700">
                    Sign Up
                </button>
                <p className="mt-4 text-center text-gray-400">
                    Already have an account? <a href="/login" className="text-indigo-400 hover:underline">Login</a>
                </p>
            </form>
        </div>
    )
}

export default SignupPage;