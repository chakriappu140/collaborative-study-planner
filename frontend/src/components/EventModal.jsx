import React, {useState, useEffect} from "react"
import moment from "moment"

const EventModal = ({event, onClose, onUpdate, onDelete}) => {
    const [title, setTitle] = useState(event.title)
    const [description, setDescription] = useState(event.description || "")
    const [start, setStart] = useState(moment(event.start).format("YYYY-MM-DDTHH:mm"))
    const [end, setEnd] = useState(moment(event.end).format("YYYY-MM-DDTHH:mm"))

    const handleUpdate = (e) => {
        e.preventDefault()
        onUpdate({...event, title, description, start: new Date(start), end: new Date(end)})
    }

    const handleDelete = () => {
        onDelete(event._id)
    }

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg">
                <h2 className="text-2xl font-bold mb-4 text-white text-center">Edit Event</h2>
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
                        <label className="block text-gray-400">Start Time</label>
                        <input
                            type="datetime-local"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400">End Time</label>
                        <input
                            type="datetime-local"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                            className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded"
                            required
                        />
                    </div>
                    <div className="flex justify-between space-x-4">
                        <button type="submit" className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700">
                            Update
                        </button>
                        <button type="button" onClick={handleDelete} className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700">
                            Delete
                        </button>
                        <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-white bg-indigo-600 rounded hover:bg-indigo-700">
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default EventModal