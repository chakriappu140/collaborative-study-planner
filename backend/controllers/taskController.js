// backend/controllers/taskController.js (UPDATED for Socket.IO)
import asyncHandler from 'express-async-handler';
import Task from '../models/Task.js';

// @desc    Create a new task in a group
// @route   POST /api/groups/:groupId/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { title, description, assignedTo, dueDate } = req.body;

  if (!title) {
    res.status(400);
    throw new Error('Task title is required');
  }

  const task = await Task.create({
    group: groupId,
    title,
    description,
    assignedTo,
    dueDate,
  });

  // Emit a real-time event to the group
  req.io.to(groupId).emit('task:created', task);

  res.status(201).json({
    message: 'Task created successfully',
    task,
  });
});

// @desc    Get all tasks for a group
// @route   GET /api/groups/:groupId/tasks
// @access  Private
const getGroupTasks = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const tasks = await Task.find({ group: groupId }).populate('assignedTo', 'name');
  res.status(200).json(tasks);
});

// @desc    Update a task
// @route   PUT /api/groups/:groupId/tasks/:taskId
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { title, description, assignedTo, status, dueDate } = req.body;

  const task = await Task.findById(taskId);

  if (task) {
    task.title = title || task.title;
    task.description = description || task.description;
    task.assignedTo = assignedTo || task.assignedTo;
    task.status = status || task.status;
    task.dueDate = dueDate || task.dueDate;

    const updatedTask = await task.save();

    // Emit a real-time event to the group
    req.io.to(updatedTask.group.toString()).emit('task:updated', updatedTask);

    res.status(200).json(updatedTask);
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

// @desc    Delete a task
// @route   DELETE /api/groups/:groupId/tasks/:taskId
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  
  const task = await Task.findById(taskId);
  
  if (task) {
    await Task.deleteOne({ _id: taskId });
    
    // Emit a real-time event to the group
    req.io.to(task.group.toString()).emit('task:deleted', taskId);

    res.status(200).json({ message: 'Task removed' });
  } else {
    res.status(404);
    throw new Error('Task not found');
  }
});

export { createTask, getGroupTasks, updateTask, deleteTask };
