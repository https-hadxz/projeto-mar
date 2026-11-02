<template>
  <main class="cadastro">
    <section class="card">
      <h1>Projeto Mar</h1>
      <h2>Criar conta</h2>
      <p>Explore o oceano e compartilhe conhecimento.</p>

      <form @submit.prevent="cadastrar">
        <label for="username">Nome de usuário</label>
        <input
          id="username"
          v-model="username"
          type="text"
          placeholder="Seu nome"
          required
        />

        <label for="email">E-mail</label>
        <input
          id="email"
          v-model="email"
          type="email"
          placeholder="seu@email.com"
          required
        />

        <label for="age">Idade</label>
        <input
          id="age"
          v-model.number="age"
          type="number"
          min="1"
          max="120"
          required
        />

        <label for="password">Senha</label>
        <input
          id="password"
          v-model="password"
          type="password"
          placeholder="Crie uma senha"
          minlength="8"
          required
        />

        <button type="submit" :disabled="carregando">
          {{ carregando ? 'Enviando...' : 'Criar conta' }}
        </button>
        <p v-if="mensagem" role="status">{{ mensagem }}</p>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { request } from '../services/api'

const username = ref('')
const email = ref('')
const age = ref(null)
const password = ref('')
const mensagem = ref('')
const carregando = ref(false)

async function cadastrar() {
  carregando.value = true
  mensagem.value = ''
  try {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        age: age.value,
        password: password.value
      })
    })
    mensagem.value = data.message
  } catch (e) {
    mensagem.value = e.message
  }
  carregando.value = false
}
</script>

<style scoped>
.cadastro {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #eaf7f8;
  font-family: Arial, sans-serif;
}

.card {
  width: 100%;
  max-width: 420px;
  box-sizing: border-box;
  padding: 32px;
  border-radius: 16px;
  background: white;
  box-shadow: 0 8px 30px #003b491a;
}

h1 {
  color: #087e8b;
  margin-bottom: 8px;
}

h2 {
  margin-bottom: 8px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label {
  font-weight: 600;
}

input {
  padding: 12px;
  border: 1px solid #b8cdd0;
  border-radius: 8px;
  font-size: 16px;
}

button {
  padding: 13px;
  border: none;
  border-radius: 8px;
  background: #087e8b;
  color: white;
  font-size: 16px;
  cursor: pointer;
}

button:hover {
  background: #05636d;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>