<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../services/api'
import { auth } from '../stores/auth'
import AnimalCard from '../components/AnimalCard.vue'

const route = useRoute()
const router = useRouter()

const busca = ref(route.query.q || '')
const animais = ref([])
const carregando = ref(false)
const erro = ref('')

const aviso = computed(() =>
  route.query.msg === 'excluido' ? 'Animal excluído com sucesso.' : ''
)

async function carregar() {
  carregando.value = true
  erro.value = ''
  const params = new URLSearchParams()
  if (route.query.q) params.set('q', route.query.q)

  try {
    animais.value = await request(`/api/animals?${params.toString()}`)
  } catch (e) {
    erro.value = e.message
  }
  carregando.value = false
}

function buscar() {
  const q = busca.value.trim()
  router.push({ path: '/animais', query: q ? { q } : {} })
}

function limpar() {
  busca.value = ''
  router.push({ path: '/animais' })
}

watch(() => route.query.q, carregar, { immediate: true })
</script>

<template>
  <div class="row" style="justify-content: space-between">
    <h1>Animais</h1>
    <RouterLink v-if="auth.token" to="/animais/novo" class="btn">Cadastrar animal</RouterLink>
    <RouterLink
      v-else
      :to="{ name: 'login', query: { redirect: '/animais/novo' } }"
      class="btn btn-outline"
    >
      Entre para cadastrar
    </RouterLink>
  </div>

  <p v-if="aviso" class="success-msg" role="status">{{ aviso }}</p>

  <form class="row" style="margin-bottom: 20px" @submit.prevent="buscar">
    <input
      v-model="busca"
      type="search"
      placeholder="Buscar por nome, espécie, raça ou local…"
      style="flex: 1; min-width: 200px"
    />
    <button class="btn" type="submit">Buscar</button>
  </form>

  <p v-if="route.query.q" class="muted">
    Resultados para <strong>{{ route.query.q }}</strong>
    · <button class="link-btn" @click="limpar">limpar filtro</button>
  </p>

  <p v-if="carregando" class="muted">
    Carregando… na primeira vez o servidor pode levar até 1 minuto para acordar.
  </p>
  <p v-else-if="erro" class="error-msg">{{ erro }}</p>
  <p v-else-if="!animais.length" class="muted">Nenhum animal cadastrado ainda.</p>
  <div v-else class="grid">
    <AnimalCard v-for="a in animais" :key="a.id" :animal="a" />
  </div>
</template>