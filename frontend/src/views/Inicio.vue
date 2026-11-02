<script setup>
import { ref, onMounted } from 'vue'
import { request } from '../services/api'
import { auth } from '../stores/auth'
import ArticleCard from '../components/ArticleCard.vue'

const recentes = ref([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    recentes.value = await request('/api/articles?limit=6')
  } catch (e) {
    erro.value = e.message
  }
  carregando.value = false
})
</script>

<template>
  <section class="hero">
    <h1>🌊 Enciclopédia do Mar</h1>
    <p class="muted">
      Fatos, curiosidades e conhecimento sobre o oceano, escritos por quem ama o mar.
    </p>
    <div class="row" style="justify-content: center">
      <RouterLink to="/explorar" class="btn">Explorar artigos</RouterLink>
      <RouterLink v-if="auth.token" to="/novo" class="btn btn-outline">
        Escrever um artigo
      </RouterLink>
      <RouterLink v-else to="/cadastro" class="btn btn-outline">Criar conta</RouterLink>
    </div>
  </section>

  <h2>Artigos recentes</h2>
  <p v-if="carregando" class="muted">
    Carregando… na primeira vez o servidor pode levar até 1 minuto para acordar.
  </p>
  <p v-else-if="erro" class="error-msg">{{ erro }}</p>
  <p v-else-if="!recentes.length" class="muted">
    Ainda não há artigos. Seja a primeira pessoa a escrever!
  </p>
  <div v-else class="grid">
    <ArticleCard v-for="a in recentes" :key="a.id" :article="a" />
  </div>
</template>