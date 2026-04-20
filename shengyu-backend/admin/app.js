// API基础URL - 使用相对路径避免CORS问题
const API_BASE_URL = '/api';

// 全局状态
let currentPage = 'dashboard';
let modalCallback = null;
let captchaToken = '';

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  initEventListeners();
  updateTime();
  setInterval(updateTime, 1000);
});

// 检查登录状态
function checkAuth() {
  const token = localStorage.getItem('admin_token');
  if (token) {
    showMainPage();
    loadPage(currentPage);
  } else {
    showLoginPage();
    loadCaptcha();
  }
}

// 显示登录页面
function showLoginPage() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('main-page').classList.add('hidden');
}

// 显示主页面
function showMainPage() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('main-page').classList.remove('hidden');
}

// 初始化事件监听
function initEventListeners() {
  // 登录表单
  document.getElementById('login-form')?.addEventListener('submit', handleLogin);

  // 验证码点击刷新
  document.getElementById('captcha-image')?.addEventListener('click', refreshCaptcha);

  // 退出登录
  document.getElementById('logout-btn')?.addEventListener('click', handleLogout);

  // 侧边栏导航
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const page = item.dataset.page;
      if (page) {
        switchPage(page);
      }
    });
  });

  // 侧边栏切换（移动端）
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('open');
  });

  // 筛选器
  document.getElementById('filter-category')?.addEventListener('change', loadAnimalTypes);
  document.getElementById('filter-sound-category')?.addEventListener('change', handleSoundCategoryFilter);
  document.getElementById('filter-sound-type')?.addEventListener('change', loadSystemSounds);
  document.getElementById('filter-review-status')?.addEventListener('change', loadUserSounds);
}

// 更新时间
function updateTime() {
  const now = new Date();
  const timeStr = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  const timeEl = document.getElementById('current-time');
  if (timeEl) timeEl.textContent = timeStr;
}

// 登录处理 - 使用管理员专用接口
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const captchaCode = document.getElementById('captcha-code').value;

  if (!captchaCode || captchaCode.length !== 4) {
    showToast('请输入4位验证码', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, captchaToken, captchaCode })
    });

    const data = await response.json();

    if (response.ok && data.token) {
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.user));
      showToast('登录成功');
      showMainPage();
      loadPage('dashboard');
    } else {
      showToast(data.error || '登录失败', 'error');
      loadCaptcha();
    }
  } catch (error) {
    console.error('登录错误:', error);
    showToast('登录失败，请检查网络', 'error');
    loadCaptcha();
  }
}

// 加载验证码
async function loadCaptcha() {
  try {
    const response = await fetch(`${API_BASE_URL}/captcha`);
    const data = await response.json();

    if (data.success && data.image) {
      captchaToken = data.token;
      const captchaImage = document.getElementById('captcha-image');
      if (captchaImage) {
        captchaImage.src = data.image;
      }
    }
  } catch (error) {
    console.error('加载验证码失败:', error);
  }
}

// 刷新验证码
function refreshCaptcha() {
  loadCaptcha();
}

// 退出登录
function handleLogout() {
  localStorage.removeItem('admin_token');
  showToast('已退出登录');
  showLoginPage();
}

// 切换页面
function switchPage(page) {
  currentPage = page;

  // 更新导航状态
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === page) {
      item.classList.add('active');
    }
  });

  // 显示对应页面
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(`page-${page}`);
  if (pageEl) pageEl.classList.add('active');

  // 加载页面数据
  loadPage(page);

  // 移动端关闭侧边栏
  document.querySelector('.sidebar')?.classList.remove('open');
}

