const mysql = require('mysql2');

// 连接远程数据库
const db = mysql.createConnection({
  host: '106.14.248.12',
  user: 'root',
  password: '@Syh20050608',
  database: 'animal_sound_app',
  charset: 'utf8mb4'
});

db.connect((err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    return;
  }
  console.log('数据库连接成功');

  // 检查用户头像路径
  console.log('\n========== 用户头像路径 ==========');
  db.query('SELECT id, username, avatar FROM users WHERE avatar IS NOT NULL LIMIT 10', (err, results) => {
    if (err) {
      console.error('查询用户失败:', err);
    } else {
      results.forEach(user => {
        console.log(`ID: ${user.id}, 用户: ${user.username}`);
        console.log(`  头像路径: ${user.avatar}`);
      });
    }

    // 检查轮播图路径
    console.log('\n========== 轮播图路径 ==========');
    db.query('SELECT id, title, image_url FROM banners LIMIT 10', (err, results) => {
      if (err) {
        console.error('查询轮播图失败:', err);
      } else {
        results.forEach(banner => {
          console.log(`ID: ${banner.id}, 标题: ${banner.title}`);
          console.log(`  图片路径: ${banner.image_url}`);
        });
      }

      // 检查帖子图片路径
      console.log('\n========== 帖子图片路径 ==========');
      db.query('SELECT id, user_id, image_url FROM posts WHERE image_url IS NOT NULL LIMIT 10', (err, results) => {
        if (err) {
          console.error('查询帖子失败:', err);
        } else {
          results.forEach(post => {
            console.log(`ID: ${post.id}, 用户ID: ${post.user_id}`);
            console.log(`  图片路径: ${post.image_url}`);
          });
        }

        // 检查声音文件路径
        console.log('\n========== 声音文件路径 ==========');
        db.query('SELECT id, emotion, sound_url FROM sounds LIMIT 10', (err, results) => {
          if (err) {
            console.error('查询声音失败:', err);
          } else {
            results.forEach(sound => {
              console.log(`ID: ${sound.id}, 情绪: ${sound.emotion}`);
              console.log(`  声音路径: ${sound.sound_url}`);
            });
          }

          db.end();
          console.log('\n========== 检查完成 ==========');
        });
      });
    });
  });
});
