<script setup>
import { computed } from 'vue'
import { fotoUrl } from '../services/api'
import { formatarData } from '../utils/format'
import Avatar from './Avatar.vue'

const props = defineProps({
  post: { type: Object, required: true }
})

const ehAnimal = computed(() => props.post.type === 'animal')
const destino = computed(() =>
  ehAnimal.value ? `/animais/${props.post.id}` : `/artigo/${props.post.id}`
)
</script>

<template>
  <article class="post">
    <header class="post-topo">
      <RouterLink v-if="post.author" :to="`/u/${post.author.id}`" class="post-autor">
        <Avatar :usuario="post.author" :tamanho="44" />
        <span>
          <strong>{{ post.author.username }}</strong>
          <small class="muted">{{ formatarData(post.createdAt) }}</small>
        </span>
      </RouterLink>
      <span v-else class="muted">Autor desconhecido</span>
      <span class="selo">{{ ehAnimal ? 'Animal' : 'Artigo' }}</span>
    </header>

    <!-- Artigo -->
    <template v-if="!ehAnimal">
      <RouterLink :to="destino" class="post-corpo">
        <h2 class="post-titulo">{{ post.title }}</h2>
        <p class="post-texto">{{ post.excerpt }}<span v-if="post.truncated">…</span></p>
      </RouterLink>
      <div v-if="post.tags.length" class="tags">
        <RouterLink
          v-for="t in post.tags"
          :key="t"
          :to="{ path: '/explorar', query: { tag: t } }"
          class="tag"
        >
          #{{ t }}
        </RouterLink>
      </div>
    </template>

    <!-- Animal -->
    <div v-else class="post-animal-corpo">
      <RouterLink :to="destino" class="polaroid">
        <img
          v-if="post.hasPhoto"
          :src="fotoUrl(post.id, post.updatedAt)"
          alt=""
          loading="lazy"
        />
        <div v-else class="polaroid-vazio" aria-hidden="true">🐚</div>
        <span class="polaroid-legenda">{{ post.name }}</span>
      </RouterLink>

      <div>
        <h2 class="post-titulo">{{ post.name }}</h2>
        <p class="muted" style="margin-bottom: 8px">
          <em>{{ post.species }}</em><span v-if="post.breed"> · {{ post.breed }}</span>
          <span v-if="post.age !== null"> · {{ post.age }} {{ post.age === 1 ? 'ano' : 'anos' }}</span>
        </p>
        <p class="post-texto">{{ post.excerpt }}<span v-if="post.truncated">…</span></p>
        <p v-if="post.locationName" class="muted" style="margin: 0">📍 {{ post.locationName }}</p>
      </div>
    </div>

    <footer class="post-rodape">
      <RouterLink :to="destino">{{ ehAnimal ? 'Ver detalhes' : 'Ler artigo' }} →</RouterLink>
    </footer>
  </article>
</template>