// 加载页面数据
function loadPage(page) {
  switch (page) {
    case 'dashboard':
      loadDashboard();
      break;
    case 'categories':
      loadCategories();
      break;
    case 'animal-types':
      loadCategoriesForFilter();
      loadAnimalTypes();
      break;
    case 'system-sounds':
      loadCategoriesForSoundFilter();
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

// ========== 轮播图管理 ==========

// 处理轮播图图片URL，确保显示完整路径
function getBannerImageUrl(imageUrl) {
  if (!imageUrl) return '';
  
  // 如果已经是完整URL，直接返回
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // 如果是相对路径，拼接基础URL
  const baseUrl = API_BASE_URL.replace('/api', '');
  
  // 确保路径以 / 开头
  const normalizedPath = imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl;
  
  return baseUrl + normalizedPath;
}

async function loadBanners() {
  const tbody = document.querySelector('#banners-table tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="7" class="loading">加载中...</td></tr>';

  try {
    const res = await fetch(`${API_BASE_URL}/banner/admin/list`);
    const data = await res.json();
    const banners = data.banners || [];

    if (banners.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty-state">暂无轮播图</td></tr>';
      return;
    }

    tbody.innerHTML = banners.map(banner => {
      const fullImageUrl = getBannerImageUrl(banner.image_url);
      return `
      <tr>
        <td>${banner.id}</td>
        <td>
          ${fullImageUrl
            ? `<img src="${fullImageUrl}" class="banner-thumb" onclick="previewImage('${fullImageUrl}')">`
            : '<span class="text-muted">未设置</span>'}
        </td>
        <td>${banner.title || '-'}</td>
        <td>${banner.link_url ? `<a href="${banner.link_url}" target="_blank">${banner.link_url}</a>` : '-'}</td>
        <td>${banner.sort_order}</td>
        <td>
          <span class="status-badge ${banner.is_active ? 'active' : 'inactive'}">
            ${banner.is_active ? '启用' : '禁用'}
          </span>
        </td>
        <td>
          <button class="btn btn-sm btn-edit" onclick="editBanner(${banner.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm ${banner.is_active ? 'btn-warning' : 'btn-success'}" onclick="toggleBannerStatus(${banner.id}, ${banner.is_active ? 0 : 1})">
            <i class="fas ${banner.is_active ? 'fa-ban' : 'fa-check'}"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteBanner(${banner.id})">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `}).join('');
  } catch (error) {
    console.error('加载轮播图失败:', error);
    tbody.innerHTML = '<tr><td colspan="7" class="error">加载失败</td></tr>';
  }
}

// 显示添加轮播图弹窗
function showAddBannerModal() {
  modalCallback = async function() {
    const formData = new FormData();
    const imageFile = document.getElementById('banner-image').files[0];
    const title = document.getElementById('banner-title').value;
    const linkUrl = document.getElementById('banner-link').value;
    const sortOrder = document.getElementById('banner-sort').value || 0;

    if (imageFile) {
      formData.append('image', imageFile);
    }
    formData.append('title', title);
    formData.append('link_url', linkUrl);
    formData.append('sort_order', sortOrder);

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
        showToast('添加失败', 'error');
      }
    } catch (error) {
      showToast('添加失败', 'error');
    }
  };

  document.getElementById('modal-title').textContent = '添加轮播图';
  document.getElementById('modal-body').innerHTML = `
    <form id="banner-form">
      <div class="form-group">
        <label><i class="fas fa-image"></i> 轮播图片</label>
        <input type="file" id="banner-image" accept="image/*" required>
      </div>
      <div class="form-group">
        <label><i class="fas fa-heading"></i> 标题（左下角文字）</label>
        <input type="text" id="banner-title" placeholder="请输入标题（可选）">
      </div>
      <div class="form-group">
        <label><i class="fas fa-link"></i> 跳转链接</label>
        <input type="text" id="banner-link" placeholder="点击轮播图跳转的链接（可选）">
      </div>
      <div class="form-group">
        <label><i class="fas fa-sort-numeric-up"></i> 排序</label>
        <input type="number" id="banner-sort" value="0" min="0" placeholder="数字越小越靠前">
      </div>
    </form>
  `;
  document.getElementById('modal').classList.add('active');
}

// 编辑轮播图
async function editBanner(id) {
  try {
    const res = await fetch(`${API_BASE_URL}/banner/admin/${id}`);
    const data = await res.json();
    const banner = data.banner;

    modalCallback = async function() {
      const formData = new FormData();
      const imageFile = document.getElementById('banner-image').files[0];
      const title = document.getElementById('banner-title').value;
      const linkUrl = document.getElementById('banner-link').value;
      const sortOrder = document.getElementById('banner-sort').value || 0;
      const isActive = document.getElementById('banner-active').checked ? 1 : 0;

      if (imageFile) {
        formData.append('image', imageFile);
      }
      formData.append('title', title);
      formData.append('link_url', linkUrl);
      formData.append('sort_order', sortOrder);
      formData.append('is_active', isActive);

      try {
        const response = await fetch(`${API_BASE_URL}/banner/admin/update/${id}`, {
          method: 'PUT',
          body: formData
        });

        if (response.ok) {
          showToast('轮播图更新成功');
          closeModal();
          loadBanners();
        } else {
          showToast('更新失败', 'error');
        }
      } catch (error) {
        showToast('更新失败', 'error');
      }
    };

    document.getElementById('modal-title').textContent = '编辑轮播图';
    const previewImageUrl = getBannerImageUrl(banner.image_url);
    document.getElementById('modal-body').innerHTML = `
      <form id="banner-form">
        ${previewImageUrl ? `<div class="form-group"><img src="${previewImageUrl}" class="preview-image"></div>` : ''}
        <div class="form-group">
          <label><i class="fas fa-image"></i> 轮播图片（不选则保留原图）</label>
          <input type="file" id="banner-image" accept="image/*">
        </div>
        <div class="form-group">
          <label><i class="fas fa-heading"></i> 标题（左下角文字）</label>
          <input type="text" id="banner-title" value="${banner.title || ''}" placeholder="请输入标题（可选）">
        </div>
        <div class="form-group">
          <label><i class="fas fa-link"></i> 跳转链接</label>
          <input type="text" id="banner-link" value="${banner.link_url || ''}" placeholder="点击轮播图跳转的链接（可选）">
        </div>
        <div class="form-group">
          <label><i class="fas fa-sort-numeric-up"></i> 排序</label>
          <input type="number" id="banner-sort" value="${banner.sort_order || 0}" min="0">
        </div>
        <div class="form-group">
          <label><i class="fas fa-toggle-on"></i> 启用状态</label>
          <label class="switch">
            <input type="checkbox" id="banner-active" ${banner.is_active ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </form>
    `;
    document.getElementById('modal').classList.add('active');
  } catch (error) {
    showToast('获取轮播图信息失败', 'error');
  }
}

// 切换轮播图状态
async function toggleBannerStatus(id, isActive) {
  try {
    const response = await fetch(`${API_BASE_URL}/banner/admin/toggle/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive })
    });

    if (response.ok) {
      showToast(isActive ? '轮播图已启用' : '轮播图已禁用');
      loadBanners();
    } else {
      showToast('操作失败', 'error');
    }
  } catch (error) {
    showToast('操作失败', 'error');
  }
}

// 删除轮播图
async function deleteBanner(id) {
  if (!confirm('确定要删除这个轮播图吗？')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/banner/admin/delete/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('轮播图删除成功');
      loadBanners();
    } else {
      showToast('删除失败', 'error');
    }
  } catch (error) {
    showToast('删除失败', 'error');
  }
}

// 预览大图
function previewImage(url) {
  const overlay = document.createElement('div');
  overlay.className = 'image-overlay';
  overlay.innerHTML = `<img src="${url}" class="preview-full">`;
  overlay.onclick = function() {
    document.body.removeChild(overlay);
  };
  document.body.appendChild(overlay);
}

// ========== 数据概览 ==========
async function loadDashboard() {
  try {
    // 并行加载所有统计数据
    const [usersRes, systemSoundsRes, userSoundsRes, postsRes, categoriesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/social/users`),
      fetch(`${API_BASE_URL}/sound/admin/system-sounds`),
      fetch(`${API_BASE_URL}/sound/admin/user-sounds`),
      fetch(`${API_BASE_URL}/post/list`),
      fetch(`${API_BASE_URL}/sound/admin/categories`)
    ]);

    const usersData = await usersRes.json();
    const systemSoundsData = await systemSoundsRes.json();
    const userSoundsData = await userSoundsRes.json();
    const postsData = await postsRes.json();
    const categoriesData = await categoriesRes.json();

    // 更新统计卡片
    document.getElementById('stat-users').textContent = usersData.users?.length || 0;
    document.getElementById('stat-sounds').textContent = systemSoundsData.data?.length || 0;
    document.getElementById('stat-user-sounds').textContent = userSoundsData.data?.length || 0;
    document.getElementById('stat-posts').textContent = postsData.posts?.length || 0;
    document.getElementById('stat-categories').textContent = categoriesData.data?.length || 0;

    // 计算待审核数量
    const pendingCount = userSoundsData.data?.filter(s => s.review_status === 'pending').length || 0;
    document.getElementById('stat-pending').textContent = pendingCount;

    // 加载最近活动
    loadRecentUploads(userSoundsData.data?.slice(0, 5) || []);
    loadRecentUsers(usersData.users?.slice(0, 5) || []);

  } catch (error) {
    console.error('加载概览数据失败:', error);
  }
}

