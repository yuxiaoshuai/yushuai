<template>
  <div class="chat-container">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <button class="new-chat-btn" @click="handleNewChat">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        新的聊天
      </button>
      
      <div class="chat-history">
        <div class="history-item active">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          最近的聊天
        </div>
        <div class="history-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          Vue3使用教程
        </div>
        <div class="history-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
          </svg>
          JavaScript高级特性
        </div>
      </div>
      
      <div class="sidebar-footer">
        <div class="sidebar-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
          </svg>
          设置
        </div>
        <div class="sidebar-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          账户
        </div>
      </div>
    </aside>

    <!-- 主聊天区域 -->
    <main class="chat-main">
      <!-- 新增：聊天标题栏 -->
      <div class="chat-header">
        <div class="chat-title">
          <h1>最近的聊天</h1>
        </div>
        <div class="user-profile">
          <div class="profile-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      </div>

      <!-- 聊天内容区域 -->
      <div class="chat-messages" ref="messagesContainer">
        <!-- 欢迎消息（AI，左侧） -->
        <div class="message ai-message welcome-message">
          <div class="message-avatar ai-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 1.8.7 3.4 1.8 4.6l-.9 3.1 2.8-1.4c.3.1.7.1 1 0l2.8 1.4-.9-3.1c1.1-1.2 1.8-2.8 1.8-4.6a8 8 0 0 0-8-8z"></path>
              <path d="M9 13h6"></path>
              <path d="M12 10v6"></path>
            </svg>
          </div>
          <div class="message-content">
            <h2>欢迎使用AI助手</h2>
            <p>我可以回答你的问题、提供建议和帮助解决各种问题。</p>
            <div class="suggested-prompts">
              <div class="prompt-item">解释Vue3的组合式API</div>
              <div class="prompt-item">如何优化前端性能</div>
              <div class="prompt-item">写一个JavaScript防抖函数</div>
            </div>
          </div>
        </div>

        <!-- 用户消息示例（右侧） -->
        <div class="message user-message">
          <div class="message-content">
            你好，能介绍一下Vue3的主要特性吗？
          </div>
          <div class="message-avatar user-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>

        <!-- AI回复示例（左侧） -->
        <div class="message ai-message">
          <div class="message-avatar ai-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 1.8.7 3.4 1.8 4.6l-.9 3.1 2.8-1.4c.3.1.7.1 1 0l2.8 1.4-.9-3.1c1.1-1.2 1.8-2.8 1.8-4.6a8 8 0 0 0-8-8z"></path>
              <path d="M9 13h6"></path>
              <path d="M12 10v6"></path>
            </svg>
          </div>
          <div class="message-content">
            <p>Vue3相比Vue2有以下主要特性：</p>
            <ul>
              <li><strong>组合式API (Composition API)</strong>：提供了更灵活的代码组织方式，适合复杂组件的逻辑复用</li>
              <li><strong>更好的TypeScript支持</strong>：整个源码用TypeScript重写，提供完善的类型定义</li>
              <li><strong>更小的体积</strong>：通过Tree-shaking优化，打包体积更小</li>
              <li><strong>响应式系统重构</strong>：使用Proxy替代Object.defineProperty，支持更多数据类型</li>
              <li><strong>Teleport组件</strong>：可以将组件渲染到DOM树的任意位置</li>
              <li><strong>Suspense组件</strong>：支持异步组件的加载状态管理</li>
            </ul>
            <p>这些特性让Vue3在大型应用开发中更加高效和灵活。</p>
          </div>
        </div>

        <!-- 加载中的消息（AI，左侧） -->
        <div class="message ai-message loading" v-if="isLoading">
          <div class="message-avatar ai-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a8 8 0 0 0-8 8c0 1.8.7 3.4 1.8 4.6l-.9 3.1 2.8-1.4c.3.1.7.1 1 0l2.8 1.4-.9-3.1c1.1-1.2 1.8-2.8 1.8-4.6a8 8 0 0 0-8-8z"></path>
              <path d="M9 13h6"></path>
              <path d="M12 10v6"></path>
            </svg>
          </div>
          <div class="message-content">
            <div class="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="chat-input-container">
        <form @submit.prevent="sendMessage" class="chat-input-form">
          <textarea
            v-model="messageInput"
            placeholder="输入你的问题，按回车发送..."
            class="chat-input"
            rows="1"
            @keydown="handleInputKeydown"
          ></textarea>
          <button 
            type="submit" 
            class="send-btn"
            :disabled="!messageInput.trim() || isLoading"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
        <p class="input-hint">
          AI会根据你的输入生成回复，请注意保护隐私信息
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue'
import { getAISuggestion } from '@/api/openAI'

// 响应式数据
const messageInput = ref('') // 用户输入的消息
const isLoading = ref(false) // 是否正在加载AI回复
const messagesContainer = ref(null) // 消息容器引用

// 从全局获取id为：live2d-widget的元素,设置隐藏
const live2dWidget = ref(null)
live2dWidget.value = document.getElementById('live2d-widget')
console.log(`live2dWidget.value`, live2dWidget.value)
live2dWidget.value.style.opacity = '0'



// 监听消息容器变化，自动滚动到底部
watch([() => messageInput.value, isLoading], () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
})

// 处理新聊天按钮点击
const handleNewChat = () => {
  // TODO: 清空聊天记录逻辑
  messageInput.value = ''
  // 这里可以添加重置聊天记录的代码
}

