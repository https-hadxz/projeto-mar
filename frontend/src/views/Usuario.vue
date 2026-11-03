<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { request, bannerUrl } from '../services/api'
import { auth } from '../stores/auth'
import { formatarData } from '../utils/format'
import { useFeed } from '../composables/useFeed'
import Avatar from '../components/Avatar.vue'
import PostCard from '../components/PostCard.vue'
import Icone from '../components/Icone.vue'

const route = useRoute()

const perfil = ref(null)
const carregandoPerfil = ref(true)
const erroPerfil = ref('')
const aba = ref('tudo')

const { itens, carregando, erro, proximo, carregar } = useFeed()

const tipos = { tudo: '', artigos: 'article', animais: 'animal' }
const tipo = computed(() => tipos[aba.value])

const ehEu = computed(
  () => auth.user && perfil.value && String(auth.user.id) === String(perfil.value.id)
)

const dadosAvatar = computed(() =>
  perfil.value
    ? {
        id: perfil.value.id,
        username: perfil.value.username,
        hasAvatar: perfil.value.hasAvatar,
        version: perfil.value.version
      }
    : null
)

async function carregarPerfil() {
  if (!route.params.id) return

  carregandoPerfil.value = true
  erroPerfil.value = ''
  perfil.value = null
  aba.value = 'tudo'

  try {
    perfil.value = await request(`/api/users/${route.params.id}`)
    carregar({ autor: route.params.id, tipo: '', reiniciar: true })
  } catch (e) {
    erroPerfil.value = e.message
  }

  carregandoPerfil.value = false
}

function trocarAba(nova) {
  aba.value = nova
  carregar({ autor: route.params.id, tipo: tipo.value, reiniciar: true })
}

watch(() => route.params.id, carregarPerfil, { immediate: true })
</script>

<template>
  <p v-if="carregandoPerfil" class="muted">
    Carregando… na primeira vez o servidor pode levar até 1 minuto para acordar.
  </p>
  <p v-else-if="erroPerfil" class="error-msg">{{ erroPerfil }}</p>

  <template v-else-if="perfil">
    <section aria-label="Perfil">
      <div class="perfil-banner" :class="{ 'banner-padrao': !perfil.hasBanner }">
        <img v-if="perfil.hasBanner" :src="bannerUrl(perfil.id, perfil.version)" alt="" />
      </div>

      <div class="perfil-cabeca">
        <Avatar class="perfil-avatar" :usuario="dadosAvatar" :tamanho="112" />

        <div class="perfil-info">
          <div class="row" style="justify-content: space-between; align-items: flex-start">
            <div>
              <h1 class="perfil-nome">{{ perfil.username }}</h1>
              <span v-if="perfil.isAdmin" class="selo">admin</span>
            </div>
            <RouterLink v-if="ehEu" to="/perfil/editar" class="btn btn-outline btn-sm">
              <Icone nome="lapis" :tamanho="16" /> Editar perfil
            </RouterLink>
          </div>

          <p v-if="perfil.suspended" class="muted">Esta conta está suspensa.</p>
          <p v-else-if="perfil.bio" class="perfil-bio">{{ perfil.bio }}</p>
          <p v-else-if="ehEu" class="muted">
            Você ainda não escreveu uma bio.
            <RouterLink to="/perfil/editar">Adicionar agora</RouterLink>
          </p>

          <div class="perfil-numeros">
            <div><strong>{{ perfil.articlesCount }}</strong><span class="muted">artigos</span></div>
            <div><strong>{{ perfil.animalsCount }}</strong><span class="muted">animais</span></div>
          </div>

          <p class="muted" style="font-size: 0.9rem">
            Membro desde {{ formatarData(perfil.createdAt) }}
          </p>
        </div>
      </div>
    </section>

    <div class="abas">
      <button class="btn btn-sm" :class="{ 'btn-outline': aba !== 'tudo' }"
        :aria-pressed="aba === 'tudo'" @click="trocarAba('tudo')">Tudo</button>
      <button class="btn btn-sm" :class="{ 'btn-outline': aba !== 'artigos' }"
        :aria-pressed="aba === 'artigos'" @click="trocarAba('artigos')">Artigos</button>
      <button class="btn btn-sm" :class="{ 'btn-outline': aba !== 'animais' }"
        :aria-pressed="aba === 'animais'" @click="trocarAba('animais')">Animais</button>
    </div>

    <div class="feed">
      <p v-if="carregando && !itens.length" class="muted">Carregando publicações…</p>
      <p v-else-if="erro && !itens.length" class="error-msg">{{ erro }}</p>
      <p v-else-if="!itens.length" class="muted">Nada publicado por aqui ainda.</p>

      <PostCard v-for="p in itens" :key="p.type + p.id" :post="p" />

      <button
        v-if="proximo"
        class="btn btn-outline"
        :disabled="carregando"
        @click="carregar({ autor: route.params.id, tipo })"
      >
        {{ carregando ? 'Carregando…' : 'Carregar mais' }}
      </button>
    </div>
  </template>
</template>