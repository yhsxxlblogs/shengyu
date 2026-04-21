// API基础URL - 使用相对路径，自动适配当前域名
const API_BASE_URL = '/api';

// 全局数据缓存
let categoriesData = [];
let typesData = [];
let systemSoundsData = [];
let userSoundsData = [];

// 检查登录状态
function checkAuth() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/admin/login.html';
    return false;
  }
  return true;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;

  initNavigation();
  initModal();
  initEventListeners();
  updateTime();
  setInterval(updateTime, 1000);

  // 默认加载数据概览页
  loadDashboard();
});

// 更新时间
function updateTime() {
  const timeEl = document.getElementById('current-time');
  if (timeEl) {
    timeEl.textContent = new Date().toLocaleString('zh-CN');
  }
}

// ========== 导航 ==========
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetPage = item.getAttribute('data-page');

      // 更新导航状态
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');

      // 显示对应页面
      pages.forEach(p => p.classList.remove('active'));
      const targetEl = document.getElementById(`page-${targetPage}`);
      if (targetEl) {
        targetEl.classList.add('active');
      }

      // 加载数据
      loadPageData(targetPage);
    });
  });

  // 侧边栏切换（移动端）
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }

  // 退出登录
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login.html';
    });
  }
}

// 根据页面加载数据
function loadPageData(page) {
  console.log('加载页面:', page);
  switch(page) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'categories':
      loadCategories();
      break;
    case 'animal-types':
      loadAnimalTypes();
      break;
    case 'system-sounds':
      loadSystemSounds();
      break;
    case 'user-sounds':
      loadUserSounds();
      break;
    case 'users':
      loadUsers();
      break;
    case 'posts':
      loadPosts();
      break;
    case 'banners':
      loadBanners();
      break;
    case 'notifications':
      loadNotifications();
      break;
  }
}

// ========== 事件监听 ==========
function initEventListeners() {
  // 分类筛选
  const categoryFilter = document.getElementById('filter-category');
  if (categoryFilter) {
    categoryFilter.addEventListener('change', loadAnimalTypes);
  }

  // 系统声音筛选
  const soundCategoryFilter = document.getElementById('filter-sound-category');
  const soundTypeFilter = document.getElementById('filter-sound-type');
  if (soundCategoryFilter) {
    soundCategoryFilter.addEventListener('change', () => {
      updateTypeFilter('filter-sound');
      loadSystemSounds();
    });
  }
  if (soundTypeFilter) {
    soundTypeFilter.addEventListener('change', loadSystemSounds);
  }

  // 用户声音筛选
  const userSoundStatusFilter = document.getElementById('filter-user-sound-status');
  if (userSoundStatusFilter) {
    userSoundStatusFilter.addEventListener('change', loadUserSounds);
  }
}

// ========== 数据概览 ==========
async function loadDashboard() {
  console.log('加载数据概览...');
  try {
    // 获取统计数据 - 使用正确的API路径
    const [catRes, typeRes, sysSoundRes, userSoundRes, userRes, postRes] = await Promise.all([
      fetch(`${API_BASE_URL}/sound/admin/categories`),
      fetch(`${API_BASE_URL}/sound/admin/animal-types`),
      fetch(`${API_BASE_URL}/sound/admin/system-sounds`),
      fetch(`${API_BASE_URL}/sound/admin/user-sounds`),
      fetch(`${API_BASE_URL}/admin/users`),
      fetch(`${API_BASE_URL}/admin/posts`)
    ]);

    const [catData, typeData, sysSoundData, userSoundData, userData, postData] = await Promise.all([
      catRes.json(),
      typeRes.json(),
      sysSoundRes.json(),
      userSoundRes.json(),
      userRes.json(),
      postRes.json()
    ]);

    console.log('统计数据:', { catData, typeData, sysSoundData, userSoundData, userData, postData });

    // 更新统计卡片
    const statUsers = document.getElementById('stat-users');
    const statSounds = document.getElementById('stat-sounds');
    const statUserSounds = document.getElementById('stat-user-sounds');
    const statPosts = document.getElementById('stat-posts');
    const statPending = document.getElementById('stat-pending');
    const statCategories = document.getElementById('stat-categories');

    if (statUsers) statUsers.textContent = userData.users?.length || 0;
    if (statSounds) statSounds.textContent = sysSoundData.data?.length || 0;
    if (statUserSounds) statUserSounds.textContent = userSoundData.data?.length || 0;
    if (statPosts) statPosts.textContent = postData.posts?.length || 0;
    if (statCategories) statCategories.textContent = catData.data?.length || 0;

    // 计算待审核数量
    const pendingCount = userSoundData.data?.filter(s => s.review_status === 'pending').length || 0;
    if (statPending) statPending.textContent = pendingCount;

    // 加载最近上传和用户
    loadRecentUploads(sysSoundData.data || []);
    loadRecentUsers(userData.users || []);
  } catch (error) {
    console.error('加载概览数据失败:', error);
    showToast('加载数据失败', 'error');
  }
}

