<template>
  <div class="mentor-layout">
    <!-- 左侧会话栏 -->
    <aside class="sidebar-left">
      <div class="top-back">
        <span class="icon">←</span>
        <span>返回首页</span>
      </div>

      <div class="history-header">
        <h3>会话历史</h3>
        <button class="new-btn">＋ 新建会话</button>
      </div>

      <div class="history-list">
        <div class="history-item active">
          <div class="history-title">
            如何优化用户登录流程？
            <span>10:24</span>
          </div>
          <div class="history-desc">
            讨论登录流程的优化方案和用户体验...
          </div>
        </div>

        <div class="history-item" v-for="item in historyList" :key="item.id">
          <div class="history-title">
            {{ item.title }}
            <span>{{ item.date }}</span>
          </div>
          <div class="history-desc">
            {{ item.desc }}
          </div>
        </div>
      </div>

      <button class="more-btn">查看更多历史会话</button>

      <div class="user-card">
        <img
          src="https://api.dicebear.com/7.x/adventurer/svg?seed=Tom"
          alt=""
        />
        <div class="user-info">
          <div class="name">张小明</div>
          <div class="role">产品经理</div>
        </div>
      </div>
    </aside>

    <!-- 中间聊天区域 -->
    <main class="chat-area">
      <div class="chat-header">
        <div class="chat-title">
          <div class="ai-avatar">🤖</div>
          <div>
            <h2>智能导师</h2>
            <p>您的专属 AI 助手，随时为您提供专业的指导与建议</p>
          </div>
        </div>

        <div class="sparkle">✦</div>
      </div>

      <div class="chat-content">
        <!-- AI消息 -->
        <div class="message-row left">
          <div class="msg-avatar">🤖</div>

          <div class="message ai">
            <div class="msg-text">
              你好！我是你的智能导师 👋
              <br />
              我可以帮助你解答问题、提供建议、分析需求、优化方案等。
              <br />
              有什么可以帮到你的吗？
            </div>

            <div class="msg-time">10:24</div>
          </div>
        </div>

        <!-- 用户消息 -->
        <div class="message-row right">
          <div class="message user">
            <div class="msg-text">
              如何优化用户登录流程，提升用户体验？
            </div>

            <div class="msg-time">10:24 ✓✓</div>
          </div>
        </div>

        <!-- AI回复 -->
        <div class="message-row left">
          <div class="msg-avatar">🤖</div>

          <div class="message ai long">
            <div class="msg-text">
              <p>
                优化用户登录流程可以从以下几个方面入手，提升用户体验：
              </p>

              <ol>
                <li>
                  <strong>简化登录步骤：</strong>
                  减少不必要的字段，支持一键登录或第三方登录。
                </li>

                <li>
                  <strong>提升反馈效率：</strong>
                  在登录过程中提供清晰的加载状态和错误提示。
                </li>

                <li>
                  <strong>增强安全性与便捷性：</strong>
                  引入验证码、设备识别等机制平衡安全与体验。
                </li>

                <li>
                  <strong>提供记住我和自动登录：</strong>
                  在保证安全的前提下，减少重复操作。
                </li>
              </ol>

              <p>
                如果你有具体的业务场景或用户群体，我可以帮你提供更有针对性的优化方案。
              </p>
            </div>

            <div class="msg-time">10:24</div>
          </div>
        </div>

        <!-- 快捷问题 -->
        <div class="quick-actions">
          <button>如何设计验证码体验好？</button>
          <button>第三方登录如何接入？</button>
          <button>登录失败率如何分析？</button>
          <button class="refresh">↻</button>
        </div>
      </div>

      <!-- 输入框 -->
      <div class="chat-input">
        <textarea
          placeholder="输入你的问题，按 Enter 发送"
        ></textarea>

        <div class="input-bottom">
          <div class="tools">
            <span>📎</span>
            <span>🖼</span>
            <span>📁</span>
          </div>

          <button class="send-btn">➤</button>
        </div>
      </div>
    </main>

    <!-- 右侧文档栏 -->
    <aside class="sidebar-right">
      <div class="doc-header">
        <h3>项目文档</h3>

        <div class="doc-actions">
          <span>🔍</span>
          <button>＋ 新建</button>
        </div>
      </div>

      <div class="doc-tabs">
        <div class="tab active">资料文档</div>
        <div class="tab">协作文档</div>
      </div>

      <div class="doc-section">
        <h4>资料文档</h4>

        <div class="doc-card" v-for="doc in docs" :key="doc.id">
          <div class="doc-icon" :class="doc.type">
            {{ doc.short }}
          </div>

          <div class="doc-info">
            <div class="doc-name">{{ doc.name }}</div>

            <div class="doc-meta">
              {{ doc.version }}　 {{ doc.date }}　 {{ doc.author }}
            </div>
          </div>

          <div class="doc-more">⋮</div>
        </div>
      </div>

      <div class="doc-section">
        <h4>协作文档</h4>

        <div class="collab-card" v-for="item in collabs" :key="item.id">
          <div class="collab-left">
            <div class="collab-icon">📄</div>

            <div>
              <div class="collab-title">{{ item.title }}</div>
              <div class="collab-meta">
                多人协作　 更新于 {{ item.time }}
              </div>
            </div>
          </div>

          <div class="avatars">
            <img
              v-for="n in 3"
              :key="n"
              :src="`https://api.dicebear.com/7.x/adventurer/svg?seed=${n}${item.id}`"
            />
            <span>+{{ item.extra }}</span>
          </div>
        </div>
      </div>

      <button class="view-all">查看全部文档 →</button>
    </aside>
  </div>
