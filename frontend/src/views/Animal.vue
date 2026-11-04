<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request, fotoUrl } from '../services/api'
import { auth } from '../stores/auth'
import { formatarData } from '../utils/format'
import MapaLocal from '../components/MapaLocal.vue'
import ReportarConteudo from '../components/ReportarConteudo.vue'

const route = useRoute()
const router = useRouter()

const animal = ref(null)
const carregando = ref(true)
const erro = ref('')

const mensagens = {
  criado: 'Animal cadastrado com sucesso!',
  editado: 'Animal atualizado com sucesso!'
}
const aviso = computed(() => mensagens[route.query.msg] || '')

const ehDono = computed(
  () =>
    animal.value &&
    auth.user &&
    String(animal.value.owner?.id) === String(auth.user.id)
)

const ehAdmin = computed(() => auth.user?.role === 'admin')
const podeDenunciar = computed(() => animal.value && auth.user && !ehDono.value)

const temLocal = computed(
  () =>
    animal.value &&
    typeof animal.value.latitude === 'number' &&
    typeof animal.value.longitude === 'number'
)

onMounted(async () => {
  try {
    animal.value = await request(`/api/animals/${route.params.id}`)
  } catch (e) {
    erro.value = e.message
  }
  carregando.value = false
})

async function excluir() {
  if (!confirm(`Excluir "${animal.value.name}"? Essa ação não pode ser desfeita.`)) return
  try {
    await request(`/api/animals/${route.params.id}`, { method: 'DELETE' })
    router.push({ path: '/animais', query: { msg: 'excluido' } })
  } catch (e) {
    erro.value = e.message
  }
}

async function removerModeracao() {
  if (!confirm(`Remover "${animal.value.name}" pela moderação? Essa ação não pode ser desfeita.`)) return
  try {
    await request(`/api/admin/content/animal/${route.params.id}`, { method: 'DELETE' })
    router.push({ path: '/animais', query: { msg: 'excluido' } })
  } catch (e) {
    erro.value = e.message
  }
}
</script>

<template>
  <p v-if="carregando" class="muted">
    Carregando… na primeira vez o servidor pode levar até 1 minuto para acordar.
  </p>
  <p v-else-if="erro && !animal" class="error-msg">{{ erro }}</p>

  <article v-else-if="animal" class="card">
    <p v-if="aviso" class="success-msg" role="status">{{ aviso }}</p>

    <h1>{{ animal.name }}</h1>
    <p class="muted" style="font-size: 14px">
      Cadastrado por
      <RouterLink v-if="animal.owner" :to="`/u/${animal.owner.id}`">{{ animal.owner.username }}</RouterLink>
      <span v-else>desconhecido</span> em
      {{ formatarData(animal.createdAt) }}
    </p>

    <img
      v-if="animal.hasPhoto"
      :src="fotoUrl(animal.id, animal.updatedAt)"
      :alt="`Foto de ${animal.name}`"
      class="foto-grande"
    />

  <h2>Identificação</h2>

<p><strong>Espécie:</strong> {{ animal.species }}</p>
<p><strong>Raça:</strong> {{ animal.breed }}</p>

<p v-if="animal.scientificName">
  <strong>Nome científico:</strong>
  <i>{{ animal.scientificName }}</i>
</p>

<p v-if="animal.family">
  <strong>Família:</strong> {{ animal.family }}
</p>

<p v-if="animal.age !== null">
  <strong>Idade atual:</strong>
  {{ animal.age }} {{ animal.age === 1 ? 'ano' : 'anos' }}
</p>

<h2>Características físicas</h2>

<p v-if="animal.lifespan !== null">
  <strong>Expectativa de vida média:</strong>
  {{ animal.lifespan }} anos
</p>

<p v-if="animal.averageSize">
  <strong>Tamanho médio:</strong> {{ animal.averageSize }}
</p>

<p v-if="animal.averageWeight">
  <strong>Peso médio:</strong> {{ animal.averageWeight }}
</p>

<h2>Biologia e comportamento</h2>

<template v-if="animal.diet">
  <h3>Alimentação</h3>
  <div class="conteudo">{{ animal.diet }}</div>
</template>

<template v-if="animal.habitat">
  <h3>Habitat natural</h3>
  <div class="conteudo">{{ animal.habitat }}</div>
</template>

<template v-if="animal.distribution">
  <h3>Distribuição geográfica</h3>
  <div class="conteudo">{{ animal.distribution }}</div>
</template>

<template v-if="animal.reproduction">
  <h3>Reprodução</h3>
  <div class="conteudo">{{ animal.reproduction }}</div>
</template>

<template v-if="animal.behavior">
  <h3>Comportamento</h3>
  <div class="conteudo">{{ animal.behavior }}</div>
</template>

<template v-if="animal.ecologicalRole">
  <h3>Papel no ecossistema</h3>
  <div class="conteudo">{{ animal.ecologicalRole }}</div>
</template>

<h2>Conservação</h2>

<p v-if="animal.conservationStatus">
  <strong>Estado de conservação:</strong>
  {{ animal.conservationStatus }}
</p>

<template v-if="animal.threats">
  <h3>Principais ameaças</h3>
  <div class="conteudo">{{ animal.threats }}</div>
</template>

<template v-if="animal.curiosities">
  <h3>Curiosidades</h3>
  <div class="conteudo">{{ animal.curiosities }}</div>
</template>

<h2>Descrição geral</h2>
<div class="conteudo">{{ animal.description }}</div>

    <h3>Descrição</h3>
    <div class="conteudo">{{ animal.description }}</div>

    <template v-if="animal.locationName || temLocal">
      <h3 style="margin-top: 20px">Localização</h3>
      <p v-if="animal.locationName">📍 {{ animal.locationName }}</p>
      <MapaLocal v-if="temLocal" :lat="animal.latitude" :lng="animal.longitude" />
    </template>

    <p v-if="erro" class="error-msg" role="alert">{{ erro }}</p>

    <div v-if="ehDono" class="row" style="margin-top: 24px">
      <RouterLink :to="`/animais/${animal.id}/editar`" class="btn">Editar</RouterLink>
      <button class="btn btn-danger" @click="excluir">Excluir</button>
    </div>

    <div v-if="ehAdmin && !ehDono" class="row" style="margin-top: 24px">
      <button class="btn btn-danger" @click="removerModeracao">
        Remover (moderação)
      </button>
    </div>

    <div v-if="podeDenunciar" style="margin-top: 20px">
      <ReportarConteudo tipo="animal" :alvo-id="String(animal.id)" />
    </div>

    <p style="margin-top: 20px">
      <RouterLink to="/animais">← Voltar para a lista</RouterLink>
    </p>
  </article>
</template>

<style scoped>
.conteudo {
  white-space: pre-wrap;
  font-size: 17px;
}
</style>