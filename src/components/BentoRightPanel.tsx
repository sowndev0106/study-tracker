import React from 'react'
import { Flame, Target, Plus, ChevronRight, ChevronLeft, Award, ShieldCheck, Sun, Moon, Check, Clock } from 'lucide-react'
import { WeekProgressSummary, WeeklyTarget, StudyRecord } from '../types'
import { formatMinutes } from '../utils/helpers'
import { format, isSameMonth, parseISO, subDays, differenceInCalendarDays, addWeeks, subWeeks } from 'date-fns'

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
  targets: _targets,
  records,
  currentMonth,
  referenceDate,
  onChangeReferenceDate,
  onOpenNewSession,
  onOpenTargets,
  storageStatus: _storageStatus
}) => {
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

  // Latest record
  const latestRecord = records.length > 0 ? records[0] : null

  // Progress percentage
  const hoursPercent = Math.min(
    100,
    Math.round((weekProgress.totalHours / (weekProgress.totalHoursTarget || 1)) * 100)
  )

  const isAllTargetsCompleted =
    weekProgress.targets.length > 0 &&
    weekProgress.targets.every(t => t.isCompleted) &&
    weekProgress.isTotalHoursCompleted

  return (
    <div className="w-[330px] xl:w-[350px] shrink-0 h-full flex flex-col gap-3 justify-start overflow-y-auto pr-0.5 select-none">
      
      {/* Bento Card 1: Weekly Goal (Fixed height h-[125px]) */}
      <div className="h-[125px] shrink-0 rounded-2xl bg-white border border-slate-200/80 shadow-xs p-4 flex items-center justify-between">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
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

          <div className="text-2xl font-black text-slate-900 mt-1">
            {weekProgress.totalHours} <span className="text-sm font-semibold text-slate-400">/ {weekProgress.totalHoursTarget}h</span>
          </div>

          <div className="text-xs font-semibold mt-0.5 flex items-center gap-1 text-emerald-600">
            {isAllTargetsCompleted ? (
              <span className="inline-flex items-center gap-1">
                <Award className="w-3 h-3 text-emerald-600" /> 100% Goal Reached!
              </span>
            ) : (
              <span>● {hoursPercent}% of weekly plan</span>
            )}
          </div>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className="text-blue-600 transition-all duration-500 stroke-current"
              strokeDasharray={`${hoursPercent}, 100`}
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-xs font-black text-slate-800">{hoursPercent}%</span>
          </div>
        </div>
      </div>

      {/* Bento Card 2: Subject Breakdown (Clean, spacious, unclipped) */}
      <div className="h-[215px] shrink-0 rounded-2xl bg-white border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-blue-600" />
            <span>Subject Goals</span>
          </span>
          <button
            onClick={onOpenTargets}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
          >
            Configure
          </button>
        </div>

        <div className="py-1 space-y-2 overflow-y-auto scrollbar-none flex-1 min-h-0">
          {weekProgress.targets.map(({ target, currentSessions, targetSessions, actualHours, targetHours, isCompleted }) => {
            const pct = Math.min(100, Math.round((currentSessions / (targetSessions || 1)) * 100))

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
            {weekProgress.isTotalHoursCompleted ? (
              <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                🎉 Weekly target reached!
              </span>
            ) : (
              <span>
                <strong className="text-slate-800 font-bold">
                  {Math.max(0, Math.round((weekProgress.totalHoursTarget - weekProgress.totalHours) * 10) / 10)}h
                </strong>{' '}
                <span className="text-slate-400">left this week</span>
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/60">
            {weekProgress.targets.filter(t => t.isCompleted).length}/{weekProgress.targets.length} completed
          </span>
        </div>
      </div>

      {/* Bento Card 3: Month Summary (Fixed height h-[175px] - Soothing low-contrast gradient) */}
      <div className="h-[175px] shrink-0 rounded-2xl bg-gradient-to-br from-slate-50/90 via-blue-50/40 to-indigo-50/30 border border-blue-200/50 shadow-xs p-3.5 flex flex-col justify-between">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {format(currentMonth, 'MMMM yyyy')} Overview
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/60 text-[10px] font-extrabold flex items-center gap-1">
            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
            {streakDays > 0 ? `${streakDays}-day streak` : 'Start streak'}
          </span>
        </div>

        <div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatMinutes(totalMinutesMonth)}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            <span>{totalSessionsMonth} sessions logged</span>
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
        </div>

        <button
          onClick={onOpenNewSession}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Log Study Session</span>
        </button>
      </div>

      {/* Bento Card 4: Recent Session (Fixed height h-[115px] - Clean, spaced, uncluttered) */}
      <div className="h-[115px] shrink-0 rounded-2xl bg-white border border-slate-200/80 shadow-xs p-3.5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 shrink-0">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>Recent Session</span>
          </span>
          {latestRecord && (
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {format(new Date(latestRecord.date), 'MMM d')}
            </span>
          )}
        </div>

        {latestRecord ? (
          <div className="py-0.5 min-w-0">
            <div
              className="font-bold text-xs text-slate-800 truncate"
              title={latestRecord.title || latestRecord.subjectName}
            >
              {latestRecord.title || latestRecord.subjectName}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
              {getRecordTimeOfDay(latestRecord) === 'morning' ? (
                <span className="text-amber-700 font-semibold inline-flex items-center gap-0.5 bg-amber-50 px-1.5 py-0.2 rounded text-[10px] border border-amber-200/50 shrink-0">
                  <Sun className="w-2.5 h-2.5 text-amber-500 fill-amber-500" /> Morning
                </span>
              ) : (
                <span className="text-indigo-700 font-semibold inline-flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.2 rounded text-[10px] border border-indigo-200/50 shrink-0">
                  <Moon className="w-2.5 h-2.5 text-indigo-500 fill-indigo-500" /> Evening
                </span>
              )}
              <span className="font-semibold text-slate-700 truncate">{latestRecord.subjectName}</span>
              <span className="text-slate-300">•</span>
              <span className="font-mono font-bold text-blue-600 bg-blue-50/80 px-1.5 py-0.2 rounded text-[10px] shrink-0">
                {formatMinutes(latestRecord.durationMinutes)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic py-2">No study sessions logged yet</div>
        )}

        <div className="text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-100 pt-1.5 shrink-0">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Auto-sync active</span>
          </span>
          <span className="text-slate-400">All data saved</span>
        </div>
      </div>
    </div>
  )
}

export default BentoRightPanel
