<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { request } from '../services/api'

const router = useRouter()

const username = ref('')
const email = ref('')
const age = ref(null)
const password = ref('')
const erro = ref('')
const carregando = ref(false)

async function cadastrar() {
  carregando.value = true
  erro.value = ''
  try {
    await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        age: age.value,
        password: password.value
      })
    })
    router.push({ name: 'login', query: { criada: '1' } })
  } catch (e) {
    erro.value = e.message
  }
  carregando.value = false
}
</script>

<template>
  <section class="card narrow">
    <h1>Criar conta</h1>
    <p class="muted">Explore o oceano e compartilhe conhecimento.</p>

    <form class="stack" @submit.prevent="cadastrar">
      <label for="username">Nome de usuário</label>
      <input id="username" v-model="username" type="text" placeholder="Seu nome" required />

      <label for="email">E-mail</label>
      <input id="email" v-model="email" type="email" placeholder="seu@email.com" required />

      <label for="age">Idade</label>
      <input id="age" v-model.number="age" type="number" min="1" max="120" required />

      <label for="password">Senha</label>
      <input
        id="password"
        v-model="password"
        type="password"
        placeholder="Crie uma senha (mínimo 8 caracteres)"
        minlength="8"
        required
      />

      <button class="btn" type="submit" :disabled="carregando">
        {{ carregando ? 'Enviando...' : 'Criar conta' }}
      </button>
      <p v-if="erro" class="error-msg" role="alert">{{ erro }}</p>
    </form>

    <p class="muted">
      Já tem conta? <RouterLink to="/login">Entrar</RouterLink>
    </p>
  </section>
</template>