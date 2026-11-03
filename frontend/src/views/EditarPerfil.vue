<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { request, avatarUrl, bannerUrl } from '../services/api'
import { auth } from '../stores/auth'
import { prepararImagemRecortada } from '../utils/imagem'

const router = useRouter()

const carregando = ref(true)
const salvando = ref(false)
const processando = ref(false)
const erro = ref('')

const bio = ref('')
const temAvatar = ref(false)
const temBanner = ref(false)
const versao = ref(0)

const avatarNovo = ref('')
const bannerNovo = ref('')
const removerAvatar = ref(false)
const removerBanner = ref(false)

const previaAvatar = computed(
  () =>
    avatarNovo.value ||
    (temAvatar.value && !removerAvatar.value ? avatarUrl(auth.user.id, versao.value) : '')
)
const previaBanner = computed(
  () =>
    bannerNovo.value ||
    (temBanner.value && !removerBanner.value ? bannerUrl(auth.user.id, versao.value) : '')
)
const inicial = computed(() => (auth.user?.username || '?').trim().charAt(0).toUpperCase())

onMounted(async () => {
  try {
    const p = await request(`/api/users/${auth.user.id}`)
    bio.value = p.bio || ''
    temAvatar.value = p.hasAvatar
    temBanner.value = p.hasBanner
    versao.value = p.version
  } catch (e) {
    erro.value = e.message
  }
  carregando.value = false
})

async function escolherAvatar(evento) {
  const arquivo = evento.target.files[0]
  if (!arquivo) return
  processando.value = true
  erro.value = ''
  try {
    avatarNovo.value = await prepararImagemRecortada(arquivo, 360, 360)
    removerAvatar.value = false
  } catch (e) {
    erro.value = e.message
    evento.target.value = ''
  }
  processando.value = false
}

async function escolherBanner(evento) {
  const arquivo = evento.target.files[0]
  if (!arquivo) return
  processando.value = true
  erro.value = ''
  try {
    bannerNovo.value = await prepararImagemRecortada(arquivo, 1400, 440)
    removerBanner.value = false
  } catch (e) {
    erro.value = e.message
    evento.target.value = ''
  }
  processando.value = false
}

async function salvar() {
  salvando.value = true
  erro.value = ''
  try {
    const data = await request('/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({
        bio: bio.value,
        avatar: avatarNovo.value || undefined,
        banner: bannerNovo.value || undefined,
        removeAvatar: removerAvatar.value && !avatarNovo.value,
        removeBanner: removerBanner.value && !bannerNovo.value
      })
    })
    auth.setSession(auth.token, data.user)
    router.push(`/u/${data.user.id}`)
  } catch (e) {
    erro.value = e.message
  }
  salvando.value = false
}
</script>

<template>
  <h1>Editar perfil</h1>

  <p v-if="carregando" class="muted">Carregando…</p>

  <form v-else class="card stack" @submit.prevent="salvar">
    <label for="banner">Banner</label>
    <div class="perfil-banner" :class="{ 'banner-padrao': !previaBanner }" style="height: 160px">
      <img v-if="previaBanner" :src="previaBanner" alt="Prévia do banner" />
    </div>
    <input id="banner" type="file" accept="image/*" @change="escolherBanner" />
    <label v-if="temBanner && !bannerNovo" class="row">
      <input v-model="removerBanner" type="checkbox" />
      Remover o banner atual
    </label>

    <label for="avatar">Foto de perfil</label>
    <span class="avatar" style="width: 112px; height: 112px; font-size: 46px">
      <img v-if="previaAvatar" :src="previaAvatar" alt="Prévia da foto de perfil" />
      <span v-else aria-hidden="true">{{ inicial }}</span>
    </span>
    <input id="avatar" type="file" accept="image/*" @change="escolherAvatar" />
    <label v-if="temAvatar && !avatarNovo" class="row">
      <input v-model="removerAvatar" type="checkbox" />
      Remover a foto atual
    </label>

    <label for="bio">Bio</label>
    <textarea
      id="bio"
      v-model="bio"
      maxlength="200"
      style="min-height: 110px"
      placeholder="Conte um pouco sobre você e o seu amor pelo mar…"
    ></textarea>
    <span class="muted" style="font-size: 0.9rem">{{ bio.length }}/200</span>

    <p v-if="processando" class="muted">Preparando a imagem…</p>
    <p v-if="erro" class="error-msg" role="alert">{{ erro }}</p>

    <div class="row">
      <button class="btn" type="submit" :disabled="salvando || processando">
        {{ salvando ? 'Salvando...' : 'Salvar' }}
      </button>
      <RouterLink :to="`/u/${auth.user.id}`" class="btn btn-outline">Cancelar</RouterLink>
    </div>
  </form>
</template>