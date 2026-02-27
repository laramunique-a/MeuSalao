import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { CORES_PREDEFINIDAS } from '@/schemas/salao.schema'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-3 block">Cores Predefinidas</Label>
        <div className="flex flex-wrap gap-2">
          {CORES_PREDEFINIDAS.map((cor) => (
            <button
              key={cor.valor}
              type="button"
              onClick={() => {
                onChange(cor.valor)
              }}
              className={cn(
                'relative h-8 w-8 rounded-md border-2 transition-all hover:scale-105',
                value === cor.valor ? 'border-gray-900 dark:border-white' : 'border-gray-200'
              )}
              style={{ backgroundColor: cor.valor }}
              title={cor.nome}
            >
              {value === cor.valor && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-4 w-4 text-white drop-shadow-lg" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="custom-color" className="text-sm font-medium mb-3 block">
          Outras Cores
        </Label>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-md border-2 border-border shadow-sm"
            style={{ backgroundColor: value }}
          />
          <div className="relative">
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
            <Button variant="outline" size="sm" type="button" className="pointer-events-none">
              Escolher Cor...
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <p className="text-sm font-medium mb-2">Pré-visualização</p>
        <div className="flex gap-2">
          {(() => {
            // Calcular se o texto deve ser claro ou escuro para a pré-visualização
            const clean = value.replace('#', '')
            const r = parseInt(clean.slice(0, 2), 16) / 255
            const g = parseInt(clean.slice(2, 4), 16) / 255
            const b = parseInt(clean.slice(4, 6), 16) / 255
            const max = Math.max(r, g, b)
            const min = Math.min(r, g, b)
            const l = (max + min) / 2
            const textColor = l < 0.72 ? '#f8f9fa' : '#1a1d21'

            return (
              <Button style={{ backgroundColor: value, borderColor: value, color: textColor }}>
                Botão Principal
              </Button>
            )
          })()}
          <div
            className="px-3 py-2 rounded text-sm font-medium"
            style={{ backgroundColor: value + '20', color: value }}
          >
            Badge
          </div>
        </div>
      </div>
    </div>
  )
}
