<script setup>
import { fotoUrl } from '../services/api'

defineProps({
  animal: { type: Object, required: true }
})
</script>

<template>
  <RouterLink :to="`/animais/${animal.id}`" class="card article-card animal-card">
    <img
      v-if="animal.hasPhoto"
      :src="fotoUrl(animal.id, animal.updatedAt)"
      :alt="`Foto de ${animal.name}`"
      class="animal-foto"
      loading="lazy"
    />
    <div v-else class="animal-foto-vazia">🐚</div>

    <div class="corpo">
      <h3>{{ animal.name }}</h3>
      <p class="muted" style="margin: 0 0 6px">
        {{ animal.species }}<span v-if="animal.breed"> · {{ animal.breed }}</span>
      </p>
      <p v-if="animal.locationName" class="muted" style="margin: 0; font-size: 14px">
        📍 {{ animal.locationName }}
      </p>
      <div class="muted" style="font-size: 14px">
        cadastrado por {{ animal.owner || 'desconhecido' }}
      </div>
    </div>
  </RouterLink>
</template>