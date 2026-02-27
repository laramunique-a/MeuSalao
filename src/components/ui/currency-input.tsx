import { Input } from '@/components/ui/input'
import { forwardRef } from 'react'

interface CurrencyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value = '', onChange, ...props }, ref) => {
    const formatCurrency = (inputValue: string): string => {
      const numbers = inputValue.replace(/\D/g, '')
      if (numbers === '') return ''
      
      const amount = Number(numbers) / 100
      return amount.toFixed(2).replace('.', ',')
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatCurrency(e.target.value)
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          value: formatted,
        },
      }
      onChange?.(newEvent as React.ChangeEvent<HTMLInputElement>)
    }

    return (
      <Input
        ref={ref}
        {...props}
        value={value}
        onChange={handleChange}
        placeholder="0,00"
      />
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'
