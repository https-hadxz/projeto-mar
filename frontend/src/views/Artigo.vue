<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../services/api'
import { auth } from '../stores/auth'
import { formatarData } from '../utils/format'
import ReportarConteudo from '../components/ReportarConteudo.vue'

const route = useRoute()
const router = useRouter()

const artigo = ref(null)
const carregando = ref(true)
const erro = ref('')

const podeExcluir = computed(
  () =>
    artigo.value &&
    auth.user &&
    (String(auth.user.id) === String(artigo.value.author?.id) ||
      auth.user.role === 'admin')
)

const podeDenunciar = computed(
  () =>
    artigo.value &&
    auth.user &&
    String(auth.user.id) !== String(artigo.value.author?.id)
)

onMounted(async () => {
  try {
    artigo.value = await request(`/api/articles/${route.params.id}`)
  } catch (e) {
    erro.value = e.message
  }
  carregando.value = false
})

async function excluir() {
  if (!confirm('Excluir este artigo? Essa ação não pode ser desfeita.')) return
  try {
    await request(`/api/articles/${route.params.id}`, { method: 'DELETE' })
    router.push('/explorar')
  } catch (e) {
    erro.value = e.message
  }
}
</script>

<template>
  <p v-if="carregando" class="muted">
    Carregando… na primeira vez o servidor pode levar até 1 minuto para acordar.
  </p>
  <p v-else-if="erro && !artigo" class="error-msg">{{ erro }}</p>

  <article v-else-if="artigo" class="card">
    <h1>{{ artigo.title }}</h1>
    <p class="muted" style="font-size: 14px">
      Criado por {{ artigo.author?.username || 'desconhecido' }} em
      {{ formatarData(artigo.createdAt) }}
      <span v-if="artigo.lastEditedBy">
        · última edição por {{ artigo.lastEditedBy }} em
        {{ formatarData(artigo.updatedAt) }}
      </span>
    </p>

    <div v-if="artigo.tags.length" class="tags">
      <RouterLink
        v-for="t in artigo.tags"
        :key="t"
        :to="{ path: '/explorar', query: { tag: t } }"
        class="tag"
      >
        #{{ t }}
      </RouterLink>
    </div>

    <div class="conteudo">{{ artigo.content }}</div>

    <p v-if="erro" class="error-msg">{{ erro }}</p>

    <div class="row" style="margin-top: 24px">
      <RouterLink v-if="auth.token" :to="`/editar/${artigo.id}`" class="btn">
        Editar
      </RouterLink>
      <RouterLink
        v-else
        :to="{ name: 'login', query: { redirect: route.fullPath } }"
        class="btn btn-outline"
      >
        Entre para editar
      </RouterLink>
      <button v-if="podeExcluir" class="btn btn-danger" @click="excluir">Excluir</button>
    </div>

    <div v-if="podeDenunciar" style="margin-top: 20px">
      <ReportarConteudo tipo="article" :alvo-id="String(artigo.id)" />
    </div>

    <details v-if="artigo.revisions.length" style="margin-top: 24px">
      <summary>Histórico de edições ({{ artigo.revisions.length }})</summary>
      <ul>
        <li v-for="(r, i) in artigo.revisions" :key="i">
          {{ formatarData(r.editedAt, true) }} — {{ r.editedBy }}
          <span v-if="r.summary" class="muted">: {{ r.summary }}</span>
        </li>
      </ul>
    </details>
  </article>
</template>

<style scoped>
.conteudo {
  white-space: pre-wrap;
  margin-top: 20px;
  font-size: 17px;
}
</style>