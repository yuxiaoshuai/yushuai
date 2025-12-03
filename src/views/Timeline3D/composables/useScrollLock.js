// src/views/Timeline3D/composables/useScrollLock.js
import { onBeforeUnmount } from "vue";

export function useScrollLock() {
  let lastScrollY = 0;

  const lockScroll = () => {
    lastScrollY = window.scrollY;
    document.body.style.background = "#0a0a1a";
    document.body.classList.add("scroll-locked");
    document.body.style.top = `-${lastScrollY}px`;
  };

  const unlockScroll = () => {
    document.body.classList.remove("scroll-locked");
    document.body.style.top = "";
    document.body.style.background = "";
    setTimeout(() => window.scrollTo(0, lastScrollY), 50);
  };

  onBeforeUnmount(() => {
    // 离开页面时确保恢复
    if (document.body.classList.contains("scroll-locked")) unlockScroll();
  });

  return { lockScroll, unlockScroll };
}
