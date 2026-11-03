<script setup>
import { ref, onMounted } from 'vue'
import { request } from '../services/api'
import { formatarData } from '../utils/format'

const aba = ref('denuncias')
const aviso = ref('')
const erro = ref('')

const motivos = {
  spam: 'Spam ou propaganda',
  ofensivo: 'Conteúdo ofensivo',
  falso: 'Informação falsa',
  inadequado: 'Conteúdo inadequado',
  outro: 'Outro'
}
const rotulosStatus = { open: 'Aberta', resolved: 'Resolvida', dismissed: 'Ignorada' }

const statusFiltro = ref('open')
const denuncias = ref([])
const carregandoDenuncias = ref(false)

const busca = ref('')
const usuarios = ref([])
const carregandoUsuarios = ref(false)

function link(d) {
  return d.targetType === 'article' ? `/artigo/${d.targetId}` : `/animais/${d.targetId}`
}

async function carregarDenuncias() {
  carregandoDenuncias.value = true
  try {
    denuncias.value = await request(`/api/admin/reports?status=${statusFiltro.value}`)
  } catch (e) {
    erro.value = e.message
  }
  carregandoDenuncias.value = false
}

async function carregarUsuarios() {
  carregandoUsuarios.value = true
  try {
    const q = busca.value.trim()
    usuarios.value = await request(
      `/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`
    )
  } catch (e) {
    erro.value = e.message
  }
  carregandoUsuarios.value = false
}

async function executar(caminho, opcoes) {
  aviso.value = ''
  erro.value = ''
  try {
    const r = await request(caminho, opcoes)
    aviso.value = r.message
    await Promise.all([carregarDenuncias(), carregarUsuarios()])
  } catch (e) {
    erro.value = e.message
  }
}

function ignorar(d) {
  executar(`/api/admin/reports/${d.id}/dismiss`, { method: 'POST' })
}

function removerConteudo(d) {
  if (!confirm(`Remover "${d.target.title}" definitivamente?`)) return
  executar(`/api/admin/content/${d.targetType}/${d.targetId}`, { method: 'DELETE' })
}

function suspender(id, nome) {
  const motivo = window.prompt(`Suspender "${nome}"? Informe o motivo (opcional):`)
  if (motivo === null) return
  executar(`/api/admin/users/${id}/ban`, {
    method: 'POST',
    body: JSON.stringify({ reason: motivo })
  })
}

function reativar(u) {
  if (!confirm(`Reativar a conta de "${u.username}"?`)) return
  executar(`/api/admin/users/${u.id}/unban`, { method: 'POST' })
}

onMounted(() => {
  carregarDenuncias()
  carregarUsuarios()
})
</script>

<template>
  <h1>Moderação</h1>

  <div class="row" style="margin-bottom: 16px">
    <button
      class="btn btn-sm"
      :class="{ 'btn-outline': aba !== 'denuncias' }"
      @click="aba = 'denuncias'"
    >
      Denúncias
    </button>
    <button
      class="btn btn-sm"
      :class="{ 'btn-outline': aba !== 'usuarios' }"
      @click="aba = 'usuarios'"
    >
      Usuários
    </button>
  </div>

  <p v-if="aviso" class="success-msg" role="status">{{ aviso }}</p>
  <p v-if="erro" class="error-msg" role="alert">{{ erro }}</p>

  <!-- DENÚNCIAS -->
  <section v-if="aba === 'denuncias'">
    <div class="row" style="margin-bottom: 16px">
      <label for="filtro">Mostrar:</label>
      <select
        id="filtro"
        v-model="statusFiltro"
        style="width: auto; padding: 8px"
        @change="carregarDenuncias"
      >
        <option value="open">Abertas</option>
        <option value="resolved">Resolvidas</option>
        <option value="dismissed">Ignoradas</option>
        <option value="all">Todas</option>
      </select>
    </div>

    <p v-if="carregandoDenuncias" class="muted">Carregando…</p>
    <p v-else-if="!denuncias.length" class="muted">Nenhuma denúncia por aqui.</p>

    <div v-else class="stack">
      <div v-for="d in denuncias" :key="d.id" class="card stack">
        <div>
          <strong>{{ d.targetType === 'article' ? 'Artigo' : 'Animal' }}:</strong>
          <RouterLink v-if="d.target" :to="link(d)">{{ d.target.title }}</RouterLink>
          <span v-else class="muted">(conteúdo já removido)</span>
        </div>

        <div class="muted" style="font-size: 14px">
          Motivo: {{ motivos[d.reason] || d.reason }} · denunciado por
          {{ d.reporter }} em {{ formatarData(d.createdAt, true) }}
        </div>

        <div v-if="d.details">“{{ d.details }}”</div>

        <div v-if="d.target && d.target.owner" class="muted" style="font-size: 14px">
          Autor: {{ d.target.owner.username }}
        </div>

        <div v-if="d.status === 'open'" class="row">
          <button class="btn btn-outline btn-sm" @click="ignorar(d)">Ignorar denúncia</button>
          <button v-if="d.target" class="btn btn-danger btn-sm" @click="removerConteudo(d)">
            Remover conteúdo
          </button>
          <button
            v-if="d.target && d.target.owner"
            class="btn btn-outline btn-sm"
            @click="suspender(d.target.owner.id, d.target.owner.username)"
          >
            Suspender autor
          </button>
        </div>
        <div v-else class="muted" style="font-size: 14px">
          Situação: {{ rotulosStatus[d.status] }}
        </div>
      </div>
    </div>
  </section>

  <!-- USUÁRIOS -->
  <section v-else>
    <form class="row" style="margin-bottom: 16px" @submit.prevent="carregarUsuarios">
      <input
        v-model="busca"
        type="search"
        placeholder="Buscar por nome ou e-mail…"
        style="flex: 1; min-width: 200px"
      />
      <button class="btn" type="submit">Buscar</button>
    </form>

    <p v-if="carregandoUsuarios" class="muted">Carregando…</p>
    <p v-else-if="!usuarios.length" class="muted">Nenhum usuário encontrado.</p>

    <div v-else class="stack">
      <div v-for="u in usuarios" :key="u.id" class="card">
        <div class="row" style="justify-content: space-between">
          <div>
            <strong>{{ u.username }}</strong>
            <span v-if="u.role === 'admin'" class="tag">admin</span>
            <span
              v-if="u.banned"
              class="tag"
              style="background: #fbe3e0; color: #c0392b"
            >
              suspenso
            </span>
            <div class="muted" style="font-size: 14px">
              {{ u.email }} · desde {{ formatarData(u.createdAt) }}
            </div>
            <div v-if="u.banned && u.banReason" class="muted" style="font-size: 14px">
              Motivo: {{ u.banReason }}
            </div>
          </div>

          <div v-if="u.role !== 'admin'">
            <button
              v-if="!u.banned"
              class="btn btn-danger btn-sm"
              @click="suspender(u.id, u.username)"
            >
              Suspender
            </button>
            <button v-else class="btn btn-outline btn-sm" @click="reativar(u)">
              Reativar
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
select {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  background: #fff;
  color: var(--text);
}
</style>