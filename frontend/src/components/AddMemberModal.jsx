import React, {useState} from "react"
import {useAuth} from "../context/AuthContext.jsx"
import {FaUserPlus} from "react-icons/fa"

const AddMemberModal = ({groupId, onClose, onMemberAdded}) => {
    const [email, setEmail] = useState("")
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const {axiosInstance} = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        try {
            const res = await axiosInstance.post(`/api/groups/${groupId}/members`, {email})
            setSuccess(res.data.message)
            onMemberAdded(res.data.group)
            setEmail("")
        } catch (error) {
            setError(error.response?.data?.message || "Failed to add member")
        }
    }
    
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">Add Member to Group</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                {success && <p className="text-green-500 text-center mb-4">{success}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400">User Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter member's email"
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                            required
                        />
                    </div>
                    <div className="flex justify-between space-x-4">
                        <button type="submit" className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center justify-center">
                            <FaUserPlus className="mr-2"/>Add Member
                        </button>
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-300 bg-gray-600 rounded hover:bg-gray-700">
                            Close
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddMemberModal