import React from 'react'
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday
} from 'date-fns'
import { vi } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react'
import { StudyRecord, WeeklyTarget } from '../types'
import { formatMinutes } from '../utils/helpers'

interface CalendarViewProps {
  currentMonth: Date
  onChangeMonth: (date: Date) => void
  records: StudyRecord[]
  targets: WeeklyTarget[]
  onSelectDay: (date: Date) => void
  onAddSessionOnDay: (date: Date) => void
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentMonth,
  onChangeMonth,
  records,
  targets,
  onSelectDay,
  onAddSessionOnDay
}) => {
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const handlePrevMonth = () => onChangeMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => onChangeMonth(addMonths(currentMonth, 1))
  const handleToday = () => onChangeMonth(new Date())

  // Map subject to color helper
  const getSubjectColor = (subject: string): string => {
    const found = targets.find(t => t.subject.toLowerCase() === subject.toLowerCase())
    if (found) return found.color
    if (subject.toLowerCase() === 'aws') return '#FF9900'
    if (subject.toLowerCase() === 'golang') return '#00ADD8'
    if (subject.toLowerCase() === 'leetcode') return '#FEA015'
    return '#6366F1'
  }

  const weekDayHeaders = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Calendar Header Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 capitalize">
            Tháng {format(currentMonth, 'MM, yyyy')}
          </h2>
          <span className="text-xs text-slate-400 font-normal">
            ({format(currentMonth, 'MMMM yyyy', { locale: vi })})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-xs"
          >
            Hôm nay
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white text-slate-600 active:scale-95 transition-all"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200"></div>
            <button
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white text-slate-600 active:scale-95 transition-all"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 text-center text-xs font-semibold text-slate-600 py-2.5">
        {weekDayHeaders.map((day, idx) => (
          <div
            key={day}
            className={`${idx >= 5 ? 'text-amber-700/80' : ''}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid Cells */}
      <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-[1px]">
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isCurrent = isSameMonth(day, monthStart)
          const isCurrentDay = isToday(day)

          // Find records for this specific day
          const dayRecords = records.filter(r => r.date === dateStr)
          const totalDayMinutes = dayRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0)

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDay(day)}
              className={`group min-h-[110px] sm:min-h-[125px] p-2 flex flex-col justify-between transition-colors cursor-pointer ${
                isCurrent ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/40 text-slate-400 hover:bg-slate-100/50'
              }`}
            >
              {/* Day Cell Top: Date Number & Quick Add */}
              <div className="flex items-center justify-between">
                <span
                  className={`w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCurrentDay
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isCurrent
                      ? 'text-slate-800'
                      : 'text-slate-400'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                <div className="flex items-center gap-1">
                  {totalDayMinutes > 0 && (
                    <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                      {formatMinutes(totalDayMinutes)}
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddSessionOnDay(day)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all active:scale-95"
                    title="Ghi nhận buổi học ngày này"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day Records List */}
              <div className="mt-1.5 space-y-1 flex-1 overflow-y-auto max-h-[85px] scrollbar-none">
                {dayRecords.map((rec) => {
                  const color = getSubjectColor(rec.subject)

                  return (
                    <div
                      key={rec.id}
                      className="px-1.5 py-1 rounded-md text-[11px] font-medium border flex items-center justify-between gap-1 shadow-2xs hover:shadow-xs transition-shadow"
                      style={{
                        backgroundColor: `${color}15`,
                        borderColor: `${color}40`,
                        color: '#1E293B'
                      }}
                      title={`${rec.subjectName}: ${rec.durationMinutes}m - ${rec.title}\n${rec.notes}`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold truncate">
                          {rec.subjectName || rec.subject.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold opacity-80 flex-shrink-0">
                        {rec.durationMinutes}m
                      </span>
                    </div>
                  )
                })}
              </div>

              {/* Day Bottom indicator on small screens */}
              {totalDayMinutes > 0 && (
                <div className="sm:hidden text-[9px] text-slate-500 font-semibold text-right mt-1">
                  {formatMinutes(totalDayMinutes)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