// 处理输入框键盘事件（Shift+Enter换行，Enter发送）
const handleInputKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

// 发送消息（核心接口调用逻辑）
const sendMessage = async () => {
  const message = messageInput.value.trim()
  if (!message || isLoading.value) return

  // 1. 添加用户消息到聊天记录
  // TODO: 实际项目中需要将用户消息添加到消息列表数组中
  console.log('用户消息:', message)
  
  // 2. 清空输入框
  messageInput.value = ''
  
  // 3. 显示加载状态
  isLoading.value = true

  try {
    // 4. 调用OpenAI API（接口调用位置）
    await getAISuggestion(message, (res) => {
        console.log(`AI回复: ${res}`)
    })

    // 模拟AI回复（实际项目中替换为真实接口返回数据）
    const mockReply = "这是模拟的AI回复。在实际项目中，这里会替换为从OpenAI API获取的真实回复内容。"
    
  } catch (error) {
    // 错误处理
    console.error('API调用失败:', error)
    // TODO: 显示错误提示
  } finally {
    // 隐藏加载状态
    isLoading.value = false
  }
}
</script>

<style scoped>
/* 定义CSS变量 */
:root {
  --max-width-layout-small-padding: 16px;
  --max-width-layout-large-padding: 64px;
  --left-side-width: 260px; /* 侧边栏宽度 */
  --right-side-width: 0px;   /* 右侧无额外区域，设为0 */
}

/* 全局容器样式 */
.chat-container {
  display: flex;
  height: 100vh;
  background-color: #f9f9f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 侧边栏样式 */
.sidebar {
  width: var(--left-side-width);
  background-color: #202123;
  color: #e5e7eb;
  display: flex;
  flex-direction: column;
  padding: 1rem;
  gap: 1rem;
  overflow-y: auto;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background-color: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: #e5e7eb;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
}

.new-chat-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.chat-history {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.history-item.active {
  background-color: rgba(255, 255, 255, 0.1);
}

.history-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: auto;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.sidebar-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

/* 主聊天区域样式 */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #ffffff;
}

/* 新增：聊天标题栏样式 */
.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  background-color: #ffffff;
}

.chat-title h1 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.user-profile {
  display: flex;
  align-items: center;
}

.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.profile-avatar:hover {
  background-color: #4f46e5;
}

/* 消息列表样式 - 核心修改：设置clamp响应式padding */
.chat-messages {
  flex: 1;
  /* 关键：使用clamp实现响应式padding */
  padding: clamp(16px, 18%, 1000px);
  padding-top: 2rem;
  padding-bottom: 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  background-color: #ffffff;
}

.message {
  display: flex;
  gap: 1.25rem;
  max-width: 100%;
  width: 100%;
  align-items: flex-start;
}

/* AI消息（左侧）样式 */
.ai-message {
  justify-content: flex-start;
}

/* 用户消息（右侧）样式 */
.user-message {
  justify-content: flex-end;
}

.message-avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ai-avatar {
  background-color: #10a37f;
  color: white;
}

.user-avatar {
  background-color: #6366f1;
  color: white;
}

.message-content {
  flex: 0 1 800px;
  line-height: 1.6;
  font-size: 1rem;
  color: #374151;
}

/* 欢迎消息样式（AI左侧） */
.welcome-message .message-content {
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #111827;
  }
  
  p {
    margin-bottom: 1.5rem;
    color: #4b5563;
  }
}

.suggested-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 1rem;
}

.prompt-item {
  padding: 0.75rem 1rem;
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  color: #374151;
}

.prompt-item:hover {
  background-color: #e5e7eb;
}

/* 用户消息内容样式（右侧） */
.user-message .message-content {
  background-color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  text-align: left;
}

/* AI消息内容样式（左侧） */
.ai-message .message-content {
  text-align: left;
  ul {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
  }
  
  li {
    margin-bottom: 0.5rem;
  }
  
  strong {
    color: #111827;
  }
}

/* 加载动画 */
.loading-dots {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 1rem 0;
}

.loading-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #9ca3af;
  animation: loading 1.4s infinite ease-in-out both;
}

.loading-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loading-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes loading {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1);
  }
  100% {
    transform: scale(0);
  }
}

/* 输入区域样式 */
.chat-input-container {
  padding: 1rem 2rem;
  border-top: 1px solid #e5e7eb;
  background-color: #ffffff;
}

.chat-input-form {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 800px;
  margin: 0 auto;
}

.chat-input {
  flex: 1;
  padding: 0.875rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  resize: none;
  font-size: 0.9rem;
  line-height: 1.5;
  color: #374151;
  font-family: inherit;
  transition: border-color 0.2s;
  min-height: 44px;
  max-height: 200px;
}

.chat-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.send-btn {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  border-radius: 0.5rem;
  background-color: #6366f1;
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.send-btn:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.send-btn:not(:disabled):hover {
  background-color: #4f46e5;
}

.input-hint {
  max-width: 800px;
  margin: 0.75rem auto 0;
  font-size: 0.75rem;
  color: #9ca3af;
  text-align: center;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    left: -260px;
    top: 0;
    height: 100vh;
    z-index: 100;
    transition: left 0.3s;
  }
  
  .sidebar.show {
    left: 0;
  }
  
  .chat-header {
    padding: 1rem;
  }
  
  .chat-messages {
    padding: 1rem;
    gap: 1.5rem;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .chat-input-container {
    padding: 1rem;
  }
}
</style>