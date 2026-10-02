import React, { useMemo, useState } from 'react'
import { Flame, Target, Plus, ChevronRight, ChevronLeft, Award, Sun, Moon, Check, Zap } from 'lucide-react'
import { WeekProgressSummary, WeeklyTarget, StudyRecord } from '../types'
import { getWeekBounds } from '../utils/helpers'
import { format, isSameMonth, parseISO, subDays, differenceInCalendarDays, addWeeks, subWeeks, addDays, isSameDay } from 'date-fns'

interface BentoRightPanelProps {
  weekProgress: WeekProgressSummary
  targets: WeeklyTarget[]
  records: StudyRecord[]
  currentMonth: Date
  referenceDate: Date
  onChangeReferenceDate: (newDate: Date) => void
  onOpenNewSession: () => void
  onOpenTargets: () => void
  storageStatus: { status: string; storage: string; r2Bound: boolean }
}

export const BentoRightPanel: React.FC<BentoRightPanelProps> = ({
  weekProgress,
  targets,
  records,
  currentMonth,
  referenceDate,
  onChangeReferenceDate,
  onOpenNewSession,
  onOpenTargets,
  storageStatus: _storageStatus
}) => {
  const [subjectViewMode, setSubjectViewMode] = useState<'week' | 'month'>('week')
  const [showMonthDetail, setShowMonthDetail] = useState(false)
  const [showWeekDetail, setShowWeekDetail] = useState(false)
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

  // Calculate month records & stats
  const monthRecords = records.filter(r => {
    try {
      return isSameMonth(new Date(r.date), currentMonth)
    } catch {
      return false
    }
  })

  const totalMinutesMonth = monthRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
  const totalSessionsMonth = monthRecords.length
  const morningMonthCount = monthRecords.filter(r => getRecordTimeOfDay(r) === 'morning').length
  const eveningMonthCount = monthRecords.filter(r => getRecordTimeOfDay(r) === 'evening').length

  // Calculate streak
  const calculateStreak = (): number => {
    if (records.length === 0) return 0
    const uniqueDates = Array.from(new Set(records.map(r => r.date))).sort().reverse()
    if (uniqueDates.length === 0) return 0

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd')

    // Must have record today or yesterday to have active streak
    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
      return 0
    }

    let streak = 1
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const d1 = parseISO(uniqueDates[i])
      const d2 = parseISO(uniqueDates[i + 1])
      if (differenceInCalendarDays(d1, d2) === 1) {
        streak++
      } else {
        break
      }
    }
    return streak
  }

  const streakDays = calculateStreak()

  // Weekly & monthly target strictly calculated from sum of subjects
  const subjectsWeeklyTargetSum = Math.round(
    targets.reduce((acc, t) => acc + (Number(t.targetHoursPerWeek) || 0), 0) * 10
  ) / 10
  const effectiveWeeklyTarget = subjectsWeeklyTargetSum > 0
    ? subjectsWeeklyTargetSum
    : (weekProgress.totalHoursTarget || 6.0)
  const monthHoursTarget = Math.round(effectiveWeeklyTarget * 4 * 10) / 10
  const totalHoursMonth = Math.round((totalMinutesMonth / 60) * 10) / 10
  const monthPercent = Math.min(100, Math.round((totalHoursMonth / (monthHoursTarget || 1)) * 100))
  const isMonthCompleted = totalHoursMonth >= monthHoursTarget
  const remainingMonthHours = Math.max(0, Math.round((monthHoursTarget - totalHoursMonth) * 10) / 10)

  // Monthly progress per subject (4x of weekly targets)
  const monthSubjectProgress = useMemo(() => {
    return targets.map(target => {
      const sRecords = monthRecords.filter(r => {
        const matchSubject = r.subject && (r.subject === target.subject || r.subject === target.id)
        const matchName = r.subjectName && target.name && r.subjectName.toLowerCase() === target.name.toLowerCase()
        return matchSubject || matchName
      })
      const monthMins = sRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
      const actualHoursMonth = Math.round((monthMins / 60) * 10) / 10
      const targetHoursMonth = Math.round((target.targetHoursPerWeek || 2.0) * 4 * 10) / 10
      const currentSessionsMonth = sRecords.length
      const targetSessionsMonth = target.targetSessionsPerWeek * 4
      const isCompletedMonth = actualHoursMonth >= targetHoursMonth
      const pct = Math.min(100, Math.round((actualHoursMonth / (targetHoursMonth || 1)) * 100))

      return {
        target,
        actualHours: actualHoursMonth,
        targetHours: targetHoursMonth,
        currentSessions: currentSessionsMonth,
        targetSessions: targetSessionsMonth,
        isCompleted: isCompletedMonth,
        pct
      }
    })
  }, [targets, monthRecords])

  const monthCompletedSubjectsCount = monthSubjectProgress.filter(t => t.isCompleted).length

  // Progress percentage
  const hoursPercent = Math.min(
    100,
    Math.round((weekProgress.totalHours / (effectiveWeeklyTarget || 1)) * 100)
  )

  const isWeeklyHoursCompleted = weekProgress.totalHours >= effectiveWeeklyTarget
  const isAllTargetsCompleted =
    weekProgress.targets.length > 0 &&
    weekProgress.targets.every(t => t.isCompleted) &&
    isWeeklyHoursCompleted

  // Today's Target Pace: always anchored to the real current week/day,
  // independent of whichever week the "Weekly Goal" card is browsing to.
  const todayDate = new Date()
  const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  const paceDays = useMemo(() => {
    const { start: realWeekStart } = getWeekBounds(todayDate)
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(realWeekStart, i)
      const dayStr = format(day, 'yyyy-MM-dd')
      const minutes = records
        .filter(r => r.date === dayStr && r.completed)
        .reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
      return {
        label: WEEKDAY_LABELS[i],
        hours: Math.round((minutes / 60) * 10) / 10,
        isToday: isSameDay(day, todayDate),
        isFuture: day > todayDate && !isSameDay(day, todayDate)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })
  }, [records])

  const maxPaceHours = Math.max(0.5, ...paceDays.map(d => d.hours))
  const todayPace = paceDays.find(d => d.isToday)
  const hoursLoggedToday = todayPace?.hours || 0
  const hoursLoggedBeforeToday = paceDays
    .filter(d => !d.isToday && !d.isFuture)
    .reduce((sum, d) => sum + d.hours, 0)
  const remainingDaysInWeek = paceDays.filter(d => d.isToday || d.isFuture).length || 1
  const idealPaceToday = Math.max(0, effectiveWeeklyTarget - hoursLoggedBeforeToday) / remainingDaysInWeek
  const hoursNeededToday = Math.max(0, Math.round((idealPaceToday - hoursLoggedToday) * 10) / 10)

  // Sessions still outstanding this (real, current) week across all subject targets
  const remainingSessionsThisWeek = useMemo(() => {
    const { start: realWeekStart, end: realWeekEnd } = getWeekBounds(todayDate)
    return targets.reduce((sum, t) => {
      const done = records.filter(r => {
        if (r.subject.toLowerCase() !== t.subject.toLowerCase() || !r.completed) return false
        try {
          const rDate = parseISO(r.date)
          return rDate >= realWeekStart && rDate <= realWeekEnd
        } catch {
          return false
        }
      }).length
      return sum + Math.max(0, t.targetSessionsPerWeek - done)
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [records, targets])

  return (
    <div className="w-[330px] xl:w-[350px] shrink-0 h-full flex flex-col justify-between overflow-hidden select-none">
      {/* Scrollable Upper Cards Area */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-2.5 scrollbar-none">
        {/* Bento Card 1: DEDICATED MONTHLY TARGET CARD WITH EXPANDABLE SUBJECT MINI RINGS */}
      <div className="shrink-0 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-blue-50/40 to-white border border-indigo-200/80 shadow-xs p-3.5 flex flex-col justify-between gap-2.5">
        {/* Top: Monthly Overview & Overall Progress Ring */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 uppercase tracking-wider truncate">
              <Target className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">{format(currentMonth, 'MMMM yyyy')} Goal</span>
            </div>

            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {totalHoursMonth} <span className="text-sm font-semibold text-slate-400">/ {monthHoursTarget}h</span>
            </div>

            <div className="text-xs font-semibold mt-0.5 flex items-center gap-1 text-indigo-600 truncate">
              {isMonthCompleted ? (
                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                  <Award className="w-3 h-3 text-emerald-600 shrink-0" /> 100% Monthly Goal Hit!
                </span>
              ) : (
                <span>● {monthPercent}% completed ({remainingMonthHours}h left)</span>
              )}
            </div>
          </div>

          {/* Main Circular Progress Gauge for Monthly Target (Interactive Toggle) */}
          <button
            onClick={() => setShowMonthDetail(v => !v)}
            className="relative w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] shrink-0 flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title={showMonthDetail ? "Click to hide subject breakdown" : "Click to view subject breakdown"}
          >
            <svg className="w-12 h-12 -rotate-90 shrink-0" viewBox="0 0 36 36">
              <path
                className="text-indigo-100/80 group-hover:text-indigo-200/80 transition-colors"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={`${isMonthCompleted ? 'text-emerald-500' : 'text-indigo-600'} transition-all duration-500 ease-out`}
                strokeDasharray={`${monthPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[11px] font-black text-indigo-900 group-hover:text-indigo-600 transition-colors">
                {monthPercent}%
              </span>
            </div>
          </button>
        </div>

        {/* Bottom: Subtle Subject Monthly Target Mini Rings (Expandable) */}
        {showMonthDetail && (
          <div className="pt-2 border-t border-indigo-100/70 grid grid-cols-4 gap-1 text-center">
            {monthSubjectProgress.map((s) => (
              <div key={s.target.id} className="flex flex-col items-center group cursor-default min-w-0">
                {/* Mini Ring Gauge */}
                <div className="relative w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] shrink-0 flex items-center justify-center mb-0.5">
                  <svg className="w-8 h-8 -rotate-90 shrink-0" viewBox="0 0 36 36">
                    <path
                      className="text-slate-200/70"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      style={{ color: s.target.color }}
                      className="transition-all duration-500 ease-out"
                      strokeDasharray={`${s.pct}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-[8px] font-black text-slate-700">
                    {s.isCompleted ? (
                      <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                    ) : (
                      `${s.pct}%`
                    )}
                  </div>
                </div>

                {/* Subject Short Name */}
                <span className="text-[10px] font-bold text-slate-700 truncate w-full px-0.5" title={s.target.name}>
                  {s.target.name}
                </span>

                {/* Monthly Target Hours */}
                <span className="text-[9px] font-mono text-slate-500">
                  {s.actualHours}/{s.targetHours}h
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bento Card 2: Weekly Goal with Expandable Subject Mini Rings */}
      <div className="shrink-0 rounded-2xl bg-white border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex flex-col justify-center min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2 truncate">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                <span>Week {weekProgress.weekNumber}</span>
              </div>
              <div className="flex items-center border border-slate-200 rounded-md overflow-hidden bg-slate-50">
                <button
                  onClick={() => onChangeReferenceDate(subWeeks(referenceDate, 1))}
                  className="p-0.5 hover:bg-white text-slate-500 hover:text-slate-800 transition-all active:scale-95 cursor-pointer"
                  title="Previous week"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <div className="w-[1px] h-3 bg-slate-200"></div>
                <button
                  onClick={() => onChangeReferenceDate(addWeeks(referenceDate, 1))}
                  className="p-0.5 hover:bg-white text-slate-500 hover:text-slate-800 transition-all active:scale-95 cursor-pointer"
                  title="Next week"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {weekProgress.totalHours} <span className="text-sm font-semibold text-slate-400">/ {effectiveWeeklyTarget}h</span>
            </div>

            <div className="text-xs font-semibold mt-0.5 flex items-center gap-1 text-emerald-600 truncate">
              {isAllTargetsCompleted ? (
                <span className="inline-flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-600 shrink-0" /> 100% Goal Reached!
                </span>
              ) : (
                <span>● {hoursPercent}% of weekly plan</span>
              )}
            </div>
          </div>

          {/* Circular Progress Gauge (Interactive Toggle) */}
          <button
            onClick={() => setShowWeekDetail(v => !v)}
            className="relative w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] shrink-0 flex items-center justify-center rounded-full hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title={showWeekDetail ? "Click to hide subject breakdown" : "Click to view subject breakdown"}
          >
            <svg className="w-12 h-12 -rotate-90 shrink-0" viewBox="0 0 36 36">
              <path
                className="text-slate-100 group-hover:text-slate-200 transition-colors"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-blue-600 transition-all duration-500 ease-out"
                strokeDasharray={`${hoursPercent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-[11px] font-black text-slate-700 group-hover:text-blue-600 transition-colors">
                {hoursPercent}%
              </span>
            </div>
          </button>
        </div>

        {/* Bottom: Subtle Subject Weekly Target Mini Rings (Expandable) */}
        {showWeekDetail && (
          <div className="pt-2 border-t border-slate-100 grid grid-cols-4 gap-1 text-center">
            {weekProgress.targets.map((item) => {
              const target = item.target
              const actualHours = item.actualHours
              const targetHours = item.targetHours
              const pct = item.pct
              return (
                <div key={target.id} className="flex flex-col items-center group cursor-default min-w-0">
                  {/* Mini Ring Gauge */}
                  <div className="relative w-8 h-8 min-w-[32px] min-h-[32px] max-w-[32px] max-h-[32px] shrink-0 flex items-center justify-center mb-0.5">
                    <svg className="w-8 h-8 -rotate-90 shrink-0" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200/70"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        style={{ color: target.color }}
                        className="transition-all duration-500 ease-out"
                        strokeDasharray={`${pct}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute text-[8px] font-black text-slate-700">
                      {item.isCompleted ? (
                        <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                      ) : (
                        `${pct}%`
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-bold text-slate-700 truncate w-full px-0.5" title={target.name}>
                    {target.name}
                  </span>

                  <span className="text-[9px] font-mono text-slate-500">
                    {actualHours}/{targetHours}h
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Bento Card: Today's Target Pace */}
      <div className="shrink-0 rounded-2xl bg-white border border-slate-200/80 shadow-xs p-3.5 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
            <span>Today's Target Pace</span>
          </div>
          {hoursNeededToday > 0 ? (
            <span className="text-xs font-extrabold text-emerald-600">{hoursNeededToday}h needed today</span>
          ) : (
            <span className="text-xs font-extrabold text-emerald-600 inline-flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" /> On pace
            </span>
          )}
        </div>

        {/* Mini 7-day bar chart, today highlighted */}
        <div className="flex items-end justify-between gap-1.5 h-9 px-0.5">
          {paceDays.map((d, idx) => {
            const barPct = Math.max(8, Math.round((d.hours / maxPaceHours) * 100))
            return (
              <div
                key={idx}
                className={`flex-1 h-full rounded-lg flex items-end justify-center ${
                  d.isToday ? 'bg-blue-50 ring-1 ring-blue-200' : ''
                }`}
                title={`${d.label}: ${d.hours}h`}
              >
                <div
                  className={`w-2 rounded-full transition-all duration-300 ${
                    d.isToday
                      ? 'bg-blue-400'
                      : d.isFuture
                      ? 'bg-slate-100'
                      : d.hours > 0
                      ? 'bg-blue-600'
                      : 'bg-slate-100'
                  }`}
                  style={{ height: d.hours > 0 || d.isToday ? `${barPct}%` : '4px' }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex items-center justify-between -mt-1">
          {paceDays.map((d, idx) => (
            <span
              key={idx}
              className={`flex-1 text-center text-[10px] font-semibold ${
                d.isToday ? 'text-blue-600 font-black' : 'text-slate-400'
              }`}
            >
              {d.label}
            </span>
          ))}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">
            <strong className="text-slate-800 font-bold">{format(todayDate, 'EEEE')}</strong>: Today
          </span>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
            Target: {remainingSessionsThisWeek} session{remainingSessionsThisWeek === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Bento Card 3: Subject Breakdown with Week / Month Toggle (Fixed height h-[210px]) */}
      <div className="h-[210px] shrink-0 rounded-2xl bg-white border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>Subject Goals</span>
            </span>
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 text-[10px] font-semibold border border-slate-200/60">
              <button
                onClick={() => setSubjectViewMode('week')}
                className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                  subjectViewMode === 'week' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setSubjectViewMode('month')}
                className={`px-1.5 py-0.2 rounded transition-all cursor-pointer ${
                  subjectViewMode === 'month' ? 'bg-white text-indigo-700 font-bold shadow-2xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="View monthly target for each subject"
              >
                Month
              </button>
            </div>
          </div>
          <button
            onClick={onOpenTargets}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
          >
            Configure
          </button>
        </div>

        <div className="py-1 space-y-2 overflow-y-auto scrollbar-none flex-1 min-h-0">
          {(subjectViewMode === 'month' ? monthSubjectProgress : weekProgress.targets).map((item) => {
            const target = 'target' in item ? item.target : item
            const actualHours = item.actualHours
            const targetHours = item.targetHours
            const currentSessions = item.currentSessions
            const targetSessions = item.targetSessions
            const isCompleted = actualHours >= targetHours
            const pct = Math.min(100, Math.round((actualHours / (targetHours || 1)) * 100))

            return (
              <div key={target.id} className="group flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs leading-none">
                  {/* Subject Dot & Name */}
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: target.color }}
                    />
                    <span className="font-bold text-slate-800 text-[12px] truncate" title={target.name}>
                      {target.name}
                    </span>
                  </div>

                  {/* Clean Right Stats: Hours + Sessions Badge */}
                  <div className="flex items-center gap-1.5 shrink-0 text-right">
                    <span className="font-mono text-xs text-slate-700">
                      <span className="font-bold">{actualHours}</span>
                      <span className="text-slate-400 text-[11px]">/{targetHours}h</span>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/60'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {isCompleted && <Check className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />}
                      {currentSessions}/{targetSessions}
                    </span>
                  </div>
                </div>

                {/* Smooth Progress Bar */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: target.color
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Separated Clean Footer */}
        <div className="pt-2 border-t border-slate-100 shrink-0 flex items-center justify-between text-[11px]">
          <div className="text-slate-500 font-medium">
            {subjectViewMode === 'week' ? (
              isWeeklyHoursCompleted ? (
                <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                  🎉 Weekly target reached!
                </span>
              ) : (
                <span>
                  <strong className="text-slate-800 font-bold">
                    {Math.max(0, Math.round((effectiveWeeklyTarget - weekProgress.totalHours) * 10) / 10)}h
                  </strong>{' '}
                  <span className="text-slate-400">left this week</span>
                </span>
              )
            ) : (
              isMonthCompleted ? (
                <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                  🎉 Monthly target reached!
                </span>
              ) : (
                <span>
                  <strong className="text-slate-800 font-bold">{remainingMonthHours}h</strong>{' '}
                  <span className="text-slate-400">left in {format(currentMonth, 'MMM')}</span>
                </span>
              )
            )}
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
            {subjectViewMode === 'week'
              ? `${weekProgress.targets.filter(t => t.isCompleted).length}/${weekProgress.targets.length} completed`
              : `${monthCompletedSubjectsCount}/${targets.length} completed`}
          </span>
        </div>
      </div>
      </div>

      {/* Pinned Bottom Card: Month Activity & Quick Log (Always pinned at bottom) */}
      <div className="shrink-0 rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 border border-slate-200/80 shadow-xs p-3 flex flex-col justify-between gap-2.5 bg-white mt-1">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {format(currentMonth, 'MMMM')} Activity
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-extrabold flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
            {streakDays > 0 ? `${streakDays}-day streak` : 'Start streak'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>{totalSessionsMonth} sessions</span>
          <span>•</span>
          <span className="inline-flex items-center gap-0.5 text-amber-700 font-semibold">
            <Sun className="w-3 h-3 text-amber-500 fill-amber-500" />
            {morningMonthCount} AM
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-0.5 text-indigo-700 font-semibold">
            <Moon className="w-3 h-3 text-indigo-500 fill-indigo-500" />
            {eveningMonthCount} PM
          </span>
        </div>

        <button
          onClick={onOpenNewSession}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Study Session</span>
        </button>
      </div>
    </div>
  )
}

export default BentoRightPanel
