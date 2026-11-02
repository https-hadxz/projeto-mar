import { reactive } from 'vue'

const CHAVE = 'mar_auth'

function ler() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE)) || {}
  } catch (e) {
    return {}
  }
}

const salvo = ler()

export const auth = reactive({
  token: salvo.token || null,
  user: salvo.user || null,

  setSession(token, user) {
    this.token = token
    this.user = user
    try {
      localStorage.setItem(CHAVE, JSON.stringify({ token, user }))
    } catch (e) {
      /* ignora */
    }
  },

  logout() {
    this.token = null
    this.user = null
    try {
      localStorage.removeItem(CHAVE)
    } catch (e) {
      /* ignora */
    }
  }
})