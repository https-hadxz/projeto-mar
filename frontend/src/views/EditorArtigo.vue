<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../services/api'

const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id)
const editando = computed(() => !!id.value)

const titulo = ref('')
const conteudo = ref('')
const tags = ref('')
const resumo = ref('')
const erro = ref('')
const carregando = ref(false)
const salvando = ref(false)

onMounted(async () => {
  if (!editando.value) return
  carregando.value = true
  try {
    const a = await request(`/api/articles/${id.value}`)
    titulo.value = a.title
    conteudo.value = a.content
    tags.value = a.tags.join(', ')
  } catch (e) {
    erro.value = e.message
  }
  carregando.value = false
})

async function salvar() {
  salvando.value = true
  erro.value = ''
  try {
    const corpo = {
      title: titulo.value,
      content: conteudo.value,
      tags: tags.value,
      summary: resumo.value
    }
    const data = editando.value
      ? await request(`/api/articles/${id.value}`, {
          method: 'PUT',
          body: JSON.stringify(corpo)
        })
      : await request('/api/articles', {
          method: 'POST',
          body: JSON.stringify(corpo)
        })
    router.push(`/artigo/${data.id}`)
  } catch (e) {
    erro.value = e.message
  }
  salvando.value = false
}
</script>

<template>
  <h1>{{ editando ? 'Editar artigo' : 'Novo artigo' }}</h1>

  <p v-if="carregando" class="muted">Carregando…</p>

  <form v-else class="card stack" @submit.prevent="salvar">
    <label for="titulo">Título</label>
    <input id="titulo" v-model="titulo" type="text" maxlength="150" required />

    <label for="conteudo">Conteúdo</label>
    <textarea
      id="conteudo"
      v-model="conteudo"
      maxlength="20000"
      placeholder="Conte um fato interessante sobre o mar…"
      required
    ></textarea>

    <label for="tags">Tags (separadas por vírgula)</label>
    <input id="tags" v-model="tags" type="text" placeholder="baleias, corais, profundezas" />

    <template v-if="editando">
      <label for="resumo">O que você mudou? (opcional)</label>
      <input id="resumo" v-model="resumo" type="text" maxlength="200" />
    </template>

    <p v-if="erro" class="error-msg" role="alert">{{ erro }}</p>

    <div class="row">
      <button class="btn" type="submit" :disabled="salvando">
        {{ salvando ? 'Salvando...' : 'Salvar' }}
      </button>
      <RouterLink :to="editando ? `/artigo/${id}` : '/explorar'" class="btn btn-outline">
        Cancelar
      </RouterLink>
    </div>
  </form>
</template>