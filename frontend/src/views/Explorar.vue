<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../services/api'
import ArticleCard from '../components/ArticleCard.vue'
import AnimalCard from '../components/AnimalCard.vue'

const route = useRoute()
const router = useRouter()

const busca = ref(route.query.q || '')
const artigos = ref([])
const animais = ref([])
const carregando = ref(false)
const erroArtigos = ref('')
const erroAnimais = ref('')

const tag = computed(() => route.query.tag || '')

// Tags só existem nos artigos, então filtrar por tag mostra só artigos
const tipo = computed(() => {
  if (tag.value) return 'artigos'
  return ['artigos', 'animais'].includes(route.query.tipo) ? route.query.tipo : 'tudo'
})

const mostraArtigos = computed(() => tipo.value !== 'animais')
const mostraAnimais = computed(() => tipo.value !== 'artigos')
const limite = computed(() => (tipo.value === 'tudo' ? 12 : 60))

const semResultados = computed(
  () =>
    !carregando.value &&
    !erroArtigos.value &&
    !erroAnimais.value &&
    (!mostraArtigos.value || !artigos.value.length) &&
    (!mostraAnimais.value || !animais.value.length)
)

async function carregar() {
  carregando.value = true
  erroArtigos.value = ''
  erroAnimais.value = ''

  const params = new URLSearchParams()
  if (route.query.q) params.set('q', route.query.q)
  params.set('limit', String(limite.value))

  const paramsArtigos = new URLSearchParams(params)
  if (tag.value) paramsArtigos.set('tag', tag.value)

  const [resArtigos, resAnimais] = await Promise.allSettled([
    mostraArtigos.value
      ? request(`/api/articles?${paramsArtigos.toString()}`)
      : Promise.resolve([]),
    mostraAnimais.value
      ? request(`/api/animals?${params.toString()}`)
      : Promise.resolve([])
  ])

  if (resArtigos.status === 'fulfilled') {
    artigos.value = resArtigos.value
  } else {
    artigos.value = []
    erroArtigos.value = resArtigos.reason?.message || 'Erro ao carregar artigos.'
  }

  if (resAnimais.status === 'fulfilled') {
    animais.value = resAnimais.value
  } else {
    animais.value = []
    erroAnimais.value = resAnimais.reason?.message || 'Erro ao carregar animais.'
  }

  carregando.value = false
}

function irPara(novoTipo, q) {
  const query = {}
  if (q) query.q = q
  if (novoTipo !== 'tudo') query.tipo = novoTipo
  router.push({ path: '/explorar', query })
}

function buscar() {
  irPara(tipo.value, busca.value.trim())
}

function limpar() {
  busca.value = ''
  irPara(tipo.value === 'artigos' && tag.value ? 'tudo' : tipo.value, '')
}

watch(() => [route.query.q, route.query.tag, route.query.tipo], carregar, {
  immediate: true
})
</script>

<template>
  <h1>Explorar</h1>

  <form class="row" style="margin-bottom: 16px" @submit.prevent="buscar">
    <input
      v-model="busca"
      type="search"
      placeholder="Buscar artigos e animais…"
      style="flex: 1; min-width: 200px"
    />
    <button class="btn" type="submit">Buscar</button>
  </form>

  <div class="row" style="margin-bottom: 16px">
    <button
      class="btn btn-sm"
      :class="{ 'btn-outline': tipo !== 'tudo' }"
      @click="irPara('tudo', route.query.q)"
    >
      Tudo
    </button>
    <button
      class="btn btn-sm"
      :class="{ 'btn-outline': tipo !== 'artigos' }"
      @click="irPara('artigos', route.query.q)"
    >
      Artigos
    </button>
    <button
      class="btn btn-sm"
      :class="{ 'btn-outline': tipo !== 'animais' }"
      :disabled="!!tag"
      @click="irPara('animais', route.query.q)"
    >
      Animais
    </button>
  </div>

  <p v-if="route.query.q || tag" class="muted">
    Resultados para <strong>{{ route.query.q || '#' + tag }}</strong>
    · <button class="link-btn" @click="limpar">limpar filtro</button>
  </p>

  <p v-if="carregando" class="muted">
    Carregando… na primeira vez o servidor pode levar até 1 minuto para acordar.
  </p>

  <template v-else>
    <p v-if="semResultados" class="muted">Nada encontrado.</p>

    <section v-if="mostraArtigos && (artigos.length || erroArtigos)">
      <div class="row" style="justify-content: space-between">
        <h2>Artigos</h2>
        <button
          v-if="tipo === 'tudo' && artigos.length >= limite"
          class="link-btn"
          @click="irPara('artigos', route.query.q)"
        >
          Ver todos os artigos →
        </button>
      </div>
      <p v-if="erroArtigos" class="error-msg">{{ erroArtigos }}</p>
      <div v-else class="grid">
        <ArticleCard v-for="a in artigos" :key="a.id" :article="a" />
      </div>
    </section>

    <section
      v-if="mostraAnimais && (animais.length || erroAnimais)"
      style="margin-top: 28px"
    >
      <div class="row" style="justify-content: space-between">
        <h2>Animais</h2>
        <button
          v-if="tipo === 'tudo' && animais.length >= limite"
          class="link-btn"
          @click="irPara('animais', route.query.q)"
        >
          Ver todos os animais →
        </button>
      </div>
      <p v-if="erroAnimais" class="error-msg">{{ erroAnimais }}</p>
      <div v-else class="grid">
        <AnimalCard v-for="a in animais" :key="a.id" :animal="a" />
      </div>
    </section>
  </template>
</template>