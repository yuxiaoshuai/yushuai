<template>
  <div id="YUSHUAI"></div>
  <ShowDocx v-show="isShowDocx"/>
</template>

<script setup>
import ShowDocx from '@/views/ShowDocx.vue';

import { onMounted, ref } from 'vue';
import * as echarts from 'echarts';
import { useRouter } from 'vue-router';

const router = useRouter();

const isShowDocx = ref(false);

onMounted(() => {
  var chartDom = document.getElementById('YUSHUAI');
  var myChart = echarts.init(chartDom);

  var option = {
    graphic: {
      elements: [
        {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: 'Yu Shuai', // Yú Shuài
            fontSize: 100,
            fontWeight: 'bold',
            lineDash: [0, 200], // 设定初始的虚线样式
            lineDashOffset: 200,   // 控制虚线的起始位置
            fill: 'transparent',
            stroke: '#373839',
            lineWidth: 1
          },
          keyframeAnimation: {
            duration: 3000,
            // loop: true,
            keyframes: [
              {
                percent: 0.7,
                style: {
                  fill: 'transparent',
                  lineDashOffset: 200,
                  lineDash: [200, 0]
                }
              },
              {
                percent: 0.8,
                style: {
                  fill: 'transparent'
                }
              },
              {
                percent: 1,
                style: {
                  fill: 'black'
                }
              }
            ]
          }
        }
      ]
    }
  };

  myChart.setOption(option);

  // 监听动画完成事件
  myChart.on('finished', () => {
    // 动画完成后执行的操作
    // router.push('/Chat');
    router.push('/show-docx');
    // isShowDocx.value = true; // 显示文档
  });

  window.addEventListener('resize', () => {
    myChart.resize();
  });
});
</script>

<style scoped>
#YUSHUAI {
  width: 100%;
  height: 100%;
}
</style>
