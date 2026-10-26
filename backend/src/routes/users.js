const express = require('express');
const prisma = require('../config/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

/**
 * GET /api/users
 * Get all users (for assigning tasks / adding members).
 * Returns id, name, email only.
 */
router.get('/', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });

    res.json(users);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/me
 * Return current user profile (no password).
 */
router.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users/workload
 * Return each user's IN_PROGRESS task count for the given project.
 * Query param: projectId (required).
 */
router.get('/workload', async (req, res, next) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId query parameter is required.' });
    }

    // Verify the requesting user is a member of the project
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
      return res.status(403).json({ error: 'Access denied.' });
    }

    // Get all members of the project
    const members = await prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    // Get IN_PROGRESS task counts per assignee for this project
    const inProgressCounts = await prisma.task.groupBy({
      by: ['assigneeId'],
      where: {
        projectId,
        status: 'IN_PROGRESS',
        assigneeId: { not: null },
      },
      _count: { id: true },
    });

    // Build a map of userId → count
    const countMap = {};
    inProgressCounts.forEach((row) => {
      if (row.assigneeId) {
        countMap[row.assigneeId] = row._count.id;
      }
    });

    // Also include the project owner if not already a member entry
    const workload = members.map((m) => ({
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role,
      inProgressCount: countMap[m.user.id] || 0,
    }));

    res.json(workload);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
