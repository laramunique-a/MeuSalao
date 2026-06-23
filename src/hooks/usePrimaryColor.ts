import { useEffect } from 'react'
import { useSalao } from './useSalao'

export function usePrimaryColor() {
  const { data: salao } = useSalao()

  useEffect(() => {
    // Mantemos a sincronização com localStorage para fins de compatibilidade
    // com regras de negócio internas, mas não alteramos os estilos inline do DOM.
    if (salao?.cor_primaria) {
      localStorage.setItem('salao_cor', salao.cor_primaria)
    }
  }, [salao?.cor_primaria])

  return '#1F1F1F'
}
