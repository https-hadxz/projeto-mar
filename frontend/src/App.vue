<script setup>
import { RouterView, useRouter } from 'vue-router'
import { auth } from './stores/auth'

const router = useRouter()

function sair() {
  auth.logout()
  router.push('/')
}
</script>

<template>
  <header class="topbar">
    <div class="container topbar-inner">
      <RouterLink to="/" class="brand">🌊 Projeto Mar</RouterLink>
      <nav>
        <RouterLink to="/explorar">Explorar</RouterLink>
        <template v-if="auth.token">
          <RouterLink to="/novo">Novo artigo</RouterLink>
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