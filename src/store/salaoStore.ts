import { create } from 'zustand'
import type { Salao } from '@/types/models'

interface SalaoState {
  salao: Salao | null
  setSalao: (salao: Salao | null) => void
}

export const useSalaoStore = create<SalaoState>((set) => ({
  salao: null,
  setSalao: (salao) => set({ salao }),
}))