function loadRecentUploads(uploads) {
  const container = document.getElementById('recent-uploads');
  if (!container) return;

  if (uploads.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无上传</div>';
    return;
  }

  container.innerHTML = uploads.map(upload => `
    <div class="recent-item">
      <i class="fas fa-music"></i>
      <div class="info">
        <h4>${escapeHtml(upload.emotion)} - ${escapeHtml(upload.animal_type)}</h4>
        <p>用户ID: ${upload.user_id}</p>
      </div>
      <span class="time">${formatTime(upload.created_at)}</span>
    </div>
  `).join('');
}

function loadRecentUsers(users) {
  const container = document.getElementById('recent-users');
  if (!container) return;

  if (users.length === 0) {
    container.innerHTML = '<div class="empty-state">暂无用户</div>';
    return;
  }

  container.innerHTML = users.map(user => `
    <div class="recent-item">
      <i class="fas fa-user"></i>
      <div class="info">
        <h4>${escapeHtml(user.username)}</h4>
        <p>${escapeHtml(user.email)}</p>
      </div>
      <span class="time">${formatTime(user.created_at)}</span>
    </div>
  `).join('');
}

function refreshDashboard() {
  loadDashboard();
  showToast('数据已刷新');
}

// ========== 分类管理 ==========
async function loadCategories() {
  const tbody = document.querySelector('#categories-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories`);
    const data = await response.json();
    const categories = data.data || [];

    if (categories.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">暂无分类</td></tr>';
      return;
    }

    tbody.innerHTML = categories.map(cat => `
      <tr>
        <td>${cat.id}</td>
        <td><code>${escapeHtml(cat.name)}</code></td>
        <td>${escapeHtml(cat.display_name)}</td>
        <td>${cat.sort_order || 0}</td>
        <td>${cat.is_active ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-danger">禁用</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-primary" onclick="editCategory(${cat.id})">编辑</button>
            <button class="btn btn-danger" onclick="deleteCategory(${cat.id})">删除</button>
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
  openModal('添加分类', `
    <div class="form-group">
      <label>分类标识</label>
      <input type="text" id="category-name" placeholder="如: popular">
      <small>英文标识，用于系统识别</small>
    </div>
    <div class="form-group">
      <label>显示名称</label>
      <input type="text" id="category-display" placeholder="如: 热门动物">
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="category-sort" value="0">
    </div>
  `, saveCategory);
}

async function saveCategory() {
  const name = document.getElementById('category-name').value.trim();
  const display_name = document.getElementById('category-display').value.trim();
  const sort_order = parseInt(document.getElementById('category-sort').value) || 0;

  if (!name || !display_name) {
    showToast('请填写完整信息', 'error');
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
    showToast('添加失败', 'error');
  }
}

async function editCategory(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories`);
    const data = await response.json();
    const cat = data.data?.find(c => c.id === id);
    if (!cat) return;

    openModal('编辑分类', `
      <div class="form-group">
        <label>分类标识</label>
        <input type="text" value="${escapeHtml(cat.name)}" disabled>
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
    `, () => updateCategory(id));
  } catch (error) {
    showToast('加载失败', 'error');
  }
}

