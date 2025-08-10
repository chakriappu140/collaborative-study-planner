import React, {useState, useEffect} from "react"
import {useAuth} from "../context/AuthContext.jsx"
import {FaPlus} from "react-icons/fa"
import {useSocket} from "../context/SocketContext.jsx"

const TaskBoard = ({groupId}) => {
    const {axiosInstance} = useAuth()
    const [tasks, setTasks] = useState([])
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(true)

    const fetchTasks = async () => {
        try {
            const res = await axiosInstance.get(`/api/groups/${groupId}/tasks`)
            setTasks(res.data)
        } catch (error) {
            console.error("Failed to fetch tasks : ", error)
        }finally{
            setLoading(false)
        }
    }

    useEffect(() => {
        if(groupId){
            fetchTasks()
        }
    }, [groupId])

    useEffect(() => {
        if(socket){
            socket.on("task:created", (newTask) => {
                setTasks((prevTasks) => [...prevTasks, newTask])
            })
            socket.on("task:updated", (updatedTask) => {
                setTasks((prevTasks) => 
                    prevTasks.map((task) => 
                        task._id === updatedTask._id ? updatedTask : task
                    )
                )
            })
            socket.on("task:deleted", (taskId) => {
                setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId))
            })
        }

        return () => {
            if(socket){
                socket.off("task:created")
                socket.off("task:updated")
                socket.off("task:deleted")
            }
        }
    }, [socket])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if(!title.trim()) return

        try {
            const res = await axiosInstance.post(`/api/groups/${groupId}/tasks`, {title})
            setTasks([...tasks, res.data.task])
            setTitle("")
        } catch (error) {
            console.error("Failed to create task : ", error)
        }
    }

    const tasksByStatus = tasks.reduce((acc, task) => {
        if(!acc[task.status]) acc[task.status] = []
        acc[task.status].push(task)
        return acc
    }, {"To Do": [], "In Progress": [], "Done": []})

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4">Task Board</h2>
            {loading ? (
                <p className="text-gray-400">Loading tasks...</p>
            ) : (
                <div className="flex space-x-4 overflow-x-auto">
                    {["To Do", "In Progress", "Done"].map(status => (
                        <div key={status} classname="w-80 bg-gray-700 p-4 rounded-lg flex-shrink-0">
                            <h3 className="text-lg font-bold mb-3">{status} ({tasksByStatus[status].length})</h3>
                            <div className="space-y-3 min-h-[50px]">
                                {tasksByStatus[status].map(task => (
                                    <div key={task._id} className="bg-gray-600 p-3 rounded-lg shadow-sm">
                                        <p>{task.title}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <form onSubmit={handleSubmit} className="mt-6 flex space-x-2">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Add a new task"
                    className="flex-1 px-3 py-2 text-white bg-gray-700 border border-gray-600 rounded"
                    required
                />
                <button type="submit" className="px-4 py-2 bg-emerald-600 rounded hover:bg-emerald-700">
                    <FaPlus/>
                </button>
            </form>
        </div>
    )
}

export default TaskBoard;