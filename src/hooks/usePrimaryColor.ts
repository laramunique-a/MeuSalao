import { useEffect } from 'react'
import { useSalao } from './useSalao'

export function usePrimaryColor() {
  const { data: salao } = useSalao()

  useEffect(() => {
    // Tentar pegar do localStorage primeiro para evitar flash
    const cachedColor = localStorage.getItem('salao_cor')
    const color = salao?.cor_primaria || cachedColor || '#9333ea'
    applyPrimaryColor(color)
  }, [salao?.cor_primaria])

  return salao?.cor_primaria || localStorage.getItem('salao_cor') || '#9333ea'
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) {
    return { h: 0, s: 0, l: Math.round(l * 100) }
  }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

  let h = 0
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

function applyPrimaryColor(hex: string) {
  const root = document.documentElement
  const { h, s, l } = hexToHSL(hex)

  // Formato correto para shadcn/ui: "H S% L%"
  const hsl = `${h} ${s}% ${l}%`

  // Cor do texto sobre o fundo primário: off-white para cores médias/escuras, cinza muito escuro para claras
  // Aumentamos o threshold para 72 para favorecer texto branco em tons "dusty"
  const foreground = l < 72 ? '210 20% 98%' : '210 20% 12%'

  root.style.setProperty('--primary', hsl)
  root.style.setProperty('--primary-foreground', foreground)
  root.style.setProperty('--ring', hsl)

  // Salvar no localStorage para o script do index.html ler no próximo carregamento
  localStorage.setItem('salao_cor', hex)

  // Variante mais clara para hover/backgrounds suaves
  const lightL = Math.min(l + 40, 95)
  root.style.setProperty('--primary-light', `${h} ${s}% ${lightL}%`)
}
