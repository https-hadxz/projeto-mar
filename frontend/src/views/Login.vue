<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { request } from '../services/api'
import { auth } from '../stores/auth'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const erro = ref('')
const carregando = ref(false)

async function entrar() {
  carregando.value = true
  erro.value = ''
  try {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: email.value, password: password.value })
    })
    auth.setSession(data.token, data.user)

    const destino = String(route.query.redirect || '/')
    router.push(destino.startsWith('/') && !destino.startsWith('//') ? destino : '/')
  } catch (e) {
    erro.value = e.message
  }
  carregando.value = false
}
</script>

<template>
  <section class="card narrow">
    <h1>Entrar</h1>
    <p v-if="route.query.criada" class="success-msg">
      Conta criada! Entre com seu e-mail e senha.
    </p>

    <form class="stack" @submit.prevent="entrar">
      <label for="email">E-mail</label>
      <input id="email" v-model="email" type="email" placeholder="seu@email.com" required />

      <label for="password">Senha</label>
      <input id="password" v-model="password" type="password" required />

      <button class="btn" type="submit" :disabled="carregando">
        {{ carregando ? 'Entrando...' : 'Entrar' }}
      </button>
      <p v-if="erro" class="error-msg" role="alert">{{ erro }}</p>
    </form>

    <p class="muted">
      Não tem conta? <RouterLink to="/cadastro">Criar conta</RouterLink>
    </p>
  </section>
</template>