</template>

<script lang="ts" setup>
const historyList = [
  {
    id: 1,
    title: "项目需求分析讨论",
    date: "昨天",
    desc: "梳理项目核心需求和功能范围..."
  },
  {
    id: 2,
    title: "技术架构设计建议",
    date: "05/20",
    desc: "关于系统架构的技术选型讨论..."
  },
  {
    id: 3,
    title: "用户画像分析",
    date: "05/18",
    desc: "针对目标用户群体的特征分析..."
  },
  {
    id: 4,
    title: "数据看板设计思路",
    date: "05/16",
    desc: "数据可视化方案和指标体系讨论..."
  },
  {
    id: 5,
    title: "API 接口设计咨询",
    date: "05/15",
    desc: "RESTful 接口设计规范和建议..."
  }
]

const docs = [
  {
    id: 1,
    short: "W",
    type: "word",
    name: "产品需求文档 PRD",
    version: "v1.2",
    date: "05/20",
    author: "张小明"
  },
  {
    id: 2,
    short: "PDF",
    type: "pdf",
    name: "用户研究报告",
    version: "v1.0",
    date: "05/18",
    author: "李思远"
  },
  {
    id: 3,
    short: "P",
    type: "ppt",
    name: "竞品分析报告",
    version: "v1.1",
    date: "05/15",
    author: "王浩曦"
  },
  {
    id: 4,
    short: "X",
    type: "excel",
    name: "功能需求清单",
    version: "v1.3",
    date: "05/14",
    author: "张小明"
  },
  {
    id: 5,
    short: "文",
    type: "doc",
    name: "技术选型文档",
    version: "v1.0",
    date: "05/10",
    author: "赵子豪"
  }
]

const collabs = [
  {
    id: 1,
    title: "项目计划与里程碑",
    time: "10:15",
    extra: 3
  },
  {
    id: 2,
    title: "需求评审记录",
    time: "昨天",
    extra: 2
  },
  {
    id: 3,
    title: "UI 设计评审反馈",
    time: "05/19",
    extra: 4
  }
]
</script>

<style scoped>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

.mentor-layout {
  display: flex;
  height: 100vh;
  background: #f6f8fc;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  color: #1f2a44;
  overflow: hidden;
}

/* 左侧 */
.sidebar-left {
  width: 340px;
  background: rgba(255, 255, 255, 0.85);
  border-right: 1px solid #eef1f7;
  padding: 24px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.top-back {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  margin-bottom: 30px;
  cursor: pointer;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.history-header h3 {
  margin: 0;
  font-size: 24px;
}

.new-btn {
  border: none;
  background: #edf3ff;
  color: #4f7cff;
  padding: 10px 16px;
  border-radius: 14px;
  cursor: pointer;
}

.history-list {
  flex: 1;
  overflow-y: auto;
}

.history-item {
  padding: 18px;
  border-radius: 18px;
  margin-bottom: 14px;
  cursor: pointer;
  transition: 0.25s;
}

.history-item:hover {
  background: #f7f9ff;
}

.history-item.active {
  background: #eef4ff;
}

.history-title {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  margin-bottom: 8px;
}

.history-title span {
  font-size: 13px;
  color: #94a0b8;
}

.history-desc {
  font-size: 14px;
  color: #8d96a8;
  line-height: 1.6;
}

.more-btn {
  height: 50px;
  border-radius: 16px;
  border: 1px solid #edf1f7;
  background: white;
  margin: 18px 0;
  cursor: pointer;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-top: 10px;
}

.user-card img {
  width: 54px;
  height: 54px;
  border-radius: 50%;
}

.name {
  font-weight: 600;
}

.role {
  color: #94a0b8;
  margin-top: 4px;
  font-size: 14px;
}

/* 中间 */
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 24px;
}

.chat-header {
  background: white;
  border-radius: 24px;
  padding: 24px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 6px 30px rgba(40, 70, 120, 0.04);
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ai-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #edf4ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
}

.chat-title h2 {
  margin: 0;
  font-size: 30px;
}

.chat-title p {
  margin-top: 6px;
  color: #8f98ac;
}

.sparkle {
  font-size: 24px;
  color: #5f87ff;
}

.chat-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 10px;
}

