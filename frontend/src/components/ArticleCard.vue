<script setup>
import { formatarData } from '../utils/format'

defineProps({
  article: { type: Object, required: true }
})
</script>

<template>
  <RouterLink :to="`/artigo/${article.id}`" class="card article-card">
    <h3>{{ article.title }}</h3>
    <p class="muted">
      {{ article.excerpt }}<span v-if="article.excerpt.length >= 200">…</span>
    </p>
    <div class="muted" style="font-size: 14px">
      por {{ article.author || 'desconhecido' }} · {{ formatarData(article.updatedAt) }}
    </div>
    <div v-if="article.tags.length" class="tags">
      <span v-for="t in article.tags" :key="t" class="tag">#{{ t }}</span>
    </div>
  </RouterLink>
</template>