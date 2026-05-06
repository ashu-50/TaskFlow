import { Router } from 'express';
import { body, param } from 'express-validator';
import { Op, col } from 'sequelize';
import { Task, Project, ProjectMember, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate);

/* ── Helper ───────────────────────── */
const verifyProjectAccess = async (projectId, userId, userRole) => {
  const project = await Project.findByPk(projectId);
  if (!project) throw createError('Project not found', 404);

  if (userRole === 'admin') return { project, isOwner: true };

  const membership = await ProjectMember.findOne({ where: { projectId, userId } });
  const isOwner = project.ownerId === userId;

  if (!membership && !isOwner) {
    throw createError('You are not a member of this project', 403);
  }

  return { project, membership, isOwner };
};

/* ── GET TASKS ───────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const { projectId, status, priority, assigneeId, overdue, page = 1, limit = 20 } = req.query;

    const where = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = assigneeId;

    if (overdue === 'true') {
      where.dueDate = { [Op.lt]: new Date() };
      where.status = { [Op.ne]: 'done' };
    }

    let accessibleIds = [];

    if (req.user.role === 'admin') {
      if (projectId) where.projectId = projectId;
    } else {
      const memberships = await ProjectMember.findAll({
        where: { userId: req.user.id },
        attributes: ['projectId'],
      });

      const owned = await Project.findAll({
        where: { ownerId: req.user.id },
        attributes: ['id'],
      });

      accessibleIds = [
        ...memberships.map((m) => m.projectId),
        ...owned.map((p) => p.id),
      ];

      if (accessibleIds.length === 0) {
        return res.json({ success: true, count: 0, tasks: [] });
      }

      where.projectId = projectId
        ? { [Op.and]: [{ [Op.in]: accessibleIds }, projectId] }
        : { [Op.in]: accessibleIds };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Task.findAndCountAll({
      where,
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] },
        { model: Project, as: 'project', attributes: ['id', 'name'] },
      ],
      order: [
        [col('Task.dueDate'), 'ASC'],
        [col('Task.createdAt'), 'DESC'],
      ],
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      count,
      totalPages: Math.ceil(count / limit),
      page: Number(page),
      tasks: rows,
    });
  } catch (err) {
    next(err);
  }
});

/* ── CREATE TASK ───────────────────────── */
router.post(
  '/',
  [
    body('title').isLength({ min: 2 }),
    body('projectId').isUUID(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { projectId, title, description, priority, assigneeId, dueDate } = req.body;

      await verifyProjectAccess(projectId, req.user.id, req.user.role);

      const task = await Task.create({
        title,
        description,
        priority: priority || 'medium',
        projectId,
        assigneeId: assigneeId || null,
        createdById: req.user.id,
        dueDate: dueDate || null,
      });

      res.status(201).json({ success: true, task });
    } catch (err) {
      next(err);
    }
  }
);

/* ── UPDATE TASK (FIXED) ───────────────────────── */
router.patch(
  '/:id',
  [
    param('id').isUUID(),

    body('status').optional(),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('assigneeId').optional().isUUID(),
    body('dueDate').optional().isISO8601().toDate(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      let { status } = req.body;

      const task = await Task.findByPk(id);

      if (!task) {
        return next(createError('Task not found', 404));
      }

      await verifyProjectAccess(task.projectId, req.user.id, req.user.role);

      // ✅ STATUS NORMALIZATION (FIX)
      const statusMap = {
        'To Do': 'todo',
        'In Progress': 'in_progress',
        'Review': 'review',
        'Done': 'done',
      };

      if (statusMap[status]) {
        status = statusMap[status];
      }

      const allowedStatus = ['todo', 'in_progress', 'review', 'done'];

      if (status && !allowedStatus.includes(status)) {
        return next(createError('Invalid status value', 400));
      }

      // ✅ PERMISSION FIX
      if (
        req.user.role !== 'admin' &&
        task.assigneeId !== req.user.id &&
        task.createdById !== req.user.id
      ) {
        return next(createError('Not allowed to update this task', 403));
      }

      const allowedFields = [
        'title',
        'description',
        'priority',
        'assigneeId',
        'dueDate',
      ];

      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          task[field] = req.body[field];
        }
      });

      if (status) {
        task.status = status;
      }

      if (status === 'done' && !task.completedAt) {
        task.completedAt = new Date();
      }

      await task.save();

      res.json({
        success: true,
        task,
      });

    } catch (err) {
      console.error('TASK UPDATE ERROR:', err);
      next(err);
    }
  }
);
/* ── DELETE TASK ───────────────────────── */
router.delete('/:id', param('id').isUUID(), validate, async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);

    if (!task) {
      return next(createError('Task not found', 404));
    }

    // ✅ Check project access
    await verifyProjectAccess(task.projectId, req.user.id, req.user.role);

    // ✅ Permission: admin OR creator OR assignee
    if (
      req.user.role !== 'admin' &&
      task.createdById !== req.user.id &&
      task.assigneeId !== req.user.id
    ) {
      return next(createError('Not allowed to delete this task', 403));
    }

    await task.destroy();

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });

  } catch (err) {
    console.error('DELETE TASK ERROR:', err);
    next(err);
  }
});

export default router;