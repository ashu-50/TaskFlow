'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('project_members', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      // ❌ removed defaultValue
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

    userId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    projectRole: {
      type: Sequelize.ENUM('manager', 'contributor', 'viewer'),
      defaultValue: 'contributor',
      allowNull: false,
    },

    joinedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
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

  await queryInterface.addIndex(
    'project_members',
    ['projectId', 'userId'],
    { unique: true }
  );
}
export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('project_members');

  // optional cleanup (safe for MySQL)
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS enum_project_members_projectRole;'
  );
}