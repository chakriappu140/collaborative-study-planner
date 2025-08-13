// backend/controllers/taskController.js
import asyncHandler from 'express-async-handler';
import Task from '../models/Task.js';
import Group from '../models/Group.js';
import Notification from '../models/Notification.js'; // NEW IMPORT

const createNotification = async (groupId, senderId, message, link) => {
    try {
        const group = await Group.findById(groupId);
        if (!group) return;

        const membersToNotify = group.members.filter(member => member.toString() !== senderId.toString());

        const notifications = membersToNotify.map(memberId => ({
            user: memberId,
            message,
            link
        }));

        await Notification.insertMany(notifications);

        // Emit notifications to each user via their respective socket.io rooms
        for (const memberId of membersToNotify) {
            req.io.to(memberId.toString()).emit('notification:new', { message, link });
        }
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

// @desc    Create a new task in a group
// @route   POST /api/groups/:groupId/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { title, description, assignedTo, dueDate } = req.body;
    const senderId = req.user._id;

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

    // Create a notification for all other group members
    await createNotification(groupId, senderId, `A new task "${task.title}" has been created in the group.`, `/groups/${groupId}`);

    res.status(201).json({
        message: 'Task created successfully',
        task,
    });
});

// @desc    Update a task
// @route   PUT /api/groups/:groupId/tasks/:taskId
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
    const { taskId, groupId } = req.params;
    const { title, description, assignedTo, status, dueDate } = req.body;
    const senderId = req.user._id;

    const task = await Task.findById(taskId);

    if (task) {
        task.title = title || task.title;
        task.description = description || task.description;
        task.assignedTo = assignedTo || task.assignedTo;
        task.status = status || task.status;
        task.dueDate = dueDate || task.dueDate;

        const updatedTask = await task.save();

        req.io.to(updatedTask.group.toString()).emit('task:updated', updatedTask);
        await createNotification(groupId, senderId, `Task "${updatedTask.title}" has been updated.`, `/groups/${groupId}`);

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
    const { taskId, groupId } = req.params;
    const senderId = req.user._id;
    
    const task = await Task.findById(taskId);
    
    if (task) {
        await Task.deleteOne({ _id: taskId });
        
        req.io.to(task.group.toString()).emit('task:deleted', taskId);
        await createNotification(groupId, senderId, `Task "${task.title}" has been deleted.`, `/groups/${groupId}`);

        res.status(200).json({ message: 'Task removed' });
    } else {
        res.status(404);
        throw new Error('Task not found');
    }
});

const getGroupTasks = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const tasks = await Task.find({ group: groupId }).populate('assignedTo', 'name');
    res.status(200).json(tasks);
});

export { createTask, getGroupTasks, updateTask, deleteTask };