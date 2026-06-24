import * as React from "react"
import { Button, type ButtonProps } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// AgendaButton: botão padronizado para a Agenda (altura 40px, cantos rounded-xl 20px)
export const AgendaButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        className={cn(
          "h-10 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-200 border border-transparent shadow-none",
          variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90 hover:translate-y-[-1px] active:scale-[0.98]",
          variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:translate-y-[-1px] active:scale-[0.98]",
          variant === "outline" && "border-border bg-background hover:bg-accent/80 hover:translate-y-[-1px] text-foreground active:scale-[0.98]",
          variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:translate-y-[-1px] active:scale-[0.98]",
          variant === "ghost" && "hover:bg-accent/80 text-foreground active:scale-[0.98]",
          className
        )}
        {...props}
      />
    )
  }
)
AgendaButton.displayName = "AgendaButton"

// AgendaFilterButton: botão de filtro (seletor) padronizado (altura 40px, cantos rounded-xl 20px)
export const AgendaFilterButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps & { active?: boolean }
>(({ className, active, children, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="outline"
      className={cn(
        "h-10 px-4 text-xs font-semibold uppercase tracking-wider border-border bg-background rounded-xl hover:bg-accent/80 transition-all duration-200 shadow-none active:scale-[0.98]",
        active && "bg-accent text-foreground font-bold border-accent-foreground/10",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
})
AgendaFilterButton.displayName = "AgendaFilterButton"
