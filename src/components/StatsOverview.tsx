import React, { useState, useMemo } from 'react'
import { StudyRecord, WeeklyTarget } from '../types'
import { formatMinutes } from '../utils/helpers'
import {
  Clock,
  BookCheck,
  TrendingUp,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Flame,
  Award,
  Search,
  Calendar as CalendarIcon,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Target,
  CheckCircle2,
  Trophy,
  Check
} from 'lucide-react'
import {
  format,
  isSameMonth,
  subMonths,
  addMonths,
  parseISO,
  subDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  getDay,
  startOfWeek,
  endOfWeek,
  getISOWeek
} from 'date-fns'

interface StatsOverviewProps {
  records: StudyRecord[]
  targets: WeeklyTarget[]
  totalHoursTarget?: number
  currentMonth: Date
  onChangeMonth?: (date: Date) => void
  onOpenNewSession: () => void
  onEditSession?: (record: StudyRecord) => void
  onDeleteSession?: (id: string) => Promise<void>
  onSwitchToCalendar?: () => void
}

type DateRangeFilter = 'month' | 'last30' | 'all'

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  records,
  targets,
  totalHoursTarget = 6.0,
  currentMonth,
  onChangeMonth,
  onOpenNewSession,
  onEditSession,
  onDeleteSession,
  onSwitchToCalendar
}) => {
  const [rangeFilter, setRangeFilter] = useState<DateRangeFilter>('month')
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all')
  const [selectedTimeOfDayFilter, setSelectedTimeOfDayFilter] = useState<'all' | 'morning' | 'evening'>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [historyTab, setHistoryTab] = useState<'week' | 'month'>('week')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'achieved' | 'pending'>('all')

  // Effective weekly and monthly targets derived strictly from subjects sum
  const subjectsWeeklyTargetSum = useMemo(() => {
    return Math.round(targets.reduce((acc, t) => acc + (Number(t.targetHoursPerWeek) || 0), 0) * 10) / 10
  }, [targets])

  const effectiveWeeklyTarget = subjectsWeeklyTargetSum > 0 ? subjectsWeeklyTargetSum : totalHoursTarget
  const effectiveMonthlyTarget = Math.round(effectiveWeeklyTarget * 4 * 10) / 10

  // Helper to determine Morning vs Evening for any record
  const getRecordTimeOfDay = (rec: StudyRecord): 'morning' | 'evening' => {
    if (rec.timeOfDay) return rec.timeOfDay === 'morning' ? 'morning' : 'evening'
    if (rec.startTime) {
      const h = parseInt(rec.startTime.split(':')[0], 10)
      return h < 12 ? 'morning' : 'evening'
    }
    if (rec.createdAt) {
      try {
        return new Date(rec.createdAt).getHours() < 12 ? 'morning' : 'evening'
      } catch {
        return 'evening'
      }
    }
    return 'evening'
  }

  // Filter records based on selected time range
  const filteredByRange = useMemo(() => {
    const today = new Date()

    return records.filter(r => {
      try {
        const rDate = parseISO(r.date)
        if (rangeFilter === 'month') {
          return isSameMonth(rDate, currentMonth)
        }
        if (rangeFilter === 'last30') {
          const thirtyDaysAgo = subDays(today, 30)
          return rDate >= thirtyDaysAgo && rDate <= today
        }
        return true // 'all'
      } catch {
        return false
      }
    })
  }, [records, rangeFilter, currentMonth])

  // Subject color helper
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
    if (s.includes('aws') || sn.includes('aws') || s.includes('cloud') || sn.includes('cloud')) return '#FF9900'
    if (s.includes('golang') || sn.includes('golang') || s.includes('go') || sn.includes('go')) return '#00ADD8'
    if (s.includes('leetcode') || sn.includes('leetcode') || s.includes('algo') || sn.includes('algo')) return '#10B981'
    if (s.includes('english') || sn.includes('english') || s.includes('ielts') || sn.includes('ielts')) return '#3B82F6'
    return '#6366F1'
  }

  // High-level Metrics
  const totalMinutes = filteredByRange.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10
  const totalSessions = filteredByRange.length

  const morningRecords = filteredByRange.filter(r => getRecordTimeOfDay(r) === 'morning')
  const eveningRecords = filteredByRange.filter(r => getRecordTimeOfDay(r) === 'evening')

  const morningMinutes = morningRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
  const eveningMinutes = eveningRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
  const morningHours = Math.round((morningMinutes / 60) * 10) / 10
  const eveningHours = Math.round((eveningMinutes / 60) * 10) / 10

  const morningPct = totalMinutes > 0 ? Math.round((morningMinutes / totalMinutes) * 100) : 50
  const eveningPct = totalMinutes > 0 ? 100 - morningPct : 50

  const avgSessionMins = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0
  const avgMorningMins = morningRecords.length > 0 ? Math.round(morningMinutes / morningRecords.length) : 0
  const avgEveningMins = eveningRecords.length > 0 ? Math.round(eveningMinutes / eveningRecords.length) : 0

  // Calculate Streak
  const calculateStreak = (): { current: number; longest: number } => {
    if (records.length === 0) return { current: 0, longest: 0 }
    const uniqueDates = Array.from(new Set(records.map(r => r.date))).sort().reverse()
    if (uniqueDates.length === 0) return { current: 0, longest: 0 }

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd')

    let current = 0
    if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
      current = 1
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const d1 = parseISO(uniqueDates[i])
        const d2 = parseISO(uniqueDates[i + 1])
        if (differenceInCalendarDays(d1, d2) === 1) {
          current++
        } else {
          break
        }
      }
    }

    // Longest streak
    const chronologicalDates = [...uniqueDates].reverse()
    let longest = 1
    let temp = 1
    for (let i = 0; i < chronologicalDates.length - 1; i++) {
      const d1 = parseISO(chronologicalDates[i])
      const d2 = parseISO(chronologicalDates[i + 1])
      if (differenceInCalendarDays(d2, d1) === 1) {
        temp++
        if (temp > longest) longest = temp
      } else {
        temp = 1
      }
    }

    return { current, longest: Math.max(current, longest) }
  }

  const { current: currentStreak, longest: longestStreak } = calculateStreak()

  // Daily Activity Chart data for the month
  const dailyChartData = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

    return daysInMonth.map(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayRecs = records.filter(r => r.date === dateStr)
      const morningDayMins = dayRecs
        .filter(r => getRecordTimeOfDay(r) === 'morning')
        .reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
      const eveningDayMins = dayRecs
        .filter(r => getRecordTimeOfDay(r) === 'evening')
        .reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
      const totalDayMins = morningDayMins + eveningDayMins

      return {
        dateStr,
        dayNumber: format(day, 'd'),
        dayName: format(day, 'EEE'),
        morningHours: Math.round((morningDayMins / 60) * 10) / 10,
        eveningHours: Math.round((eveningDayMins / 60) * 10) / 10,
        totalHours: Math.round((totalDayMins / 60) * 10) / 10,
        sessionsCount: dayRecs.length
      }
    })
  }, [records, currentMonth])

  const maxDailyHours = Math.max(...dailyChartData.map(d => d.totalHours), 3.0)

  // Day of week breakdown (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const dayOfWeekStats = useMemo(() => {
    const dowNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const result = [1, 2, 3, 4, 5, 6, 0].map(dayIndex => {
      const recs = filteredByRange.filter(r => {
        try {
          return getDay(parseISO(r.date)) === dayIndex
        } catch {
          return false
        }
      })
      const mins = recs.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
      return {
        dayIndex,
        name: dowNames[dayIndex],
        hours: Math.round((mins / 60) * 10) / 10,
        sessions: recs.length
      }
    })
    return result
  }, [filteredByRange])

  const maxDowHours = Math.max(...dayOfWeekStats.map(d => d.hours), 1.0)
  const peakDay = [...dayOfWeekStats].sort((a, b) => b.hours - a.hours)[0]

  // Filtered session records for Logbook table (Date desc; on same date: Morning on top, Evening below)
  const logbookRecords = useMemo(() => {
    return filteredByRange
      .filter(r => {
        // Subject filter
        if (selectedSubjectFilter !== 'all' && r.subject.toLowerCase() !== selectedSubjectFilter.toLowerCase()) {
          return false
        }
        // Time of day filter
        if (selectedTimeOfDayFilter !== 'all' && getRecordTimeOfDay(r) !== selectedTimeOfDayFilter) {
          return false
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchTitle = (r.title || '').toLowerCase().includes(q)
          const matchNotes = (r.notes || '').toLowerCase().includes(q)
          const matchSubject = (r.subjectName || r.subject).toLowerCase().includes(q)
          return matchTitle || matchNotes || matchSubject
        }
        return true
      })
      .sort((a, b) => {
        // Order by date descending
        const dateDiff = b.date.localeCompare(a.date)
        if (dateDiff !== 0) return dateDiff

        // On the same date: Morning (AM) on top, Evening (PM) below
        const isMorningA = getRecordTimeOfDay(a) === 'morning'
        const isMorningB = getRecordTimeOfDay(b) === 'morning'
        if (isMorningA !== isMorningB) return isMorningA ? -1 : 1

        if (a.startTime && b.startTime) {
          const timeDiff = a.startTime.localeCompare(b.startTime)
          if (timeDiff !== 0) return timeDiff
        }
        if (a.startTime && !b.startTime) return -1
        if (!a.startTime && b.startTime) return 1

        return (a.createdAt || '').localeCompare(b.createdAt || '')
      })
  }, [filteredByRange, selectedSubjectFilter, selectedTimeOfDayFilter, searchQuery])

  // Calculate weekly achievement history across all tracked records
  const weeklyHistory = useMemo(() => {
    const today = new Date()
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 })

    // Collect unique week starts
    const weekStartMap = new Map<string, Date>()
    weekStartMap.set(format(currentWeekStart, 'yyyy-MM-dd'), currentWeekStart)

    records.forEach(r => {
      try {
        const d = parseISO(r.date)
        const ws = startOfWeek(d, { weekStartsOn: 1 })
        const key = format(ws, 'yyyy-MM-dd')
        if (!weekStartMap.has(key)) {
          weekStartMap.set(key, ws)
        }
      } catch {}
    })

    const sortedWeekStarts = Array.from(weekStartMap.values()).sort(
      (a, b) => b.getTime() - a.getTime()
    )

    return sortedWeekStarts.map(ws => {
      const we = endOfWeek(ws, { weekStartsOn: 1 })
      const wsStr = format(ws, 'yyyy-MM-dd')
      const weStr = format(we, 'yyyy-MM-dd')
      const weekNum = getISOWeek(ws)
      const isCurrentWeek = ws.getTime() === currentWeekStart.getTime()

      const weekRecs = records.filter(r => r.date >= wsStr && r.date <= weStr)
      const totalMins = weekRecs.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
      const totalHours = Math.round((totalMins / 60) * 10) / 10
      const isAchieved = totalHours >= effectiveWeeklyTarget
      const pct = Math.min(100, Math.round((totalHours / (effectiveWeeklyTarget || 1)) * 100))

      // Subject breakdown for this week
      const subjectStats = targets.map(t => {
        const recs = weekRecs.filter(r => {
          const matchSub = r.subject && (r.subject.toLowerCase() === t.subject.toLowerCase() || r.subject === t.id)
          const matchName = r.subjectName && t.name && r.subjectName.toLowerCase() === t.name.toLowerCase()
          return matchSub || matchName
        })
        const sMins = recs.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
        const sHours = Math.round((sMins / 60) * 10) / 10
        const tHours = t.targetHoursPerWeek || 2.0
        const isCompleted = sHours >= tHours
        return {
          target: t,
          hours: sHours,
          targetHours: tHours,
          sessions: recs.length,
          isCompleted
        }
      })

      const completedSubjectsCount = subjectStats.filter(s => s.isCompleted).length

      return {
        id: `week-${wsStr}`,
        weekNumber: weekNum,
        startDate: ws,
        endDate: we,
        dateLabel: `${format(ws, 'MMM d')} – ${format(we, 'MMM d, yyyy')}`,
        isCurrentWeek,
        totalHours,
        targetHours: effectiveWeeklyTarget,
        isAchieved,
        pct,
        sessionsCount: weekRecs.length,
        subjectStats,
        completedSubjectsCount
      }
    })
  }, [records, targets, effectiveWeeklyTarget])

  // Calculate monthly achievement history across all tracked records
  const monthlyHistory = useMemo(() => {
    const today = new Date()
    const currentMonthStart = startOfMonth(today)

    const monthStartMap = new Map<string, Date>()
    monthStartMap.set(format(currentMonthStart, 'yyyy-MM'), currentMonthStart)

    records.forEach(r => {
      try {
        const d = parseISO(r.date)
        const ms = startOfMonth(d)
        const key = format(ms, 'yyyy-MM')
        if (!monthStartMap.has(key)) {
          monthStartMap.set(key, ms)
        }
      } catch {}
    })

    const sortedMonthStarts = Array.from(monthStartMap.values()).sort(
      (a, b) => b.getTime() - a.getTime()
    )

    return sortedMonthStarts.map(ms => {
      const msStr = format(ms, 'yyyy-MM')
      const isCurrentMonth = ms.getTime() === currentMonthStart.getTime()

      const monthRecs = records.filter(r => {
        try {
          return format(parseISO(r.date), 'yyyy-MM') === msStr
        } catch {
          return false
        }
      })

      const totalMins = monthRecs.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
      const totalHours = Math.round((totalMins / 60) * 10) / 10
      const isAchieved = totalHours >= effectiveMonthlyTarget
      const pct = Math.min(100, Math.round((totalHours / (effectiveMonthlyTarget || 1)) * 100))

      // Subject breakdown for this month
      const subjectStats = targets.map(t => {
        const recs = monthRecs.filter(r => {
          const matchSub = r.subject && (r.subject.toLowerCase() === t.subject.toLowerCase() || r.subject === t.id)
          const matchName = r.subjectName && t.name && r.subjectName.toLowerCase() === t.name.toLowerCase()
          return matchSub || matchName
        })
        const sMins = recs.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
        const sHours = Math.round((sMins / 60) * 10) / 10
        const tHours = Math.round((t.targetHoursPerWeek || 2.0) * 4 * 10) / 10
        const isCompleted = sHours >= tHours
        return {
          target: t,
          hours: sHours,
          targetHours: tHours,
          sessions: recs.length,
          isCompleted
        }
      })

      const completedSubjectsCount = subjectStats.filter(s => s.isCompleted).length

      return {
        id: `month-${msStr}`,
        monthDate: ms,
        monthLabel: format(ms, 'MMMM yyyy'),
        isCurrentMonth,
        totalHours,
        targetHours: effectiveMonthlyTarget,
        isAchieved,
        pct,
        sessionsCount: monthRecs.length,
        subjectStats,
        completedSubjectsCount
      }
    })
  }, [records, targets, effectiveMonthlyTarget])

  const filteredWeeklyHistory = useMemo(() => {
    if (historyStatusFilter === 'achieved') {
      return weeklyHistory.filter(w => w.isAchieved)
    }
    if (historyStatusFilter === 'pending') {
      return weeklyHistory.filter(w => !w.isAchieved)
    }
    return weeklyHistory
  }, [weeklyHistory, historyStatusFilter])

  const filteredMonthlyHistory = useMemo(() => {
    if (historyStatusFilter === 'achieved') {
      return monthlyHistory.filter(m => m.isAchieved)
    }
    if (historyStatusFilter === 'pending') {
      return monthlyHistory.filter(m => !m.isAchieved)
    }
    return monthlyHistory
  }, [monthlyHistory, historyStatusFilter])

  const achievedWeeksCount = weeklyHistory.filter(w => w.isAchieved).length
  const achievedMonthsCount = monthlyHistory.filter(m => m.isAchieved).length

  const handleDelete = async (id: string, title: string) => {
    if (onDeleteSession && window.confirm(`Are you sure you want to delete "${title || 'this session'}"?`)) {
      await onDeleteSession(id)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs select-none">
      {/* Analytics Header & Filter Bar */}
      <div className="px-5 py-3.5 border-b border-slate-200/80 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Study Analytics & Insights</span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                {rangeFilter === 'month' ? format(currentMonth, 'MMMM yyyy') : rangeFilter === 'last30' ? 'Last 30 Days' : 'All Time'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Habits tracking, Morning vs Evening distribution, and subject mastery
            </p>
          </div>
        </div>

        {/* Range Switcher & Controls */}
        <div className="flex items-center gap-2.5">
          <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
            <button
              onClick={() => setRangeFilter('month')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                rangeFilter === 'month'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setRangeFilter('last30')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                rangeFilter === 'last30'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setRangeFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                rangeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              All Time
            </button>
          </div>

          {rangeFilter === 'month' && onChangeMonth && (
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
              <button
                onClick={() => onChangeMonth(subMonths(currentMonth, 1))}
                className="p-1 hover:bg-white text-slate-600 active:scale-95 transition-all cursor-pointer"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-3.5 bg-slate-200"></div>
              <button
                onClick={() => onChangeMonth(addMonths(currentMonth, 1))}
                className="p-1 hover:bg-white text-slate-600 active:scale-95 transition-all cursor-pointer"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {onSwitchToCalendar && (
            <button
              onClick={onSwitchToCalendar}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Back to Calendar</span>
            </button>
          )}

          <button
            onClick={onOpenNewSession}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Session</span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
        {/* Top 4 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Study Time */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Total Study Time</span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {totalHours} <span className="text-sm font-semibold text-slate-400">hours</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {formatMinutes(totalMinutes)} total across {totalSessions} session(s)
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Goal: {effectiveMonthlyTarget}h/month ({effectiveWeeklyTarget}h/week)</span>
              <span className="font-bold text-blue-600">
                {Math.min(100, Math.round((totalHours / (effectiveMonthlyTarget || 1)) * 100))}%
              </span>
            </div>
          </div>

          {/* Card 2: Completed Sessions & Average */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Total Sessions</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <BookCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {totalSessions} <span className="text-sm font-semibold text-slate-400">sessions</span>
              </div>
              <div className="text-xs text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span>● Avg: {avgSessionMins} mins per session</span>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>100% completed goal</span>
              <span className="font-bold text-emerald-600">Active</span>
            </div>
          </div>

          {/* Card 3: Morning vs Evening Ratio */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>AM vs PM Routine</span>
              <div className="flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <Moon className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {morningPct}% <span className="text-sm font-semibold text-slate-400">AM</span> • {eveningPct}% <span className="text-sm font-semibold text-slate-400">PM</span>
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                {morningRecords.length} Morning • {eveningRecords.length} Evening
              </div>
            </div>
            {/* Visual ratio bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-100">
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${morningPct}%` }} className="bg-amber-400 h-full" title={`Morning: ${morningPct}%`} />
                <div style={{ width: `${eveningPct}%` }} className="bg-indigo-500 h-full" title={`Evening: ${eveningPct}%`} />
              </div>
            </div>
          </div>

          {/* Card 4: Consistency & Streak */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
              <span>Consistency Streak</span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {currentStreak} <span className="text-sm font-semibold text-slate-400">days active</span>
              </div>
              <div className="text-xs text-amber-700 font-semibold mt-0.5">
                {currentStreak > 0 ? '🔥 Active learning streak!' : 'Log a session today to start'}
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Longest streak:</span>
              <span className="font-bold text-slate-800">{longestStreak} days</span>
            </div>
          </div>
        </div>

        {/* SECTION 2: Goal Target Achievement History (Weekly & Monthly Reports) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Target Achievement History</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review which weeks and months achieved your study target ({effectiveWeeklyTarget}h/wk • {effectiveMonthlyTarget}h/mo)
              </p>
            </div>

            {/* Controls: Week/Month Switcher + Status Filter */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Tab: Weekly vs Monthly */}
              <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
                <button
                  onClick={() => setHistoryTab('week')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    historyTab === 'week'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Weekly History ({weeklyHistory.length})
                </button>
                <button
                  onClick={() => setHistoryTab('month')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    historyTab === 'month'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Monthly History ({monthlyHistory.length})
                </button>
              </div>

              {/* Status Filter */}
              <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
                <button
                  onClick={() => setHistoryStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    historyStatusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setHistoryStatusFilter('achieved')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    historyStatusFilter === 'achieved'
                      ? 'bg-emerald-100 text-emerald-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-emerald-700'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Achieved</span>
                </button>
                <button
                  onClick={() => setHistoryStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    historyStatusFilter === 'pending'
                      ? 'bg-amber-100 text-amber-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-amber-700'
                  }`}
                >
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Pending</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Summary KPI Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Weekly Goals Met</span>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {achievedWeeksCount} / {weeklyHistory.length} <span className="text-xs text-slate-400 font-semibold">weeks</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {weeklyHistory.length > 0 ? Math.round((achievedWeeksCount / weeklyHistory.length) * 100) : 0}% success
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monthly Goals Met</span>
                <div className="text-base font-black text-slate-900 mt-0.5">
                  {achievedMonthsCount} / {monthlyHistory.length} <span className="text-xs text-slate-400 font-semibold">months</span>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                {monthlyHistory.length > 0 ? Math.round((achievedMonthsCount / monthlyHistory.length) * 100) : 0}% success
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Standards</span>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {effectiveWeeklyTarget}h/wk • {effectiveMonthlyTarget}h/mo
                </div>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {targets.length} subjects
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          {historyTab === 'week' ? (
            filteredWeeklyHistory.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-semibold">No weekly records match this filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredWeeklyHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      item.isAchieved
                        ? 'bg-gradient-to-br from-emerald-50/40 via-white to-white border-emerald-200 shadow-2xs'
                        : item.isCurrentWeek
                        ? 'bg-gradient-to-br from-blue-50/30 via-white to-white border-blue-200 shadow-2xs'
                        : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">
                          Week {item.weekNumber}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {item.dateLabel}
                        </span>
                      </div>

                      {item.isAchieved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Achieved ({item.pct}%)</span>
                        </span>
                      ) : item.isCurrentWeek ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Current Week ({item.pct}%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          <span>Incomplete ({item.pct}%)</span>
                        </span>
                      )}
                    </div>

                    {/* Hours Progress Bar */}
                    <div className="space-y-1 my-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          {item.totalHours} <span className="font-normal text-slate-400">/ {item.targetHours}h logged</span>
                        </span>
                        <span className="font-semibold text-slate-500 text-[11px]">
                          {item.sessionsCount} session(s)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.isAchieved ? 'bg-emerald-500' : 'bg-blue-600'
                          }`}
                          style={{ width: `${Math.min(100, item.pct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Subject Contribution Badges */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {item.subjectStats.map((s) => (
                        <span
                          key={s.target.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${
                            s.isCompleted
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : s.hours > 0
                              ? 'bg-slate-50 border-slate-200 text-slate-700'
                              : 'bg-slate-50/50 border-slate-100 text-slate-400'
                          }`}
                          title={`${s.target.name}: ${s.hours}h of ${s.targetHours}h target (${s.sessions} sessions)`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: s.target.color }}
                          />
                          <span className="truncate max-w-[80px]">{s.target.name}</span>
                          <span className="font-bold">{s.hours}/{s.targetHours}h</span>
                          {s.isCompleted && <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredMonthlyHistory.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-xs text-slate-500 font-semibold">No monthly records match this filter</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredMonthlyHistory.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      item.isAchieved
                        ? 'bg-gradient-to-br from-emerald-50/40 via-white to-white border-emerald-200 shadow-2xs'
                        : item.isCurrentMonth
                        ? 'bg-gradient-to-br from-indigo-50/30 via-white to-white border-indigo-200 shadow-2xs'
                        : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-900 border border-indigo-200">
                          {item.monthLabel}
                        </span>
                      </div>

                      {item.isAchieved ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Goal Hit ({item.pct}%)</span>
                        </span>
                      ) : item.isCurrentMonth ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          <span>In Progress ({item.pct}%)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          <span>Incomplete ({item.pct}%)</span>
                        </span>
                      )}
                    </div>

                    {/* Hours Progress Bar */}
                    <div className="space-y-1 my-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          {item.totalHours} <span className="font-normal text-slate-400">/ {item.targetHours}h logged</span>
                        </span>
                        <span className="font-semibold text-slate-500 text-[11px]">
                          {item.sessionsCount} session(s)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.isAchieved ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(100, item.pct)}%` }}
                        />
                      </div>
                    </div>

                    {/* Subject Contribution Badges */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5 text-[11px]">
                      {item.subjectStats.map((s) => (
                        <span
                          key={s.target.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-medium ${
                            s.isCompleted
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                              : s.hours > 0
                              ? 'bg-slate-50 border-slate-200 text-slate-700'
                              : 'bg-slate-50/50 border-slate-100 text-slate-400'
                          }`}
                          title={`${s.target.name}: ${s.hours}h of ${s.targetHours}h monthly target (${s.sessions} sessions)`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: s.target.color }}
                          />
                          <span className="truncate max-w-[80px]">{s.target.name}</span>
                          <span className="font-bold">{s.hours}/{s.targetHours}h</span>
                          {s.isCompleted && <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* SECTION 3: Deep Morning vs Evening Comparative Module */}
        <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50/90 via-blue-50/20 to-indigo-50/30 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Morning (AM) vs Evening (PM) Habit Analysis</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Understand when you focus best and balance your daily schedule
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100/90 text-amber-900 border border-amber-300">
                <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{morningHours}h ({morningPct}%)</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-100/90 text-indigo-900 border border-indigo-300">
                <Moon className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500" />
                <span>{eveningHours}h ({eveningPct}%)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Morning Card */}
            <div className="p-4 rounded-xl bg-white border border-amber-200/70 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-amber-900">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-amber-600 fill-amber-600" />
                  </div>
                  <span>Morning Study Routine (AM)</span>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {morningRecords.length} sessions
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                  <span className="text-[10px] text-amber-700 font-semibold uppercase">Total Time</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">{morningHours} hrs</p>
                  <span className="text-[10px] text-slate-500">({formatMinutes(morningMinutes)})</span>
                </div>
                <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-100">
                  <span className="text-[10px] text-amber-700 font-semibold uppercase">Avg Duration</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">{avgMorningMins} mins</p>
                  <span className="text-[10px] text-slate-500">per session</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                {morningRecords.length > 0
                  ? `Morning sessions account for ${morningPct}% of your total learning volume.`
                  : 'No morning sessions logged yet. Try scheduling a quick morning review!'}
              </p>
            </div>

            {/* Evening Card */}
            <div className="p-4 rounded-xl bg-white border border-indigo-200/70 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-sm text-indigo-900">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600" />
                  </div>
                  <span>Evening Study Routine (PM)</span>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                  {eveningRecords.length} sessions
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                  <span className="text-[10px] text-indigo-700 font-semibold uppercase">Total Time</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">{eveningHours} hrs</p>
                  <span className="text-[10px] text-slate-500">({formatMinutes(eveningMinutes)})</span>
                </div>
                <div className="p-2.5 rounded-lg bg-indigo-50/50 border border-indigo-100">
                  <span className="text-[10px] text-indigo-700 font-semibold uppercase">Avg Duration</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">{avgEveningMins} mins</p>
                  <span className="text-[10px] text-slate-500">per session</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                {eveningRecords.length > 0
                  ? `Evening sessions account for ${eveningPct}% of your total learning volume.`
                  : 'No evening sessions logged yet.'}
              </p>
            </div>
          </div>

          {/* Habit Insight Note */}
          <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 flex items-center gap-2.5 shadow-2xs">
            <Award className="w-4 h-4 text-blue-600 shrink-0" />
            <p>
              <strong>Productivity Pattern:</strong>{' '}
              {totalSessions === 0
                ? 'Start recording morning and evening sessions to unlock personalized productivity insights.'
                : morningHours >= eveningHours
                ? `You are predominantly a Morning Learner (${morningPct}% AM), averaging ${avgMorningMins} mins per session before noon.`
                : `You study predominantly in the Evening (${eveningPct}% PM), logging most of your deep work after work/school.`}
            </p>
          </div>
        </div>

        {/* SECTION 3: Daily Activity Graph (Bars of the Month) */}
        {rangeFilter === 'month' && (
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                  <span>Daily Study Hours ({format(currentMonth, 'MMMM yyyy')})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Stacked daily hours: Morning (Amber) vs Evening (Indigo)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
                  <span>Morning</span>
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                  <span>Evening</span>
                </span>
              </div>
            </div>

            {/* Daily Bar Chart */}
            <div className="h-44 w-full flex items-end gap-1 sm:gap-1.5 pt-6 pb-2 overflow-x-auto scrollbar-none">
              {dailyChartData.map((d) => {
                const totalHeightPct = Math.min(100, Math.round((d.totalHours / maxDailyHours) * 100))
                const morningRatio = d.totalHours > 0 ? d.morningHours / d.totalHours : 0
                const eveningRatio = d.totalHours > 0 ? d.eveningHours / d.totalHours : 0

                return (
                  <div
                    key={d.dateStr}
                    className="flex-1 min-w-[18px] sm:min-w-[22px] flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  >
                    {/* Hover Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1.5 z-20 pointer-events-none bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 shadow-lg whitespace-nowrap">
                      <div className="font-bold">{d.dateStr} ({d.dayName})</div>
                      <div>Total: {d.totalHours}h ({d.sessionsCount} session{d.sessionsCount !== 1 ? 's' : ''})</div>
                      {d.morningHours > 0 && <div className="text-amber-300">☀️ Morning: {d.morningHours}h</div>}
                      {d.eveningHours > 0 && <div className="text-indigo-300">🌙 Evening: {d.eveningHours}h</div>}
                    </div>

                    {/* Bar Stack */}
                    <div
                      className="w-full rounded-t-md overflow-hidden flex flex-col justify-end transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${Math.max(totalHeightPct, 4)}%` }}
                    >
                      {d.totalHours === 0 ? (
                        <div className="w-full h-full bg-slate-100 rounded-t-sm" />
                      ) : (
                        <>
                          {/* Evening segment (top) */}
                          {d.eveningHours > 0 && (
                            <div
                              style={{ height: `${eveningRatio * 100}%` }}
                              className="w-full bg-indigo-500"
                            />
                          )}
                          {/* Morning segment (bottom) */}
                          {d.morningHours > 0 && (
                            <div
                              style={{ height: `${morningRatio * 100}%` }}
                              className="w-full bg-amber-400"
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* Day Number Label */}
                    <span className="text-[10px] font-semibold text-slate-400 mt-1">
                      {d.dayNumber}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SECTION 4: Day of Week Pattern & Subject Breakdown Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Day of Week Productivity */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Day of Week Productivity</span>
                </h3>
                {peakDay && peakDay.hours > 0 && (
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    Peak: {peakDay.name} ({peakDay.hours}h)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Study hours distributed across days of the week
              </p>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-3">
              {dayOfWeekStats.map((d) => {
                const heightPct = Math.min(100, Math.round((d.hours / maxDowHours) * 100))
                const isPeak = peakDay && d.dayIndex === peakDay.dayIndex && d.hours > 0

                return (
                  <div key={d.name} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-bold text-slate-700">
                      {d.hours > 0 ? `${d.hours}h` : '-'}
                    </span>
                    <div className="h-24 w-full bg-slate-100 rounded-lg p-1 flex flex-col justify-end">
                      <div
                        className={`w-full rounded-md transition-all duration-500 ${
                          isPeak
                            ? 'bg-gradient-to-t from-blue-600 to-indigo-600 shadow-xs'
                            : 'bg-slate-300'
                        }`}
                        style={{ height: `${Math.max(heightPct, 6)}%` }}
                        title={`${d.name}: ${d.hours}h (${d.sessions} sessions)`}
                      />
                    </div>
                    <span className={`text-xs font-bold ${isPeak ? 'text-blue-700' : 'text-slate-500'}`}>
                      {d.name}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="pt-2 text-[11px] text-slate-400 italic">
              * Identifies which days of the week you study with greatest consistency.
            </div>
          </div>

          {/* Subject Mastery Breakdown */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Subject Mastery & Distribution</span>
              </h3>
              <span className="text-xs text-slate-500">
                {targets.length} tracked subjects
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {targets.map((target) => {
                const subRecs = filteredByRange.filter(
                  r => r.subject.toLowerCase() === target.subject.toLowerCase()
                )
                const subMins = subRecs.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
                const subHours = Math.round((subMins / 60) * 10) / 10
                
                // Target hours for this period (Monthly for month/last30, Weekly otherwise)
                const isMonthlyPeriod = rangeFilter === 'month' || rangeFilter === 'last30'
                const subjectTargetHours = isMonthlyPeriod
                  ? Math.round((target.targetHoursPerWeek || 2.0) * 4 * 10) / 10
                  : (target.targetHoursPerWeek || 2.0)
                const optionalTargetSessions = isMonthlyPeriod
                  ? target.targetSessionsPerWeek * 4
                  : target.targetSessionsPerWeek

                // Progress percentage is strictly based on hours target
                const hoursProgressPct = Math.min(100, Math.round((subHours / (subjectTargetHours || 1)) * 100))
                const isTargetMet = subHours >= subjectTargetHours

                const subMorningCount = subRecs.filter(r => getRecordTimeOfDay(r) === 'morning').length
                const subEveningCount = subRecs.filter(r => getRecordTimeOfDay(r) === 'evening').length

                return (
                  <div
                    key={target.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: target.color }}
                        />
                        <span className="font-extrabold text-slate-900">{target.name}</span>
                        {isTargetMet && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.2 rounded-full">
                            <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" /> Target Met
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <span className="font-black text-slate-900">{subHours}</span>
                        <span className="text-slate-400 font-normal">/ {subjectTargetHours}h</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                          isTargetMet ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {hoursProgressPct}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar (Strictly based on target hours) */}
                    <div className="h-1.5 w-full bg-slate-200/70 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${hoursProgressPct}%`,
                          backgroundColor: target.color
                        }}
                      />
                    </div>

                    {/* Morning vs Evening split for this subject */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-0.5 text-amber-700 font-semibold">
                          <Sun className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> {subMorningCount} AM
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-0.5 text-indigo-700 font-semibold">
                          <Moon className="w-2.5 h-2.5 text-indigo-500 fill-indigo-500" /> {subEveningCount} PM
                        </span>
                      </span>
                      <span className="text-slate-400">
                        Goal: <strong className="text-slate-600 font-semibold">{subjectTargetHours}h</strong> ({subRecs.length}/{optionalTargetSessions} sessions optional)
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* SECTION 5: Searchable Session History & Study Notes Logbook */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BookCheck className="w-4 h-4 text-blue-600" />
                <span>Study Logbook & Notes Explorer</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Browse, search keywords, and review session notes from this period
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search topic or notes..."
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 w-44 sm:w-56"
                />
              </div>

              {/* Slot Filter */}
              <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
                <button
                  onClick={() => setSelectedTimeOfDayFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    selectedTimeOfDayFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All Slots
                </button>
                <button
                  onClick={() => setSelectedTimeOfDayFilter('morning')}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    selectedTimeOfDayFilter === 'morning'
                      ? 'bg-amber-100 text-amber-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-amber-700'
                  }`}
                >
                  <Sun className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>AM</span>
                </button>
                <button
                  onClick={() => setSelectedTimeOfDayFilter('evening')}
                  className={`px-2 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    selectedTimeOfDayFilter === 'evening'
                      ? 'bg-indigo-100 text-indigo-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-indigo-700'
                  }`}
                >
                  <Moon className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                  <span>PM</span>
                </button>
              </div>

              {/* Subject Filter */}
              <select
                value={selectedSubjectFilter}
                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="all">All Subjects</option>
                {targets.map(t => (
                  <option key={t.id} value={t.subject}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Logbook Session List */}
          {logbookRecords.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <BookCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No sessions match your filter</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Try clearing your search query or selecting "All Slots".
              </p>
              <button
                onClick={onOpenNewSession}
                className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Session Now</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {logbookRecords.map((record) => {
                const color = getSubjectColor(record.subject)
                const isMorning = getRecordTimeOfDay(record) === 'morning'
                const formattedDuration = formatMinutes(record.durationMinutes)

                return (
                  <div
                    key={record.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 hover:shadow-2xs transition-all flex flex-col gap-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Date badge */}
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {format(parseISO(record.date), 'MMM d, yyyy')}
                        </span>

                        {/* Morning / Evening Badge */}
                        {isMorning ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200/60">
                            <Sun className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span>Morning (AM)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-200/60">
                            <Moon className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                            <span>Evening (PM)</span>
                          </span>
                        )}

                        {/* Subject Tag */}
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white shadow-2xs"
                          style={{ backgroundColor: color }}
                        >
                          {record.subjectName || record.subject.toUpperCase()}
                        </span>

                        {/* Duration */}
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>{formattedDuration}</span>
                        </span>

                        {record.startTime && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            at {record.startTime}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        {onEditSession && (
                          <button
                            onClick={() => onEditSession(record)}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                            title="Edit session"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {onDeleteSession && (
                          <button
                            onClick={() => handleDelete(record.id, record.title)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Topic Title */}
                    {record.title && (
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                        {record.title}
                      </h4>
                    )}

                    {/* Notes block */}
                    {record.notes && (
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                        {record.notes}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StatsOverview