async function updateCategory(id) {
  const display_name = document.getElementById('category-display').value.trim();
  const sort_order = parseInt(document.getElementById('category-sort').value) || 0;
  const is_active = parseInt(document.getElementById('category-active').value);

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
      showToast('更新失败', 'error');
    }
  } catch (error) {
    showToast('更新失败', 'error');
  }
}

async function deleteCategory(id) {
  if (!confirm('确定要删除这个分类吗？')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('分类删除成功');
      loadCategories();
    } else {
      showToast('删除失败', 'error');
    }
  } catch (error) {
    showToast('删除失败', 'error');
  }
}

// ========== 动物类型管理 ==========
async function loadCategoriesForFilter() {
  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories`);
    const data = await response.json();
    const categories = data.data || [];

    const select = document.getElementById('filter-category');
    if (!select) return;

    select.innerHTML = '<option value="">所有分类</option>' +
      categories.map(cat => `<option value="${cat.name}">${escapeHtml(cat.display_name)}</option>`).join('');
  } catch (error) {
    console.error('加载分类选项失败:', error);
  }
}

async function loadAnimalTypes() {
  const tbody = document.querySelector('#animal-types-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" class="loading">加载中...</td></tr>';

  const categoryFilter = document.getElementById('filter-category')?.value || '';

  try {
    const [typesRes, catRes] = await Promise.all([
      fetch(`${API_BASE_URL}/sound/admin/animal-types`),
      fetch(`${API_BASE_URL}/sound/admin/categories`)
    ]);

    const typesData = await typesRes.json();
    const catData = await catRes.json();

    let types = typesData.data || [];
    const categories = catData.data || [];
    const catMap = {};
    categories.forEach(c => catMap[c.name] = c.display_name);

    // 筛选
    if (categoryFilter) {
      types = types.filter(t => t.category === categoryFilter);
    }

    if (types.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无数据</td></tr>';
      return;
    }

    tbody.innerHTML = types.map(type => `
      <tr>
        <td>${type.id}</td>
        <td><span style="font-size: 24px;">${type.icon || '🐾'}</span></td>
        <td>${escapeHtml(type.name)}</td>
        <td><code>${escapeHtml(type.type)}</code></td>
        <td>${escapeHtml(catMap[type.category] || type.category)}</td>
        <td>${escapeHtml(type.description || '-')}</td>
        <td>${type.sort_order || 0}</td>
        <td>${type.is_active ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-danger">禁用</span>'}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-primary" onclick="editAnimalType(${type.id})">编辑</button>
            <button class="btn btn-danger" onclick="deleteAnimalType(${type.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载动物类型失败:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败</td></tr>';
  }
}

