<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request, fotoUrl } from '../services/api'
import { auth } from '../stores/auth'
import { prepararImagem } from '../utils/imagem'
import MapaLocal from '../components/MapaLocal.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => route.params.id)
const editando = computed(() => !!id.value)

const nome = ref('')
const especie = ref('')
const raca = ref('')
const idade = ref('')
const descricao = ref('')
const localNome = ref('')
const latitude = ref(null)
const longitude = ref(null)

const fotoNova = ref('')
const fotoAtual = ref('')
const removerFoto = ref(false)

const erro = ref('')
const erroLocal = ref('')
const carregando = ref(false)
const salvando = ref(false)
const processandoFoto = ref(false)
const semPermissao = ref(false)

const previa = computed(
  () => fotoNova.value || (!removerFoto.value ? fotoAtual.value : '')
)

onMounted(async () => {
  if (!editando.value) return
  carregando.value = true
  try {
    const a = await request(`/api/animals/${id.value}`)

    if (String(a.owner?.id) !== String(auth.user?.id)) {
      semPermissao.value = true
      erro.value = 'Você só pode editar os animais que cadastrou.'
      carregando.value = false
      return
    }

    nome.value = a.name
    especie.value = a.species
    raca.value = a.breed || ''
    idade.value = a.age === null ? '' : a.age
    descricao.value = a.description
    localNome.value = a.locationName || ''
    latitude.value = typeof a.latitude === 'number' ? a.latitude : null
    longitude.value = typeof a.longitude === 'number' ? a.longitude : null
    fotoAtual.value = a.hasPhoto ? fotoUrl(a.id, a.updatedAt) : ''
  } catch (e) {
    erro.value = e.message
  }
  carregando.value = false
})

async function escolherFoto(evento) {
  const arquivo = evento.target.files[0]
  if (!arquivo) return

  processandoFoto.value = true
  erro.value = ''
  try {
    fotoNova.value = await prepararImagem(arquivo)
    removerFoto.value = false
  } catch (e) {
    erro.value = e.message
    evento.target.value = ''
  }
  processandoFoto.value = false
}

function definirPonto({ lat, lng }) {
  latitude.value = lat
  longitude.value = lng
  erroLocal.value = ''
}

function limparPonto() {
  latitude.value = null
  longitude.value = null
}

function usarMinhaLocalizacao() {
  erroLocal.value = ''
  if (!navigator.geolocation) {
    erroLocal.value = 'Seu navegador não permite obter a localização.'
    return
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      definirPonto({
        lat: Number(pos.coords.latitude.toFixed(5)),
        lng: Number(pos.coords.longitude.toFixed(5))
      })
    },
    () => {
      erroLocal.value = 'Não foi possível obter sua localização. Clique no mapa para marcar.'
    }
  )
}

async function salvar() {
  salvando.value = true
  erro.value = ''
  try {
    const corpo = {
      name: nome.value,
      species: especie.value,
      breed: raca.value,
      age: idade.value === '' || idade.value === null ? null : Number(idade.value),
      description: descricao.value,
      locationName: localNome.value,
      latitude: latitude.value,
      longitude: longitude.value,
      photo: fotoNova.value || undefined,
      removePhoto: removerFoto.value && !fotoNova.value
    }

    const data = editando.value
      ? await request(`/api/animals/${id.value}`, {
          method: 'PUT',
          body: JSON.stringify(corpo)
        })
      : await request('/api/animals', {
          method: 'POST',
          body: JSON.stringify(corpo)
        })

    router.push({
      path: `/animais/${data.id}`,
      query: { msg: editando.value ? 'editado' : 'criado' }
    })
  } catch (e) {
    erro.value = e.message
  }
  salvando.value = false
}
</script>

<template>
  <h1>{{ editando ? 'Editar animal' : 'Cadastrar animal' }}</h1>

  <p v-if="carregando" class="muted">Carregando…</p>
  <p v-else-if="semPermissao" class="error-msg" role="alert">
    {{ erro }} <RouterLink to="/animais">Voltar para a lista</RouterLink>
  </p>

  <form v-else class="card stack" @submit.prevent="salvar">
    <label for="nome">Nome *</label>
    <input id="nome" v-model="nome" type="text" maxlength="80" required />

    <label for="especie">Espécie *</label>
    <input
      id="especie"
      v-model="especie"
      type="text"
      maxlength="80"
      placeholder="Ex.: Tartaruga-verde"
      required
    />

    <label for="raca">Raça (opcional)</label>
    <input id="raca" v-model="raca" type="text" maxlength="80" />

    <label for="idade">Idade em anos (opcional)</label>
    <input id="idade" v-model="idade" type="number" min="0" max="500" step="0.1" />

    <label for="descricao">Descrição *</label>
    <textarea
      id="descricao"
      v-model="descricao"
      maxlength="2000"
      style="min-height: 160px"
      placeholder="Conte o que você sabe sobre esse animal…"
      required
    ></textarea>

    <label for="foto">Foto (opcional)</label>
    <input id="foto" type="file" accept="image/*" @change="escolherFoto" />
    <p v-if="processandoFoto" class="muted">Preparando a foto…</p>
    <img v-if="previa" :src="previa" alt="Prévia da foto" class="foto-grande" />
    <label v-if="fotoAtual && !fotoNova" class="row">
      <input v-model="removerFoto" type="checkbox" style="width: auto" />
      Remover a foto atual
    </label>

    <label for="local">Nome do local (opcional)</label>
    <input
      id="local"
      v-model="localNome"
      type="text"
      maxlength="120"
      placeholder="Ex.: Praia de Copacabana, RJ"
    />

    <label>Ponto no mapa (opcional)</label>
    <p class="muted" style="margin: 0; font-size: 14px">
      Clique no mapa para marcar o local.
    </p>
    <MapaLocal :lat="latitude" :lng="longitude" editavel @escolher="definirPonto" />
    <div class="row">
      <button type="button" class="btn btn-outline btn-sm" @click="usarMinhaLocalizacao">
        Usar minha localização
      </button>
      <button
        v-if="latitude !== null"
        type="button"
        class="btn btn-outline btn-sm"
        @click="limparPonto"
      >
        Limpar ponto
      </button>
      <span v-if="latitude !== null" class="muted" style="font-size: 14px">
        {{ latitude }}, {{ longitude }}
      </span>
    </div>
    <p v-if="erroLocal" class="error-msg">{{ erroLocal }}</p>

    <p v-if="erro" class="error-msg" role="alert">{{ erro }}</p>

    <div class="row">
      <button class="btn" type="submit" :disabled="salvando || processandoFoto">
        {{ salvando ? 'Salvando...' : 'Salvar' }}
      </button>
      <RouterLink :to="editando ? `/animais/${id}` : '/animais'" class="btn btn-outline">
        Cancelar
      </RouterLink>
    </div>
  </form>
</template>