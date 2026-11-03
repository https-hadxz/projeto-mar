<script setup>
import { computed } from 'vue'
import { avatarUrl } from '../services/api'

const props = defineProps({
  usuario: { type: Object, default: null },
  tamanho: { type: Number, default: 44 }
})

const inicial = computed(() =>
  (props.usuario?.username || '?').trim().charAt(0).toUpperCase()
)
</script>

<template>
  <span
    class="avatar"
    :style="{
      width: tamanho + 'px',
      height: tamanho + 'px',
      fontSize: Math.round(tamanho * 0.42) + 'px'
    }"
  >
    <img
      v-if="usuario && usuario.hasAvatar"
      :src="avatarUrl(usuario.id, usuario.version)"
      alt=""
      loading="lazy"
    />
    <span v-else aria-hidden="true">{{ inicial }}</span>
  </span>
</template>