import React, {useState} from "react"
import {useNavigate} from "react-router-dom"
import {useAuth} from "../context/AuthContext.jsx"

const LoginPage = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)
    const navigate = useNavigate()
    const {login} = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            await login({email, password})
            navigate("/dashboard")
        } catch (error) {
            setError(error.message)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <form onSubmit= {handleSubmit} className="p-8 bg-gray-800 rounded shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-6 text-center text-white">Login</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <div className="mb-4">
                    <label className="block text-gray-400">Email</label>
                    <input 
                        type = "email"
                        value = {email}
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
                <button type="submit" className="w-full px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700">
                    Login
                </button>
                <p className="mt-4 text-center text-gray-400">
                    Don't have an account? <a href="/signup" className="text-indigo-400 hover:underline">Sign up</a>
                </p>
            </form>
        </div>
    )
}

export default LoginPage;