.message-row {
  display: flex;
  margin-bottom: 30px;
}

.message-row.right {
  justify-content: flex-end;
}

.msg-avatar {
  width: 44px;
  height: 44px;
  background: #eef4ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  font-size: 20px;
}

.message {
  max-width: 72%;
  padding: 22px;
  border-radius: 22px;
  box-shadow: 0 6px 20px rgba(40, 70, 120, 0.04);
}

.message.ai {
  background: white;
}

.message.user {
  background: #edf4ff;
}

.msg-text {
  line-height: 1.9;
  color: #2b3550;
}

.msg-time {
  margin-top: 16px;
  color: #9aa3b6;
  font-size: 13px;
}

.quick-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-left: 58px;
}

.quick-actions button {
  border: 1px solid #e8edf7;
  background: white;
  border-radius: 14px;
  padding: 12px 18px;
  cursor: pointer;
  color: #50607d;
}

.quick-actions .refresh {
  width: 46px;
}

/* 输入框 */
.chat-input {
  background: white;
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 6px 30px rgba(40, 70, 120, 0.04);
}

.chat-input textarea {
  width: 100%;
  height: 90px;
  border: none;
  resize: none;
  outline: none;
  font-size: 15px;
  font-family: inherit;
}

.input-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
}

.tools {
  display: flex;
  gap: 16px;
  color: #94a0b8;
  font-size: 20px;
}

.send-btn {
  width: 58px;
  height: 58px;
  border-radius: 18px;
  border: none;
  background: linear-gradient(135deg, #9bb5ff, #6e8dff);
  color: white;
  font-size: 20px;
  cursor: pointer;
}

/* 右侧 */
.sidebar-right {
  width: 360px;
  background: rgba(255, 255, 255, 0.85);
  border-left: 1px solid #eef1f7;
  padding: 24px;
  overflow-y: auto;
}

.doc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.doc-header h3 {
  margin: 0;
  font-size: 28px;
}

.doc-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.doc-actions button {
  border: none;
  background: #edf3ff;
  color: #4f7cff;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
}

.doc-tabs {
  display: flex;
  margin-top: 26px;
  border-bottom: 1px solid #edf1f7;
}

.tab {
  padding: 14px 24px;
  color: #8f98ac;
  cursor: pointer;
}

.tab.active {
  color: #4f7cff;
  border-bottom: 2px solid #4f7cff;
}

.doc-section {
  margin-top: 28px;
}

.doc-section h4 {
  margin-bottom: 18px;
}

.doc-card {
  display: flex;
  align-items: center;
  padding: 18px;
  background: white;
  border-radius: 18px;
  margin-bottom: 14px;
  box-shadow: 0 6px 20px rgba(40, 70, 120, 0.04);
}

.doc-icon {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  color: white;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  font-weight: bold;
}

.word {
  background: #4f7cff;
}

.pdf {
  background: #ff6a6a;
}

.ppt {
  background: #ff9d4d;
}

.excel {
  background: #43c37b;
}

.doc {
  background: #8b6eff;
}

.doc-info {
  flex: 1;
}

.doc-name {
  font-weight: 600;
  margin-bottom: 6px;
}

.doc-meta {
  color: #94a0b8;
  font-size: 13px;
}

.doc-more {
  color: #8d96a8;
}

.collab-card {
  background: white;
  border-radius: 18px;
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
  box-shadow: 0 6px 20px rgba(40, 70, 120, 0.04);
}

.collab-left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.collab-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: #eef4ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collab-title {
  font-weight: 600;
}

.collab-meta {
  color: #94a0b8;
  font-size: 13px;
  margin-top: 4px;
}

.avatars {
  display: flex;
  align-items: center;
}

.avatars img {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  margin-left: -8px;
  border: 2px solid white;
}

.avatars span {
  margin-left: 8px;
  color: #7f8aa3;
  font-size: 13px;
}

.view-all {
  width: 100%;
  height: 54px;
  margin-top: 18px;
  border-radius: 16px;
  border: 1px solid #e8edf7;
  background: white;
  cursor: pointer;
  color: #4f7cff;
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 1400px) {
  .sidebar-right {
    display: none;
  }
}

@media (max-width: 1000px) {
  .sidebar-left {
    display: none;
  }
}
</style>
