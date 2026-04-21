// API基础URL
const API_BASE_URL = 'http://106.14.248.12:3000/api';

// 全局数据缓存
let categoriesData = [];
let typesData = [];
let systemSoundsData = [];
let userSoundsData = [];

// 检查登录状态
function checkAuth() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    // 未登录，跳转到登录页
    window.location.href = '/admin/login.html';
    return false;
  }
  return true;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 先检查权限
  if (!checkAuth()) return;
  
  initNavigation();
  initModal();
  initEventListeners();
  loadDashboard();
});

// ========== 导航 ==========
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('.content-section');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = link.getAttribute('data-section');

      // 更新导航状态
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      // 显示对应section
      sections.forEach(s => s.classList.remove('active'));
      document.getElementById(targetSection).classList.add('active');

      // 加载数据
      loadSectionData(targetSection);
    });
  });
}

// 根据section加载数据
function loadSectionData(section) {
  // 确保对应的section存在且是激活状态
  const sectionEl = document.getElementById(section);
  if (!sectionEl || !sectionEl.classList.contains('active')) {
    return;
  }

  switch(section) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'categories':
      loadCategories();
      break;
    case 'types':
      loadTypes();
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
    case 'push':
      loadNotifications();
      break;
  }
}

// ========== 事件监听 ==========
function initEventListeners() {
  // 刷新按钮
  document.getElementById('refresh-btn')?.addEventListener('click', () => {
    const activeSection = document.querySelector('.content-section.active')?.id;
    if (activeSection) loadSectionData(activeSection);
  });

  // 大类管理
  document.getElementById('add-category-btn')?.addEventListener('click', showAddCategoryModal);

  // 类型管理页面内的大类标签管理
  document.getElementById('add-category-btn')?.addEventListener('click', showAddTypesCategoryModal);

  // 类型管理页面内的小类标签管理
  document.getElementById('add-type-btn')?.addEventListener('click', showAddTypeModal);
  document.getElementById('type-category-filter')?.addEventListener('change', loadTypesAnimalTypes);

  // 系统声音管理
  document.getElementById('add-system-sound-btn')?.addEventListener('click', showAddSystemSoundModal);
  document.getElementById('system-sound-category-filter')?.addEventListener('change', () => {
    updateTypeFilter('system-sound');
    loadSystemSounds();
  });
  document.getElementById('system-sound-type-filter')?.addEventListener('change', loadSystemSounds);

  // 用户声音管理
  document.getElementById('user-sound-status-filter')?.addEventListener('change', loadUserSounds);

  // 推送管理
  document.getElementById('add-notification-btn')?.addEventListener('click', showAddNotificationModal);
}

// ========== 数据概览 ==========
async function loadDashboard() {
  // 检查概览页面元素是否存在
  const statCategories = document.getElementById('stat-categories');
  if (!statCategories) {
    console.log('概览页面元素不存在，跳过加载');
    return;
  }

  try {
    // 获取大类数量
    const catRes = await fetch(`${API_BASE_URL}/sound/admin/categories`);
    const catData = await catRes.json();
    const statCategories = document.getElementById('stat-categories');
    if (statCategories) statCategories.textContent = catData.data?.length || 0;

    // 获取类型数量
    const typeRes = await fetch(`${API_BASE_URL}/sound/admin/animal-types`);
    const typeData = await typeRes.json();
    const statTypes = document.getElementById('stat-types');
    if (statTypes) statTypes.textContent = typeData.data?.length || 0;

    // 获取系统声音数量
    const sysSoundRes = await fetch(`${API_BASE_URL}/sound/admin/system-sounds`);
    const sysSoundData = await sysSoundRes.json();
    const statSystemSounds = document.getElementById('stat-system-sounds');
    if (statSystemSounds) statSystemSounds.textContent = sysSoundData.data?.length || 0;

    // 获取用户声音数量
    const userSoundRes = await fetch(`${API_BASE_URL}/sound/admin/user-sounds`);
    const userSoundData = await userSoundRes.json();
    const statUserSounds = document.getElementById('stat-user-sounds');
    if (statUserSounds) statUserSounds.textContent = userSoundData.data?.length || 0;

    // 获取用户数量
    const userRes = await fetch(`${API_BASE_URL}/social/users`);
    const userData = await userRes.json();
    const statUsers = document.getElementById('stat-users');
    if (statUsers) statUsers.textContent = userData.users?.length || 0;

    // 获取帖子数量
    const postRes = await fetch(`${API_BASE_URL}/post/list`);
    const postData = await postRes.json();
    const statPosts = document.getElementById('stat-posts');
    if (statPosts) statPosts.textContent = postData.posts?.length || 0;
  } catch (error) {
    console.error('加载概览数据失败:', error);
  }
}

