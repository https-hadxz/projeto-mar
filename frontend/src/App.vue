<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { auth } from './stores/auth'
import { request } from './services/api'
import Icone from './components/Icone.vue'
import Avatar from './components/Avatar.vue'

const router = useRouter()
const route = useRoute()
const menuAberto = ref(false)

function fecharMenu() {
  menuAberto.value = false
}

function sair() {
  fecharMenu()
  auth.logout()
  router.push('/')
}

function aoTeclar(e) {
  if (e.key === 'Escape') fecharMenu()
}

watch(() => route.fullPath, fecharMenu)

onMounted(async () => {
  window.addEventListener('keydown', aoTeclar)

  if (!auth.token) return
  try {
    const data = await request('/api/auth/me')
    auth.setSession(auth.token, data.user)
  } catch (e) {
    /* se a sessão não vale mais, o api.js já faz o logout */
  }
})

onBeforeUnmount(() => window.removeEventListener('keydown', aoTeclar))
</script>

<template>
  <RouterLink to="/" class="marca">
    <span aria-hidden="true">🌊</span> Projeto Mar
  </RouterLink>

  <div v-if="menuAberto" class="dock-fundo" @click="fecharMenu"></div>

  <nav class="dock" aria-label="Navegação principal">
    <RouterLink to="/" class="dock-item" exact-active-class="ativo" aria-label="Início">
      <Icone nome="home" />
      <span class="dock-rotulo">Início</span>
    </RouterLink>

    <RouterLink to="/explorar" class="dock-item" active-class="ativo" aria-label="Explorar">
      <Icone nome="compass" />
      <span class="dock-rotulo">Explorar</span>
    </RouterLink>

    <RouterLink to="/animais" class="dock-item" active-class="ativo" aria-label="Animais">
      <Icone nome="fish" />
      <span class="dock-rotulo">Animais</span>
    </RouterLink>

    <template v-if="auth.token">
      <div class="dock-novo">
        <button
          type="button"
          class="dock-item"
          :class="{ ativo: menuAberto }"
          aria-label="Criar novo"
          aria-haspopup="true"
          :aria-expanded="menuAberto"
          @click="menuAberto = !menuAberto"
        >
          <Icone nome="plus" />
          <span class="dock-rotulo">Criar</span>
        </button>

        <div v-if="menuAberto" class="menu-novo">
          <RouterLink to="/novo"><Icone nome="artigo" :tamanho="18" /> Novo artigo</RouterLink>
          <RouterLink to="/animais/novo"><Icone nome="fish" :tamanho="18" /> Cadastrar animal</RouterLink>
        </div>
      </div>

      <RouterLink
        v-if="auth.user?.role === 'admin'"
        to="/moderacao"
        class="dock-item"
        active-class="ativo"
        aria-label="Moderação"
      >
        <Icone nome="shield" />
        <span class="dock-rotulo">Moderação</span>
      </RouterLink>

      <RouterLink
        v-if="auth.user"
        :to="`/u/${auth.user.id}`"
        class="dock-item"
        active-class="ativo"
        aria-label="Meu perfil"
      >
        <Avatar :usuario="auth.user" :tamanho="32" />
        <span class="dock-rotulo">Meu perfil</span>
      </RouterLink>

      <button type="button" class="dock-item" aria-label="Sair" @click="sair">
        <Icone nome="logout" />
        <span class="dock-rotulo">Sair</span>
      </button>
    </template>

    <template v-else>
      <RouterLink to="/login" class="dock-item" active-class="ativo" aria-label="Entrar">
        <Icone nome="login" />
        <span class="dock-rotulo">Entrar</span>
      </RouterLink>
      <RouterLink to="/cadastro" class="dock-item" active-class="ativo" aria-label="Criar conta">
        <Icone nome="userplus" />
        <span class="dock-rotulo">Criar conta</span>
      </RouterLink>
    </template>
  </nav>

  <main class="container page">
    <RouterView />
  </main>
</template>