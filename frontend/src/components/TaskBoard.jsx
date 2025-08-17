import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { FaPlus, FaTrash, FaUserCircle } from 'react-icons/fa';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import moment from 'moment';
import TaskModal from './TaskModal.jsx';

const priorityColors = {
    'Low': 'bg-gray-500',
    'Medium': 'bg-yellow-500',
    'High': 'bg-red-500',
};

const TaskBoard = ({ groupId, members }) => {
    const { axiosInstance } = useAuth();
    const socket = useSocket();
    const [tasks, setTasks] = useState([]);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState(null);

    const fetchTasks = async () => {
        try {
            const res = await axiosInstance.get(`/api/groups/${groupId}/tasks`);
            setTasks(res.data);
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (groupId) {
            fetchTasks();
        }
    }, [groupId]);

    useEffect(() => {
        if (socket) {
            socket.on('task:created', (newTask) => {
                setTasks((prevTasks) => [...prevTasks, newTask]);
            });
            socket.on('task:updated', (updatedTask) => {
                setTasks((prevTasks) =>
                    prevTasks.map((task) =>
                        task._id === updatedTask._id ? updatedTask : task
                    )
                );
            });
            socket.on('task:deleted', (taskId) => {
                setTasks((prevTasks) => prevTasks.filter((task) => task._id !== taskId));
            });
        }
        
        return () => {
            if (socket) {
                socket.off('task:created');
                socket.off('task:updated');
                socket.off('task:deleted');
            }
        };
    }, [socket]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        try {
            await axiosInstance.post(`/api/groups/${groupId}/tasks`, { title, priority: 'Low' });
            setTitle('');
        } catch (err) {
            console.error('Failed to create task:', err);
        }
    };

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination || (destination.droppableId === source.droppableId)) {
            return;
        }

        const newStatus = destination.droppableId;
        const taskId = draggableId;
        
        const updatedTasks = tasks.map(task =>
            task._id === taskId ? { ...task, status: newStatus } : task
        );
        setTasks(updatedTasks);

        try {
            await axiosInstance.put(`/api/groups/${groupId}/tasks/${taskId}`, { status: newStatus });
        } catch (err) {
            console.error('Failed to update task status:', err);
            setTasks(tasks);
        }
    };

    const handleUpdateTask = async (updatedTask) => {
        try {
            await axiosInstance.put(`/api/groups/${groupId}/tasks/${updatedTask._id}`, updatedTask);
            setSelectedTask(null);
        } catch (err) {
            console.error('Failed to update task:', err);
        }
    };
    
    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            try {
                await axiosInstance.delete(`/api/groups/${groupId}/tasks/${taskId}`);
                setSelectedTask(null);
            } catch (err) {
                console.error('Failed to delete task:', err);
            }
        }
    };

    const tasksByStatus = tasks.reduce((acc, task) => {
        if (!acc[task.status]) acc[task.status] = [];
        acc[task.status].push(task);
        return acc;
    }, { 'To Do': [], 'In Progress': [], 'Done': [] });

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg relative">
            <h2 className="text-2xl font-semibold mb-4">Task Board</h2>
            {loading ? (
                <p className="text-gray-400">Loading tasks...</p>
            ) : (
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex space-x-4 overflow-x-auto">
                        {['To Do', 'In Progress', 'Done'].map(status => (
                            <Droppable droppableId={status} key={status}>
                                {(provided) => (
                                    <div
                                        {...provided.droppableProps}
                                        ref={provided.innerRef}
                                        className="w-80 bg-gray-700 p-4 rounded-lg flex-shrink-0"
                                    >
                                        <h3 className="text-lg font-bold mb-3">{status} ({tasksByStatus[status].length})</h3>
                                        <div className="space-y-3 min-h-[50px]">
                                            {tasksByStatus[status].map((task, index) => (
                                                <Draggable key={task._id} draggableId={task._id} index={index}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="bg-gray-600 p-3 rounded-lg shadow-sm cursor-pointer"
                                                            onClick={() => setSelectedTask(task)}
                                                        >
                                                            <div className="flex justify-between items-center mb-1">
                                                                <p className="text-lg">{task.title}</p>
                                                                <span className={`px-2 py-1 rounded-full text-xs text-white ${priorityColors[task.priority]}`}>
                                                                    {task.priority}
                                                                </span>
                                                            </div>
                                                            {task.assignedTo && (
                                                                <div className="flex items-center space-x-2 mt-2">
                                                                    {task.assignedTo.avatar ? (
                                                                        <img src={task.assignedTo.avatar} alt="Avatar" className="w-6 h-6 rounded-full object-cover" />
                                                                    ) : (
                                                                        <FaUserCircle size={24} className="text-gray-400" />
                                                                    )}
                                                                    <p className="text-sm text-gray-400">Assigned to: {task.assignedTo.name}</p>
                                                                </div>
                                                            )}
                                                            {task.dueDate && (
                                                                <p className="text-sm text-gray-400">Due: {moment(task.dueDate).format('MMM Do, h:mm a')}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>
                                )}
                            </Droppable>
                        ))}
                    </div>
                </DragDropContext>
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
                    <FaPlus />
                </button>
            </form>
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    members={members}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                />
            )}
        </div>
    );
};

export default TaskBoard;
