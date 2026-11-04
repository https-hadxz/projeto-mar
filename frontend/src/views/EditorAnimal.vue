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
const scientificName = ref('')
const family = ref('')
const lifespan = ref('')
const averageSize = ref('')
const averageWeight = ref('')

const diet = ref('')
const habitat = ref('')
const distribution = ref('')
const reproduction = ref('')
const behavior = ref('')
const ecologicalRole = ref('')

const conservationStatus = ref('')
const threats = ref('')
const curiosities = ref('')
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
    scientificName.value = a.scientificName || ''
    family.value = a.family || ''
    lifespan.value = a.lifespan ?? ''
    averageSize.value = a.averageSize || ''
    averageWeight.value = a.averageWeight || ''

    diet.value = a.diet || ''
    habitat.value = a.habitat || ''
    distribution.value = a.distribution || ''
    reproduction.value = a.reproduction || ''
    behavior.value = a.behavior || ''
    ecologicalRole.value = a.ecologicalRole || ''
    conservationStatus.value = a.conservationStatus || ''
    threats.value = a.threats || ''
    curiosities.value = a.curiosities || ''
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
  erro.value = ''

  if (!raca.value.trim()) {
    erro.value = 'Informe a raça do animal.'
    return
  }

  if (!previa.value) {
    erro.value = 'A fotografia do animal é obrigatória.'
    return
  }

  salvando.value = true

  try {
    const corpo = {
      name: nome.value,
      species: especie.value,
      breed: raca.value.trim(),
      age: idade.value === '' ? null : Number(idade.value),

      scientificName: scientificName.value,
      family: family.value,
      lifespan: lifespan.value === '' ? null : Number(lifespan.value),
      averageSize: averageSize.value,
      averageWeight: averageWeight.value,

      diet: diet.value,
      habitat: habitat.value,
      distribution: distribution.value,
      reproduction: reproduction.value,
      behavior: behavior.value,
      ecologicalRole: ecologicalRole.value,

      conservationStatus: conservationStatus.value,
      threats: threats.value,
      curiosities: curiosities.value,

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
  } finally {
    salvando.value = false
  }
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
<label for="raca">Raça *</label>
<input
  id="raca"
  v-model="raca"
  type="text"
  maxlength="80"
  required
/>

<label for="idade">Idade atual em anos (opcional)</label>
<input
  id="idade"
  v-model="idade"
  type="number"
  min="0"
  max="500"
  step="0.1"
/>

<label for="descricao">Descrição geral *</label>
<textarea
  id="descricao"
  v-model="descricao"
  maxlength="2000"
  style="min-height: 160px"
  placeholder="Conte o que você sabe sobre esse animal..."
  required
></textarea>

<h2>Fotografia</h2>

<label for="foto">Fotografia do animal *</label>
<input
  id="foto"
  type="file"
  accept="image/jpeg,image/png,image/webp"
  :required="!previa"
  @change="escolherFoto"
/>

<p class="muted">
  A fotografia é obrigatória para cadastrar o animal.
</p>

<p v-if="processandoFoto" class="muted">
  Preparando a foto...
</p>

<img
  v-if="previa"
  :src="previa"
  alt="Prévia da foto"
  class="foto-grande"
/>

<label v-if="fotoAtual && !fotoNova" class="row">
  <input
    v-model="removerFoto"
    type="checkbox"
    style="width: auto"
  />
  Remover a foto atual
</label>

<h2>Informações científicas</h2>

<label for="scientificName">Nome científico</label>
<input
  id="scientificName"
  v-model="scientificName"
  maxlength="120"
  placeholder="Ex.: Chelonia mydas"
/>

<label for="family">Família</label>
<input
  id="family"
  v-model="family"
  maxlength="100"
  placeholder="Ex.: Cheloniidae"
/>

<h2>Características físicas e expectativa de vida</h2>

<label for="lifespan">Expectativa de vida média (anos)</label>
<input
  id="lifespan"
  v-model="lifespan"
  type="number"
  min="0"
  max="500"
  step="0.1"
  placeholder="Ex.: 80"
/>

<label for="averageSize">Tamanho médio</label>
<input
  id="averageSize"
  v-model="averageSize"
  maxlength="100"
  placeholder="Ex.: 1,2 metro de comprimento"
/>

<label for="averageWeight">Peso médio</label>
<input
  id="averageWeight"
  v-model="averageWeight"
  maxlength="100"
  placeholder="Ex.: 150 kg"
/>

<h2>Biologia e comportamento</h2>

<label for="diet">Alimentação</label>
<textarea
  id="diet"
  v-model="diet"
  maxlength="1000"
  placeholder="O que esse animal come?"
></textarea>

<label for="habitat">Habitat natural</label>
<textarea
  id="habitat"
  v-model="habitat"
  maxlength="1000"
  placeholder="Onde vive?"
></textarea>

<label for="distribution">Distribuição geográfica</label>
<textarea
  id="distribution"
  v-model="distribution"
  maxlength="1000"
  placeholder="Em quais regiões do mundo pode ser encontrado?"
></textarea>

<label for="reproduction">Reprodução</label>
<textarea
  id="reproduction"
  v-model="reproduction"
  maxlength="1000"
  placeholder="Como acontece sua reprodução?"
></textarea>

<label for="behavior">Comportamento</label>
<textarea
  id="behavior"
  v-model="behavior"
  maxlength="1000"
  placeholder="Hábitos, migração, vida social..."
></textarea>

<label for="ecologicalRole">Papel no ecossistema</label>
<textarea
  id="ecologicalRole"
  v-model="ecologicalRole"
  maxlength="1000"
  placeholder="Qual sua importância para o equilíbrio ambiental?"
></textarea>

<h2>Conservação</h2>

<label for="conservationStatus">Estado de conservação</label>
<select id="conservationStatus" v-model="conservationStatus">
  <option value="">Não informado</option>
  <option value="Pouco preocupante">Pouco preocupante</option>
  <option value="Quase ameaçada">Quase ameaçada</option>
  <option value="Vulnerável">Vulnerável</option>
  <option value="Em perigo">Em perigo</option>
  <option value="Criticamente em perigo">Criticamente em perigo</option>
  <option value="Extinta na natureza">Extinta na natureza</option>
  <option value="Extinta">Extinta</option>
  <option value="Dados insuficientes">Dados insuficientes</option>
  <option value="Não avaliada">Não avaliada</option>
</select>

<label for="threats">Principais ameaças</label>
<textarea
  id="threats"
  v-model="threats"
  maxlength="1000"
  placeholder="Poluição, pesca predatória, mudanças climáticas..."
></textarea>

<label for="curiosities">Curiosidades</label>
<textarea
  id="curiosities"
  v-model="curiosities"
  maxlength="1500"
  placeholder="Compartilhe fatos interessantes sobre esse animal."
></textarea>

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