function showAddAnimalTypeModal() {
  loadCategoriesForModal();
  openModal('添加动物类型', `
    <div class="form-group">
      <label>类型标识</label>
      <input type="text" id="type-id" placeholder="如: cat">
      <small>英文标识，用于系统识别</small>
    </div>
    <div class="form-group">
      <label>显示名称</label>
      <input type="text" id="type-name" placeholder="如: 猫咪">
    </div>
    <div class="form-group">
      <label>图标</label>
      <input type="text" id="type-icon" placeholder="如: 🐱">
    </div>
    <div class="form-group">
      <label>所属分类</label>
      <select id="type-category"></select>
    </div>
    <div class="form-group">
      <label>描述</label>
      <textarea id="type-description" rows="3"></textarea>
    </div>
    <div class="form-group">
      <label>排序</label>
      <input type="number" id="type-sort" value="0">
    </div>
  `, saveAnimalType);
}

async function loadCategoriesForModal() {
  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories`);
    const data = await response.json();
    const categories = data.data || [];

    setTimeout(() => {
      const select = document.getElementById('type-category');
      if (select) {
        select.innerHTML = categories.map(cat =>
          `<option value="${cat.name}">${escapeHtml(cat.display_name)}</option>`
        ).join('');
      }
    }, 100);
  } catch (error) {
    console.error('加载分类选项失败:', error);
  }
}

async function saveAnimalType() {
  const type = document.getElementById('type-id').value.trim();
  const name = document.getElementById('type-name').value.trim();
  const icon = document.getElementById('type-icon').value.trim();
  const category = document.getElementById('type-category').value;
  const description = document.getElementById('type-description').value.trim();
  const sort_order = parseInt(document.getElementById('type-sort').value) || 0;

  if (!type || !name || !category) {
    showToast('请填写完整信息', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/animal-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name, icon, category, description, sort_order })
    });

    if (response.ok) {
      showToast('动物类型添加成功');
      closeModal();
      loadAnimalTypes();
    } else {
      const error = await response.json();
      showToast(error.error || '添加失败', 'error');
    }
  } catch (error) {
    showToast('添加失败', 'error');
  }
}

async function editAnimalType(id) {
  try {
    const [typeRes, catRes] = await Promise.all([
      fetch(`${API_BASE_URL}/sound/admin/animal-types`),
      fetch(`${API_BASE_URL}/sound/admin/categories`)
    ]);

    const typeData = await typeRes.json();
    const catData = await catRes.json();

    const type = typeData.data?.find(t => t.id === id);
    const categories = catData.data || [];

    if (!type) return;

    openModal('编辑动物类型', `
      <div class="form-group">
        <label>类型标识</label>
        <input type="text" value="${escapeHtml(type.type)}" disabled>
      </div>
      <div class="form-group">
        <label>显示名称</label>
        <input type="text" id="type-name" value="${escapeHtml(type.name)}">
      </div>
      <div class="form-group">
        <label>图标</label>
        <input type="text" id="type-icon" value="${escapeHtml(type.icon || '')}">
      </div>
      <div class="form-group">
        <label>所属分类</label>
        <select id="type-category">
          ${categories.map(cat => `<option value="${cat.name}" ${cat.name === type.category ? 'selected' : ''}>${escapeHtml(cat.display_name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>描述</label>
        <textarea id="type-description" rows="3">${escapeHtml(type.description || '')}</textarea>
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
    `, () => updateAnimalType(id));
  } catch (error) {
    showToast('加载失败', 'error');
  }
}

async function updateAnimalType(id) {
  const name = document.getElementById('type-name').value.trim();
  const icon = document.getElementById('type-icon').value.trim();
  const category = document.getElementById('type-category').value;
  const description = document.getElementById('type-description').value.trim();
  const sort_order = parseInt(document.getElementById('type-sort').value) || 0;
  const is_active = parseInt(document.getElementById('type-active').value);

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/animal-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon, category, description, sort_order, is_active })
    });

    if (response.ok) {
      showToast('动物类型更新成功');
      closeModal();
      loadAnimalTypes();
    } else {
      showToast('更新失败', 'error');
    }
  } catch (error) {
    showToast('更新失败', 'error');
  }
}

