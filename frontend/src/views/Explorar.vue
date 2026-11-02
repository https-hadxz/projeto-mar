<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../services/api'
import ArticleCard from '../components/ArticleCard.vue'

const route = useRoute()
const router = useRouter()

const busca = ref(route.query.q || '')
const artigos = ref([])
const carregando = ref(false)
const erro = ref('')

async function carregar() {
  carregando.value = true
  erro.value = ''
  const params = new URLSearchParams()
  if (route.query.q) params.set('q', route.query.q)
  if (route.query.tag) params.set('tag', route.query.tag)

  try {
    artigos.value = await request(`/api/articles?${params.toString()}`)
  } catch (e) {
    erro.value = e.message
  }
  carregando.value = false
}

function buscar() {
  const q = busca.value.trim()
  router.push({ path: '/explorar', query: q ? { q } : {} })
}

function limpar() {
  busca.value = ''
  router.push({ path: '/explorar' })
}

watch(() => [route.query.q, route.query.tag], carregar, { immediate: true })
</script>

<template>
  <h1>Explorar</h1>

  <form class="row" style="margin-bottom: 20px" @submit.prevent="buscar">
    <input
      v-model="busca"
      type="search"
      placeholder="Buscar por título, texto ou tag…"
      style="flex: 1; min-width: 200px"
    />
    <button class="btn" type="submit">Buscar</button>
  </form>

  <p v-if="route.query.q || route.query.tag" class="muted">
    Mostrando resultados para
    <strong>{{ route.query.q || '#' + route.query.tag }}</strong>
    · <button class="link-btn" @click="limpar">limpar filtro</button>
  </p>

  <p v-if="carregando" class="muted">
    Carregando… na primeira vez o servidor pode levar até 1 minuto para acordar.
  </p>
  <p v-else-if="erro" class="error-msg">{{ erro }}</p>
  <p v-else-if="!artigos.length" class="muted">Nenhum artigo encontrado.</p>
  <div v-else class="grid">
    <ArticleCard v-for="a in artigos" :key="a.id" :article="a" />
  </div>
</template>