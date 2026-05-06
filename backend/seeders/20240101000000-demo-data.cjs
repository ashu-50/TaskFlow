'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Fixed IDs (idempotent)
const adminId    = 'aaaaaaaa-0000-0000-0000-000000000001';
const member1Id  = 'bbbbbbbb-0000-0000-0000-000000000002';
const member2Id  = 'cccccccc-0000-0000-0000-000000000003';
const member3Id  = 'dddddddd-0000-0000-0000-000000000004';
const project1Id = 'eeeeeeee-0000-0000-0000-000000000005';
const project2Id = 'ffffffff-0000-0000-0000-000000000006';
const project3Id = '11111111-0000-0000-0000-000000000007';

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (n) => new Date(Date.now() + n * DAY);

module.exports = {
  async up(queryInterface) {
    const pw = await bcrypt.hash('password123', 12);

    // USERS
    await queryInterface.bulkInsert('users', [
      { id: adminId, name: 'Alice Chen', email: 'admin@example.com', password: pw, role: 'admin', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: member1Id, name: 'Bob Patel', email: 'bob@example.com', password: pw, role: 'member', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: member2Id, name: 'Carol Smith', email: 'carol@example.com', password: pw, role: 'member', isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: member3Id, name: 'David Kim', email: 'david@example.com', password: pw, role: 'member', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ]);

    // PROJECTS
    await queryInterface.bulkInsert('projects', [
      { id: project1Id, name: 'Website Redesign', description: 'UI/UX overhaul', status: 'active', ownerId: adminId, dueDate: daysFromNow(30), createdAt: new Date(), updatedAt: new Date() },
      { id: project2Id, name: 'Mobile App v2', description: 'New features', status: 'active', ownerId: adminId, dueDate: daysFromNow(60), createdAt: new Date(), updatedAt: new Date() },
      { id: project3Id, name: 'Data Migration', description: 'DB migration', status: 'on_hold', ownerId: adminId, dueDate: daysFromNow(90), createdAt: new Date(), updatedAt: new Date() },
    ]);

    // PROJECT MEMBERS
    await queryInterface.bulkInsert('project_members', [
      { id: uuidv4(), projectId: project1Id, userId: adminId, projectRole: 'manager', joinedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), projectId: project1Id, userId: member1Id, projectRole: 'contributor', joinedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), projectId: project1Id, userId: member2Id, projectRole: 'contributor', joinedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },

      { id: uuidv4(), projectId: project2Id, userId: adminId, projectRole: 'manager', joinedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), projectId: project2Id, userId: member2Id, projectRole: 'contributor', joinedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), projectId: project2Id, userId: member3Id, projectRole: 'contributor', joinedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },

      { id: uuidv4(), projectId: project3Id, userId: adminId, projectRole: 'manager', joinedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), projectId: project3Id, userId: member3Id, projectRole: 'contributor', joinedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    ]);

    // TASKS
    await queryInterface.bulkInsert('tasks', [
      { id: uuidv4(), title: 'Design homepage', status: 'in_progress', priority: 'high', projectId: project1Id, assigneeId: member1Id, createdById: adminId, dueDate: daysFromNow(5), createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), title: 'Write content', status: 'todo', priority: 'medium', projectId: project1Id, assigneeId: member1Id, createdById: adminId, dueDate: daysFromNow(10), createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), title: 'Setup CI/CD', status: 'todo', priority: 'high', projectId: project1Id, assigneeId: adminId, createdById: adminId, dueDate: daysFromNow(-2), createdAt: new Date(), updatedAt: new Date() },

      { id: uuidv4(), title: 'JWT auth', status: 'in_progress', priority: 'high', projectId: project2Id, assigneeId: member2Id, createdById: adminId, dueDate: daysFromNow(3), createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), title: 'Unit tests', status: 'todo', priority: 'medium', projectId: project2Id, assigneeId: member2Id, createdById: adminId, dueDate: daysFromNow(-1), createdAt: new Date(), updatedAt: new Date() },

      { id: uuidv4(), title: 'Schema audit', status: 'done', priority: 'high', projectId: project3Id, assigneeId: member3Id, createdById: adminId, dueDate: daysFromNow(-10), completedAt: daysFromNow(-9), createdAt: new Date(), updatedAt: new Date() },
      { id: uuidv4(), title: 'Migration scripts', status: 'todo', priority: 'high', projectId: project3Id, assigneeId: member3Id, createdById: adminId, dueDate: daysFromNow(-3), createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('tasks', null, {});
    await queryInterface.bulkDelete('project_members', null, {});
    await queryInterface.bulkDelete('projects', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};