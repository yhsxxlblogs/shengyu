const db = require('./config/db');
const bcrypt = require('bcrypt');

// 清洗数据库数据
function cleanDatabase() {
  return new Promise((resolve, reject) => {
    // 禁用外键约束
    db.query('SET FOREIGN_KEY_CHECKS = 0', (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      // 删除所有表
      const dropTables = [
        'DROP TABLE IF EXISTS likes',
        'DROP TABLE IF EXISTS comments',
        'DROP TABLE IF EXISTS posts',
        'DROP TABLE IF EXISTS sounds',
        'DROP TABLE IF EXISTS users'
      ];
      
      let index = 0;
      function executeNext() {
        if (index >= dropTables.length) {
          // 重新启用外键约束
          db.query('SET FOREIGN_KEY_CHECKS = 1', (err) => {
            if (err) {
              reject(err);
              return;
            }
            // 重新创建表
            createTables().then(resolve).catch(reject);
          });
          return;
        }
        db.query(dropTables[index], (err) => {
          if (err) {
            reject(err);
            return;
          }
          index++;
          executeNext();
        });
      }
      
      executeNext();
    });
  });
}

// 创建数据库表
function createTables() {
  return new Promise((resolve, reject) => {
    // 用户表
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        visible TINYINT DEFAULT 1,
        review_status ENUM('none', 'pending', 'approved', 'rejected') DEFAULT 'none',
        is_official TINYINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    
    // 帖子表
    const createPostsTable = `
      CREATE TABLE IF NOT EXISTS posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        sound_id INT,
        content TEXT,
        image_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (sound_id) REFERENCES sounds(id)
      )
    `;
    
    // 评论表
    const createCommentsTable = `
      CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    
    // 点赞表
    const createLikesTable = `
      CREATE TABLE IF NOT EXISTS likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
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
        publish_at TIMESTAMP NULL,
        expire_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    // 执行创建表的SQL语句
    db.query(createUsersTable, (err) => {
      if (err) {
        reject(err);
        return;
      }
      db.query(createSoundsTable, (err) => {
        if (err) {
          reject(err);
          return;
        }
        db.query(createPostsTable, (err) => {
          if (err) {
            reject(err);
            return;
          }
          db.query(createCommentsTable, (err) => {
            if (err) {
              reject(err);
              return;
            }
            db.query(createLikesTable, (err) => {
              if (err) {
                reject(err);
                return;
              }
              db.query(createNotificationsTable, (err) => {
                if (err) {
                  reject(err);
                  return;
                }
                resolve();
              });
            });
          });
        });
      });
    });
  });
}

