<template>
  <div class="chat-box">

    <!-- 顶部区域 -->
    <div class="chat-nav">
      <div class="nav-core-left">
        <div>
          <button @click="initPeer">{{ peerId ? '更新 Peer' : '初始化 Peer' }}</button>
          <button @click="connectToOtherPeer" :disabled="!peerId || isConnected">连接对方</button>
          <button @click="disconnect" :disabled="!isConnected">断开连接</button>
        </div>
      </div>

      <div class="nav-core-center peer-id" @click="copyPeerId">
        <h1>Peer A的 Peer ID: </h1>
        <button v-if="!peerId" @click="initPeer">初始化 Peer</button>
        <p v-else class="id-text">
          {{ peerId }}
          <span v-if="showCopied" class="copied-indicator">✓ 已复制</span>
        </p>
      </div>

      <div class="nav-core-right">
        <div v-if="connectionClosed" class="connection-status">会话已结束</div>
      </div>
      
    </div>

    <!-- 聊天记录 -->
    <div class="chat-history">
      <div class="chat-history-core">
        <div
          v-for="(item, index) in chatHistory"
          :key="index"
          :class="['message-item', item.direction === 'in' ? 'message-item-left' : 'message-item-right']"
        >
          <div class="message-meta">
            {{ item.timestamp }} | {{ item.direction === 'in' ? '接收' : '发送' }}
          </div>
          <div v-if="item.type === 'text'" class="text-message">
            {{ item.content }}
          </div>
          <div v-else-if="item.type === 'image'" class="image-message">
            <img :src="item.content" alt="收到的图片" @load="revokeOldUrls(index)" />
          </div>
        </div>
      </div>
    </div>

    <!-- 底部区域 -->
    <div class="chat-command">
      <!-- 文字消息区域 -->
      <div class="message-area">
        <input v-model="message" placeholder="输入消息" :disabled="!isConnected" />
        <button @click="sendMessage" :disabled="!isConnected">发送文字</button>
      </div>
      
      <!-- 图片发送区域 -->
      <div class="image-area">
        <input 
          type="file" 
          accept="image/*" 
          @change="handleImageSelect" 
          :disabled="!isConnected" 
          ref="fileInput"
        />
        <button @click="sendImage" :disabled="!selectedImage || !isConnected">发送图片</button>
        <progress v-if="uploading" :value="uploadProgress" max="100"></progress>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { Peer } from 'peerjs';

const props = defineProps({});

const peer = ref(null);
const peerId = ref('');
const conn = ref(null);
const message = ref('');
const isConnected = ref(false);
const connectionClosed = ref(false);
const showCopied = ref(false);

// 图片相关状态
const fileInput = ref(null);
const selectedImage = ref(null);
const uploading = ref(false);
const uploadProgress = ref(0);

// 聊天记录
const chatHistory = ref([]);
const blobUrls = ref([]); // 用于管理Blob URL

// 初始化 Peer
const initPeer = () => {
  peer.value = new Peer();
  peer.value.on('open', (id) => {
    peerId.value = id;
    console.log('Peer ID:', id);
  });

  peer.value.on('connection', (connection) => {
    conn.value = connection;
    setupConnectionEvents();
  });
};

// 设置连接事件
const setupConnectionEvents = () => {
  conn.value.on('open', () => {
    isConnected.value = true;
    connectionClosed.value = false;
    addToChatHistory('系统', '连接已建立', 'system');
  });

  conn.value.on('data', (data) => {
    try {
      if (typeof data === 'string') {
        // 文本消息
        addToChatHistory('对方', data, 'text', 'in');
      } else if (data.type === 'image') {
        // 图片消息
        const blob = new Blob([data.content], { type: data.mimeType });
        const blobUrl = URL.createObjectURL(blob);
        blobUrls.value.push(blobUrl);
        addToChatHistory('对方', blobUrl, 'image', 'in');
      }
    } catch (error) {
      console.error('处理接收数据出错:', error);
    }
  });

  conn.value.on('close', handleDisconnection);
};

// 连接对方
const connectToOtherPeer = () => {
  const otherPeerId = prompt('输入对方的 Peer ID');
  if (!otherPeerId) return;

  conn.value = peer.value.connect(otherPeerId);
  setupConnectionEvents();
};

// 发送文字消息
const sendMessage = () => {
  if (!isConnected.value || !message.value.trim()) return;
  
  conn.value.send(message.value);
  addToChatHistory('我', message.value, 'text', 'out');
  message.value = '';
};