async function deleteAnimalType(id) {
  if (!confirm('确定要删除这个动物类型吗？')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/animal-types/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('动物类型删除成功');
      loadAnimalTypes();
    } else {
      showToast('删除失败', 'error');
    }
  } catch (error) {
    showToast('删除失败', 'error');
  }
}

// ========== 系统声音管理 ==========
async function loadCategoriesForSoundFilter() {
  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/categories`);
    const data = await response.json();
    const categories = data.data || [];

    const select = document.getElementById('filter-sound-category');
    if (select) {
      select.innerHTML = '<option value="">所有分类</option>' +
        categories.map(cat => `<option value="${cat.name}">${escapeHtml(cat.display_name)}</option>`).join('');
    }
  } catch (error) {
    console.error('加载分类失败:', error);
  }
}

async function handleSoundCategoryFilter() {
  const category = document.getElementById('filter-sound-category')?.value;
  const typeSelect = document.getElementById('filter-sound-type');

  if (!typeSelect) return;

  if (!category) {
    typeSelect.innerHTML = '<option value="">所有类型</option>';
    loadSystemSounds();
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/animal-types`);
    const data = await response.json();
    const types = data.data?.filter(t => t.category === category) || [];

    typeSelect.innerHTML = '<option value="">所有类型</option>' +
      types.map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');

    loadSystemSounds();
  } catch (error) {
    console.error('加载类型失败:', error);
  }
}

