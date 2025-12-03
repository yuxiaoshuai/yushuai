<!-- src/views/Timeline3D/components/MonthCard.vue -->
<template>
  <div
    class="month-card"
    :class="{ active: active }"
    :style="cardStyle"
    @click="onCardClick"
  >
    <div class="month-card-title">{{ month.name }}</div>
    <div class="month-card-content line-clamp-2">
      {{ month.content }}
    </div>

    <div class="month-card-stats">
      <!-- 点赞 -->
      <div class="stat-item">
        <i
          class="stat-icon like-icon"
          :class="[likeSolid ? 'fas fa-heart solid' : 'far fa-heart', liked ? 'active' : '']"
          @click.stop="toggleLike"
        ></i>
        <span class="like-count">{{ likeCount }}</span>
      </div>

      <!-- 评论 -->
      <div class="stat-item">
        <i
          class="stat-icon comment-icon"
          :class="[commentSolid ? 'fas fa-comment solid' : 'far fa-comment', commented ? 'active' : '']"
          @click.stop="toggleComment"
        ></i>
        <span class="comment-count">{{ commentCount }}</span>
      </div>

      <!-- 浏览 -->
      <div class="stat-item">
        <i class="fas fa-eye stat-icon solid"></i>
        <span>{{ month.stats.views }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  year: { type: String, required: true },
  month: { type: Object, required: true },
  active: { type: Boolean, default: false },
  liked: { type: Boolean, default: false },
  commented: { type: Boolean, default: false },
  likeSolid: { type: Boolean, default: false },
  commentSolid: { type: Boolean, default: false },
  likeCount: { type: Number, required: true },
  commentCount: { type: Number, required: true },
  visible: { type: Boolean, default: true },
  delayIndex: { type: Number, default: 0 },
});
const emit = defineEmits(["select-month", "toggle-like", "toggle-comment"]);

const cardStyle = computed(() => ({
  opacity: props.visible ? 1 : 0,
  transition: "opacity .5s ease, transform .5s ease",
  transitionDelay: `${props.delayIndex * 0.05}s`,
}));

function onCardClick(e) {
  emit("select-month", props.month.month);
}

function toggleLike() {
  emit("toggle-like", props.month.month);
}
function toggleComment() {
  emit("toggle-comment", props.month.month);
}
</script>
