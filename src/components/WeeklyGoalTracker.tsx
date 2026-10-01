import React, { useEffect, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  Plus,
  Terminal,
  Cloud,
  Code,
  Target
} from 'lucide-react'
import { WeekProgressSummary, WeeklyTarget } from '../types'
import { formatMinutes, fireCelebration, formatWeekRange } from '../utils/helpers'
import { parseISO, addWeeks, subWeeks } from 'date-fns'

interface WeeklyGoalTrackerProps {
  progress: WeekProgressSummary
  referenceDate: Date
  onChangeReferenceDate: (newDate: Date) => void
  onQuickAddSubject: (target: WeeklyTarget) => void
}

export const WeeklyGoalTracker: React.FC<WeeklyGoalTrackerProps> = ({
  progress,
  referenceDate,
  onChangeReferenceDate,
  onQuickAddSubject
}) => {
  const previousCompletedRef = useRef<boolean>(false)

  const allCompleted =
    progress.targets.length > 0 &&
    progress.targets.every(t => t.isCompleted) &&
    progress.isTotalHoursCompleted

  useEffect(() => {
    if (allCompleted && !previousCompletedRef.current) {
      fireCelebration()
    }
    previousCompletedRef.current = allCompleted
  }, [allCompleted])

  const handlePrevWeek = () => {
    onChangeReferenceDate(subWeeks(referenceDate, 1))
  }

  const handleNextWeek = () => {
    onChangeReferenceDate(addWeeks(referenceDate, 1))
  }

  const handleCurrentWeek = () => {
    onChangeReferenceDate(new Date())
  }

  const startDate = parseISO(progress.weekStart)
  const endDate = parseISO(progress.weekEnd)

  const getSubjectIcon = (iconName?: string) => {
    switch (iconName) {
      case 'cloud':
        return <Cloud className="w-4 h-4" />
      case 'terminal':
        return <Terminal className="w-4 h-4" />
      case 'code':
      default:
        return <Code className="w-4 h-4" />
    }
  }

  const hoursPercent = Math.min(
    100,
    Math.round((progress.totalHours / (progress.totalHoursTarget || 1)) * 100)
  )
  const remainingHours = Math.max(
    0,
    Math.round((progress.totalHoursTarget - progress.totalHours) * 10) / 10
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all">
      {/* Week Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Week {progress.weekNumber} Goals</span>
            </h2>
            {allCompleted && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                100% Weekly Goals Achieved!
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Date range: <span className="font-medium text-slate-700">{formatWeekRange(startDate, endDate)}</span>
          </p>
        </div>

        {/* Week controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <button
            onClick={handleCurrentWeek}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>This Week</span>
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-white text-slate-600 active:scale-95 transition-all cursor-pointer"
              title="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200"></div>
            <button
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-white text-slate-600 active:scale-95 transition-all cursor-pointer"
              title="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- WEEKLY TOTAL HOURS TARGET BANNER --- */}
      <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-amber-50/40 border border-blue-100 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Total Weekly Hours Goal:
                </span>
                <span className="text-sm font-extrabold text-blue-700">
                  {progress.totalHours}h / {progress.totalHoursTarget}h
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {progress.isTotalHoursCompleted ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Weekly hours target completed (+{Math.round((progress.totalHours - progress.totalHoursTarget) * 10) / 10}h)!
                  </span>
                ) : (
                  <span>
                    Remaining <strong>{remainingHours}h</strong> to reach this week's target.
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-blue-700">
              {hoursPercent}% completed
            </span>
          </div>
        </div>

        {/* Global Progress bar */}
        <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden shadow-inner">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              progress.isTotalHoursCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}
            style={{ width: `${hoursPercent}%` }}
          />
        </div>
      </div>

      {/* Subject targets list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-4">
        {progress.targets.map(
          ({
            target,
            currentSessions,
            targetSessions,
            totalMinutes,
            targetHours,
            isCompleted
          }) => {
            const pct = Math.min(
              100,
              Math.round((currentSessions / (targetSessions || 1)) * 100)
            )

            return (
              <div
                key={target.id}
                className={`relative rounded-xl border p-4 transition-all duration-200 ${
                  isCompleted
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
                style={{
                  borderTopWidth: '3px',
                  borderTopColor: target.color
                }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: target.color }}
                    >
                      {getSubjectIcon(target.iconName)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">
                        {target.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span>Goal: <strong className="text-slate-700">{targetSessions} sessions</strong></span>
                        <span>•</span>
                        <span><strong className="text-slate-700">{targetHours}h</strong>/week</span>
                      </div>
                    </div>
                  </div>

                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full shadow-2xs">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Done</span>
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden mb-2">
                  <div
                    className="h-full transition-all duration-500 rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: target.color
                    }}
                  />
                </div>

                {/* Stats & Quick Log */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-700">
                      {currentSessions}/{targetSessions} sessions
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>Studied: <strong className="text-slate-800">{formatMinutes(totalMinutes)}</strong></span>
                      {target.minDurationMinutes && (
                        <span className="text-slate-400 font-normal">
                          (~{target.minDurationMinutes}m/session)
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onQuickAddSubject(target)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-100 active:scale-95 transition-all text-slate-700 shadow-2xs cursor-pointer"
                    title={`Add 1 session for ${target.name}`}
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500" />
                    <span>Log</span>
                  </button>
                </div>
              </div>
            )
          }
        )}
      </div>

      {/* Week Footer stats */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-4">
          <span>
            Total sessions this week: <strong className="text-slate-800 font-semibold">{progress.totalSessions} sessions</strong>
          </span>
          <span>•</span>
          <span>
            Total study time: <strong className="text-slate-800 font-semibold">{formatMinutes(progress.totalMinutes)} ({progress.totalHours}h)</strong>
          </span>
        </div>
        <span className="italic text-slate-400">
          Click "Weekly Goals" in the sidebar to customize your hours and targets.
        </span>
      </div>
    </div>
  )
}

export default WeeklyGoalTracker
