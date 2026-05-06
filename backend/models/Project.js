import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Project = sequelize.define(
  'Project',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Project name is required' },
        len: {
          args: [2, 150],
          msg: 'Project name must be between 2 and 150 characters',
        },
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM('active', 'on_hold', 'completed', 'archived'),
      defaultValue: 'active',
      allowNull: false,
    },

    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },

    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
  },
  {
    tableName: 'projects',
    timestamps: true,
  }
);

export default Project;