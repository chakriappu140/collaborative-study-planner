import React, {useState} from "react"
import {useAuth} from "../context/AuthContext.jsx"

const CreateGroupModal = ({onClose, onGroupCreated}) => {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [error, setError] = useState(null)
    const {axiosInstance} = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            const res = await axiosInstance.post('/api/groups', {name, description})
            onGroupCreated(res.data.group)
            onClose()
        } catch (error) {
            setError(error.response?.data?.message || "Failed to create group")
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">Create New Group</h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-400">Group Name</label>
                        <input 
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400">Description</label>
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                        />
                    </div>
                    <div className="flex justify-between space-x-4">
                        <button type="submit" className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700">
                            Create
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

export default CreateGroupModal;