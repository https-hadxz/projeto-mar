export function prepararImagem(arquivo, maxLado = 900, qualidade = 0.8) {
  return new Promise((resolve, reject) => {
    if (!arquivo.type.startsWith('image/')) {
      return reject(new Error('Escolha um arquivo de imagem.'))
    }
    if (arquivo.size > 15 * 1024 * 1024) {
      return reject(new Error('A imagem é muito grande (máximo 15 MB).'))
    }

    const url = URL.createObjectURL(arquivo)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height))
      const largura = Math.round(img.width * escala)
      const altura = Math.round(img.height * escala)

      const canvas = document.createElement('canvas')
      canvas.width = largura
      canvas.height = altura

      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, largura, altura)
      ctx.drawImage(img, 0, 0, largura, altura)

      resolve(canvas.toDataURL('image/jpeg', qualidade))
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler essa imagem. Tente um JPG ou PNG.'))
    }

    img.src = url
  })
}