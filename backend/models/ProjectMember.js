import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProjectMember = sequelize.define(
  'ProjectMember',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },

    // UPDATED ROLE SYSTEM
    projectRole: {
      type: DataTypes.ENUM(
        'admin',
        'member'
      ),
      defaultValue: 'member',
      allowNull: false,
    },

    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'project_members',

    timestamps: true,

    indexes: [
      {
        unique: true,
        fields: ['projectId', 'userId'],
      },
    ],
  }
);

export default ProjectMember;
