import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type DateNavigatorProps = {
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  labelToday?: string
  isTodayActive?: boolean
  className?: string
} & (
  | {
      mode: "single"
      selectedDate: Date
      onSelectDate: (date: Date) => void
    }
  | {
      mode: "range"
      selectedRange: { from: Date; to: Date }
      onSelectRange: (range: { from: Date; to: Date }) => void
    }
)

export function DateNavigator(props: DateNavigatorProps) {
  const {
    onPrev,
    onNext,
    onToday,
    labelToday = "HOJE",
    isTodayActive = false,
    className,
    mode,
  } = props

  const [popoverOpen, setPopoverOpen] = useState(false)
  const [tempRange, setTempRange] = useState<{ from: Date | undefined; to?: Date | undefined } | undefined>(
    props.mode === "range" ? { from: props.selectedRange.from, to: props.selectedRange.to } : undefined
  )

  useEffect(() => {
    if (props.mode === "range") {
      setTempRange({ from: props.selectedRange.from, to: props.selectedRange.to })
    }
  }, [props.mode === "range" ? props.selectedRange.from.getTime() + props.selectedRange.to.getTime() : null])

  const renderDateText = () => {
    if (mode === "single") {
      const { selectedDate } = props
      return (
        <div className="flex flex-col items-start leading-none pr-1">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            {format(selectedDate, "EEEE", { locale: ptBR }).toUpperCase()}
          </span>
          <span className="text-[11px] font-bold text-foreground uppercase tracking-tight mt-0.5">
            {format(selectedDate, "dd 'de' MMMM", { locale: ptBR }).toUpperCase()}
          </span>
        </div>
      )
    } else {
      const { selectedRange } = props
      const fromStr = format(selectedRange.from, "dd/MM/yyyy")
      const toStr = format(selectedRange.to, "dd/MM/yyyy")
      return (
        <div className="flex flex-col items-start leading-none pr-1">
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            PERÍODO
          </span>
          <span className="text-[11px] font-bold text-foreground uppercase tracking-tight mt-0.5">
            {`${fromStr} A ${toStr}`}
          </span>
        </div>
      )
    }
  }

  return (
    <div className={cn("flex items-center bg-background rounded-xl border border-border p-0.5 h-10 select-none", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onPrev}
        className="h-9 w-9 rounded-lg hover:bg-accent/80 text-foreground active:scale-95 transition-all"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover open={popoverOpen} onOpenChange={(open) => {
        setPopoverOpen(open)
        if (!open && props.mode === "range" && tempRange?.from) {
          props.onSelectRange({
            from: tempRange.from,
            to: tempRange.to || tempRange.from
          })
        }
      }}>
        <PopoverTrigger asChild>
          <div className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-accent/50 transition-all cursor-pointer">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            
            <span
              onClick={(e) => {
                e.stopPropagation()
                onToday()
              }}
              className={cn(
                "text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer",
                isTodayActive && "text-foreground bg-accent"
              )}
            >
              {labelToday}
            </span>

            <div className="h-5 w-[1px] bg-border mx-1" />

            {renderDateText()}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border border-border rounded-lg" align="start">
          {mode === "single" ? (
            <Calendar
              mode="single"
              selected={props.selectedDate}
              onSelect={(date) => {
                if (date) {
                  props.onSelectDate(date)
                  setPopoverOpen(false)
                }
              }}
              initialFocus
              locale={ptBR}
              className="p-3"
            />
          ) : (
            <Calendar
              mode="range"
              selected={tempRange}
              onSelect={(range) => {
                setTempRange(range)
                if (range?.from && range?.to) {
                  props.onSelectRange({ from: range.from, to: range.to })
                  setPopoverOpen(false)
                }
              }}
              initialFocus
              locale={ptBR}
              className="p-3"
            />
          )}
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onNext}
        className="h-9 w-9 rounded-lg hover:bg-accent/80 text-foreground active:scale-95 transition-all"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
