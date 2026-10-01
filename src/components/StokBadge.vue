<script setup>
const props = defineProps({
  stok: {
    type: Number,
    default: 0
  },
  stokMinimum: {
    type: Number,
    default: 10
  },
  size: {
    type: String,
    enum: ['sm', 'md', 'lg'],
    default: 'md'
  }
})

const getStatus = () => {
  if (props.stok === 0) {
    return {
      label: '🚨 Habis',
      color: 'bg-red-600 text-white',
      badge: 'bg-red-100 text-red-700 border-red-200'
    }
  } else if (props.stok <= props.stokMinimum) {
    return {
      label: `⚠️ Menipis (${props.stok})`,
      color: 'bg-amber-600 text-white',
      badge: 'bg-amber-100 text-amber-700 border-amber-200'
    }
  } else {
    return {
      label: `✅ Tersedia (${props.stok})`,
      color: 'bg-emerald-600 text-white',
      badge: 'bg-emerald-100 text-emerald-700 border-emerald-200'
    }
  }
}

const sizeClasses = {
  sm: 'px-2 py-1 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-2 text-sm'
}

const status = getStatus()
</script>

<template>
  <!-- Badge Style -->
  <span v-if="$slots.default" :class="['inline-flex rounded-full font-semibold border', sizeClasses[size], status.badge]">
    <slot />
  </span>
  
  <!-- Default: Icon + Text -->
  <span v-else :class="['inline-flex rounded-full font-semibold text-white shadow-sm', sizeClasses[size], status.color]">
    {{ status.label }}
  </span>
</template>
