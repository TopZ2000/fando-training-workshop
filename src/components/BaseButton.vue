<script setup lang="ts">
withDefaults(
  defineProps<{ primary?: boolean; quiet?: boolean; disabled?: boolean }>(),
  { primary: false, quiet: false, disabled: false },
);
</script>
<template>
  <button
    class="button"
    :class="{ 'button--primary': primary, 'button--quiet': quiet }"
    :disabled="disabled"
  >
    <slot />
  </button>
</template>