async function loadSystemSounds() {
  const tbody = document.querySelector('#system-sounds-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" class="loading">加载中...</td></tr>';

  const typeFilter = document.getElementById('filter-sound-type')?.value || '';

  try {
    const [soundsRes, typesRes] = await Promise.all([
      fetch(`${API_BASE_URL}/sound/admin/system-sounds`),
      fetch(`${API_BASE_URL}/sound/admin/animal-types`)
    ]);

    const soundsData = await soundsRes.json();
    const typesData = await typesRes.json();

    let sounds = soundsData.data || [];
    const types = typesData.data || [];
    const typeMap = {};
    types.forEach(t => typeMap[t.id] = t);

    // 筛选
    if (typeFilter) {
      sounds = sounds.filter(s => s.type_id == typeFilter);
    }

    if (sounds.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无系统声音</td></tr>';
      return;
    }

    tbody.innerHTML = sounds.map(sound => {
      const type = typeMap[sound.type_id];
      return `
        <tr>
          <td>${sound.id}</td>
          <td>
            <audio controls preload="none" style="width: 150px; height: 32px;">
              <source src="http://localhost:3000${sound.sound_url}" type="audio/mpeg">
            </audio>
          </td>
          <td>${type ? `${type.icon || '🐾'} ${escapeHtml(type.name)}` : '-'}</td>
          <td>${escapeHtml(sound.emotion)}</td>
          <td>${formatDuration(sound.duration)}</td>
          <td>${escapeHtml(sound.description || '-')}</td>
          <td>${sound.is_active ? '<span class="badge badge-success">启用</span>' : '<span class="badge badge-danger">禁用</span>'}</td>
          <td>${formatDate(sound.created_at)}</td>
          <td>
            <div class="table-actions">
              <button class="btn btn-danger" onclick="deleteSystemSound(${sound.id})">删除</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    console.error('加载系统声音失败:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败</td></tr>';
  }
}

function showAddSystemSoundModal() {
  loadTypesForSoundModal();
  openModal('上传系统声音', `
    <div class="form-group">
      <label>动物类型</label>
      <select id="sound-type"></select>
    </div>
    <div class="form-group">
      <label>情绪</label>
      <input type="text" id="sound-emotion" placeholder="如: 开心">
    </div>
    <div class="form-group">
      <label>声音文件</label>
      <input type="file" id="sound-file" accept="audio/*">
    </div>
    <div class="form-group">
      <label>时长（秒）</label>
      <input type="number" id="sound-duration" placeholder="自动检测">
    </div>
    <div class="form-group">
      <label>描述</label>
      <textarea id="sound-description" rows="2"></textarea>
    </div>
  `, saveSystemSound);
}

async function loadTypesForSoundModal() {
  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/animal-types`);
    const data = await response.json();
    const types = data.data || [];

    setTimeout(() => {
      const select = document.getElementById('sound-type');
      if (select) {
        select.innerHTML = types.map(t =>
          `<option value="${t.id}">${t.icon || '🐾'} ${escapeHtml(t.name)}</option>`
        ).join('');
      }
    }, 100);
  } catch (error) {
    console.error('加载类型失败:', error);
  }
}

async function saveSystemSound() {
  const type_id = document.getElementById('sound-type').value;
  const emotion = document.getElementById('sound-emotion').value.trim();
  const file = document.getElementById('sound-file').files[0];
  const duration = parseInt(document.getElementById('sound-duration').value) || 0;
  const description = document.getElementById('sound-description').value.trim();

  if (!type_id || !emotion || !file) {
    showToast('请填写完整信息并选择文件', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('sound', file);
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
      showToast('声音上传成功');
      closeModal();
      loadSystemSounds();
    } else {
      const error = await response.json();
      showToast(error.error || '上传失败', 'error');
    }
  } catch (error) {
    showToast('上传失败', 'error');
  }
}

async function deleteSystemSound(id) {
  if (!confirm('确定要删除这个系统声音吗？')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/system-sounds/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('声音删除成功');
      loadSystemSounds();
    } else {
      showToast('删除失败', 'error');
    }
  } catch (error) {
    showToast('删除失败', 'error');
  }
}

// ========== 用户声音管理 ==========
async function loadUserSounds() {
  const tbody = document.querySelector('#user-sounds-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" class="loading">加载中...</td></tr>';

  const statusFilter = document.getElementById('filter-review-status')?.value || '';

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/user-sounds`);
    const data = await response.json();
    let sounds = data.data || [];

    // 筛选
    if (statusFilter) {
      sounds = sounds.filter(s => s.review_status === statusFilter);
    }

    if (sounds.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无用户声音</td></tr>';
      return;
    }

    tbody.innerHTML = sounds.map(sound => `
      <tr>
        <td>${sound.id}</td>
        <td>
          <audio controls preload="none" style="width: 150px; height: 32px;">
            <source src="http://localhost:3000${sound.sound_url}" type="audio/mpeg">
          </audio>
        </td>
        <td>${sound.username || sound.user_id}</td>
        <td>${escapeHtml(sound.animal_type)}</td>
        <td>${escapeHtml(sound.emotion)}</td>
        <td>${formatDuration(sound.duration)}</td>
        <td>${getReviewStatusBadge(sound.review_status)}</td>
        <td>${formatDate(sound.created_at)}</td>
        <td>
          <div class="table-actions">
            ${sound.review_status === 'pending' ? `
              <button class="btn btn-success" onclick="reviewSound(${sound.id}, 'approved')">通过</button>
              <button class="btn btn-danger" onclick="reviewSound(${sound.id}, 'rejected')">拒绝</button>
            ` : ''}
            <button class="btn btn-danger" onclick="deleteUserSound(${sound.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载用户声音失败:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败</td></tr>';
  }
}

function getReviewStatusBadge(status) {
  switch (status) {
    case 'pending': return '<span class="badge badge-warning">待审核</span>';
    case 'approved': return '<span class="badge badge-success">已通过</span>';
    case 'rejected': return '<span class="badge badge-danger">已拒绝</span>';
    default: return '<span class="badge badge-info">无需审核</span>';
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
      showToast('操作失败', 'error');
    }
  } catch (error) {
    showToast('操作失败', 'error');
  }
}

async function deleteUserSound(id) {
  if (!confirm('确定要删除这个用户声音吗？')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/sound/admin/user-sounds/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('删除成功');
      loadUserSounds();
    } else {
      showToast('删除失败', 'error');
    }
  } catch (error) {
    showToast('删除失败', 'error');
  }
}

