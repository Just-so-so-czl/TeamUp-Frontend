<script setup lang="ts">
const menuItems = [
  {
    key: 'workspace',
    label: '工作台',
    active: true,
    icon: 'M4 5a2 2 0 0 1 2-2h5v7H4V5Zm9-2h5a2 2 0 0 1 2 2v3h-7V3ZM4 12h7v9H6a2 2 0 0 1-2-2v-7Zm9 0h7v7a2 2 0 0 1-2 2h-5v-9Z',
  },
  {
    key: 'teams',
    label: '我的小组',
    active: false,
    icon: 'M8 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm8 2a3 3 0 1 0-2.9-3.8M3 20a5 5 0 0 1 10 0M14.5 20a4.5 4.5 0 0 1 6 0',
  },
  {
    key: 'docs',
    label: '协作文档',
    active: false,
    icon: 'M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm7 1v5h5M8 13h8M8 17h5',
  },
  {
    key: 'mentor',
    label: '智能导师',
    active: false,
    icon: 'M12 3 2 8l10 5 10-5-10-5Zm-7 8v5c0 2.8 3.1 5 7 5s7-2.2 7-5v-5',
  },
  {
    key: 'tasks',
    label: '任务调度',
    active: false,
    icon: 'M7 2v3M17 2v3M4 7h16M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm2 7h4v4H8z',
  },
]

const activeGroups = [
  { name: '软件工程课程设计组', role: '组长', progress: '进度 78%' },
  { name: '计算机网络冲刺组', role: '开发者', progress: '进度 62%' },
  { name: '算法竞赛训练营', role: '文案', progress: '进度 49%' },
]

const pendingTasks = [
  { title: '整理数据库 ER 图', due: '截止今晚 21:00', priority: '高优先级' },
  { title: '补充接口联调文档', due: '截止明天 10:30', priority: '中优先级' },
  { title: '复盘上周冲刺会议', due: '截止明天 18:00', priority: '低优先级' },
]

const recentDocs = [
  { title: '需求评审纪要.md', updateTime: '20 分钟前更新' },
  { title: '系统架构草图.pdf', updateTime: '今天 14:22 更新' },
  { title: '任务拆分清单.docx', updateTime: '昨天 19:40 更新' },
]
</script>

<template>
  <div class="dashboard-page">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-logo">TU</div>
        <div class="brand-text">
          <h1>TeamUp</h1>
          <p>Study Together</p>
        </div>
      </div>

      <nav class="menu">
        <button
          v-for="item in menuItems"
          :key="item.key"
          class="menu-item"
          :class="{ active: item.active }"
          type="button"
        >
          <svg class="menu-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path :d="item.icon" />
          </svg>
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="profile">
        <div class="avatar">张</div>
        <div class="profile-meta">
          <div class="name">张同学</div>
          <div class="email">zhang@teamup.edu.cn</div>
        </div>
      </div>
    </aside>

    <main class="workspace">
      <header class="topbar">
        <div class="group-actions">
          <button class="group-btn create-btn" type="button">
            <i class="fa-solid fa-plus" aria-hidden="true"></i>
            <span>创建小组</span>
          </button>
          <button class="group-btn join-btn" type="button">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M10 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
              <path d="M14 8l4 4-4 4" />
              <path d="M8 12h10" />
            </svg>
            <span>加入小组</span>
          </button>
        </div>
        <div class="search-wrap">
          <input type="text" placeholder="搜索小组、文档或任务..." />
        </div>
        <div class="top-actions">
          <button type="button" aria-label="消息">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 8a6 6 0 1 0-12 0v5l-2 3h16l-2-3V8Zm-7 11h2" />
            </svg>
          </button>
          <button type="button" aria-label="设置">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="6" cy="12" r="1.8" fill="currentColor" />
              <circle cx="12" cy="12" r="1.8" fill="currentColor" />
              <circle cx="18" cy="12" r="1.8" fill="currentColor" />
            </svg>
          </button>
        </div>
      </header>

      <section class="greeting">
        <h2>下午好，张同学 👋</h2>
        <p>今天有 3 个任务即将到达 Deadline，AI 导师已为你生成了最新的复习导图。</p>
      </section>

      <section class="main-grid">
        <article class="card">
          <div class="card-title">正在进行的小组</div>
          <ul>
            <li v-for="group in activeGroups" :key="group.name">
              <span class="item-name">{{ group.name }}</span>
              <span class="item-sub">{{ group.role }} · {{ group.progress }}</span>
            </li>
          </ul>
        </article>

        <article class="card">
          <div class="card-title">待处理的任务</div>
          <ul>
            <li v-for="task in pendingTasks" :key="task.title">
              <span class="item-name">{{ task.title }}</span>
              <span class="item-sub">{{ task.due }} · {{ task.priority }}</span>
            </li>
          </ul>
        </article>

        <article class="card docs-card">
          <div class="card-title">近期文档</div>
          <ul>
            <li v-for="doc in recentDocs" :key="doc.title">
              <span class="item-name">{{ doc.title }}</span>
              <span class="item-sub">{{ doc.updateTime }}</span>
            </li>
          </ul>
        </article>
      </section>
    </main>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(140deg, #eefaf7 0%, #e5f5fb 52%, #f5fcfb 100%);
  color: #204d4c;
}

