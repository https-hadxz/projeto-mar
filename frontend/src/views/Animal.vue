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
      Cadastrado por {{ animal.owner?.username || 'desconhecido' }} em
      {{ formatarData(animal.createdAt) }}
    </p>

    <img
      v-if="animal.hasPhoto"
      :src="fotoUrl(animal.id, animal.updatedAt)"
      :alt="`Foto de ${animal.name}`"
      class="foto-grande"
    />

    <p><strong>Espécie:</strong> {{ animal.species }}</p>
    <p v-if="animal.breed"><strong>Raça:</strong> {{ animal.breed }}</p>
    <p v-if="animal.age !== null">
      <strong>Idade:</strong> {{ animal.age }} {{ animal.age === 1 ? 'ano' : 'anos' }}
    </p>

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