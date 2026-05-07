import { Router } from 'express';
import { Op, fn, col } from 'sequelize';
import { Task, Project, ProjectMember, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

/* ───────────────────────────────────────────── */
/* GET DASHBOARD */
/* ───────────────────────────────────────────── */
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const isAdmin =
      req.user.role === 'admin';

    const now = new Date();

    const next7Days = new Date(
      now.getTime() +
        7 * 24 * 60 * 60 * 1000
    );

    const last30Days = new Date(
      now.getTime() -
        30 * 24 * 60 * 60 * 1000
    );

    let projectWhere = {};

    let taskWhere = {};

    /* ───────────────────────────────────────── */
    /* ACCESS CONTROL */
    /* ───────────────────────────────────────── */
    if (!isAdmin) {
      const [
        memberships,
        ownedProjects,
      ] = await Promise.all([
        ProjectMember.findAll({
          where: { userId },
          attributes: ['projectId'],
        }),

        Project.findAll({
          where: { ownerId: userId },
          attributes: ['id'],
        }),
      ]);

      const accessibleIds = [
        ...new Set([
          ...memberships.map(
            (m) => m.projectId
          ),

          ...ownedProjects.map(
            (p) => p.id
          ),
        ]),
      ];

      projectWhere = {
        id: {
          [Op.in]: accessibleIds,
        },
      };

      taskWhere = {
        projectId: {
          [Op.in]: accessibleIds,
        },
      };
    }

    const [
      totalProjects,
      activeProjects,
      totalTasks,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      myTasks,
      upcomingDeadlines,
      recentActivity,
      tasksPerUserRaw,
      completedLast30,
      teamMembers,
    ] = await Promise.all([

      /* TOTAL PROJECTS */
      Project.count({
        where: projectWhere,
      }),

      /* ACTIVE PROJECTS */
      Project.count({
        where: {
          ...projectWhere,
          status: 'active',
        },
      }),

      /* TOTAL TASKS */
      Task.count({
        where: taskWhere,
      }),

      /* TASKS BY STATUS */
      Task.findAll({
        where: taskWhere,

        attributes: [
          'status',
          [
            fn(
              'COUNT',
              col('Task.id')
            ),
            'count',
          ],
        ],

        group: ['status'],

        raw: true,
      }),

      /* TASKS BY PRIORITY */
      Task.findAll({
        where: taskWhere,

        attributes: [
          'priority',
          [
            fn(
              'COUNT',
              col('Task.id')
            ),
            'count',
          ],
        ],

        group: ['priority'],

        raw: true,
      }),

      /* OVERDUE TASKS */
      Task.findAll({
        where: {
          ...taskWhere,

          '$Task.dueDate$': {
            [Op.lt]: now,
          },

          status: {
            [Op.ne]: 'done',
          },
        },

        include: [
          {
            model: User,
            as: 'assignee',
            attributes: [
              'id',
              'name',
            ],
          },

          {
            model: Project,
            as: 'project',
            attributes: [
              'id',
              'name',
            ],
          },
        ],

        order: [
          [
            col('Task.dueDate'),
            'ASC',
          ],
        ],

        subQuery: false,

        limit: 10,
      }),

      /* MY TASKS */
      Task.findAll({
        where: {
          ...taskWhere,

          assigneeId: userId,

          status: {
            [Op.ne]: 'done',
          },
        },

        include: [
          {
            model: Project,
            as: 'project',
            attributes: [
              'id',
              'name',
            ],
          },
        ],

        order: [
          [
            col('Task.dueDate'),
            'ASC',
          ],
        ],

        subQuery: false,

        limit: 10,
      }),

      /* UPCOMING DEADLINES */
      Task.findAll({
        where: {
          ...taskWhere,

          '$Task.dueDate$': {
            [Op.between]: [
              now,
              next7Days,
            ],
          },

          status: {
            [Op.ne]: 'done',
          },
        },

        include: [
          {
            model: User,
            as: 'assignee',
            attributes: [
              'id',
              'name',
            ],
          },

          {
            model: Project,
            as: 'project',
            attributes: [
              'id',
              'name',
            ],
          },
        ],

        order: [
          [
            col('Task.dueDate'),
            'ASC',
          ],
        ],

        subQuery: false,

        limit: 10,
      }),

      /* RECENT ACTIVITY */
      Task.findAll({
        where: taskWhere,

        include: [
          {
            model: User,
            as: 'assignee',
            attributes: [
              'id',
              'name',
            ],
          },

          {
            model: Project,
            as: 'project',
            attributes: [
              'id',
              'name',
            ],
          },
        ],

        order: [
          [
            col('Task.updatedAt'),
            'DESC',
          ],
        ],

        subQuery: false,

        limit: 8,
      }),

      /* TASKS PER USER */
      Task.findAll({
        where: {
          ...taskWhere,

          assigneeId: {
            [Op.ne]: null,
          },
        },

        attributes: [
          'assigneeId',

          [
            fn(
              'COUNT',
              col('Task.id')
            ),
            'count',
          ],
        ],

        include: [
          {
            model: User,
            as: 'assignee',
            attributes: [
              'id',
              'name',
            ],
          },
        ],

        group: [
          'assigneeId',
          'assignee.id',
          'assignee.name',
        ],

        raw: true,

        nest: true,
      }),

      /* COMPLETED LAST 30 DAYS */
      Task.count({
        where: {
          ...taskWhere,

          status: 'done',

          '$Task.completedAt$': {
            [Op.gte]:
              last30Days,
          },
        },
      }),

      /* TEAM MEMBERS */
      isAdmin
        ? User.count()
        : Promise.resolve(null),
    ]);

    /* ───────────────────────────────────────── */
    /* FORMAT DATA */
    /* ───────────────────────────────────────── */

    const statusBreakdown = {
      todo: 0,
      in_progress: 0,
      review: 0,
      done: 0,
    };

    tasksByStatus.forEach((t) => {
      if (
        statusBreakdown[t.status] !==
        undefined
      ) {
        statusBreakdown[t.status] =
          Number(t.count);
      }
    });

    const priorityBreakdown = {
      low: 0,
      medium: 0,
      high: 0,
    };

    tasksByPriority.forEach((t) => {
      if (
        priorityBreakdown[
          t.priority
        ] !== undefined
      ) {
        priorityBreakdown[
          t.priority
        ] = Number(t.count);
      }
    });

    const tasksPerUser =
      tasksPerUserRaw.map((t) => ({
        user: t.assignee,
        total: Number(t.count),
      }));

    const completionRate =
      totalTasks > 0
        ? Math.round(
            (completedLast30 /
              totalTasks) *
              100
          )
        : 0;

    /* ───────────────────────────────────────── */
    /* RESPONSE */
    /* ───────────────────────────────────────── */

    res.json({
      success: true,

      dashboard: {
        summary: {
          totalProjects,
          activeProjects,
          totalTasks,

          overdueTasks:
            overdueTasks.length,

          completionRate,

          teamMembers,
        },

        taskStatus:
          statusBreakdown,

        taskPriority:
          priorityBreakdown,

        tasksPerUser,

        overdueTasks,

        myTasks,

        upcomingDeadlines,

        recentActivity,
      },
    });

  } catch (err) {
    next(err);
  }
});

/* ───────────────────────────────────────────── */
/* GET ALL USERS */
/* ───────────────────────────────────────────── */
router.get(
  '/users',

  async (req, res, next) => {
    try {
      const users =
        await User.findAll({
          attributes: [
            'id',
            'name',
            'email',
            'role',
            'createdAt',
          ],
        });

      res.json({
        success: true,
        users,
      });

    } catch (err) {
      next(err);
    }
  }
);

export default router;
