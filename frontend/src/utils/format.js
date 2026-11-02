export function formatarData(valor, comHora = false) {
  if (!valor) return ''
  const opcoes = { day: '2-digit', month: 'short', year: 'numeric' }
  if (comHora) {
    opcoes.hour = '2-digit'
    opcoes.minute = '2-digit'
  }
  return new Date(valor).toLocaleString('pt-BR', opcoes)
}