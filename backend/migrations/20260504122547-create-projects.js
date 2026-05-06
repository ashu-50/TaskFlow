'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('projects', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      // ❌ removed defaultValue
    },

    name: {
      type: Sequelize.STRING(150),
      allowNull: false,
    },

    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },

    status: {
      type: Sequelize.ENUM('active', 'on_hold', 'completed', 'archived'),
      defaultValue: 'active',
      allowNull: false,
    },

    ownerId: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },

    dueDate: {
      type: Sequelize.DATEONLY,
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

  await queryInterface.addIndex('projects', ['ownerId']);
  await queryInterface.addIndex('projects', ['status']);
}
export async function down(queryInterface, Sequelize) {
  // optional but clean
  await queryInterface.dropTable('projects');
  await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_projects_status;');
}