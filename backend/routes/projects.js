import { Router } from 'express';
import { body, param } from 'express-validator';
import { Op } from 'sequelize';
import { Project, ProjectMember, User, Task } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

router.use(authenticate);

/* ─────────────────────────────────────────────── */
/* ACCESS CONTROL HELPER */
/* ─────────────────────────────────────────────── */
const getProjectOrFail = async (
  projectId,
  userId,
  requireAdminAccess = false,
  userRole = 'member'
) => {
  const project = await Project.findByPk(projectId, {
    include: [
      {
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email'],
      },
      {
        model: ProjectMember,
        as: 'projectMembers',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'name', 'email', 'role'],
          },
        ],
      },
    ],
  });

  if (!project) {
    throw createError('Project not found', 404);
  }

  const isOwner = project.ownerId === userId;

  const membership = project.projectMembers.find(
    (m) => m.userId === userId
  );

  const isProjectAdmin =
    membership?.projectRole === 'admin';

  // SYSTEM ADMIN BYPASS
  if (userRole === 'admin') {
    return {
      project,
      isOwner: true,
      membership,
    };
  }

  // REQUIRE PROJECT ADMIN ACCESS
  if (
    requireAdminAccess &&
    !isOwner &&
    !isProjectAdmin
  ) {
    throw createError(
      'Not authorized to manage this project',
      403
    );
  }

  // REQUIRE MEMBERSHIP
  if (
    !requireAdminAccess &&
    !isOwner &&
    !membership
  ) {
    throw createError(
      'Not a member of this project',
      403
    );
  }

  return {
    project,
    isOwner,
    membership,
  };
};

/* ─────────────────────────────────────────────── */
/* GET ALL PROJECTS */
/* ─────────────────────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const { status, search } = req.query;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.name = {
        [Op.like]: `%${search}%`,
      };
    }

    let projects;

    // SYSTEM ADMIN
    if (req.user.role === 'admin') {
      projects = await Project.findAll({
        where,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: User,
            as: 'members',
            attributes: ['id', 'name'],
            through: {
              attributes: ['projectRole'],
            },
          },
        ],
        order: [['createdAt', 'DESC']],
      });
    } else {
      projects = await Project.findAll({
        where,
        include: [
          {
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'email'],
          },
          {
            model: User,
            as: 'members',
            attributes: ['id', 'name'],
            through: {
              attributes: ['projectRole'],
            },
            where: {
              id: req.user.id,
            },
            required: false,
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      projects = projects.filter(
        (p) =>
          p.ownerId === req.user.id ||
          p.members.some(
            (m) => m.id === req.user.id
          )
      );
    }

    res.json({
      success: true,
      count: projects.length,
      projects,
    });

  } catch (err) {
    next(err);
  }
});

/* ─────────────────────────────────────────────── */
/* CREATE PROJECT */
/* ─────────────────────────────────────────────── */
router.post(
  '/',
  [
    body('name')
      .trim()
      .isLength({ min: 2 }),

    body('description')
      .optional()
      .trim(),

    body('dueDate')
      .optional()
      .isISO8601(),

    body('status')
      .optional()
      .isIn([
        'active',
        'on_hold',
        'completed',
        'archived',
      ]),
  ],

  validate,

  async (req, res, next) => {
    try {
      const {
        name,
        description,
        dueDate,
        status,
      } = req.body;

      // CREATE PROJECT
      const project = await Project.create({
        name,
        description,
        dueDate,
        status: status || 'active',
        ownerId: req.user.id,
      });

      // CREATOR BECOMES PROJECT ADMIN
      await ProjectMember.create({
        projectId: project.id,
        userId: req.user.id,
        projectRole: 'admin',
      });

      const fullProject =
        await Project.findByPk(project.id);

      res.status(201).json({
        success: true,
        project: fullProject,
      });

    } catch (err) {
      next(err);
    }
  }
);

/* ─────────────────────────────────────────────── */
/* GET PROJECT BY ID */
/* ─────────────────────────────────────────────── */
router.get(
  '/:id',
  param('id').isUUID(),
  validate,

  async (req, res, next) => {
    try {
      const { project } =
        await getProjectOrFail(
          req.params.id,
          req.user.id,
          false,
          req.user.role
        );

      const tasks = await Task.findAll({
        where: {
          projectId: project.id,
        },
      });

      res.json({
        success: true,
        project,
        tasks,
      });

    } catch (err) {
      next(err);
    }
  }
);

/* ─────────────────────────────────────────────── */
/* UPDATE PROJECT */
/* ─────────────────────────────────────────────── */
router.patch(
  '/:id',

  param('id').isUUID(),

  validate,

  async (req, res, next) => {
    try {
      const { project } =
        await getProjectOrFail(
          req.params.id,
          req.user.id,
          true,
          req.user.role
        );

      await project.update(req.body);

      res.json({
        success: true,
        project,
      });

    } catch (err) {
      next(err);
    }
  }
);

/* ─────────────────────────────────────────────── */
/* DELETE PROJECT */
/* ─────────────────────────────────────────────── */
router.delete(
  '/:id',

  async (req, res, next) => {
    try {
      const {
        project,
        isOwner,
      } = await getProjectOrFail(
        req.params.id,
        req.user.id,
        true,
        req.user.role
      );

      if (!isOwner && req.user.role !== 'admin') {
        return next(
          createError(
            'Only project owner can delete project',
            403
          )
        );
      }

      await project.destroy();

      res.json({
        success: true,
        message: 'Project deleted',
      });

    } catch (err) {
      next(err);
    }
  }
);

/* ─────────────────────────────────────────────── */
/* ADD MEMBER */
/* ─────────────────────────────────────────────── */
router.post(
  '/:id/members',

  async (req, res, next) => {
    try {
      await getProjectOrFail(
        req.params.id,
        req.user.id,
        true,
        req.user.role
      );

      const existing =
        await ProjectMember.findOne({
          where: {
            projectId: req.params.id,
            userId: req.body.userId,
          },
        });

      if (existing) {
        throw createError(
          'User already added to project',
          400
        );
      }

      const member =
        await ProjectMember.create({
          projectId: req.params.id,
          userId: req.body.userId,
          projectRole:
            req.body.projectRole || 'member',
        });

      res.json({
        success: true,
        member,
      });

    } catch (err) {
      next(err);
    }
  }
);

/* ─────────────────────────────────────────────── */
/* REMOVE MEMBER */
/* ─────────────────────────────────────────────── */
router.delete(
  '/:id/members/:userId',

  async (req, res, next) => {
    try {
      await getProjectOrFail(
        req.params.id,
        req.user.id,
        true,
        req.user.role
      );

      await ProjectMember.destroy({
        where: {
          projectId: req.params.id,
          userId: req.params.userId,
        },
      });

      res.json({
        success: true,
      });

    } catch (err) {
      next(err);
    }
  }
);

/* ─────────────────────────────────────────────── */
/* GET MEMBERS */
/* ─────────────────────────────────────────────── */
router.get(
  '/:id/members',

  async (req, res, next) => {
    try {
      const { project } =
        await getProjectOrFail(
          req.params.id,
          req.user.id,
          false,
          req.user.role
        );

      res.json({
        success: true,
        members: project.projectMembers,
      });

    } catch (err) {
      next(err);
    }
  }
);

export default router;
