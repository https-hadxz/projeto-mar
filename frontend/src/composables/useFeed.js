import { ref } from 'vue'
import { request } from '../services/api'

export function useFeed() {
  const itens = ref([])
  const carregando = ref(true)
  const erro = ref('')
  const proximo = ref(null)
  let ultima = 0

  async function carregar({ autor = '', tipo = '', reiniciar = false } = {}) {
    const meuNumero = ++ultima
    carregando.value = true
    erro.value = ''

    if (reiniciar) {
      itens.value = []
      proximo.value = null
    }

    const params = new URLSearchParams({ limit: '10' })
    if (autor) params.set('author', autor)
    if (tipo) params.set('type', tipo)
    if (!reiniciar && proximo.value) params.set('before', proximo.value)

    try {
      const data = await request(`/api/feed?${params.toString()}`)
      if (meuNumero !== ultima) return
      itens.value = reiniciar ? data.items : [...itens.value, ...data.items]
      proximo.value = data.next
    } catch (e) {
      if (meuNumero !== ultima) return
      erro.value = e.message
    }

    carregando.value = false
  }

  return { itens, carregando, erro, proximo, carregar }
}