// ========== 用户管理 ==========
async function loadUsers() {
  const tbody = document.querySelector('#users-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="9" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/social/users`);
    const data = await response.json();
    const users = data.users || [];

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" class="empty-state">暂无用户</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(user => `
      <tr>
        <td>${user.id}</td>
        <td>
          ${user.avatar ? `<img src="http://106.14.248.12:3000${user.avatar}" class="img-preview" alt="">` : '<i class="fas fa-user-circle" style="font-size: 40px; color: #ccc;"></i>'}
        </td>
        <td>${escapeHtml(user.username)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td>${user.posts_count || 0}</td>
        <td>${user.sounds_count || 0}</td>
        <td>${user.comments_count || 0}</td>
        <td>${formatDate(user.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-danger" onclick="deleteUser(${user.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载用户失败:', error);
    tbody.innerHTML = '<tr><td colspan="9" class="empty-state">加载失败</td></tr>';
  }
}

async function deleteUser(id) {
  if (!confirm('确定要删除这个用户吗？此操作不可恢复！')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/social/users/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('用户删除成功');
      loadUsers();
    } else {
      showToast('删除失败', 'error');
    }
  } catch (error) {
    showToast('删除失败', 'error');
  }
}

// ========== 帖子管理 ==========
async function loadPosts() {
  const tbody = document.querySelector('#posts-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/post/list`);
    const data = await response.json();
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
        <td>
          ${post.image_url ? `<img src="${post.image_url.startsWith('http') ? post.image_url : 'http://106.14.248.12:3000' + post.image_url}" class="img-preview" alt="">` : '-'}
        </td>
        <td>${post.like_count || 0}</td>
        <td>${post.comment_count || 0}</td>
        <td>${formatDate(post.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-danger" onclick="deletePost(${post.id})">删除</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    console.error('加载帖子失败:', error);
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state">加载失败</td></tr>';
  }
}

async function deletePost(id) {
  if (!confirm('确定要删除这个帖子吗？')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/post/admin/delete/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('帖子删除成功');
      loadPosts();
    } else {
      showToast('删除失败', 'error');
    }
  } catch (error) {
    showToast('删除失败', 'error');
  }
}

// ========== 通知管理 ==========
async function loadNotifications() {
  const tbody = document.querySelector('#notifications-table tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="8" class="loading">加载中...</td></tr>';

  try {
    const response = await fetch(`${API_BASE_URL}/admin/notification`);
    const data = await response.json();
    const notifications = data.notifications || [];

    if (notifications.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-state">暂无通知</td></tr>';
      return;
    }

    tbody.innerHTML = notifications.map(notif => `
      <tr>
        <td>${notif.id}</td>
        <td>${escapeHtml(notif.title)}</td>
        <td>${escapeHtml(notif.content?.substring(0, 50))}${notif.content?.length > 50 ? '...' : ''}</td>
        <td>${escapeHtml(notif.type)}</td>
        <td>${notif.status === 'active' ? '<span class="badge badge-success">启用</span>' : notif.status === 'pending' ? '<span class="badge badge-warning">待发布</span>' : '<span class="badge badge-danger">已禁用</span>'}</td>
        <td>${formatDate(notif.publish_at)}</td>
        <td>${formatDate(notif.expire_at)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-danger" onclick="deleteNotification(${notif.id})">删除</button>
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
  openModal('发送通知', `
    <div class="form-group">
      <label>标题</label>
      <input type="text" id="notif-title" placeholder="通知标题">
    </div>
    <div class="form-group">
      <label>内容</label>
      <textarea id="notif-content" rows="4" placeholder="通知内容"></textarea>
    </div>
    <div class="form-group">
      <label>类型</label>
      <select id="notif-type">
        <option value="info">信息</option>
        <option value="warning">警告</option>
        <option value="success">成功</option>
      </select>
    </div>
    <div class="form-group">
      <label>过期时间</label>
      <input type="datetime-local" id="notif-expire">
    </div>
  `, saveNotification);
}

async function saveNotification() {
  const title = document.getElementById('notif-title').value.trim();
  const content = document.getElementById('notif-content').value.trim();
  const type = document.getElementById('notif-type').value;
  const expire_at = document.getElementById('notif-expire').value;

  if (!title || !content) {
    showToast('请填写完整信息', 'error');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, type, expire_at })
    });

    if (response.ok) {
      showToast('通知发送成功');
      closeModal();
      loadNotifications();
    } else {
      showToast('发送失败', 'error');
    }
  } catch (error) {
    showToast('发送失败', 'error');
  }
}

async function deleteNotification(id) {
  if (!confirm('确定要删除这个通知吗？')) return;

  try {
    const response = await fetch(`${API_BASE_URL}/admin/notification/${id}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      showToast('通知删除成功');
      loadNotifications();
    } else {
      showToast('删除失败', 'error');
    }
  } catch (error) {
    showToast('删除失败', 'error');
  }
}

// ========== 模态框 ==========
function openModal(title, content, callback) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = content;
  document.getElementById('modal').classList.add('active');
  modalCallback = callback;
}

function closeModal() {
  document.getElementById('modal').classList.remove('active');
  modalCallback = null;
}

function confirmModal() {
  if (modalCallback) {
    modalCallback();
  }
}

// ========== 工具函数 ==========
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const messageEl = document.getElementById('toast-message');

  messageEl.textContent = message;
  toast.className = 'toast';
  if (type === 'error') toast.classList.add('error');

  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  return `${Math.floor(diff / 86400)}天前`;
}

function formatDuration(seconds) {
  if (!seconds) return '-';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
