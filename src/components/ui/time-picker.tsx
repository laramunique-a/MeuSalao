import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TimePickerProps {
    value: string
    onChange: (value: string) => void
    disabled?: boolean
    className?: string
}

export function TimePicker({ value, onChange, disabled, className }: TimePickerProps) {
    const [hValue, mValue] = React.useMemo(() => {
        if (!value || !value.includes(":")) return ["", ""]
        return value.split(":")
    }, [value])

    const [localHour, setLocalHour] = React.useState(hValue)
    const [localMinute, setLocalMinute] = React.useState(mValue)

    // Update local state when prop value changes (e.g. form reset)
    React.useEffect(() => {
        setLocalHour(hValue)
        setLocalMinute(mValue)
    }, [hValue, mValue])

    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 2)
        setLocalHour(val)

        if (val.length === 2) {
            const num = parseInt(val)
            if (num > 23) val = "23"
            setLocalHour(val)
            onChange(`${val}:${localMinute.padStart(2, '0')}`)
        }
    }

    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 2)
        setLocalMinute(val)

        if (val.length === 2) {
            const num = parseInt(val)
            if (num > 59) val = "59"
            setLocalMinute(val)
            onChange(`${localHour.padStart(2, '0')}:${val}`)
        }
    }

    const handleBlur = () => {
        // Se ambos estiverem vazios, mantém vazio e notifica o formulário
        if (localHour === "" && localMinute === "") {
            onChange("");
            return;
        }

        let h = localHour.padStart(2, '0')
        let m = localMinute.padStart(2, '0')

        // Se um dos campos estiver vazio mas o outro não, podemos manter um padrão ou deixar vazio
        // Aqui, se o usuário digitou algo, garantimos que seja um número válido
        if (localHour !== "") {
            const hNum = parseInt(h)
            if (isNaN(hNum)) h = "08"
            else if (hNum > 23) h = "23"
            else h = hNum.toString().padStart(2, '0')
        } else {
            h = ""
        }

        if (localMinute !== "") {
            const mNum = parseInt(m)
            if (isNaN(mNum)) m = "00"
            else if (mNum > 59) m = "59"
            else m = mNum.toString().padStart(2, '0')
        } else {
            m = ""
        }

        setLocalHour(h)
        setLocalMinute(m)

        if (h !== "" && m !== "") {
            onChange(`${h}:${m}`)
        } else if (h === "" && m === "") {
            onChange("")
        }
    }

    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="flex-1 max-w-[70px]">
                <Input
                    type="text"
                    inputMode="numeric"
                    value={localHour}
                    onChange={handleHourChange}
                    onBlur={handleBlur}
                    onFocus={(e) => e.target.select()}
                    disabled={disabled}
                    placeholder="HH"
                    className="text-center font-medium"
                />
            </div>
            <span className="text-muted-foreground font-bold text-lg">:</span>
            <div className="flex-1 max-w-[70px]">
                <Input
                    type="text"
                    inputMode="numeric"
                    value={localMinute}
                    onChange={handleMinuteChange}
                    onBlur={handleBlur}
                    onFocus={(e) => e.target.select()}
                    disabled={disabled}
                    placeholder="mm"
                    className="text-center font-medium"
                />
            </div>
        </div>
    )
}
