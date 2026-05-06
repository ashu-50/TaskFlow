'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('users', {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.UUIDV4, // optional but useful
    },

    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },

    email: {
      type: Sequelize.STRING(255),
      allowNull: false,
      unique: true,
    },

    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },

    // ✅ REQUIRED (your code uses this)
    role: {
      type: Sequelize.ENUM('admin', 'member'),
      allowNull: false,
      defaultValue: 'member',
    },

    // ✅ REQUIRED (your auth uses this)
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.dropTable('users');

  // clean ENUM (important in MySQL)
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS enum_users_role;'
  ).catch(() => {});
}