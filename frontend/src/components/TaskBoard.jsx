// frontend/src/components/TaskBoard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { FaPlus, FaTrash } from 'react-icons/fa';
import {DragDropContext, Droppable, Draggable} from "@hello-pangea/dnd"

const TaskBoard = ({ groupId, members }) => {
  const { axiosInstance } = useAuth();
  const socket = useSocket();
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);

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

  // Set up socket listeners for tasks
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
      // The backend will handle emitting the event
      await axiosInstance.post(`/api/groups/${groupId}/tasks`, { title });
      setTitle('');
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const onDragEnd = async (result) => {
    const {destination, source, draggableId} = result

    if(!destination || (destination.droppableId === source.droppableId)){
      return
    }

    const newStatus = destination.droppableId;
    const taskId = draggableId
    const updatedTasks = tasks.map(task => 
      task._id === taskId ? {...task, status: newStatus} : task
    )
    setTasks(updatedTasks)

    try {
      await axiosInstance.put(`api/groups/${groupId}/tasks/${taskId}`, {status: newStatus})
    } catch (error) {
      console.error("Failed to update task status : ", error)
      setTasks(tasks)
    }
  }

  const handleDeleteTask = async (taskId) => {
    if(window.confirm("Are you sure you want to delete this task?")){
      try {
        await axiosInstance.delete(`/api/groups/${groupId}/tasks/${taskId}`)
      } catch (error) {
        console.error("Failed to delete task : ", error)
      }
    }
  }

  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) acc[task.status] = [];
    acc[task.status].push(task);
    return acc;
  }, { 'To Do': [], 'In Progress': [], 'Done': [] });

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
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
                              className="bg-gray-600 p-3 rounded-lg shadow-sm flex justify-between items-center"
                            >
                              <p>{task.title}</p>
                              <button
                                onClick={() => handleDeleteTask(task._id)}
                                className="text-red-400 hover:text-red-600"
                              >
                                <FaTrash />
                              </button>
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
    </div>
  );
};

export default TaskBoard;