// 插入测试数据
function insertTestData() {
  return new Promise((resolve, reject) => {
    // 插入用户数据
    const users = [
      { username: 'syh', email: '216@qq.com', password: '123456' },
      { username: 'testuser', email: 'test@example.com', password: '123456' }
    ];
    
    let insertedUsers = [];
    
    // 插入用户
    function insertUsers() {
      return new Promise((resolve, reject) => {
        let userIndex = 0;
        function insertNextUser() {
          if (userIndex >= users.length) {
            resolve(insertedUsers);
            return;
          }
          const user = users[userIndex];
          // 密码加密
          const hashedPassword = bcrypt.hashSync(user.password, 10);
          db.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [user.username, user.email, hashedPassword],
            (err, result) => {
              if (err) {
                reject(err);
                return;
              }
              insertedUsers.push({ id: result.insertId, ...user });
              userIndex++;
              insertNextUser();
            }
          );
        }
        insertNextUser();
      });
    }
    
    // 插入声音数据
    function insertSounds(users) {
      return new Promise((resolve, reject) => {
        const sounds = [
          { user_id: users[0].id, animal_type: 'cat', emotion: '温柔', sound_url: 'cat_gentle.mp3', duration: 5 },
          { user_id: users[0].id, animal_type: 'dog', emotion: '愤怒', sound_url: 'dog_angry.mp3', duration: 3 },
          { user_id: users[1].id, animal_type: 'bird', emotion: '玩耍', sound_url: 'bird_playful.mp3', duration: 4 }
        ];
        
        let insertedSounds = [];
        let soundIndex = 0;
        
        function insertNextSound() {
          if (soundIndex >= sounds.length) {
            resolve(insertedSounds);
            return;
          }
          const sound = sounds[soundIndex];
          db.query(
            'INSERT INTO sounds (user_id, animal_type, emotion, sound_url, duration) VALUES (?, ?, ?, ?, ?)',
            [sound.user_id, sound.animal_type, sound.emotion, sound.sound_url, sound.duration],
            (err, result) => {
              if (err) {
                reject(err);
                return;
              }
              insertedSounds.push({ id: result.insertId, ...sound });
              soundIndex++;
              insertNextSound();
            }
          );
        }
        insertNextSound();
      });
    }
    
    // 插入帖子数据
    function insertPosts(users, sounds) {
      return new Promise((resolve, reject) => {
        const posts = [
          { user_id: users[0].id, sound_id: sounds[0].id, content: '这是我家猫咪的温柔叫声，是不是很可爱？', image_url: null },
          { user_id: users[0].id, sound_id: sounds[1].id, content: '狗狗生气了，声音好凶啊！', image_url: null },
          { user_id: users[1].id, sound_id: sounds[2].id, content: '小鸟在窗外玩耍，声音真好听', image_url: null }
        ];
        
        let insertedPosts = [];
        let postIndex = 0;
        
        function insertNextPost() {
          if (postIndex >= posts.length) {
            resolve(insertedPosts);
            return;
          }
          const post = posts[postIndex];
          db.query(
            'INSERT INTO posts (user_id, sound_id, content, image_url) VALUES (?, ?, ?, ?)',
            [post.user_id, post.sound_id, post.content, post.image_url],
            (err, result) => {
              if (err) {
                reject(err);
                return;
              }
              insertedPosts.push({ id: result.insertId, ...post });
              postIndex++;
              insertNextPost();
            }
          );
        }
        insertNextPost();
      });
    }
    
    // 插入评论数据
    function insertComments(users, posts) {
      return new Promise((resolve, reject) => {
        const comments = [
          { post_id: posts[0].id, user_id: users[1].id, content: '真的很可爱！' },
          { post_id: posts[1].id, user_id: users[1].id, content: '哈哈，狗狗确实生气了' },
          { post_id: posts[2].id, user_id: users[0].id, content: '听起来很欢快' }
        ];
        
        let commentIndex = 0;
        
        function insertNextComment() {
          if (commentIndex >= comments.length) {
            resolve();
            return;
          }
          const comment = comments[commentIndex];
          db.query(
            'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [comment.post_id, comment.user_id, comment.content],
            (err) => {
              if (err) {
                reject(err);
                return;
              }
              commentIndex++;
              insertNextComment();
            }
          );
        }
        insertNextComment();
      });
    }
    
    // 插入点赞数据
    function insertLikes(users, posts) {
      return new Promise((resolve, reject) => {
        const likes = [
          { post_id: posts[0].id, user_id: users[1].id },
          { post_id: posts[1].id, user_id: users[1].id },
          { post_id: posts[2].id, user_id: users[0].id }
        ];
        
        let likeIndex = 0;
        
        function insertNextLike() {
          if (likeIndex >= likes.length) {
            resolve();
            return;
          }
          const like = likes[likeIndex];
          db.query(
            'INSERT INTO likes (post_id, user_id) VALUES (?, ?)',
            [like.post_id, like.user_id],
            (err) => {
              if (err) {
                reject(err);
                return;
              }
              likeIndex++;
              insertNextLike();
            }
          );
        }
        insertNextLike();
      });
    }
    
    // 执行插入操作
    insertUsers()
      .then(insertedUsers => {
        return insertSounds(insertedUsers).then(insertedSounds => {
          return { users: insertedUsers, sounds: insertedSounds };
        });
      })
      .then(({ users, sounds }) => {
        return insertPosts(users, sounds).then(insertedPosts => {
          return { users, sounds, posts: insertedPosts };
        });
      })
      .then(({ users, posts }) => {
        return insertComments(users, posts).then(() => {
          return { users, posts };
        });
      })
      .then(({ users, posts }) => {
        return insertLikes(users, posts);
      })
      .then(() => {
        resolve();
      })
      .catch(err => {
        reject(err);
      });
  });
}

// 主函数
async function main() {
  try {
    console.log('开始清洗数据库...');
    await cleanDatabase();
    console.log('数据库清洗完成');
    
    console.log('开始插入测试数据...');
    await insertTestData();
    console.log('测试数据插入完成');
    
    console.log('数据库操作完成！');
    process.exit(0);
  } catch (error) {
    console.error('数据库操作失败:', error);
    process.exit(1);
  }
}

main();
