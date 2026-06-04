"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { es } from "date-fns/locale"

import { cn } from "@/shared/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"

export interface DatePickerProps {
  value?: Date | string | null
  onChange: (date: Date) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccionar fecha",
  className,
  disabled,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const timeValue = value ? new Date(value).getTime() : null
  const parsedValue = React.useMemo(() => (timeValue ? new Date(timeValue) : null), [timeValue])
  const [currentMonth, setCurrentMonth] = React.useState(parsedValue || new Date())

  // Ensure current month syncs if external value changes (and popover is closed)
  React.useEffect(() => {
    if (parsedValue && !isOpen) {
      setCurrentMonth(parsedValue)
    }
  }, [parsedValue, isOpen])

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }) // Week starts on Monday
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: startDate, end: endDate })
  const weekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"]

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-[11px] border border-border/40 bg-card/45 px-3 text-xs outline-none transition-all",
          "hover:border-border/70 hover:bg-card/75 focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
          !parsedValue && "text-muted-foreground",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <span className="truncate">
          {parsedValue ? format(parsedValue, "PPP", { locale: es }) : placeholder}
        </span>
        <CalendarIcon className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
      </PopoverTrigger>
      
      <PopoverContent 
        align="start" 
        className="w-auto p-3 rounded-[18px] border border-border/40 shadow-xl bg-card"
      >
        <div className="flex flex-col space-y-3">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevMonth}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-all hover:border-border/40 hover:bg-muted/50 active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[13px] font-semibold capitalize text-foreground">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-transparent text-muted-foreground transition-all hover:border-border/40 hover:bg-muted/50 active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">
              {weekDays.map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                const isSelected = parsedValue ? isSameDay(day, parsedValue) : false
                const isCurrentMonth = isSameMonth(day, currentMonth)
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      onChange(day)
                      setIsOpen(false)
                    }}
                    className={cn(
                      "flex h-8 w-8 cursor-pointer items-center justify-center rounded-[9px] text-xs font-medium transition-all active:scale-95",
                      isCurrentMonth
                        ? "text-foreground hover:bg-muted/60"
                        : "text-muted-foreground/30 hover:text-muted-foreground/60 hover:bg-muted/30",
                      isSelected &&
                        "bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/90"
                    )}
                  >
                    {format(day, "d")}
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* Quick Actions (Today) */}
          <div className="pt-2 border-t border-border/25 mt-1">
            <button
              type="button"
              onClick={() => {
                onChange(new Date())
                setIsOpen(false)
              }}
              className="w-full rounded-lg py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:bg-brand-500/10 transition-colors cursor-pointer"
            >
              Seleccionar Hoy
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