// ========== 大类管理 ==========
async function loadCategories() {
  // 确保categories section是激活状态
  const categoriesSection = document.getElementById('categories');
  if (!categoriesSection || !categoriesSection.classList.contains('active')) {
    return;
  }

  const tbody = document.querySelector('#categories-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="loading">加载中...</td></tr>';

  try {
    const [catRes, typeRes] = await Promise.all([
      fetch(`${API_BASE_URL}/sound/admin/categories`),
      fetch(`${API_BASE_URL}/sound/admin/animal-types`)
    ]);

    const catData = await catRes.json();
    const typeData = await typeRes.json();

    categoriesData = catData.data || [];
    const types = typeData.data || [];

    // 统计每个大类的类型数量
    const typeCounts = {};
    types.forEach(t => {
      const cat = t.category || 'other';
      typeCounts[cat] = (typeCounts[cat] || 0) + 1;
    });

    if (categoriesData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无大类数据</td></tr>';
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
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editCategory(${cat.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteCategory(${cat.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载大类失败:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">加载失败</td></tr>';
  }
}

function showAddCategoryModal() {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '添加大类';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>大类标识（英文，只能包含字母、数字和下划线）</label>
      <input type="text" id="category-name" placeholder="例如: popular, sleep">
    </div>
    <div class="form-group">
      <label>显示名称</label>
      <input type="text" id="category-display" placeholder="例如: 热门动物, 睡前疗愈馆">
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="category-sort" value="0" placeholder="数字越小越靠前">
    </div>
  `;
  modal.setAttribute('data-type', 'addCategory');
  modal.classList.add('active');
}

async function editCategory(id) {
  const cat = categoriesData.find(c => c.id === id);
  if (!cat) return;

  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '编辑大类';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>大类标识</label>
      <input type="text" value="${escapeHtml(cat.name)}" disabled>
      <small>大类标识不可修改</small>
    </div>
    <div class="form-group">
      <label>显示名称</label>
      <input type="text" id="category-display" value="${escapeHtml(cat.display_name)}">
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="category-sort" value="${cat.sort_order || 0}">
    </div>
    <div class="form-group">
      <label>状态</label>
      <select id="category-active">
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

  if (!confirm(`确定要删除大类 "${cat.display_name}" 吗？\n该大类下的类型将被移动到"其他动物"。`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('大类删除成功');
      loadCategories();
    } else {
      const error = await response.json();
      showToast(error.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('删除大类失败:', error);
    showToast('删除失败', 'error');
  }
}

// ========== 类型管理 ==========
async function loadTypes() {
  // 确保types section是激活状态
  const typesSection = document.getElementById('types');
  if (!typesSection || !typesSection.classList.contains('active')) {
    return;
  }

  // 加载大类标签
  await loadTypesCategories();

  // 加载小类标签
  await loadTypesAnimalTypes();
}

// 加载大类标签（类型管理页面内）
async function loadTypesCategories() {
  const tbody = document.querySelector('#types-categories-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories`);
    const data = await response.json();
    categoriesData = data.data || [];

    if (categoriesData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无大类数据</td></tr>';
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
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editTypesCategory(${cat.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteTypesCategory(${cat.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载大类标签失败:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">加载失败</td></tr>';
  }
}

// 加载小类标签
async function loadTypesAnimalTypes() {
  const tbody = document.querySelector('#types-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="loading">加载中...</td></tr>';

  const categoryFilter = document.getElementById('type-category-filter')?.value || '';

  try {
    // 先加载大类列表到筛选器
    await loadCategoryOptions('type-category-filter');

    const [typeRes, catRes] = await Promise.all([
      fetch(`${API_BASE_URL}/sound/admin/animal-types`),
      fetch(`${API_BASE_URL}/sound/admin/categories`)
    ]);

    const typeData = await typeRes.json();
    const catData = await catRes.json();

    typesData = typeData.data || [];
    categoriesData = catData.data || [];

    // 创建大类名称映射
    const catMap = {};
    categoriesData.forEach(c => catMap[c.name] = c.display_name);

    // 筛选
    let filteredTypes = typesData;
    if (categoryFilter) {
      filteredTypes = typesData.filter(t => t.category === categoryFilter);
    }

    if (filteredTypes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">暂无小类数据</td></tr>';
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
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editType(${type.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteType(${type.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载小类标签失败:', error);
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">加载失败</td></tr>';
  }
}

// 编辑大类标签（类型管理页面）
async function editTypesCategory(id) {
  const cat = categoriesData.find(c => c.id === id);
  if (!cat) return;

  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '编辑大类标签';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>大类标识</label>
      <input type="text" value="${escapeHtml(cat.name)}" disabled>
      <small>大类标识不可修改</small>
    </div>
    <div class="form-group">
      <label>显示名称</label>
      <input type="text" id="category-display" value="${escapeHtml(cat.display_name)}">
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="category-sort" value="${cat.sort_order || 0}">
    </div>
    <div class="form-group">
      <label>状态</label>
      <select id="category-active">
        <option value="1" ${cat.is_active ? 'selected' : ''}>启用</option>
        <option value="0" ${!cat.is_active ? 'selected' : ''}>禁用</option>
      </select>
    </div>
  `;
  modal.setAttribute('data-type', 'editTypesCategory');
  modal.setAttribute('data-id', id);
  modal.classList.add('active');
}

// 删除大类标签（类型管理页面）
async function deleteTypesCategory(id) {
  const cat = categoriesData.find(c => c.id === id);
  if (!cat) return;

  if (!confirm(`确定要删除大类标签 "${cat.display_name}" 吗？\n该大类下的类型将被移动到"其他动物"。`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('大类标签删除成功');
      loadTypesCategories();
      loadTypesAnimalTypes();
    } else {
      const error = await response.json();
      showToast(error.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('删除大类标签失败:', error);
    showToast('删除失败', 'error');
  }
}

// 显示添加大类标签弹窗（类型管理页面）
async function showAddTypesCategoryModal() {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '添加大类标签';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>大类标识（英文，唯一）</label>
      <input type="text" id="category-name" placeholder="例如: popular, sleep">
    </div>
    <div class="form-group">
      <label>显示名称</label>
      <input type="text" id="category-display" placeholder="例如: 热门动物, 睡前疗愈馆">
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="category-sort" value="0">
    </div>
  `;
  modal.setAttribute('data-type', 'addTypesCategory');
  modal.classList.add('active');
}

async function showAddTypeModal() {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '添加类型';

  // 加载大类选项
  const categories = await fetchCategories();

  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>类型标识（英文）</label>
      <input type="text" id="type-id" placeholder="例如: cat, dog, rain">
    </div>
    <div class="form-group">
      <label>显示名称</label>
      <input type="text" id="type-name" placeholder="例如: 猫咪, 雨声">
    </div>
    <div class="form-group">
      <label>图标（Emoji）</label>
      <input type="text" id="type-icon" placeholder="例如: 🐱, 🌧️">
    </div>
    <div class="form-group">
      <label>所属大类</label>
      <select id="type-category">
        ${categories.map(c => `<option value="${c.name}">${escapeHtml(c.display_name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="type-sort" value="0">
    </div>
    <div class="form-group">
      <label>描述</label>
      <textarea id="type-description" rows="3"></textarea>
    </div>
  `;
  modal.setAttribute('data-type', 'addType');
  modal.classList.add('active');
}

async function editType(id) {
  const type = typesData.find(t => t.id === id);
  if (!type) return;

  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '编辑类型';

  const categories = await fetchCategories();

  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>类型标识</label>
      <input type="text" value="${escapeHtml(type.type)}" disabled>
      <small>类型标识不可修改</small>
    </div>
    <div class="form-group">
      <label>显示名称</label>
      <input type="text" id="type-name" value="${escapeHtml(type.name)}">
    </div>
    <div class="form-group">
      <label>图标（Emoji）</label>
      <input type="text" id="type-icon" value="${escapeHtml(type.icon) || ''}">
    </div>
    <div class="form-group">
      <label>所属大类</label>
      <select id="type-category">
        ${categories.map(c => `<option value="${c.name}" ${c.name === type.category ? 'selected' : ''}>${escapeHtml(c.display_name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="type-sort" value="${type.sort_order || 0}">
    </div>
    <div class="form-group">
      <label>状态</label>
      <select id="type-active">
        <option value="1" ${type.is_active ? 'selected' : ''}>启用</option>
        <option value="0" ${!type.is_active ? 'selected' : ''}>禁用</option>
      </select>
    </div>
    <div class="form-group">
      <label>描述</label>
      <textarea id="type-description" rows="3">${escapeHtml(type.description) || ''}</textarea>
    </div>
  `;
  modal.setAttribute('data-type', 'editType');
  modal.setAttribute('data-id', id);
  modal.classList.add('active');
}

async function deleteType(id) {
  const type = typesData.find(t => t.id === id);
  if (!type) return;

  if (!confirm(`确定要删除小类标签 "${type.name}" 吗？`)) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/animal-types/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('小类标签删除成功');
      loadTypesAnimalTypes();
    } else {
      const error = await response.json();
      showToast(error.error || '删除失败', 'error');
    }
  } catch (error) {
    console.error('删除小类标签失败:', error);
    showToast('删除失败', 'error');
  }
}

// ========== 系统声音管理 ==========
async function loadSystemSounds() {
  // 确保system-sounds section是激活状态
  const systemSoundsSection = document.getElementById('system-sounds');
  if (!systemSoundsSection || !systemSoundsSection.classList.contains('active')) {
    return;
  }

  const tbody = document.querySelector('#system-sounds-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="loading">加载中...</td></tr>';

  const categoryFilter = document.getElementById('system-sound-category-filter')?.value || '';
  const typeFilter = document.getElementById('system-sound-type-filter')?.value || '';

  try {
    // 加载筛选器选项
    await loadCategoryOptions('system-sound-category-filter');
    if (categoryFilter) {
      await loadTypeOptions('system-sound-type-filter', categoryFilter);
    }

    const response = await fetch(`${API_BASE_URL}/sound/admin/system-sounds`);
    const data = await response.json();
    systemSoundsData = data.data || [];

    // 筛选
    let filteredSounds = systemSoundsData;
    if (typeFilter) {
      filteredSounds = systemSoundsData.filter(s => s.type_id == typeFilter);
    } else if (categoryFilter) {
      // 获取该大类下的所有类型ID
      const typeIds = typesData
        .filter(t => t.category === categoryFilter)
        .map(t => t.id);
      filteredSounds = systemSoundsData.filter(s => typeIds.includes(s.type_id));
    }

    if (filteredSounds.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">暂无系统声音</td></tr>';
      return;
    }

    tbody.innerHTML = filteredSounds.map(sound => `
      <tr>
        <td>${sound.id}</td>
        <td>${escapeHtml(sound.type_name)}</td>
        <td>${escapeHtml(sound.emotion)}</td>
        <td>
          <audio controls style="width: 150px; height: 30px;">
            <source src="${sound.sound_url}" type="audio/mpeg">
          </audio>
        </td>
        <td>${formatDuration(sound.duration)}</td>
        <td>${escapeHtml(sound.description) || '-'}</td>
        <td>${sound.is_active ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-danger">禁用</span>'}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-primary" onclick="editSystemSound(${sound.id})">编辑</button>
            <button class="btn btn-sm btn-danger" onclick="deleteSystemSound(${sound.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载系统声音失败:', error);
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">加载失败</td></tr>';
  }
}

async function showAddSystemSoundModal() {
  const modal = document.getElementById('modal');
  document.getElementById('modal-title').textContent = '上传系统声音';

  const categories = await fetchCategories();

  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>选择大类</label>
      <select id="system-sound-category" onchange="updateTypeSelect()">
        <option value="">请选择大类</option>
        ${categories.map(c => `<option value="${c.name}">${escapeHtml(c.display_name)}</option>`).join('')}
      </select>
    </div>
    <div class="form-group">
      <label>选择类型</label>
      <select id="system-sound-type">
        <option value="">请先选择大类</option>
      </select>
    </div>
    <div class="form-group">
      <label>情绪/场景</label>
      <input type="text" id="system-sound-emotion" placeholder="例如: 开心, 放松, 睡眠">
    </div>
    <div class="form-group">
      <label>声音文件</label>
      <input type="file" id="system-sound-file" accept="audio/*">
    </div>
    <div class="form-group">
      <label>时长（秒）</label>
      <input type="number" id="system-sound-duration" placeholder="自动检测或手动输入">
    </div>
    <div class="form-group">
      <label>描述</label>
      <textarea id="system-sound-description" rows="3"></textarea>
    </div>
  `;
  modal.setAttribute('data-type', 'addSystemSound');
  modal.classList.add('active');
}

async function updateTypeSelect() {
  const categoryName = document.getElementById('system-sound-category')?.value;
  const typeSelect = document.getElementById('system-sound-type');

  if (!categoryName) {
    typeSelect.innerHTML = '<option value="">请先选择大类</option>';
    return;
  }

  // 获取该大类下的类型
  const types = await fetchTypesByCategory(categoryName);
  typeSelect.innerHTML = types.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
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
  // 确保user-sounds section是激活状态
  const userSoundsSection = document.getElementById('user-sounds');
  if (!userSoundsSection || !userSoundsSection.classList.contains('active')) {
    return;
  }

  const tbody = document.querySelector('#user-sounds-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="loading">加载中...</td></tr>';

  const statusFilter = document.getElementById('user-sound-status-filter')?.value || '';

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/user-sounds`);
    const data = await response.json();
    userSoundsData = data.data || [];

    // 筛选
    let filteredSounds = userSoundsData;
    if (statusFilter) {
      filteredSounds = userSoundsData.filter(s => s.review_status === statusFilter);
    }

    if (filteredSounds.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">暂无用户声音</td></tr>';
      return;
    }

    tbody.innerHTML = filteredSounds.map(sound => `
      <tr>
        <td>${sound.id}</td>
        <td>${escapeHtml(sound.username)}</td>
        <td>${escapeHtml(sound.animal_type)}</td>
        <td>${escapeHtml(sound.emotion)}</td>
        <td>
          <audio controls style="width: 150px; height: 30px;">
            <source src="${sound.sound_url}" type="audio/mpeg">
          </audio>
        </td>
        <td>${formatDuration(sound.duration)}</td>
        <td>${getReviewStatusBadge(sound.review_status)}</td>
        <td>
          <div class="action-buttons">
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
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">加载失败</td></tr>';
  }
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
  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) {
    console.log('用户表格不存在，跳过加载');
    return;
  }
  tbody.innerHTML = '<tr><td colspan="5" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/social/users`);
    const data = await response.json();
    const users = data.users || [];

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-state">暂无用户</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.id}</td>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${formatDate(user.created_at)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-danger" onclick="deleteUser(${user.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载用户失败:', error);
    tbody.innerHTML = '<tr><td colspan="5" class="empty-state">加载失败</td></tr>';
  }
}

async function deleteUser(id) {
  if (!confirm('确定要删除这个用户吗？此操作不可恢复！')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/social/users/${id}`, {
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
  const tbody = document.querySelector('#posts-table tbody');
  if (!tbody) {
    console.log('帖子表格不存在，跳过加载');
    return;
  }
  tbody.innerHTML = '<tr><td colspan="6" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/post/list`);
    const data = await response.json();
    const posts = data.posts || [];

    if (posts.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无帖子</td></tr>';
      return;
    }

    tbody.innerHTML = posts.map(post => `
      <tr>
        <td>${post.id}</td>
        <td>${escapeHtml(post.username)}</td>
        <td>${escapeHtml(post.content?.substring(0, 50))}${post.content?.length > 50 ? '...' : ''}</td>
        <td>${post.sound_id ? '有' : '无'}</td>
        <td>${formatDate(post.created_at)}</td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-sm btn-danger" onclick="deletePost(${post.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载帖子失败:', error);
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">加载失败</td></tr>';
  }
}

async function deletePost(id) {
  if (!confirm('确定要删除这个帖子吗？')) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/post/admin/delete/${id}`, {
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

// ========== 推送管理 ==========
async function loadNotifications() {
  // 确保push section是激活状态
  const pushSection = document.getElementById('push');
  if (!pushSection || !pushSection.classList.contains('active')) {
    return;
  }

  const tbody = document.querySelector('#notifications-table tbody');
  if (!tbody) {
    return;
  }
  tbody.innerHTML = '<tr><td colspan="8" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/admin/notification`);
    const data = await response.json();
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
          <div class="action-buttons">
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
  document.getElementById('modal-title').textContent = '添加通知';
  document.getElementById('modal-body').innerHTML = `
    <div class="form-group">
      <label>标题</label>
      <input type="text" id="notification-title" placeholder="通知标题">
    </div>
    <div class="form-group">
      <label>内容</label>
      <textarea id="notification-content" rows="4" placeholder="通知内容"></textarea>
    </div>
    <div class="form-group">
      <label>类型</label>
      <select id="notification-type">
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
  const saveBtn = document.getElementById('modal-save');

  // 点击模态框外部关闭
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // 保存按钮
  saveBtn.addEventListener('click', () => {
    const type = modal.getAttribute('data-type');
    switch(type) {
      case 'addCategory':
        saveCategory();
        break;
      case 'editCategory':
        updateCategory();
        break;
      case 'addTypesCategory':
        saveTypesCategory();
        break;
      case 'editTypesCategory':
        updateTypesCategory();
        break;
      case 'addType':
        saveType();
        break;
      case 'editType':
        updateType();
        break;
      case 'addSystemSound':
        saveSystemSound();
        break;
      case 'addNotification':
        saveNotification();
        break;
    }
  });
}

function closeModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('active');
  modal.removeAttribute('data-type');
  modal.removeAttribute('data-id');
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
    showToast('大类标识只能包含字母、数字和下划线', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, display_name, sort_order })
    });

    if (response.ok) {
      showToast('大类添加成功');
      closeModal();
      loadCategories();
    } else {
      const error = await response.json();
      showToast(error.error || '添加失败', 'error');
    }
  } catch (error) {
    console.error('添加大类失败:', error);
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
      showToast('大类更新成功');
      closeModal();
      loadCategories();
    } else {
      const error = await response.json();
      showToast(error.error || '更新失败', 'error');
    }
  } catch (error) {
    console.error('更新大类失败:', error);
    showToast('更新失败', 'error');
  }
}

// 类型管理页面：保存大类标签
async function saveTypesCategory() {
  const name = document.getElementById('category-name')?.value.trim();
  const display_name = document.getElementById('category-display')?.value.trim();
  const sort_order = parseInt(document.getElementById('category-sort')?.value || '0');

  if (!name || !display_name) {
    showToast('请填写完整信息', 'error');
    return;
  }

  if (!/^[a-zA-Z0-9_]+$/.test(name)) {
    showToast('大类标识只能包含字母、数字和下划线', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, display_name, sort_order })
    });

    if (response.ok) {
      showToast('大类标签添加成功');
      closeModal();
      loadTypesCategories();
    } else {
      const error = await response.json();
      showToast(error.error || '添加失败', 'error');
    }
  } catch (error) {
    console.error('添加大类标签失败:', error);
    showToast('添加失败', 'error');
  }
}

// 类型管理页面：更新大类标签
async function updateTypesCategory() {
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
      showToast('大类标签更新成功');
      closeModal();
      loadTypesCategories();
    } else {
      const error = await response.json();
      showToast(error.error || '更新失败', 'error');
    }
  } catch (error) {
    console.error('更新大类标签失败:', error);
    showToast('更新失败', 'error');
  }
}

async function saveType() {
  const type = document.getElementById('type-id')?.value.trim();
  const name = document.getElementById('type-name')?.value.trim();
  const icon = document.getElementById('type-icon')?.value.trim();
  const category = document.getElementById('type-category')?.value;
  const sort_order = parseInt(document.getElementById('type-sort')?.value || '0');
  const description = document.getElementById('type-description')?.value.trim();

  if (!type || !name || !category) {
    showToast('请填写完整信息', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/animal-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name, icon, category, sort_order, description })
    });

    if (response.ok) {
      showToast('小类标签添加成功');
      closeModal();
      loadTypesAnimalTypes();
    } else {
      const error = await response.json();
      showToast(error.error || '添加失败', 'error');
    }
  } catch (error) {
    console.error('添加小类标签失败:', error);
    showToast('添加失败', 'error');
  }
}

async function updateType() {
  const id = document.getElementById('modal').getAttribute('data-id');
  const name = document.getElementById('type-name')?.value.trim();
  const icon = document.getElementById('type-icon')?.value.trim();
  const category = document.getElementById('type-category')?.value;
  const sort_order = parseInt(document.getElementById('type-sort')?.value || '0');
  const is_active = parseInt(document.getElementById('type-active')?.value || '1');
  const description = document.getElementById('type-description')?.value.trim();

  if (!name || !category) {
    showToast('请填写完整信息', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/animal-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon, category, sort_order, is_active, description })
    });

    if (response.ok) {
      showToast('小类标签更新成功');
      closeModal();
      loadTypesAnimalTypes();
    } else {
      const error = await response.json();
      showToast(error.error || '更新失败', 'error');
    }
  } catch (error) {
    console.error('更新小类标签失败:', error);
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
      showToast('通知添加成功');
      closeModal();
      loadNotifications();
    } else {
      const error = await response.json();
      showToast(error.error || '添加失败', 'error');
    }
  } catch (error) {
    console.error('添加通知失败:', error);
    showToast('添加失败', 'error');
  }
}

// ========== 辅助函数 ==========
async function fetchCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    console.error('获取大类失败:', error);
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
  const categories = await fetchCategories();

  // 保留第一个选项（通常是"所有大类"）
  const firstOption = select.options[0];
  select.innerHTML = '';
  select.appendChild(firstOption);

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat.name;
    option.textContent = cat.display_name;
    select.appendChild(option);
  });

  select.value = currentValue;
}

async function loadTypeOptions(selectId, categoryName) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const types = await fetchTypesByCategory(categoryName);

  // 保留第一个选项
  const firstOption = select.options[0];
  select.innerHTML = '';
  select.appendChild(firstOption);

  types.forEach(type => {
    const option = document.createElement('option');
    option.value = type.id;
    option.textContent = type.name;
    select.appendChild(option);
  });
}

async function updateTypeFilter(prefix) {
  const categorySelect = document.getElementById(`${prefix}-category-filter`);
  const typeSelect = document.getElementById(`${prefix}-type-filter`);

  if (!categorySelect || !typeSelect) return;

  const categoryName = categorySelect.value;

  if (categoryName) {
    await loadTypeOptions(`${prefix}-type-filter`, categoryName);
  } else {
    // 重置类型筛选器
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

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}
