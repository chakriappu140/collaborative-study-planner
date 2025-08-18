import asyncHandler from 'express-async-handler';
import Task from '../models/Task.js';
import Group from '../models/Group.js';
import Notification from '../models/Notification.js';
import mongoose from 'mongoose';

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
  const tasks = await Task.find({ group: groupId }).populate('assignedTo', 'name avatar email');
  res.status(200).json(tasks);
});

const createTask = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { title, description, assignedTo, dueDate, priority } = req.body;
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
    priority: priority || 'Low',
  });

  await task.populate('assignedTo', 'name avatar email');

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

const updateTask = asyncHandler(async (req, res) => {
  const { taskId, groupId } = req.params;
  const { title, description, assignedTo, status, dueDate, priority } = req.body;
  const senderId = req.user._id;

  const task = await Task.findById(taskId);

  if (task) {
    task.title = title || task.title;
    task.description = description || task.description;
    task.assignedTo = assignedTo || task.assignedTo;
    task.status = status || task.status;
    task.dueDate = dueDate || task.dueDate;
    task.priority = priority || task.priority;

    const updatedTask = await task.save();

    await updatedTask.populate('assignedTo', 'name avatar email');

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

const getTaskProgress = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const pipeline = [
    {
      $match: {
        group: new mongoose.Types.ObjectId(groupId)
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

export { getGroupTasks, createTask, updateTask, deleteTask, getTaskProgress };
