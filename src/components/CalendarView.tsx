import React, { useState } from 'react'
import {
  format,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getISOWeek
} from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Sun,
  Moon,
  LayoutGrid,
  CalendarRange
} from 'lucide-react'
import { StudyRecord, WeeklyTarget } from '../types'
import { formatMinutes } from '../utils/helpers'

const STORAGE_VIEW_MODE_KEY = 'study_tracker_calendar_layout_mode_v1'

interface CalendarViewProps {
  currentMonth: Date
  onChangeMonth: (date: Date) => void
  records: StudyRecord[]
  targets: WeeklyTarget[]
  totalHoursTarget?: number
  onSelectDay: (date: Date) => void
  onAddSessionOnDay: (date: Date) => void
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentMonth,
  onChangeMonth,
  records,
  targets,
  totalHoursTarget,
  onSelectDay,
  onAddSessionOnDay
}) => {
  // Layout mode: 'month' vs 'week', persisted in localStorage
  const [viewMode, setViewMode] = useState<'month' | 'week'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_VIEW_MODE_KEY)
      return saved === 'week' ? 'week' : 'month'
    } catch {
      return 'month'
    }
  })

  const handleViewModeChange = (mode: 'month' | 'week') => {
    setViewMode(mode)
    try {
      localStorage.setItem(STORAGE_VIEW_MODE_KEY, mode)
    } catch (e) {
      console.error('Failed to save calendar view mode to localStorage', e)
    }
  }

  // Quick period filter: all / morning / evening
  const [periodFilter, setPeriodFilter] = useState<'all' | 'morning' | 'evening'>('all')

  // Month bounds & days
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  const numWeeks = Math.max(5, Math.ceil(monthDays.length / 7))

  // Week bounds & days
  const weekStart = startOfWeek(currentMonth, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(currentMonth, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const weekNumber = getISOWeek(currentMonth)

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'week') {
      onChangeMonth(subWeeks(currentMonth, 1))
    } else {
      onChangeMonth(subMonths(currentMonth, 1))
    }
  }

  const handleNext = () => {
    if (viewMode === 'week') {
      onChangeMonth(addWeeks(currentMonth, 1))
    } else {
      onChangeMonth(addMonths(currentMonth, 1))
    }
  }

  const handleToday = () => onChangeMonth(new Date())

  // Helper to determine Morning vs Evening for any record
  const getRecordTimeOfDay = (rec: StudyRecord): 'morning' | 'evening' => {
    if (rec.timeOfDay) {
      return rec.timeOfDay === 'morning' ? 'morning' : 'evening'
    }
    if (rec.startTime) {
      const hour = parseInt(rec.startTime.split(':')[0], 10)
      return hour < 12 ? 'morning' : 'evening'
    }
    if (rec.createdAt) {
      try {
        const hour = new Date(rec.createdAt).getHours()
        return hour < 12 ? 'morning' : 'evening'
      } catch {
        return 'evening'
      }
    }
    return 'evening'
  }

  // Sort helper: Morning (AM) on top, Evening (PM) below, ordered chronologically
  const sortRecordsByTimeOfDay = (a: StudyRecord, b: StudyRecord): number => {
    const isMorningA = getRecordTimeOfDay(a) === 'morning'
    const isMorningB = getRecordTimeOfDay(b) === 'morning'
    if (isMorningA !== isMorningB) {
      return isMorningA ? -1 : 1
    }
    // If both are morning or both evening, order chronologically by startTime
    if (a.startTime && b.startTime) {
      const timeDiff = a.startTime.localeCompare(b.startTime)
      if (timeDiff !== 0) return timeDiff
    }
    if (a.startTime && !b.startTime) return -1
    if (!a.startTime && b.startTime) return 1

    // Fallback to createdAt ascending
    if (a.createdAt && b.createdAt) {
      return a.createdAt.localeCompare(b.createdAt)
    }
    return 0
  }

  // Map subject to color helper (matching by subject, name, id, or keyword fallbacks)
  const getSubjectColor = (subject?: string, subjectName?: string): string => {
    const s = (subject || '').trim().toLowerCase()
    const sn = (subjectName || '').trim().toLowerCase()

    const found = targets.find(t => {
      const ts = (t.subject || '').trim().toLowerCase()
      const tn = (t.name || '').trim().toLowerCase()
      return (
        (ts && (ts === s || ts === sn)) ||
        (tn && (tn === s || tn === sn)) ||
        (t.id && (t.id === subject || t.id === subjectName))
      )
    })
    if (found?.color) return found.color

    // Fallbacks for well-known subjects
    if (s.includes('aws') || sn.includes('aws') || s.includes('cloud') || sn.includes('cloud')) {
      return '#FF9900' // AWS Orange
    }
    if (s.includes('golang') || sn.includes('golang') || s.includes('go') || sn.includes('go')) {
      return '#00ADD8' // Golang Cyan
    }
    if (s.includes('leetcode') || sn.includes('leetcode') || s.includes('algo') || sn.includes('algo')) {
      return '#10B981' // LeetCode Emerald Green
    }
    if (s.includes('english') || sn.includes('english') || s.includes('ielts') || sn.includes('ielts')) {
      return '#3B82F6' // English Blue
    }

    return '#6366F1'
  }

  const weekDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  // Month-wide stats
  const monthRecords = records.filter(r => {
    try {
      return isSameMonth(new Date(r.date), currentMonth)
    } catch {
      return false
    }
  })
  const morningMonthRecords = monthRecords.filter(r => getRecordTimeOfDay(r) === 'morning')
  const eveningMonthRecords = monthRecords.filter(r => getRecordTimeOfDay(r) === 'evening')
  const morningMonthMinutes = morningMonthRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
  const eveningMonthMinutes = eveningMonthRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
  const totalMonthMinutes = monthRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)

  // Week-wide stats
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd')
  const weekRecords = records.filter(r => r.date >= weekStartStr && r.date <= weekEndStr)
  const morningWeekRecords = weekRecords.filter(r => getRecordTimeOfDay(r) === 'morning')
  const eveningWeekRecords = weekRecords.filter(r => getRecordTimeOfDay(r) === 'evening')
  const morningWeekMinutes = morningWeekRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
  const eveningWeekMinutes = eveningWeekRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
  const totalWeekMinutes = weekRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)

  // Dynamic values depending on active layout mode
  const activeRecords = viewMode === 'week' ? weekRecords : monthRecords
  const activeMorningRecords = viewMode === 'week' ? morningWeekRecords : morningMonthRecords
  const activeEveningRecords = viewMode === 'week' ? eveningWeekRecords : eveningMonthRecords
  const activeMorningMinutes = viewMode === 'week' ? morningWeekMinutes : morningMonthMinutes
  const activeEveningMinutes = viewMode === 'week' ? eveningWeekMinutes : eveningMonthMinutes
  const activeTotalMinutes = viewMode === 'week' ? totalWeekMinutes : totalMonthMinutes
  const subjectsWeeklyTargetSum = Math.round(
    targets.reduce((acc, t) => acc + (Number(t.targetHoursPerWeek) || 0), 0) * 10
  ) / 10
  const effectiveWeeklyTarget = subjectsWeeklyTargetSum > 0 ? subjectsWeeklyTargetSum : (totalHoursTarget || 0)
  const effectiveMonthlyTarget = Math.round(effectiveWeeklyTarget * 4 * 10) / 10

  const activeTargetHours = effectiveWeeklyTarget > 0
    ? (viewMode === 'week' ? effectiveWeeklyTarget : effectiveMonthlyTarget)
    : null

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs select-none">
      {/* Calendar Header Bar */}
      <div className="px-3 py-2 sm:px-5 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-slate-200/80 bg-white shrink-0">
        {/* Month / Week Title & Overview */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-baseline gap-1.5 sm:gap-2">
            <h2 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight">
              {viewMode === 'week' ? (
                <>
                  <span className="sm:hidden">W{weekNumber} • {format(weekStart, 'MMM d')}–{format(weekEnd, 'd')}</span>
                  <span className="hidden sm:inline">Week {weekNumber} • {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d, yyyy')}</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">{format(currentMonth, 'MMM yyyy')}</span>
                  <span className="hidden sm:inline">{format(currentMonth, 'MMMM yyyy')}</span>
                </>
              )}
            </h2>
            <span className="text-xs font-semibold text-slate-400">
              ({formatMinutes(activeTotalMinutes)}
              {activeTargetHours ? ` / ${activeTargetHours}h` : ''})
            </span>
          </div>

          {/* Morning / Evening Tracking Pills */}
          <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-slate-200">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60 shadow-2xs">
              <Sun className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span>{activeMorningRecords.length} Morning</span>
              <span className="text-amber-600/80 font-medium">({formatMinutes(activeMorningMinutes)})</span>
            </span>

            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/60 shadow-2xs">
              <Moon className="w-3 h-3 text-indigo-500 fill-indigo-500" />
              <span>{activeEveningRecords.length} Evening</span>
              <span className="text-indigo-600/80 font-medium">({formatMinutes(activeEveningMinutes)})</span>
            </span>
          </div>
        </div>

        {/* Filter & View Mode & Navigation Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto scrollbar-none max-w-full pb-0.5">
          {/* View Mode Switcher: Month vs Week */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
            <button
              onClick={() => handleViewModeChange('month')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                viewMode === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Switch to Month Layout"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">Month</span>
            </button>
            <button
              onClick={() => handleViewModeChange('week')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer ${
                viewMode === 'week'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Switch to Weekly Layout"
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">Week</span>
            </button>
          </div>

          <div className="w-[1px] h-4 bg-slate-200 hidden md:block"></div>

          {/* Quick Filter: All / Morning / Evening */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-2 sm:px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                periodFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All ({activeRecords.length})
            </button>
            <button
              onClick={() => setPeriodFilter('morning')}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition-all flex items-center gap-0.5 sm:gap-1 cursor-pointer ${
                periodFilter === 'morning'
                  ? 'bg-amber-100 text-amber-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-amber-700'
              }`}
              title="Filter Morning sessions"
            >
              <Sun className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="hidden sm:inline">Morning</span>
              <span className="text-[11px] sm:text-xs">({activeMorningRecords.length})</span>
            </button>
            <button
              onClick={() => setPeriodFilter('evening')}
              className={`px-1.5 sm:px-2 py-1 rounded-lg transition-all flex items-center gap-0.5 sm:gap-1 cursor-pointer ${
                periodFilter === 'evening'
                  ? 'bg-indigo-100 text-indigo-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-indigo-700'
              }`}
              title="Filter Evening sessions"
            >
              <Moon className="w-3 h-3 text-indigo-500 fill-indigo-500" />
              <span className="hidden sm:inline">Evening</span>
              <span className="text-[11px] sm:text-xs">({activeEveningRecords.length})</span>
            </button>
          </div>

          <button
            onClick={handleToday}
            className="px-2 sm:px-2.5 py-1.5 text-xs font-semibold text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
          >
            Today
          </button>

          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={handlePrev}
              className="p-1 sm:p-1.5 hover:bg-white text-slate-600 active:scale-95 transition-all cursor-pointer"
              title={viewMode === 'week' ? 'Previous week' : 'Previous month'}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-3.5 bg-slate-200"></div>
            <button
              onClick={handleNext}
              className="p-1 sm:p-1.5 hover:bg-white text-slate-600 active:scale-95 transition-all cursor-pointer"
              title={viewMode === 'week' ? 'Next week' : 'Next month'}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'week' ? (
        /* ================= WEEKLY LAYOUT (Mobile swipe-snap carousel + Desktop 7-col grid) ================= */
        <div className="flex-1 min-h-0 overflow-x-auto flex md:grid md:grid-cols-7 divide-x divide-slate-200/80 bg-white snap-x snap-mandatory md:snap-none scrollbar-thin">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const isCurrentDay = isToday(day)
            const dayRecords = records.filter(r => r.date === dateStr)
            const totalDayMinutes = dayRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0)
            const morningRecords = dayRecords.filter(r => getRecordTimeOfDay(r) === 'morning')
            const eveningRecords = dayRecords.filter(r => getRecordTimeOfDay(r) === 'evening')

            const filteredRecords = dayRecords
              .filter(r => {
                if (periodFilter === 'all') return true
                return getRecordTimeOfDay(r) === periodFilter
              })
              .sort(sortRecordsByTimeOfDay)

            return (
              <div
                key={dateStr}
                className={`flex flex-col h-full overflow-hidden transition-colors w-[250px] sm:w-[270px] md:w-auto shrink-0 md:shrink snap-start md:snap-align-none ${
                  isCurrentDay ? 'bg-blue-50/20' : 'bg-white'
                }`}
              >
                {/* Column Header: Day of Week + Date Number */}
                <div
                  onClick={() => onSelectDay(day)}
                  className={`p-2 sm:p-2.5 border-b border-slate-100 flex items-center justify-between shrink-0 cursor-pointer group hover:bg-slate-50 transition-colors ${
                    isCurrentDay ? 'bg-blue-50/60' : 'bg-slate-50/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span
                      className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-full text-xs font-black shrink-0 transition-all ${
                        isCurrentDay
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-800 bg-white border border-slate-200 group-hover:border-slate-300'
                      }`}
                    >
                      {format(day, 'd')}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-[11px] sm:text-xs font-bold truncate ${isCurrentDay ? 'text-blue-700' : 'text-slate-700'}`}>
                        {format(day, 'EEE')}
                      </div>
                      {totalDayMinutes > 0 ? (
                        <div className="text-[10px] font-mono font-semibold text-slate-500">
                          {formatMinutes(totalDayMinutes)}
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-300 italic hidden sm:block">No study</div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddSessionOnDay(day)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all active:scale-95 cursor-pointer shrink-0"
                    title="Log session on this day"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Day Slot indicator bar */}
                {(morningRecords.length > 0 || eveningRecords.length > 0) && (
                  <div className="px-2 py-1 bg-slate-50/80 border-b border-slate-100 flex items-center gap-1.5 shrink-0 text-[10px]">
                    {morningRecords.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-amber-700 font-bold">
                        <Sun className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                        <span>{morningRecords.length}</span>
                      </span>
                    )}
                    {morningRecords.length > 0 && eveningRecords.length > 0 && (
                      <span className="text-slate-300">•</span>
                    )}
                    {eveningRecords.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-indigo-700 font-bold">
                        <Moon className="w-2.5 h-2.5 text-indigo-500 fill-indigo-500" />
                        <span>{eveningRecords.length}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Sessions list in Week Column */}
                <div className="p-1.5 sm:p-2 space-y-2 flex-1 overflow-y-auto scrollbar-none min-h-0">
                  {filteredRecords.map((rec) => {
                    const isMorning = getRecordTimeOfDay(rec) === 'morning'
                    const color = getSubjectColor(rec.subject, rec.subjectName)
                    const formattedDuration = formatMinutes(rec.durationMinutes)

                    return (
                      <div
                        key={rec.id}
                        onClick={() => onSelectDay(day)}
                        className="p-2 rounded-xl border border-slate-200 bg-white shadow-2xs hover:shadow-xs hover:border-slate-300 transition-all flex flex-col gap-1 cursor-pointer group/card"
                        style={{
                          borderLeftWidth: '3.5px',
                          borderLeftColor: color,
                          borderTopColor: '#E2E8F0',
                          borderRightColor: '#E2E8F0',
                          borderBottomColor: '#E2E8F0'
                        }}
                      >
                        {/* Row 1: Slot + Time + Duration */}
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1 min-w-0">
                            {isMorning ? (
                              <span className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200/60">
                                <Sun className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                <span>AM</span>
                              </span>
                            ) : (
                              <span className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200/60">
                                <Moon className="w-2.5 h-2.5 text-indigo-500 fill-indigo-500" />
                                <span>PM</span>
                              </span>
                            )}
                            {rec.startTime && (
                              <span className="text-[10px] font-mono text-slate-400 font-medium">
                                {rec.startTime}
                              </span>
                            )}
                          </div>

                          <span className="shrink-0 text-[10px] font-mono font-bold text-blue-700 bg-blue-50/80 px-1.5 py-0.2 rounded">
                            {formattedDuration}
                          </span>
                        </div>

                        {/* Subject name */}
                        <div className="text-[11px] font-bold text-slate-800 truncate leading-tight">
                          {rec.subjectName || rec.subject.toUpperCase()}
                        </div>

                        {/* Topic / Focus Area */}
                        {rec.title && (
                          <div className="text-[10px] text-slate-500 line-clamp-2 leading-snug">
                            {rec.title}
                          </div>
                        )}

                        {/* Notes snippet */}
                        {rec.notes && (
                          <div className="text-[9px] text-slate-400 italic line-clamp-2 border-t border-slate-50 pt-1 mt-0.5">
                            {rec.notes.replace(/\n/g, ' ')}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Empty state button to log session */}
                  {filteredRecords.length === 0 && (
                    <button
                      onClick={() => onAddSessionOnDay(day)}
                      className="w-full py-6 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex flex-col items-center justify-center gap-1 text-[11px] font-medium cursor-pointer"
                    >
                      <Plus className="w-4 h-4 opacity-50" />
                      <span>Log</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ================= MONTHLY LAYOUT (Multi-week calendar grid) ================= */
        <>
          {/* Mobile Swipe / Scroll Hint */}
          <div className="md:hidden px-3 py-1 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between text-[10px] font-medium text-slate-500 shrink-0 select-none">
            <span>👈 Swipe for all 7 days</span>
            <span>Scroll down for weeks 👇</span>
          </div>

          <div className="flex-1 min-h-0 overflow-auto scrollbar-thin flex flex-col">
            <div className="min-w-[680px] md:min-w-0 flex-1 flex flex-col h-full">
              {/* Days of Week Header (Mon - Sun) */}
              <div className="grid grid-cols-7 border-b border-slate-200/80 bg-slate-100 text-center text-xs font-bold text-slate-600 py-1.5 shrink-0 sticky top-0 z-20 shadow-2xs">
              {weekDayHeaders.map((day, idx) => (
                <div
                  key={day}
                  className={`${idx >= 5 ? 'text-amber-700/80' : ''}`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid Cells (Dynamic rows on desktop, scrollable min-height on mobile) */}
            <div
              className="grid grid-cols-7 flex-1 gap-[1px] bg-slate-200/80 [grid-template-rows:repeat(var(--weeks),minmax(120px,1fr))] md:[grid-template-rows:repeat(var(--weeks),minmax(0,1fr))]"
              style={{
                '--weeks': numWeeks
              } as React.CSSProperties}
            >
            {monthDays.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd')
              const isCurrent = isSameMonth(day, monthStart)
              const isCurrentDay = isToday(day)

              // Find records for this specific day
              const dayRecords = records.filter(r => r.date === dateStr)
              const totalDayMinutes = dayRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0)

              const morningRecords = dayRecords.filter(r => getRecordTimeOfDay(r) === 'morning')
              const eveningRecords = dayRecords.filter(r => getRecordTimeOfDay(r) === 'evening')

              // Filter records according to selected period (Morning on top, Evening below)
              const filteredRecords = dayRecords
                .filter(r => {
                  if (periodFilter === 'all') return true
                  return getRecordTimeOfDay(r) === periodFilter
                })
                .sort(sortRecordsByTimeOfDay)

              return (
                <div
                  key={dateStr}
                  onClick={() => onSelectDay(day)}
                  className={`group h-full min-h-[120px] md:min-h-0 p-1.5 sm:p-2 flex flex-col justify-between transition-colors cursor-pointer overflow-hidden ${
                    isCurrent
                      ? isCurrentDay
                        ? 'bg-blue-50/40 hover:bg-blue-50/70'
                        : 'bg-white hover:bg-slate-50/90'
                      : 'bg-slate-50/50 text-slate-400 hover:bg-slate-100/60'
                  }`}
                >
                  {/* Day Cell Top: Date Number & Micro-indicators */}
                  <div className="flex items-center justify-between shrink-0 mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                          isCurrentDay
                            ? 'bg-blue-600 text-white shadow-xs'
                            : isCurrent
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {format(day, 'd')}
                      </span>

                      {/* Morning / Evening counts on this day */}
                      {morningRecords.length > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200/50"
                          title={`${morningRecords.length} Morning study session(s)`}
                        >
                          <Sun className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          <span>{morningRecords.length}</span>
                        </span>
                      )}

                      {eveningRecords.length > 0 && (
                        <span
                          className="inline-flex items-center gap-0.5 text-[9px] font-extrabold px-1 py-0.2 rounded bg-indigo-50 text-indigo-800 border border-indigo-200/50"
                          title={`${eveningRecords.length} Evening study session(s)`}
                        >
                          <Moon className="w-2.5 h-2.5 text-indigo-500 fill-indigo-500" />
                          <span>{eveningRecords.length}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {totalDayMinutes > 0 && (
                        <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-bold text-slate-600 bg-slate-100/90 px-1.5 py-0.5 rounded shadow-2xs">
                          <Clock className="w-2.5 h-2.5 text-slate-400" />
                          {formatMinutes(totalDayMinutes)}
                        </span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onAddSessionOnDay(day)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all active:scale-95 cursor-pointer"
                        title="Log session on this day"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Day Records List: Topic / Focus Area & Time Tracking Display */}
                  <div className="space-y-1 flex-1 overflow-y-auto scrollbar-none pr-0.5">
                    {filteredRecords.map((rec) => {
                      const isMorning = getRecordTimeOfDay(rec) === 'morning'
                      const color = getSubjectColor(rec.subject, rec.subjectName)
                      const formattedDuration = formatMinutes(rec.durationMinutes)

                      return (
                        <div
                          key={rec.id}
                          className="p-1 sm:p-1.5 rounded-lg border border-slate-200 bg-white shadow-2xs hover:shadow-xs transition-all flex flex-col gap-0.5"
                          style={{
                            borderLeftWidth: '3.5px',
                            borderLeftColor: color,
                            borderTopColor: '#E2E8F0',
                            borderRightColor: '#E2E8F0',
                            borderBottomColor: '#E2E8F0'
                          }}
                          title={`${rec.subjectName} (${isMorning ? 'Morning' : 'Evening'})\nTopic: ${rec.title || 'Untitled'}\nDuration: ${formattedDuration}`}
                        >
                          {/* Line 1: Time of Day Badge + Subject + Tracking Hours */}
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1 min-w-0">
                              {/* Morning / Evening pill */}
                              {isMorning ? (
                                <span className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200/60">
                                  <Sun className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                  <span className="hidden xl:inline">AM</span>
                                </span>
                              ) : (
                                <span className="shrink-0 inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200/60">
                                  <Moon className="w-2.5 h-2.5 text-indigo-500 fill-indigo-500" />
                                  <span className="hidden xl:inline">PM</span>
                                </span>
                              )}

                              {/* Subject name */}
                              <span className="text-[10px] font-bold text-slate-800 truncate">
                                {rec.subjectName || rec.subject.toUpperCase()}
                              </span>
                            </div>

                            {/* Tracking duration / hours */}
                            <span className="shrink-0 text-[10px] font-mono font-bold text-blue-700 bg-blue-50/80 px-1 py-0.2 rounded">
                              {formattedDuration}
                            </span>
                          </div>

                          {/* Line 2: Topic / Focus Area Only */}
                          {rec.title ? (
                            <div className="text-[9px] font-normal text-slate-400 truncate leading-tight mt-0.5">
                              {rec.title}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>

                  {/* Day Bottom indicator on small mobile viewports */}
                  {totalDayMinutes > 0 && (
                    <div className="sm:hidden text-[9px] text-slate-500 font-semibold text-right mt-0.5 shrink-0">
                      {formatMinutes(totalDayMinutes)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  )
}

export default CalendarView
