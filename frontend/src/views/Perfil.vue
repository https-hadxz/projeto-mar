<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { request } from '../services/api'
import { auth } from '../stores/auth'
import { formatarData } from '../utils/format'
import ArticleCard from '../components/ArticleCard.vue'

const router = useRouter()

const meus = ref([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    meus.value = await request(`/api/articles?author=${auth.user.id}`)
  } catch (e) {
    erro.value = e.message
  }
  carregando.value = false
})

function sair() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <section v-if="auth.user" class="card">
    <h1>{{ auth.user.username }}</h1>
    <p class="muted">
      {{ auth.user.email }} · membro desde {{ formatarData(auth.user.createdAt) }}
      <span v-if="auth.user.role === 'admin'"> · admin</span>
    </p>
    <button class="btn btn-outline" @click="sair">Sair da conta</button>
  </section>

  <h2 style="margin-top: 28px">Meus artigos</h2>
  <p v-if="carregando" class="muted">Carregando…</p>
  <p v-else-if="erro" class="error-msg">{{ erro }}</p>
  <p v-else-if="!meus.length" class="muted">
    Você ainda não escreveu nada.
    <RouterLink to="/novo">Escrever o primeiro artigo</RouterLink>
  </p>
  <div v-else class="grid">
    <ArticleCard v-for="a in meus" :key="a.id" :article="a" />
  </div>
</template>