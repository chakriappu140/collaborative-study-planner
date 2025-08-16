import asyncHandler from 'express-async-handler';
import Task from '../models/Task.js';
import Group from '../models/Group.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose'; // <-- NEW IMPORT

const createNotification = async (req, groupId, senderId, message, link) => {
    try {
        const group = await Group.findById(groupId);
        if (!group) return;

        const membersToNotify = group.members.filter(member => member.toString() !== senderId.toString());

        const notifications = membersToNotify.map(memberId => ({
            user: memberId,
            message,
            link
        }));

        const createdNotifications = await Notification.insertMany(notifications);

        for (const notif of createdNotifications) {
            req.io.to(notif.user.toString()).emit('notification:new', notif);
        }
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

const getGroupTasks = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const tasks = await Task.find({ group: groupId }).populate('assignedTo', 'name');
    res.status(200).json(tasks);
});

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

    req.io.to(groupId).emit('task:created', task);

    const group = await Group.findById(groupId);
    if (group) {
        await createNotification(req, groupId, senderId, `A new task "${task.title}" has been created in ${group.name}.`, `/groups/${groupId}`);
    }

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
        
        const group = await Group.findById(groupId);
        if (group) {
            await createNotification(req, groupId, senderId, `Task "${updatedTask.title}" has been updated in ${group.name}.`, `/groups/${groupId}`);
        }

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
        const title = task.title;
        await Task.deleteOne({ _id: taskId });
        
        req.io.to(task.group.toString()).emit('task:deleted', taskId);
        
        const group = await Group.findById(groupId);
        if (group) {
            await createNotification(req, groupId, senderId, `Task "${title}" has been deleted from ${group.name}.`, `/groups/${groupId}`);
        }

        res.status(200).json({ message: 'Task removed' });
    } else {
        res.status(404);
        throw new Error('Task not found');
    }
});

// @desc    Get task progress for a group
// @route   GET /api/groups/:groupId/tasks/progress
// @access  Private
const getTaskProgress = asyncHandler(async (req, res) => {
    const { groupId } = req.params;

    const pipeline = [
        {
            $match: {
                group: mongoose.Types.ObjectId(groupId)
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ];

    const result = await Task.aggregate(pipeline);

    const progress = {
        'To Do': 0,
        'In Progress': 0,
        'Done': 0
    };

    result.forEach(item => {
        progress[item._id] = item.count;
    });

    res.status(200).json(progress);
});

export { createTask, getGroupTasks, updateTask, deleteTask, getTaskProgress };
