import React, {useState, useEffect} from "react"
import {useAuth} from "../context/AuthContext.jsx"
import {FaUserPlus, FaSpinner} from "react-icons/fa"
import {useNavigate} from "react-router-dom"

const JoinGroupModal = ({onClose, initialToken}) => {
    const [token, setToken] = useState(initialToken || "")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const {axiosInstance} = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const res = await axiosInstance.post(`/api/groups/join/${token}`)
            alert(res.data.message)
            navigate(`/groups/${res.data.group._id}`)
        } catch (error) {
            setError(error.response?.data?.message || "Failed to join group")
        }finally{
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">Join Group with Link</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400">Invite Token</label>
                        <input
                            type="text"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Paste your invite token here"
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                            required
                        />
                    </div>
                    <div className="flex justify-between space-x-4">
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center justify-center"
                            disabled={loading}
                        >
                            {loading ? <FaSpinner className="animate-spin"/> : <><FaUserPlus className="mr-2"/>Join Group</>}
                        </button>
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-300 bg-gray-600 rounded hover:bg-gray-700">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default JoinGroupModal