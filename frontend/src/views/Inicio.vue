<script setup>
import { onMounted } from 'vue'
import { auth } from '../stores/auth'
import { useFeed } from '../composables/useFeed'
import PostCard from '../components/PostCard.vue'
import Avatar from '../components/Avatar.vue'
import Icone from '../components/Icone.vue'

const { itens, carregando, erro, proximo, carregar } = useFeed()

const bolhas = [
  { x: '8%', s: '14px', t: '9s', d: '0s' },
  { x: '22%', s: '9px', t: '12s', d: '2s' },
  { x: '38%', s: '18px', t: '10s', d: '4s' },
  { x: '57%', s: '10px', t: '13s', d: '1s' },
  { x: '73%', s: '16px', t: '9.5s', d: '3s' },
  { x: '90%', s: '11px', t: '11s', d: '5s' }
]

onMounted(() => carregar({ reiniciar: true }))
</script>

<template>
  <!-- Visitantes: capa do site -->
  <section v-if="!auth.token" class="hero-mar">
    <span v-for="(b, i) in bolhas" :key="i" class="bolha"
      :style="{ '--x': b.x, '--s': b.s, '--t': b.t, '--d': b.d }"></span>

    <p class="script">mergulhe fundo</p>
    <h1>Enciclopédia do <em>Mar</em></h1>
    <p class="hero-sub">
      Fatos, curiosidades e animais do oceano, escritos por quem ama o mar.
    </p>
    <div class="row" style="justify-content: center">
      <RouterLink to="/cadastro" class="btn btn-claro">Criar conta</RouterLink>
      <RouterLink to="/explorar" class="btn btn-fantasma">Explorar</RouterLink>
    </div>

    <svg class="hero-onda" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0,64 C240,120 480,0 720,48 C960,96 1200,16 1440,64 L1440,120 L0,120 Z" />
    </svg>
  </section>

  <!-- Logada(o): compositor, como numa rede social -->
  <section v-else-if="auth.user" class="compositor card">
    <Avatar :usuario="auth.user" :tamanho="52" />
    <div>
      <p>O que você descobriu sobre o mar hoje, {{ auth.user.username }}?</p>
      <div class="row">
        <RouterLink to="/novo" class="btn btn-sm">
          <Icone nome="artigo" :tamanho="16" /> Escrever artigo
        </RouterLink>
        <RouterLink to="/animais/novo" class="btn btn-outline btn-sm">
          <Icone nome="fish" :tamanho="16" /> Cadastrar animal
        </RouterLink>
      </div>
    </div>
  </section>

  <h2 class="titulo-secao">Últimas do mar</h2>

  <div class="feed">
    <p v-if="carregando && !itens.length" class="muted">
      Carregando… na primeira vez o servidor pode levar até 1 minuto para acordar.
    </p>
    <p v-else-if="erro && !itens.length" class="error-msg">
      {{ erro }}
      <button class="link-btn" @click="carregar({ reiniciar: true })">Tentar de novo</button>
    </p>
    <p v-else-if="!itens.length" class="muted">
      Ainda não há publicações. Seja a primeira pessoa a escrever!
    </p>

    <PostCard v-for="p in itens" :key="p.type + p.id" :post="p" />

    <p v-if="erro && itens.length" class="error-msg">{{ erro }}</p>

    <button v-if="proximo" class="btn btn-outline" :disabled="carregando" @click="carregar()">
      {{ carregando ? 'Carregando…' : 'Carregar mais' }}
    </button>
  </div>
</template>