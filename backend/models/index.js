import sequelize from '../config/database.js';

import User from './User.js';
import Project from './Project.js';
import ProjectMember from './ProjectMember.js';
import Task from './Task.js';

// ── User ↔ Project (owner) ─────────────────
User.hasMany(Project, { foreignKey: 'ownerId', as: 'ownedProjects' });
Project.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// ── User ↔ Project (members) ─────────────────
User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: 'userId',
  otherKey: 'projectId',
  as: 'memberProjects',
});

Project.belongsToMany(User, {
  through: ProjectMember,
  foreignKey: 'projectId',
  otherKey: 'userId',
  as: 'members',
});

// ── ProjectMember relations ─────────────────
Project.hasMany(ProjectMember, { foreignKey: 'projectId', as: 'projectMembers' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId' });

User.hasMany(ProjectMember, { foreignKey: 'userId' });
ProjectMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Task relations ─────────────────
Project.hasMany(Task, {
  foreignKey: 'projectId',
  as: 'tasks',
  onDelete: 'CASCADE',
});

Task.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
});

User.hasMany(Task, {
  foreignKey: 'assigneeId',
  as: 'assignedTasks',
});

Task.belongsTo(User, {
  foreignKey: 'assigneeId',
  as: 'assignee',
});

User.hasMany(Task, {
  foreignKey: 'createdById',
  as: 'createdTasks',
});

Task.belongsTo(User, {
  foreignKey: 'createdById',
  as: 'createdBy',
});

// ✅ Named exports
export {
  sequelize,
  User,
  Project,
  ProjectMember,
  Task,
};