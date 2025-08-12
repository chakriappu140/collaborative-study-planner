import React, {useState} from "react"
import moment from "moment"
import {FaSave, FaTrash, FaTimes} from "react-icons/fa"

const TaskModal = ({task, members, onClose, onUpdate, onDelete}) => {
    const [title, setTitle] = useState(task.title)
    cosnt [description, setDescription] = useState(task.description || "")
    const [dueDate, setDueDate] = useState(task.dueDate ? moment(task.dueDate).format("YYYY-MM-DDTHH:mm") : "")
    const [assignedTo, setAssignedTo] = useState(task.assignedTo?._id || "")

    const handleUpdate = (e) => {
        e.preventDefault()
        onUpdate({
            ...task,
            title,
            description,
            dueDate: dueDate ? new Date(dueDate) : null,
            assignedTo: assignedTo || null
        })
    }

    const handleDelete = () => {
        onDelete(task._id)
    }

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">Edit Task</h2>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-gray-400">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
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
                    <div>
                        <label className="block text-gray-400">Due Date</label>
                        <input
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400">Assigned To</label>
                        <select
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                        >
                            <option value="">Unassigned</option>
                            {members.map(member => (
                                <option key={member._id} value={member._id}>
                                    {member.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex justify-between space-x-4">
                        <button type="submit" className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700 flex items-center justify-center">
                            <FaSave className="mr-2"/> Save
                        </button>
                        <button type="button" onClick={handleDelete} className="flex-1 px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 flex items-center justify-center">
                            <FaTrash className="mr-2"/> Delete
                        </button>
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-gray-300 bg-gray-600 rounded hover:bg-gray-700 flex items-center justify-center">
                            <FaTimes className="mr-2"/> Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default TaskModal