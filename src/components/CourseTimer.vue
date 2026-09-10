<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from "vue";
import { Play, Pause, RotateCcw, Timer } from "lucide-vue-next";
import BaseButton from "./BaseButton.vue";
import { remainingSeconds, formatTimer } from "../lib/progress";
const props = defineProps<{ minutes: number; context: string }>();
const chosen = ref(props.minutes);
const seconds = ref(props.minutes * 60);
const running = ref(false);
const ended = ref(false);
let deadline = 0;
const valid = computed(
  () =>
    Number.isInteger(chosen.value) && chosen.value >= 1 && chosen.value <= 180,
);
function reset() {
  running.value = false;
  ended.value = false;
  if (valid.value) seconds.value = chosen.value * 60;
}
function toggle() {
  if (running.value) {
    seconds.value = remainingSeconds(deadline, Date.now());
    running.value = false;
  } else if (valid.value) {
    if (seconds.value === 0) reset();
    deadline = Date.now() + seconds.value * 1000;
    running.value = true;
  }
}
watch(
  () => props.context,
  () => {
    chosen.value = props.minutes;
    reset();
  },
);
watch(chosen, reset);
const interval = window.setInterval(() => {
  if (running.value) {
    seconds.value = remainingSeconds(deadline, Date.now());
    if (seconds.value === 0) {
      running.value = false;
      ended.value = true;
    }
  }
}, 250);
onUnmounted(() => window.clearInterval(interval));
</script>
<template>
  <section class="timer-panel" aria-label="课堂计时器">
    <div class="section-kicker"><Timer :size="16" /> 课堂计时</div>
    <div
      class="timer-number"
      :class="{ 'timer-ended': ended }"
      role="timer"
      aria-live="off"
    >
      {{ formatTimer(seconds) }}
    </div>
    <div class="timer-controls">
      <BaseButton
        :disabled="!valid"
        :aria-label="running ? '暂停计时' : '开始计时'"
        @click="toggle"
        ><Pause v-if="running" :size="15" /><Play v-else :size="15" />{{
          running ? "暂停" : "开始"
        }}</BaseButton
      ><BaseButton aria-label="重置计时" @click="reset"
        ><RotateCcw :size="15"
      /></BaseButton>
    </div>
    <label class="timer-setting"
      >本步建议 / 可调整
      <span
        ><input
          v-model.number="chosen"
          type="number"
          min="1"
          max="180"
          step="1"
          aria-label="计时分钟"
          aria-describedby="timer-error"
          :aria-invalid="!valid"
        />
        分钟</span
      ></label
    >
    <p v-if="!valid" id="timer-error" class="error-text" role="alert">
      请输入 1—180 的整数分钟。
    </p>
    <p v-if="ended" class="timer-feedback" role="status">
      时间到，请检查成果后继续。
    </p>
    <p class="small muted">只用于课堂控时，切换页面后重置。</p>
  </section>
</template>
