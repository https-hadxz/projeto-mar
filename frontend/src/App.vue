<script setup>
import { onMounted } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { auth } from './stores/auth'
import { request } from './services/api'

const router = useRouter()

function sair() {
  auth.logout()
  router.push('/')
}

onMounted(async () => {
  if (!auth.token) return
  try {
    const data = await request('/api/auth/me')
    auth.setSession(auth.token, data.user)
  } catch (e) {
    /* se a sessão não vale mais, o api.js já faz o logout */
  }
})
</script>

<template>
  <header class="topbar">
    <div class="container topbar-inner">
      <RouterLink to="/" class="brand">🌊 Projeto Mar</RouterLink>
      <nav>
        <RouterLink to="/explorar">Explorar</RouterLink>
        <RouterLink to="/animais">Animais</RouterLink>
        <template v-if="auth.token">
          <RouterLink to="/novo">Novo artigo</RouterLink>
          <RouterLink v-if="auth.user?.role === 'admin'" to="/moderacao">Moderação</RouterLink>
          <RouterLink to="/perfil">{{ auth.user?.username }}</RouterLink>
          <button class="link-btn" @click="sair">Sair</button>
        </template>
        <template v-else>
          <RouterLink to="/login">Entrar</RouterLink>
          <RouterLink to="/cadastro" class="btn btn-sm">Criar conta</RouterLink>
        </template>
      </nav>
    </div>
  </header>

  <main class="container page">
    <RouterView />
  </main>
</template>