.sidebar {
  width: 270px;
  background: #f4fcfa;
  border-right: 1px solid #cfe7e3;
  display: flex;
  flex-direction: column;
  padding: 28px 18px 20px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 8px 18px;
}

.brand-logo {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #24b3a8 0%, #46c4da 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #fff;
  letter-spacing: 1px;
}

.brand-text h1 {
  margin: 0;
  font-size: 20px;
  line-height: 1.1;
  font-weight: 700;
}

.brand-text p {
  margin: 2px 0 0;
  font-size: 12px;
  color: #4d7f7d;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}

.menu-item {
  width: 100%;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: #2d6361;
  text-align: left;
  padding: 12px 14px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.menu-icon {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.menu-item:hover {
  background: #dcf3ef;
}

.menu-item.active {
  background: linear-gradient(135deg, #2bb9b0 0%, #4bc1d6 100%);
  color: #fff;
  box-shadow: 0 10px 20px rgba(63, 173, 186, 0.28);
}

.profile {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #def3ef;
  border-radius: 16px;
  padding: 12px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #bfe8e0;
  color: #1f5653;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.name {
  font-size: 14px;
  font-weight: 700;
}

.email {
  font-size: 12px;
  color: #487875;
}

.workspace {
  flex: 1;
  padding: 28px 34px;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 16px;
}

.group-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.group-btn {
  height: 42px;
  border-radius: 12px;
  padding: 0 14px;
  border: 1px solid #8ecfd8;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.group-btn svg {
  width: 16px;
  height: 16px;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex-shrink: 0;
}

.create-btn {
  color: #fff;
  border-color: #3fb9c8;
  background: linear-gradient(135deg, #2bb9b0 0%, #4bc1d6 100%);
}

.join-btn {
  color: #256466;
  background: #eefbfc;
}

.group-btn:hover {
  filter: brightness(1.02);
}

.search-wrap {
  width: min(420px, 100%);
  flex-shrink: 1;
}

.search-wrap input {
  width: 100%;
  border: 1px solid #bedeea;
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.94);
  font-size: 14px;
  color: #245353;
}

.search-wrap input:focus {
  outline: none;
  border-color: #4dbed1;
  box-shadow: 0 0 0 3px rgba(77, 190, 209, 0.2);
}

.top-actions {
  display: flex;
  gap: 10px;
  margin-left: auto;
  flex-shrink: 0;
}

.top-actions button {
  border: 1px solid #bedeea;
  border-radius: 12px;
  background: #fff;
  color: #2d6768;
  width: 42px;
  height: 42px;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.top-actions button:hover {
  background: #e9f8fc;
}

.top-actions svg {
  width: 18px;
  height: 18px;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.greeting {
  margin-top: 22px;
  background: linear-gradient(135deg, #bfeee6 0%, #dcf4fb 100%);
  border-radius: 20px;
  padding: 24px;
  color: #1e4f4d;
}

.greeting h2 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.2;
}

.greeting p {
  margin: 8px 0 0;
  font-size: 15px;
}

.main-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #d4eaed;
  border-radius: 18px;
  padding: 18px;
  box-shadow: 0 6px 20px rgba(115, 176, 180, 0.14);
}

.docs-card {
  grid-column: 1 / -1;
}

.card-title {
  font-size: 17px;
  font-weight: 700;
  color: #245656;
  margin-bottom: 12px;
}

.card ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card li {
  background: #f4fcfb;
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #264f4f;
}

.item-sub {
  font-size: 12px;
  color: #53817f;
}

@media (max-width: 980px) {
  .dashboard-page {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid #cfe7e3;
  }

  .main-grid {
    grid-template-columns: 1fr;
  }

  .docs-card {
    grid-column: auto;
  }

  .topbar {
    flex-wrap: wrap;
  }

  .group-actions {
    width: 100%;
  }

  .group-btn {
    flex: 1;
    justify-content: center;
  }

  .search-wrap {
    width: 100%;
  }

  .top-actions {
    margin-left: 0;
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
