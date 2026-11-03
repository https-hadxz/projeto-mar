<script setup>
import { ref } from 'vue'
import { request } from '../services/api'

const props = defineProps({
  tipo: { type: String, required: true },
  alvoId: { type: String, required: true }
})

const aberto = ref(false)
const motivo = ref('')
const detalhes = ref('')
const enviando = ref(false)
const erro = ref('')
const enviado = ref(false)

async function enviar() {
  enviando.value = true
  erro.value = ''
  try {
    await request('/api/reports', {
      method: 'POST',
      body: JSON.stringify({
        targetType: props.tipo,
        targetId: props.alvoId,
        reason: motivo.value,
        details: detalhes.value
      })
    })
    enviado.value = true
  } catch (e) {
    erro.value = e.message
  }
  enviando.value = false
}
</script>

<template>
  <p v-if="enviado" class="success-msg" role="status">
    Denúncia enviada. Obrigado por ajudar a manter o site seguro!
  </p>

  <template v-else>
    <button v-if="!aberto" class="link-btn" @click="aberto = true">
      🚩 Denunciar este conteúdo
    </button>

    <form v-else class="stack" @submit.prevent="enviar">
      <label for="motivo">Motivo da denúncia</label>
      <select id="motivo" v-model="motivo" required>
        <option value="" disabled>Escolha um motivo</option>
        <option value="spam">Spam ou propaganda</option>
        <option value="ofensivo">Conteúdo ofensivo</option>
        <option value="falso">Informação falsa</option>
        <option value="inadequado">Conteúdo inadequado</option>
        <option value="outro">Outro</option>
      </select>

      <label for="detalhes">Detalhes (opcional)</label>
      <textarea
        id="detalhes"
        v-model="detalhes"
        maxlength="500"
        style="min-height: 90px"
      ></textarea>

      <p v-if="erro" class="error-msg" role="alert">{{ erro }}</p>

      <div class="row">
        <button class="btn btn-sm" type="submit" :disabled="enviando">
          {{ enviando ? 'Enviando...' : 'Enviar denúncia' }}
        </button>
        <button class="btn btn-outline btn-sm" type="button" @click="aberto = false">
          Cancelar
        </button>
      </div>
    </form>
  </template>
</template>

<style scoped>
select {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 16px;
  background: #fff;
  color: var(--text);
}
</style>