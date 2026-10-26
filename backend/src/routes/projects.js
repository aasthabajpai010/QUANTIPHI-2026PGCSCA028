const express = require('express');
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * GET /api/projects
 * Get all projects where the authenticated user is an owner or member.
 */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: {
          select: { tasks: true, members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(projects);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/projects
 * Create a new project. Auto-adds creator as ADMIN member.
 */
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: req.user.userId,
        members: {
          create: {
            userId: req.user.userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
        _count: { select: { tasks: true, members: true } },
      },
    });

    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/projects/:id
 * Get a single project with members and task counts per status.
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    // Check access
    const isMember = project.members.some((m) => m.userId === userId);
    if (!isMember && project.ownerId !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Get task counts per status
    const taskCounts = await prisma.task.groupBy({
      by: ['status'],
      where: { projectId: id },
      _count: { id: true },
    });

    const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    taskCounts.forEach((tc) => {
      counts[tc.status] = tc._count.id;
    });

    res.json({ ...project, taskCounts: counts });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/projects/:id/members
 * Add a member by email. Owner only.
 */
router.post('/:id/members', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (project.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Only the project owner can add members.' });
    }

    // Find user by email
    const userToAdd = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!userToAdd) {
      return res.status(404).json({ error: 'No user found with that email address.' });
    }

    // Check if already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId: userToAdd.id },
      },
    });

    if (existingMember) {
      return res.status(409).json({ error: 'User is already a member of this project.' });
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: userToAdd.id,
        role: role || 'MEMBER',
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(newMember);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/projects/:id/members/:userId
 * Remove a member from the project. Owner only.
 */
router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const { id, userId: targetUserId } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found.' });
    }

    if (project.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Only the project owner can remove members.' });
    }

    if (targetUserId === project.ownerId) {
      return res.status(400).json({ error: 'Cannot remove the project owner.' });
    }

    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId: id, userId: targetUserId },
      },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Member not found in this project.' });
    }

    await prisma.projectMember.delete({ where: { id: membership.id } });

    res.json({ message: 'Member removed successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
