function carregarImagem(arquivo) {
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
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler essa imagem. Tente um JPG ou PNG.'))
    }

    img.src = url
  })
}

// Reduz a foto mantendo a proporção (usada nas fotos de animais)
export async function prepararImagem(arquivo, maxLado = 900, qualidade = 0.8) {
  const img = await carregarImagem(arquivo)

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

  return canvas.toDataURL('image/jpeg', qualidade)
}

// Recorta no tamanho exato pedido (usada no avatar e no banner)
export async function prepararImagemRecortada(arquivo, largura, altura, qualidade = 0.85) {
  const img = await carregarImagem(arquivo)

  const escala = Math.max(largura / img.width, altura / img.height)
  const w = img.width * escala
  const h = img.height * escala

  const canvas = document.createElement('canvas')
  canvas.width = largura
  canvas.height = altura

  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, largura, altura)
  ctx.drawImage(img, (largura - w) / 2, (altura - h) / 2, w, h)

  return canvas.toDataURL('image/jpeg', qualidade)
} 