// 选择图片
const handleImageSelect = (event) => {
  const file = event.target.files[0];
  if (file && file.type.match('image.*')) {
    selectedImage.value = file;
  } else {
    alert('请选择有效的图片文件');
    event.target.value = '';
    selectedImage.value = null;
  }
};

// 发送图片
const sendImage = async () => {
  if (!selectedImage.value || !isConnected.value) return;
  
  uploading.value = true;
  uploadProgress.value = 0;
  
  try {
    const arrayBuffer = await readFileAsArrayBuffer(selectedImage.value);
    
    // 创建预览
    const previewUrl = URL.createObjectURL(selectedImage.value);
    blobUrls.value.push(previewUrl);
    addToChatHistory('我', previewUrl, 'image', 'out');
    
    // 发送图片数据
    conn.value.send({
      type: 'image',
      mimeType: selectedImage.value.type,
      content: arrayBuffer
    });
    
  } catch (error) {
    console.error('发送图片失败:', error);
    alert('发送图片失败');
  } finally {
    uploading.value = false;
    selectedImage.value = null;
    if (fileInput.value) fileInput.value.value = '';
  }
};

// 辅助函数：读取文件为ArrayBuffer
const readFileAsArrayBuffer = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// 添加消息到聊天记录
const addToChatHistory = (sender, content, type, direction) => {
  chatHistory.value.push({
    sender,
    content,
    type,
    direction,
    timestamp: new Date().toLocaleTimeString()
  });
};

// 释放旧的Blob URL
const revokeOldUrls = (currentIndex) => {
  // 保留最近5个图片的Blob URL，释放其他的
  if (blobUrls.value.length > 5) {
    const urlsToKeep = [];
    for (let i = Math.max(0, currentIndex - 2); i <= currentIndex + 2; i++) {
      if (i >= 0 && i < chatHistory.value.length && chatHistory.value[i].type === 'image') {
        urlsToKeep.push(chatHistory.value[i].content);
      }
    }
    
    blobUrls.value.forEach(url => {
      if (!urlsToKeep.includes(url)) {
        URL.revokeObjectURL(url);
      }
    });
    
    blobUrls.value = urlsToKeep;
  }
};

// 复制 Peer ID
const copyPeerId = async () => {
  if (!peerId.value) return;
  try {
    await navigator.clipboard.writeText(peerId.value);
    showCopied.value = true;
    setTimeout(() => showCopied.value = false, 2000);
  } catch (err) {
    console.error('复制失败:', err);
    alert('复制失败，请手动复制');
  }
};

// 断开连接
const disconnect = () => {
  conn.value?.close();
  handleDisconnection();
};

// 处理断开
const handleDisconnection = () => {
  isConnected.value = false;
  connectionClosed.value = true;
  conn.value = null;
  addToChatHistory('系统', '连接已断开', 'system');
};

// 组件卸载前清理
onBeforeUnmount(() => {
  // 释放所有Blob URL
  blobUrls.value.forEach(url => URL.revokeObjectURL(url));
  blobUrls.value = [];
  
  // 关闭连接
  if (conn.value) conn.value.close();
  if (peer.value) peer.value.destroy();
});
</script>

<style>
.message-area, .image-area {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 5px;
}

.message-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.message-item {
  margin: 10px 0;
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.text-message {
  padding: 5px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.image-message img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.message-meta {
  font-size: 0.8em;
  color: #666;
  margin-top: 3px;
}

.peer-id {
  cursor: pointer;
  padding: 5px;
  margin: 5px 0;
}

.peer-id:hover {
  background-color: #f5f5f5;
}

.id-text {
  text-decoration: underline;
  font-weight: bold;
}

.copied-indicator {
  color: green;
  margin-left: 5px;
}

.connection-status {
  color: red;
  font-weight: bold;
}

progress {
  width: 100%;
  height: 10px;
  margin-top: 5px;
}

.nav-core-center h1 {
  font-size: 17px;
  margin: 0;
  padding: 0;
  margin-right: 10px;
}
.nav-core-left button {
  margin-right: 10px;
}
.nav-core-right {
  justify-content: flex-end;
}
.nav-core-center {
  display: flex;
  align-items: center;
  flex: 2;
}
.nav-core-left {
  justify-content: flex-start;
}
.chat-nav>div {
  flex: 1;
  display: flex;
}
.chat-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 10px;
  background-color: #f0f0f0;
  border-bottom: 1px solid #ddd;
}

.chat-history {
  flex: 1;
  overflow: hidden;
  overflow-y: auto;
}

.chat-command {
  width: 100%;
  height: 68px;
  padding: 5px 10px;
  display: flex;
  background-color: #dadada;
}

.chat-box {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
  /* filter: blur(20px); */
}
</style>