async function loadRecentUploads(sounds) {
  const container = document.getElementById('recent-uploads');
  if (!container) return;

  const recentSounds = sounds.slice(-5).reverse();

  if (recentSounds.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无上传</div>';
    return;
  }

  container.innerHTML = recentSounds.map(sound => `
    <div class="recent-item">
      <i class="fas fa-music"></i>
      <div class="info">
        <h4>${escapeHtml(sound.emotion || '未知')}</h4>
        <p>${escapeHtml(sound.type_name || sound.animal_type || '系统声音')}</p>
      </div>
      <span class="time">${formatDate(sound.created_at)}</span>
    </div>
  `).join('');
}

async function loadRecentUsers(users) {
  const container = document.getElementById('recent-users');
  if (!container) return;

  const recentUsers = users.slice(-5).reverse();

  if (recentUsers.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无用户</div>';
    return;
  }

  container.innerHTML = recentUsers.map(user => `
    <div class="recent-item">
      <i class="fas fa-user"></i>
      <div class="info">
        <h4>${escapeHtml(user.username)}</h4>
        <p>${escapeHtml(user.email)}</p>
      </div>
      <span class="time">${formatDate(user.created_at)}</span>
    </div>
  `).join('');
}

function refreshDashboard() {
  loadDashboard();
  showToast('数据已刷新');
}

