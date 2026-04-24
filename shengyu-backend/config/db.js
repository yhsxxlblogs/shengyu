const mysql = require('mysql2');
const config = require('./index');

// 创建数据库连接池
const db = mysql.createPool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  charset: config.database.charset,
  waitForConnections: true,
  connectionLimit: config.database.connectionLimit,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// 测试连接
db.getConnection((err, connection) => {
  if (err) {
    console.error('数据库连接失败:', err);
    return;
  }
  console.log('数据库连接成功');
  connection.release();

  // 创建数据库表
  createTables();
});

// 创建数据库表
function createTables() {
  // 用户表
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255),
      nickname VARCHAR(100),
      avatar VARCHAR(255),
      wechat_openid VARCHAR(100),
      wechat_unionid VARCHAR(100),
      wechat_nickname VARCHAR(100),
      wechat_avatar VARCHAR(255),
      login_type VARCHAR(20) DEFAULT 'password',
      is_admin TINYINT(1) DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_created_at (created_at),
      INDEX idx_wechat_openid (wechat_openid),
      INDEX idx_is_admin (is_admin)
    )
  `;

  // 声音表
  const createSoundsTable = `
    CREATE TABLE IF NOT EXISTS sounds (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      animal_type VARCHAR(50) NOT NULL,
      emotion VARCHAR(50) NOT NULL,
      sound_url VARCHAR(255) NOT NULL,
      duration INT NOT NULL,
      visible TINYINT(1) DEFAULT 1,
      review_status VARCHAR(20) DEFAULT 'none',
      is_official TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_animal_type (animal_type),
      INDEX idx_visible (visible),
      INDEX idx_created_at (created_at)
    )
  `;

  // 帖子表
  const createPostsTable = `
    CREATE TABLE IF NOT EXISTS posts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      sound_id INT,
      content TEXT,
      image_url VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (sound_id) REFERENCES sounds(id) ON DELETE SET NULL,
      INDEX idx_user_id (user_id),
      INDEX idx_created_at (created_at),
      INDEX idx_user_created (user_id, created_at)
    )
  `;

  // 点赞表
  const createLikesTable = `
    CREATE TABLE IF NOT EXISTS likes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT,
      user_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uk_post_user (post_id, user_id),
      INDEX idx_post_id (post_id),
      INDEX idx_user_id (user_id),
      INDEX idx_post_created (post_id, created_at)
    )
  `;

  // 评论表
  const createCommentsTable = `
    CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT,
      user_id INT,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_post_id (post_id),
      INDEX idx_user_id (user_id),
      INDEX idx_post_created (post_id, created_at)
    )
  `;

  // 关注表
  const createFollowsTable = `
    CREATE TABLE IF NOT EXISTS follows (
      id INT AUTO_INCREMENT PRIMARY KEY,
      follower_id INT,
      following_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY unique_follow (follower_id, following_id),
      INDEX idx_follower_id (follower_id),
      INDEX idx_following_id (following_id),
      INDEX idx_created_at (created_at)
    )
  `;

  // 私信表
  const createMessagesTable = `
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT,
      receiver_id INT,
      content TEXT NOT NULL,
      is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_sender_receiver (sender_id, receiver_id),
      INDEX idx_receiver_sender (receiver_id, sender_id),
      INDEX idx_receiver_read (receiver_id, is_read),
      INDEX idx_created_at (created_at)
    )
  `;

  // 收藏表
  const createFavoritesTable = `
    CREATE TABLE IF NOT EXISTS favorites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      sound_id INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (sound_id) REFERENCES sounds(id) ON DELETE CASCADE,
      UNIQUE KEY uk_user_sound (user_id, sound_id),
      INDEX idx_sound_id (sound_id)
    )
  `;

  // 通知表
  const createNotificationsTable = `
    CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      status VARCHAR(50) DEFAULT 'active',
      is_active TINYINT(1) DEFAULT 1,
      publish_at TIMESTAMP NULL,
      expire_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_status (status),
      INDEX idx_publish_at (publish_at)
    )
  `;

  // 动物类型表
  const createAnimalTypesTable = `
    CREATE TABLE IF NOT EXISTS animal_types (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type VARCHAR(50) NOT NULL UNIQUE,
      name VARCHAR(50) NOT NULL,
      icon VARCHAR(50),
      category VARCHAR(50) DEFAULT 'other',
      description TEXT,
      is_active TINYINT(1) DEFAULT 1,
      sort_order INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_category (category),
      INDEX idx_sort_order (sort_order)
    )
  `;

  // 分类表
  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      display_name VARCHAR(50) NOT NULL,
      sort_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;

  // 系统声音表
  const createSystemSoundsTable = `
    CREATE TABLE IF NOT EXISTS system_sounds (
      id INT AUTO_INCREMENT PRIMARY KEY,
      type_id INT NOT NULL,
      emotion VARCHAR(50) NOT NULL,
      sound_url VARCHAR(255) NOT NULL,
      duration INT DEFAULT 0,
      description TEXT,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (type_id) REFERENCES animal_types(id) ON DELETE CASCADE
    )
  `;

  // 声音情绪表
  const createSoundEmotionsTable = `
    CREATE TABLE IF NOT EXISTS sound_emotions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      icon VARCHAR(50),
      sort_order INT DEFAULT 0,
      is_active TINYINT(1) DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // 删除记录表（用于软删除私信）
  const createDeletedMessagesTable = `
    CREATE TABLE IF NOT EXISTS deleted_messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      message_id INT NOT NULL,
      deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_message (user_id, message_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
    )
  `;

  // 执行所有建表语句
  const tables = [
    createUsersTable,
    createSoundsTable,
    createPostsTable,
    createLikesTable,
    createCommentsTable,
    createFollowsTable,
    createMessagesTable,
    createFavoritesTable,
    createNotificationsTable,
    createAnimalTypesTable,
    createCategoriesTable,
    createSystemSoundsTable,
    createSoundEmotionsTable,
    createDeletedMessagesTable
  ];

  tables.forEach((tableSql, index) => {
    db.query(tableSql, (err) => {
      if (err) {
        console.error(`创建表失败 (${index + 1}/${tables.length}):`, err);
      }
    });
  });
}

// 为 wechat.js 提供 Promise 包装的方法
db.promiseQuery = function(sql, params) {
  return new Promise((resolve, reject) => {
    this.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve([results]);
      }
    });
  });
};

module.exports = db;
