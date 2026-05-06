'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('tasks', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      // ❌ removed defaultValue
    },

    title: {
      type: Sequelize.STRING(200),
      allowNull: false,
    },

    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },

    // ✅ FIXED ENUM (match model)
    status: {
      type: Sequelize.ENUM('todo', 'in_progress', 'done'),
      defaultValue: 'todo',
      allowNull: false,
    },

    priority: {
      type: Sequelize.ENUM('low', 'medium', 'high'),
      defaultValue: 'medium',
      allowNull: false,
    },

    projectId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    assigneeId: {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },

    createdById: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },

    dueDate: {
      type: Sequelize.DATEONLY,
      allowNull: true,
    },

    completedAt: {
      type: Sequelize.DATE,
      allowNull: true,
    },

    createdAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },

    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('tasks', ['projectId']);
  await queryInterface.addIndex('tasks', ['assigneeId']);
  await queryInterface.addIndex('tasks', ['status']);
  await queryInterface.addIndex('tasks', ['dueDate']);
}
export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('tasks');

  // optional ENUM cleanup
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS enum_tasks_status;'
  );
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS enum_tasks_priority;'
  );
}