// ========== 分类管理 ==========
async function loadCategories() {
  console.log('加载分类...');
  const tbody = document.querySelector('#categories-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories`);
    const data = await response.json();
    console.log('分类数据:', data);
    categoriesData = data.data || [];

    if (categoriesData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无分类数据</td></tr>';
      return;
    }

    tbody.innerHTML = categoriesData.map(cat => `
      <tr>
        <td>${cat.id}</td>
        <td><code>${escapeHtml(cat.name)}</code></td>
        <td>${escapeHtml(cat.display_name)}</td>
        <td>${cat.sort_order || 0}</td>
        <td>${cat.is_active ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-danger">禁用</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-primary" onclick="editCategory(${cat.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory(${cat.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载分类失败:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">加载失败</td></tr>';
  }
}

function showAddCategoryModal() {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '添加分类';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>分类标识（英文，只能包含字母、数字和下划线）</label>
      <input type="text" id="category-name" class="form-control" placeholder="例如: popular, sleep">
    </div>
    <div class="form-group">
      <label>显示名称</label>
      <input type="text" id="category-display" class="form-control" placeholder="例如: 热门动物, 睡前疗愈馆">
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="category-sort" class="form-control" value="0" placeholder="数字越小越靠前">
    </div>
  `;
  modal.setAttribute('data-type', 'addCategory');
  modal.classList.add('active');
}

async function editCategory(id) {
  const cat = categoriesData.find(c => c.id === id);
  if (!cat) return;

  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '编辑分类';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>分类标识</label>
      <input type="text" class="form-control" value="${escapeHtml(cat.name)}" disabled>
      <small>分类标识不可修改</small>
    </div>
    <div class="form-group">
      <label>显示名称</label>
      <input type="text" id="category-display" class="form-control" value="${escapeHtml(cat.display_name)}">
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="category-sort" class="form-control" value="${cat.sort_order || 0}">
    </div>
    <div class="form-group">
      <label>状态</label>
      <select id="category-active" class="form-control">
        <option value="1" ${cat.is_active ? 'selected' : ''}>启用</option>
        <option value="0" ${!cat.is_active ? 'selected' : ''}>禁用</option>
      </select>
    </div>
  `;
  modal.setAttribute('data-type', 'editCategory');
  modal.setAttribute('data-id', id);
  modal.classList.add('active');
}

async function deleteCategory(id) {
  const cat = categoriesData.find(c => c.id === id);
  if (!cat) return;

  if (!confirm(`确定要删除分类 "${cat.display_name}" 吗？`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('分类删除成功');
      loadCategories();
    } else {
      const error = await response.json();
      showToast(error.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('删除分类失败:', error);
    showToast('删除失败', 'error');
  }
}

// ========== 声音类型管理 ==========
async function loadAnimalTypes() {
  console.log('加载声音类型...');
  const tbody = document.querySelector('#animal-types-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="loading">加载中...</td></tr>';

  // 加载分类选项
  await loadCategoryOptions('filter-category');

  const categoryFilter = document.getElementById('filter-category')?.value || '';

  try {
    const [typeRes, catRes] = await Promise.all([
      fetch(`${API_BASE_URL}/sound/admin/animal-types`),
      fetch(`${API_BASE_URL}/sound/admin/categories`)
    ]);

    const typeData = await typeRes.json();
    const catData = await catRes.json();

    console.log('类型数据:', typeData);
    console.log('分类数据:', catData);

    typesData = typeData.data || [];
    categoriesData = catData.data || [];

    // 创建分类名称映射
    const catMap = {};
    categoriesData.forEach(c => catMap[c.name] = c.display_name);

    // 筛选
    let filteredTypes = typesData;
    if (categoryFilter) {
      filteredTypes = typesData.filter(t => t.category === categoryFilter);
    }

    if (filteredTypes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">暂无类型数据</td></tr>';
      return;
    }

    tbody.innerHTML = filteredTypes.map(type => `
      <tr>
        <td>${type.id}</td>
        <td><code>${escapeHtml(type.type)}</code></td>
        <td>${escapeHtml(type.name)}</td>
        <td><span style="font-size: 20px;">${escapeHtml(type.icon) || '🐾'}</span></td>
        <td>${escapeHtml(catMap[type.category] || type.category)}</td>
        <td>${type.sort_order || 0}</td>
        <td>${type.is_active ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-danger">禁用</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-primary" onclick="editAnimalType(${type.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteAnimalType(${type.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载类型失败:', error);
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">加载失败</td></tr>';
  }
}

function showAddAnimalTypeModal() {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '添加声音类型';

  const categories = categoriesData;

  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>类型标识（英文）</label>
      <input type="text" id="type-id" class="form-control" placeholder="例如: cat, dog, rain">
    </div>
    <div class="form-group">
      <label>显示名称</label>
      <input type="text" id="type-name" class="form-control" placeholder="例如: 猫咪, 雨声">
    </div>
    <div class="form-group">
      <label>图标（Emoji）</label>
      <input type="text" id="type-icon" class="form-control" placeholder="例如: 🐱, 🌧️">
    </div>
    <div class="form-group">
      <label>所属分类</label>
      <select id="type-category" class="form-control">
        ${categories.map(c => `<option value="${c.name}">${escapeHtml(c.display_name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="type-sort" class="form-control" value="0">
    </div>
  `;
  modal.setAttribute('data-type', 'addAnimalType');
  modal.classList.add('active');
}

async function editAnimalType(id) {
  const type = typesData.find(t => t.id === id);
  if (!type) return;

  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '编辑声音类型';

  const categories = categoriesData;

  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>类型标识</label>
      <input type="text" class="form-control" value="${escapeHtml(type.type)}" disabled>
      <small>类型标识不可修改</small>
    </div>
    <div class="form-group">
      <label>显示名称</label>
      <input type="text" id="type-name" class="form-control" value="${escapeHtml(type.name)}">
    </div>
    <div class="form-group">
      <label>图标（Emoji）</label>
      <input type="text" id="type-icon" class="form-control" value="${escapeHtml(type.icon) || ''}">
    </div>
    <div class="form-group">
      <label>所属分类</label>
      <select id="type-category" class="form-control">
        ${categories.map(c => `<option value="${c.name}" ${c.name === type.category ? 'selected' : ''}>${escapeHtml(c.display_name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="type-sort" class="form-control" value="${type.sort_order || 0}">
    </div>
    <div class="form-group">
      <label>状态</label>
      <select id="type-active" class="form-control">
        <option value="1" ${type.is_active ? 'selected' : ''}>启用</option>
        <option value="0" ${!type.is_active ? 'selected' : ''}>禁用</option>
      </select>
    </div>
  `;
  modal.setAttribute('data-type', 'editAnimalType');
  modal.setAttribute('data-id', id);
  modal.classList.add('active');
}

async function deleteAnimalType(id) {
  const type = typesData.find(t => t.id === id);
  if (!type) return;

  if (!confirm(`确定要删除声音类型 "${type.name}" 吗？`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/animal-types/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('声音类型删除成功');
      loadAnimalTypes();
    } else {
      const error = await response.json();
      showToast(error.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('删除声音类型失败:', error);
    showToast('删除失败', 'error');
  }
}

// ========== 系统声音管理 ==========
async function loadSystemSounds() {
  console.log('加载系统声音...');
  const tbody = document.querySelector('#system-sounds-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" class="loading">加载中...</td></tr>';

  // 加载筛选器选项
  await loadCategoryOptions('filter-sound-category');

  const categoryFilter = document.getElementById('filter-sound-category')?.value || '';
  const typeFilter = document.getElementById('filter-sound-type')?.value || '';

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/system-sounds`);
    const data = await response.json();
    console.log('系统声音数据:', data);
    systemSoundsData = data.data || [];

    // 筛选
    let filteredSounds = systemSoundsData;
    if (typeFilter) {
      filteredSounds = systemSoundsData.filter(s => s.type_id == typeFilter);
    } else if (categoryFilter) {
      const typeIds = typesData
        .filter(t => t.category === categoryFilter)
        .map(t => t.id);
      filteredSounds = systemSoundsData.filter(s => typeIds.includes(s.type_id));
    }

    if (filteredSounds.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无系统声音</td></tr>';
      return;
    }

    tbody.innerHTML = filteredSounds.map(sound => `
      <tr>
        <td>${sound.id}</td>
        <td>
          <audio controls style="width: 120px; height: 30px;">
            <source src="${sound.sound_url}" type="audio/mpeg">
          </audio>
        </td>
        <td>${escapeHtml(sound.type_name || '-')}</td>
        <td>${escapeHtml(sound.emotion)}</td>
        <td>${formatDuration(sound.duration)}</td>
        <td>${escapeHtml(sound.description) || '-'}</td>
        <td>${sound.is_active ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-danger">禁用</span>'}</td>
        <td>${formatDate(sound.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-primary" onclick="editSystemSound(${sound.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteSystemSound(${sound.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载系统声音失败:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败</td></tr>';
  }
}

async function showAddSystemSoundModal() {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '上传系统声音';

  const categories = categoriesData.length > 0 ? categoriesData : await fetchCategories();

  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>选择分类</label>
      <select id="system-sound-category" class="form-control" onchange="updateTypeSelect()">
        <option value="">请选择分类</option>
        ${categories.map(c => `<option value="${c.name}">${escapeHtml(c.display_name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>选择类型</label>
      <select id="system-sound-type" class="form-control">
        <option value="">请先选择分类</option>
      </select>
    </div>
    <div class="form-group">
      <label>情绪/场景</label>
      <input type="text" id="system-sound-emotion" class="form-control" placeholder="例如: 开心, 放松, 睡眠">
    </div>
    <div class="form-group">
      <label>声音文件</label>
      <input type="file" id="system-sound-file" class="form-control" accept="audio/*">
    </div>
    <div class="form-group">
      <label>时长（秒）</label>
      <input type="number" id="system-sound-duration" class="form-control" placeholder="自动检测或手动输入">
    </div>
    <div class="form-group">
      <label>描述</label>
      <textarea id="system-sound-description" class="form-control" rows="3"></textarea>
    </div>
  `;
  modal.setAttribute('data-type', 'addSystemSound');
  modal.classList.add('active');
}

async function updateTypeSelect() {
  const categoryName = document.getElementById('system-sound-category')?.value;
  const typeSelect = document.getElementById('system-sound-type');

  if (!categoryName || !typeSelect) {
    if (typeSelect) typeSelect.innerHTML = '<option value="">请先选择分类</option>';
    return;
  }

  const types = await fetchTypesByCategory(categoryName);
  typeSelect.innerHTML = '<option value="">请选择类型</option>' +
    types.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
}

async function editSystemSound(id) {
  const sound = systemSoundsData.find(s => s.id === id);
  if (!sound) return;

  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '编辑系统声音';

  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>情绪/场景</label>
      <input type="text" id="system-sound-emotion" class="form-control" value="${escapeHtml(sound.emotion)}">
    </div>
    <div class="form-group">
      <label>描述</label>
      <textarea id="system-sound-description" class="form-control" rows="3">${escapeHtml(sound.description) || ''}</textarea>
    </div>
    <div class="form-group">
      <label>状态</label>
      <select id="system-sound-active" class="form-control">
        <option value="1" ${sound.is_active ? 'selected' : ''}>启用</option>
        <option value="0" ${!sound.is_active ? 'selected' : ''}>禁用</option>
      </select>
    </div>
  `;
  modal.setAttribute('data-type', 'editSystemSound');
  modal.setAttribute('data-id', id);
  modal.classList.add('active');
}

async function deleteSystemSound(id) {
  if (!confirm('确定要删除这个系统声音吗？')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/system-sounds/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('系统声音删除成功');
      loadSystemSounds();
    } else {
      const error = await response.json();
      showToast(error.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('删除系统声音失败:', error);
    showToast('删除失败', 'error');
  }
}

// ========== 用户声音管理 ==========
async function loadUserSounds() {
  console.log('加载用户声音...');
  const tbody = document.querySelector('#user-sounds-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" class="loading">加载中...</td></tr>';

  const statusFilter = document.getElementById('filter-user-sound-status')?.value || '';

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/user-sounds`);
    const data = await response.json();
    console.log('用户声音数据:', data);
    userSoundsData = data.data || [];

    // 筛选
    let filteredSounds = userSoundsData;
    if (statusFilter) {
      filteredSounds = userSoundsData.filter(s => s.review_status === statusFilter);
    }

    if (filteredSounds.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无用户声音</td></tr>';
      return;
    }

    tbody.innerHTML = filteredSounds.map(sound => `
      <tr>
        <td>${sound.id}</td>
        <td>
          <audio controls style="width: 120px; height: 30px;">
            <source src="${sound.sound_url}" type="audio/mpeg">
          </audio>
        </td>
        <td>${escapeHtml(sound.username)}</td>
        <td>${escapeHtml(sound.animal_type)}</td>
        <td>${escapeHtml(sound.emotion)}</td>
        <td>${formatDuration(sound.duration)}</td>
        <td>${getReviewStatusBadge(sound.review_status)}</td>
        <td>${formatDate(sound.created_at)}</td>
        <td>
          <div class="table-actions">
            ${sound.review_status === 'pending' ? `
              <button class="btn btn-sm btn-success" onclick="reviewSound(${sound.id}, 'approved')">通过</button>
              <button class="btn btn-sm btn-danger" onclick="reviewSound(${sound.id}, 'rejected')">拒绝</button>
            ` : ''}
            <button class="btn btn-sm btn-danger" onclick="deleteUserSound(${sound.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载用户声音失败:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败</td></tr>';
  }
}

function refreshUserSounds() {
  loadUserSounds();
  showToast('数据已刷新');
}

async function reviewSound(id, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/user-sounds/${id}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (response.ok) {
      showToast(status === 'approved' ? '已通过审核' : '已拒绝');
      loadUserSounds();
    } else {
      const error = await response.json();
      showToast(error.error || '操作失败', 'error');
    }
  } catch (error) {
    console.error('审核失败:', error);
    showToast('操作失败', 'error');
  }
}

async function deleteUserSound(id) {
  if (!confirm('确定要删除这个用户声音吗？')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/user-sounds/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('删除成功');
      loadUserSounds();
    } else {
      const error = await response.json();
      showToast(error.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('删除失败:', error);
    showToast('删除失败', 'error');
  }
}

// ========== 用户管理 ==========
async function loadUsers() {
  console.log('加载用户...');
  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users`);
    const data = await response.json();
    console.log('用户数据:', data);
    const users = data.users || [];

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无用户</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.id}</td>
        <td><img src="${user.avatar || getDefaultAvatar(user.username)}" alt="" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"></td>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${user.posts_count || 0}</td>
        <td>${user.sounds_count || 0}</td>
        <td>${user.comments_count || 0}</td>
        <td>${formatDate(user.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载用户失败:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败</td></tr>';
  }
}

function searchUsers() {
  const keyword = document.getElementById('search-user')?.value?.trim();
  if (!keyword) {
    loadUsers();
    return;
  }
  // 简化处理：重新加载后前端筛选
  loadUsers().then(() => {
    const tbody = document.querySelector('#users-table tbody');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(keyword.toLowerCase()) ? '' : 'none';
    });
  });
}

async function deleteUser(id) {
  if (!confirm('确定要删除这个用户吗？此操作不可恢复！')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/users/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('用户删除成功');
      loadUsers();
    } else {
      const error = await response.json();
      showToast(error.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('删除用户失败:', error);
    showToast('删除失败', 'error');
  }
}

// ========== 帖子管理 ==========
async function loadPosts() {
  console.log('加载帖子...');
  const tbody = document.querySelector('#posts-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/admin/posts`);
    const data = await response.json();
    console.log('帖子数据:', data);
    const posts = data.posts || [];

    if (posts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">暂无帖子</td></tr>';
      return;
    }

    tbody.innerHTML = posts.map(post => `
      <tr>
        <td>${post.id}</td>
        <td>${escapeHtml(post.username)}</td>
        <td>${escapeHtml(post.content?.substring(0, 50))}${post.content?.length > 50 ? '...' : ''}</td>
        <td>${post.image_url ? `<i class="fas fa-image" title="有图片"></i>` : '-'}</td>
        <td>${post.like_count || 0}</td>
        <td>${post.comment_count || 0}</td>
        <td>${formatDate(post.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-danger" onclick="deletePost(${post.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载帖子失败:', error);
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">加载失败</td></tr>';
  }
}

function searchPosts() {
  const keyword = document.getElementById('search-post')?.value?.trim();
  if (!keyword) {
    loadPosts();
    return;
  }
  loadPosts().then(() => {
    const tbody = document.querySelector('#posts-table tbody');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(keyword.toLowerCase()) ? '' : 'none';
    });
  });
}

async function deletePost(id) {
  if (!confirm('确定要删除这个帖子吗？')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/posts/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('帖子删除成功');
      loadPosts();
    } else {
      const error = await response.json();
      showToast(error.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('删除帖子失败:', error);
    showToast('删除失败', 'error');
  }
}

// ========== 轮播图管理 ==========
async function loadBanners() {
  console.log('加载轮播图...');
  const tbody = document.querySelector('#banners-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/banner/admin/list`);
    const data = await response.json();
    console.log('轮播图数据:', data);
    const banners = data.banners || [];

    if (banners.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">暂无轮播图</td></tr>';
      return;
    }

    tbody.innerHTML = banners.map(banner => {
      const fullImageUrl = banner.image_url.startsWith('http') ? banner.image_url : `${window.location.origin}${banner.image_url}`;
      return `
      <tr>
        <td>${banner.id}</td>
        <td><img src="${fullImageUrl}" alt="" class="img-preview" onerror="this.src='${getDefaultAvatar('Banner')}'"></td>
        <td>${escapeHtml(banner.title) || '-'}</td>
        <td>${banner.link_url ? `<a href="${banner.link_url}" target="_blank">${escapeHtml(banner.link_url.substring(0, 30))}...</a>` : '-'}</td>
        <td>${banner.sort_order || 0}</td>
        <td>${banner.is_active ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-danger">禁用</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-primary" onclick="editBanner(${banner.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteBanner(${banner.id})">删除</button>
          </div>
        </td>
      </tr>
    `}).join('');
  } catch (error) {
    console.error('加载轮播图失败:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="empty-state">加载失败</td></tr>';
  }
}

function showAddBannerModal() {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '添加轮播图';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>图片</label>
      <input type="file" id="banner-image" class="form-control" accept="image/*">
    </div>
    <div class="form-group">
      <label>标题（左下角文字）</label>
      <input type="text" id="banner-title" class="form-control" placeholder="例如: 热门推荐">
    </div>
    <div class="form-group">
      <label>链接</label>
      <input type="text" id="banner-link" class="form-control" placeholder="例如: https://...">
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="banner-sort" class="form-control" value="0">
    </div>
  `;
  modal.setAttribute('data-type', 'addBanner');
  modal.classList.add('active');
}

async function editBanner(id) {
  // 简化处理，实际应该获取详情
  showToast('编辑功能开发中...');
}

async function deleteBanner(id) {
  if (!confirm('确定要删除这个轮播图吗？')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/banner/admin/delete/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('轮播图删除成功');
      loadBanners();
    } else {
      const error = await response.json();
      showToast(error.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('删除轮播图失败:', error);
    showToast('删除失败', 'error');
  }
}

// ========== 推送通知管理 ==========
async function loadNotifications() {
  console.log('加载通知...');
  const tbody = document.querySelector('#notifications-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/admin/notification`);
    const data = await response.json();
    console.log('通知数据:', data);
    const notifications = data.notifications || [];

    if (notifications.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">暂无通知</td></tr>';
      return;
    }

    tbody.innerHTML = notifications.map(n => `
      <tr>
        <td>${n.id}</td>
        <td>${escapeHtml(n.title)}</td>
        <td>${escapeHtml(n.content?.substring(0, 30))}${n.content?.length > 30 ? '...' : ''}</td>
        <td>${escapeHtml(n.type)}</td>
        <td><span class="badge badge-info">${n.status || 'unknown'}</span></td>
        <td>${formatDate(n.created_at)}</td>
        <td>${n.expire_at ? formatDate(n.expire_at) : '-'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-sm btn-danger" onclick="deleteNotification(${n.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载通知失败:', error);
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">加载失败</td></tr>';
  }
}

function showAddNotificationModal() {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '发送通知';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>标题</label>
      <input type="text" id="notification-title" class="form-control" placeholder="通知标题">
    </div>
    <div class="form-group">
      <label>内容</label>
      <textarea id="notification-content" class="form-control" rows="4" placeholder="通知内容"></textarea>
    </div>
    <div class="form-group">
      <label>类型</label>
      <select id="notification-type" class="form-control">
        <option value="info">信息</option>
        <option value="warning">警告</option>
        <option value="update">更新</option>
      </select>
    </div>
  `;
  modal.setAttribute('data-type', 'addNotification');
  modal.classList.add('active');
}

async function deleteNotification(id) {
  if (!confirm('确定要删除这个通知吗？')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/notification/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('通知删除成功');
      loadNotifications();
    } else {
      const error = await response.json();
      showToast(error.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('删除通知失败:', error);
    showToast('删除失败', 'error');
  }
}

// ========== 模态框 ==========
function initModal() {
  const modal = document.getElementById('modal');

  if (!modal) return;

  // 点击模态框外部关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.classList.remove('active');
    modal.removeAttribute('data-type');
    modal.removeAttribute('data-id');
  }
}

function confirmModal() {
  const modal = document.getElementById('modal');
  const type = modal.getAttribute('data-type');

  switch(type) {
    case 'addCategory':
      saveCategory();
      break;
    case 'editCategory':
      updateCategory();
      break;
    case 'addAnimalType':
      saveAnimalType();
      break;
    case 'editAnimalType':
      updateAnimalType();
      break;
    case 'addSystemSound':
      saveSystemSound();
      break;
    case 'editSystemSound':
      updateSystemSound();
      break;
    case 'addBanner':
      saveBanner();
      break;
    case 'addNotification':
      saveNotification();
      break;
  }
}

// ========== 保存操作 ==========
async function saveCategory() {
  const name = document.getElementById('category-name')?.value.trim();
  const display_name = document.getElementById('category-display')?.value.trim();
  const sort_order = parseInt(document.getElementById('category-sort')?.value || '0');

  if (!name || !display_name) {
    showToast('请填写完整信息', 'error');
    return;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    showToast('分类标识只能包含字母、数字和下划线', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, display_name, sort_order })
    });

    if (response.ok) {
      showToast('分类添加成功');
      closeModal();
      loadCategories();
    } else {
      const error = await response.json();
      showToast(error.error || '添加失败', 'error');
    }
  } catch (error) {
    console.error('添加分类失败:', error);
    showToast('添加失败', 'error');
  }
}

async function updateCategory() {
  const id = document.getElementById('modal').getAttribute('data-id');
  const display_name = document.getElementById('category-display')?.value.trim();
  const sort_order = parseInt(document.getElementById('category-sort')?.value || '0');
  const is_active = parseInt(document.getElementById('category-active')?.value || '1');

  if (!display_name) {
    showToast('请填写显示名称', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name, sort_order, is_active })
    });

    if (response.ok) {
      showToast('分类更新成功');
      closeModal();
      loadCategories();
    } else {
      const error = await response.json();
      showToast(error.error || '更新失败', 'error');
    }
  } catch (error) {
    console.error('更新分类失败:', error);
    showToast('更新失败', 'error');
  }
}

async function saveAnimalType() {
  const type = document.getElementById('type-id')?.value.trim();
  const name = document.getElementById('type-name')?.value.trim();
  const icon = document.getElementById('type-icon')?.value.trim();
  const category = document.getElementById('type-category')?.value;
  const sort_order = parseInt(document.getElementById('type-sort')?.value || '0');

  if (!type || !name || !category) {
    showToast('请填写完整信息', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/animal-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name, icon, category, sort_order })
    });

    if (response.ok) {
      showToast('声音类型添加成功');
      closeModal();
      loadAnimalTypes();
    } else {
      const error = await response.json();
      showToast(error.error || '添加失败', 'error');
    }
  } catch (error) {
    console.error('添加声音类型失败:', error);
    showToast('添加失败', 'error');
  }
}

async function updateAnimalType() {
  const id = document.getElementById('modal').getAttribute('data-id');
  const name = document.getElementById('type-name')?.value.trim();
  const icon = document.getElementById('type-icon')?.value.trim();
  const category = document.getElementById('type-category')?.value;
  const sort_order = parseInt(document.getElementById('type-sort')?.value || '0');
  const is_active = parseInt(document.getElementById('type-active')?.value || '1');

  if (!name || !category) {
    showToast('请填写完整信息', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/animal-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon, category, sort_order, is_active })
    });

    if (response.ok) {
      showToast('声音类型更新成功');
      closeModal();
      loadAnimalTypes();
    } else {
      const error = await response.json();
      showToast(error.error || '更新失败', 'error');
    }
  } catch (error) {
    console.error('更新声音类型失败:', error);
    showToast('更新失败', 'error');
  }
}

async function saveSystemSound() {
  const type_id = document.getElementById('system-sound-type')?.value;
  const emotion = document.getElementById('system-sound-emotion')?.value.trim();
  const soundFile = document.getElementById('system-sound-file')?.files[0];
  const duration = parseInt(document.getElementById('system-sound-duration')?.value || '0');
  const description = document.getElementById('system-sound-description')?.value.trim();

  if (!type_id || !emotion || !soundFile) {
    showToast('请填写完整信息并选择文件', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('sound', soundFile);
  formData.append('type_id', type_id);
  formData.append('emotion', emotion);
  formData.append('duration', duration);
  formData.append('description', description);

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/system-sounds`, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      showToast('系统声音上传成功');
      closeModal();
      loadSystemSounds();
    } else {
      const error = await response.json();
      showToast(error.error || '上传失败', 'error');
    }
  } catch (error) {
    console.error('上传系统声音失败:', error);
    showToast('上传失败', 'error');
  }
}

async function updateSystemSound() {
  const id = document.getElementById('modal').getAttribute('data-id');
  const emotion = document.getElementById('system-sound-emotion')?.value.trim();
  const description = document.getElementById('system-sound-description')?.value.trim();
  const is_active = parseInt(document.getElementById('system-sound-active')?.value || '1');

  if (!emotion) {
    showToast('请填写情绪/场景', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/system-sounds/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emotion, description, is_active })
    });

    if (response.ok) {
      showToast('系统声音更新成功');
      closeModal();
      loadSystemSounds();
    } else {
      const error = await response.json();
      showToast(error.error || '更新失败', 'error');
    }
  } catch (error) {
    console.error('更新系统声音失败:', error);
    showToast('更新失败', 'error');
  }
}

async function saveBanner() {
  const imageFile = document.getElementById('banner-image')?.files[0];
  const title = document.getElementById('banner-title')?.value.trim();
  const link_url = document.getElementById('banner-link')?.value.trim();
  const sort_order = parseInt(document.getElementById('banner-sort')?.value || '0');

  if (!imageFile) {
    showToast('请选择图片', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('title', title);
  formData.append('link_url', link_url);
  formData.append('sort_order', sort_order);

  try {
    const response = await fetch(`${API_BASE_URL}/banner/admin/create`, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      showToast('轮播图添加成功');
      closeModal();
      loadBanners();
    } else {
      const error = await response.json();
      showToast(error.error || '添加失败', 'error');
    }
  } catch (error) {
    console.error('添加轮播图失败:', error);
    showToast('添加失败', 'error');
  }
}

async function saveNotification() {
  const title = document.getElementById('notification-title')?.value.trim();
  const content = document.getElementById('notification-content')?.value.trim();
  const type = document.getElementById('notification-type')?.value;

  if (!title || !content) {
    showToast('请填写完整信息', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, type })
    });

    if (response.ok) {
      showToast('通知发送成功');
      closeModal();
      loadNotifications();
    } else {
      const error = await response.json();
      showToast(error.error || '发送失败', 'error');
    }
  } catch (error) {
    console.error('发送通知失败:', error);
    showToast('发送失败', 'error');
  }
}

// ========== 辅助函数 ==========
async function fetchCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories`);
    const data = await response.json();
    categoriesData = data.data || [];
    return categoriesData;
  } catch (error) {
    console.error('获取分类失败:', error);
    return [];
  }
}

async function fetchTypesByCategory(categoryName) {
  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/animal-types`);
    const data = await response.json();
    const types = data.data || [];
    return types.filter(t => t.category === categoryName);
  } catch (error) {
    console.error('获取类型失败:', error);
    return [];
  }
}

async function loadCategoryOptions(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const currentValue = select.value;

  if (categoriesData.length === 0) {
    await fetchCategories();
  }

  // 保留第一个选项
  const firstOption = select.options[0];
  select.innerHTML = '';
  if (firstOption) select.appendChild(firstOption);

  categoriesData.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.name;
    option.textContent = cat.display_name;
    select.appendChild(option);
  });

  select.value = currentValue;
}

async function updateTypeFilter(prefix) {
  const categorySelect = document.getElementById(`${prefix}-category`);
  const typeSelect = document.getElementById(`${prefix}-type`);

  if (!categorySelect || !typeSelect) return;

  const categoryName = categorySelect.value;

  if (categoryName) {
    const types = await fetchTypesByCategory(categoryName);
    typeSelect.innerHTML = '<option value="">所有类型</option>' +
      types.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
  } else {
    typeSelect.innerHTML = '<option value="">所有类型</option>';
  }
}

function getReviewStatusBadge(status) {
  const badges = {
    'none': '<span class="badge badge-secondary">未提交</span>',
    'pending': '<span class="badge badge-warning">待审核</span>',
    'approved': '<span class="badge badge-success">已通过</span>',
    'rejected': '<span class="badge badge-danger">已拒绝</span>'
  };
  return badges[status] || status;
}

function formatDuration(seconds) {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 生成默认头像URL
function getDefaultAvatar(name) {
  if (!name) name = 'User';
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF69B4&color=fff&size=60`;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;

  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
  toast.className = `toast ${type}`;
  toast.style.display = 'flex';

  // 使用CSS动画
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }, 3000);
}
