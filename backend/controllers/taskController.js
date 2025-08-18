import asyncHandler from "express-async-handler";
import Task from "../models/Task.js";
import Group from "../models/Group.js";
import Notification from "../models/Notification.js";
import mongoose from "mongoose";

const createNotification = async (io, groupId, senderId, message, link) => {
  try {
    const group = await Group.findById(groupId);
    if (!group) return;

    const recipients = group.members.filter(m => m.toString() !== senderId.toString());

    const notifications = recipients.map(userId => ({
      user: userId,
      message,
      link
    }));

    const created = await Notification.insertMany(notifications);

    for (const notif of created) {
      io.to(notif.user.toString()).emit('notification:new', notif);
    }
  } catch (error) {
    console.error("Failed to create notifications", error);
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
    throw new Error("Title required");
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

  req.io.to(groupId).emit("task:created", task);

  const group = await Group.findById(groupId);

  if (group) {
    await createNotification(req.io, groupId, senderId,
      `A new task '${task.title}' was created in ${group.name}`, `/groups/${groupId}?tab=tasks`
    );
  }

  // Notify assignee (if different from sender)
  if (assignedTo && assignedTo.toString() !== senderId.toString()) {
    const notif = await Notification.create({
      user: assignedTo,
      message: `You were assigned to task '${task.title}' in ${group.name}`,
      link: `/groups/${groupId}`
    });
    req.io.to(assignedTo.toString()).emit('notification:new', notif);
  }

  res.status(201).json({ message: "Task created", task });
});

const updateTask = asyncHandler(async (req, res) => {
  const { groupId, taskId } = req.params;
  const { title, description, assignedTo, status, dueDate, priority } = req.body;
  const senderId = req.user._id;

  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  task.title = title || task.title;
  task.description = description || task.description;
  task.assignedTo = assignedTo || task.assignedTo;
  task.status = status || task.status;
  task.dueDate = dueDate || task.dueDate;
  task.priority = priority || task.priority;

  const savedTask = await task.save();
  await savedTask.populate('assignedTo', 'name avatar email');

  req.io.to(groupId).emit("task:updated", savedTask);

  const group = await Group.findById(groupId);
  if (group) {
    await createNotification(req.io, groupId, senderId,
      `Task '${savedTask.title}' was updated in ${group.name}`, `/groups/${groupId}?tab=tasks`
    );
  }

  if (assignedTo && assignedTo.toString() !== senderId.toString()) {
    const notif = await Notification.create({
      user: assignedTo,
      message: `You were assigned to task '${savedTask.title}' in ${group.name}`,
      link: `/groups/${groupId}`
    });
    req.io.to(assignedTo.toString()).emit('notification:new', notif);
  }

  res.status(200).json(savedTask);
});

const deleteTask = asyncHandler(async (req, res) => {
  const { groupId, taskId } = req.params;
  const senderId = req.user._id;

  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404);
    throw new Error("Task not found");
  }

  const taskTitle = task.title;

  await Task.deleteOne({ _id: taskId });

  req.io.to(groupId).emit("task:deleted", taskId);

  const group = await Group.findById(groupId);
  if (group) {
    await createNotification(req.io, groupId, senderId,
      `Task '${taskTitle}' was deleted from ${group.name}`, `/groups/${groupId}?tab=tasks`
    );
  }

  res.status(200).json({ message: "Task deleted" });
});

const getTaskProgress = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const pipeline = [
    { $match: { group: new mongoose.Types.ObjectId(groupId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ];

  const results = await Task.aggregate(pipeline);

  const progress = { 'To Do': 0, 'In Progress': 0, 'Done': 0 };

  results.forEach(item => {
    progress[item._id] = item.count;
  });

  res.status(200).json(progress);
});

export { getGroupTasks, createTask, updateTask, deleteTask, getTaskProgress };

