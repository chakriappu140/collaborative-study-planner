import asyncHandler from "express-async-handler";
import Group from "../models/Group.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Task from "../models/Task.js";
import CalendarEvent from "../models/CalendarEvent.js";
import crypto from "crypto";

// Helper for sending notifications to group members (excluding sender)
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

const createGroup = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    res.status(400);
    throw new Error("Group name is required");
  }

  const group = await Group.create({
    name,
    description,
    admin: req.user._id,
    members: [req.user._id],
  });

  const populatedGroup = await Group.findById(group._id).populate('members', 'name avatar email');

  res.status(201).json({
    message: "Group created successfully",
    group: populatedGroup
  });
});

const getMyGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ members: req.user._id }).populate('members', 'name avatar email');
  res.status(200).json(groups);
});

const getGroupDetails = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  const isMember = group.members.some(m => m.toString() === req.user._id.toString());
  if (!isMember) {
    res.status(403);
    throw new Error("Not a member of this group");
  }

  const populatedGroup = await Group.findById(groupId).populate('members', 'name avatar email');
  res.status(200).json(populatedGroup);
});

const deleteGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  if (group.admin.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Only admin can delete group");
  }

  await Task.deleteMany({ group: groupId });
  await CalendarEvent.deleteMany({ group: groupId });
  await Group.deleteOne({ _id: groupId });

  req.io.to(groupId).emit("group:deleted", groupId);

  res.status(200).json({ message: "Group and related data deleted" });
});

const addMemberToGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  if (group.admin.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Only admin can add members");
  }

  const userToAdd = await User.findOne({ email });
  if (!userToAdd) {
    res.status(404);
    throw new Error("User not found");
  }

  if (group.members.includes(userToAdd._id)) {
    res.status(400);
    throw new Error("User already in group");
  }

  group.members.push(userToAdd._id);
  await group.save();

  // Populate members before emitting
  const populatedGroup = await Group.findById(group._id).populate('members', 'name avatar email');

  req.io.to(group._id.toString()).emit('group:member_added', {
    group: populatedGroup,
    member: { _id: userToAdd._id, name: userToAdd.name, avatar: userToAdd.avatar, email: userToAdd.email }
  });

  // Notify added user directly
  const notif = await Notification.create({
    user: userToAdd._id,
    message: `You were added to ${group.name} by ${req.user.name}`,
    link: `/groups/${group._id}`
  });
  req.io.to(userToAdd._id.toString()).emit('notification:new', notif);

  // Notify all other group members except admin and added user
  const otherRecipients = populatedGroup.members
    .filter(m => m._id.toString() !== req.user._id.toString() && m._id.toString() !== userToAdd._id.toString());

  if (otherRecipients.length) {
    const message = `${userToAdd.name} was added to ${group.name} by ${req.user.name}`;
    const link = `/groups/${group._id}?tab=members`;
    const notifications = otherRecipients.map(user => ({
      user: user._id,
      message,
      link
    }));

    const createdNotifs = await Notification.insertMany(notifications);
    for (const notif of createdNotifs) {
      req.io.to(notif.user.toString()).emit('notification:new', notif);
    }
  }

  res.status(200).json({
    message: `Added ${userToAdd.name} to group`,
    group: populatedGroup,
  });
});

const removeMemberFromGroup = asyncHandler(async (req, res) => {
  const { groupId, memberId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  if (group.admin.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Only admin can remove members");
  }

  if (memberId === req.user._id.toString()) {
    res.status(400);
    throw new Error("Cannot remove yourself");
  }

  const memberExists = group.members.some(m => m.toString() === memberId);
  if (!memberExists) {
    res.status(404);
    throw new Error("User not in group");
  }

  const removedMember = await User.findById(memberId);

  group.members.pull(memberId);
  const savedGroup = await group.save();

  req.io.to(groupId).emit("group:member_removed", { memberId, group: savedGroup });

  // Notify the removed user directly
  if (removedMember) {
    const notif = await Notification.create({
      user: removedMember._id,
      message: `You were removed from ${group.name} by ${req.user.name}`,
      link: `/`,
    });
    req.io.to(removedMember._id.toString()).emit('notification:new', notif);

    // Notify group members too
    await createNotification(req.io, groupId, req.user._id, `${removedMember.name} was removed from ${group.name} by ${req.user.name}`, `/groups/${groupId}?tab=members`);
  }

  res.status(200).json({
    message: `Removed ${removedMember ? removedMember.name : 'member'} from group`,
    group: savedGroup,
  });
});

const generateInviteToken = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const group = await Group.findById(groupId);
  if (!group) {
    res.status(404);
    throw new Error("Group not found");
  }

  if (group.admin.toString() !== req.user._id.toString()) {
    res.status(401);
    throw new Error("Only admin can generate invite");
  }
  // why

  const token = crypto.randomBytes(20).toString('hex');
  group.inviteToken = token;
  group.inviteTokenExpires = Date.now() + 3600000; // 1 hour
  await group.save();

  res.status(200).json({ inviteToken: token });
});

const joinGroupWithToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const userId = req.user._id;

  const group = await Group.findOne({
    inviteToken: token,
    inviteTokenExpires: { $gt: Date.now() }
  });

  if (!group) {
    res.status(404);
    throw new Error("Invalid or expired invite token");
  }

  if (group.members.includes(userId)) {
    res.status(400);
    throw new Error("Already a member");
  }

  group.members.push(userId);
  group.inviteToken = undefined;
  group.inviteTokenExpires = undefined;
  await group.save();

  const user = await User.findById(userId);
  req.io.to(group._id.toString()).emit("group:member_added", {
    group,
    member: { _id: user._id, name: user.name, avatar: user.avatar, email: user.email }
  });

  // Notify user of join
  const notif = await Notification.create({
    user: userId,
    message: `You joined ${group.name}`,
    link: `/groups/${group._id}`,
  });
  req.io.to(userId.toString()).emit('notification:new', notif);

  res.status(200).json({
    message: `Joined group ${group.name}`,
    group,
  });
});

export {
  createNotification,
  createGroup,
  getMyGroups,
  getGroupDetails,
  deleteGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  generateInviteToken,
  joinGroupWithToken
};

