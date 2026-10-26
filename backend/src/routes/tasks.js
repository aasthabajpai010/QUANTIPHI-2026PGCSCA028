const express = require('express');
const { validationResult } = require('express-validator');
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');
const { taskCreateValidator, taskUpdateValidator } = require('../utils/validators');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * GET /api/tasks
 * Get all tasks for a project. Query param: projectId (required).
 * Includes assignee name and email.
 */
router.get('/', async (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId query parameter is required.' });
    }

    // Verify user is a member of this project
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.userId,
        },
      },
    });

    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!membership && (!project || project.ownerId !== req.user.userId)) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: [{ status: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
    });

    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/tasks
 * Create a new task.
 */
router.post('/', taskCreateValidator, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      projectId,
      assigneeId,
    } = req.body;

    // Verify user is a member or owner of the project
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId: req.user.userId },
      },
    });

    if (!membership && project.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    // Get max order for positioning
    const maxOrderTask = await prisma.task.findFirst({
      where: { projectId, status: status || 'TODO' },
      orderBy: { order: 'desc' },
    });
    const newOrder = maxOrderTask ? maxOrderTask.order + 1 : 0;

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        order: newOrder,
        projectId,
        assigneeId: assigneeId || null,
        creatorId: req.user.userId,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/tasks/:id
 * Update a task (including status for drag-and-drop).
 */
router.put('/:id', taskUpdateValidator, async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Find existing task
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Verify membership
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: existingTask.projectId,
          userId: req.user.userId,
        },
      },
    });

    if (!membership && existingTask.project.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const {
      title,
      description,
      status,
      priority,
      dueDate,
      assigneeId,
      order,
    } = req.body;

    // Build update data object (only include provided fields)
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null;
    if (order !== undefined) updateData.order = order;

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    res.json(updatedTask);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task. Only the creator or the project owner can delete.
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const isCreator = task.creatorId === req.user.userId;
    const isProjectOwner = task.project.ownerId === req.user.userId;

    if (!isCreator && !isProjectOwner) {
      return res.status(403).json({
        error: 'Access denied. Only the task creator or project owner can delete this task.',
      });
    }

    await prisma.task.delete({ where: { id } });

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
