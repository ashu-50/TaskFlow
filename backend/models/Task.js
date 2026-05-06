import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Task = sequelize.define(
  'Task',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Task title is required' },
        len: {
          args: [2, 200],
          msg: 'Title must be between 2 and 200 characters',
        },
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM('todo', 'in_progress', 'review', 'done'),
      defaultValue: 'todo',
      allowNull: false,
    },

    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      allowNull: false,
    },

    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'projects', key: 'id' },
    },

    assigneeId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },

    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: { model: 'users', key: 'id' },
    },

    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },

    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'tasks',
    timestamps: true,
  }
);

// ✅ Virtual field (safe, no SQL issues)
Task.prototype.isOverdue = function () {
  if (!this.dueDate || this.status === 'done') return false;
  return new Date(this.dueDate) < new Date();
};

export default Task;