<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { request } from '../services/api'
import { auth } from '../stores/auth'
import { formatarData } from '../utils/format'
import ArticleCard from '../components/ArticleCard.vue'
import AnimalCard from '../components/AnimalCard.vue'

const router = useRouter()

const meusArtigos = ref([])
const meusAnimais = ref([])
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    const [artigos, animais] = await Promise.all([
      request(`/api/articles?author=${auth.user.id}`),
      request(`/api/animals?owner=${auth.user.id}`)
    ])
    meusArtigos.value = artigos
    meusAnimais.value = animais
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

  <p v-if="carregando" class="muted" style="margin-top: 20px">Carregando…</p>
  <p v-else-if="erro" class="error-msg" style="margin-top: 20px">{{ erro }}</p>

  <template v-else>
    <h2 style="margin-top: 28px">Meus animais</h2>
    <p v-if="!meusAnimais.length" class="muted">
      Você ainda não cadastrou nenhum animal.
      <RouterLink to="/animais/novo">Cadastrar o primeiro</RouterLink>
    </p>
    <div v-else class="grid">
      <AnimalCard v-for="a in meusAnimais" :key="a.id" :animal="a" />
    </div>

    <h2 style="margin-top: 28px">Meus artigos</h2>
    <p v-if="!meusArtigos.length" class="muted">
      Você ainda não escreveu nada.
      <RouterLink to="/novo">Escrever o primeiro artigo</RouterLink>
    </p>
    <div v-else class="grid">
      <ArticleCard v-for="a in meusArtigos" :key="a.id" :article="a" />
    </div>
  </template>
</template>