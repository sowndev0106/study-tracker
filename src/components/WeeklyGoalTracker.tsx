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
  Code
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

  const allCompleted = progress.targets.length > 0 && progress.targets.every(t => t.isCompleted)

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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all">
      {/* Week Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Mục tiêu tuần {progress.weekNumber}</span>
            </h2>
            {allCompleted && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                Đạt 100% mục tiêu!
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Thời gian: <span className="font-medium text-slate-700">{formatWeekRange(startDate, endDate)}</span>
          </p>
        </div>

        {/* Week controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <button
            onClick={handleCurrentWeek}
            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Tuần này</span>
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
            <button
              onClick={handlePrevWeek}
              className="p-1.5 hover:bg-white text-slate-600 active:scale-95 transition-all"
              title="Tuần trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-slate-200"></div>
            <button
              onClick={handleNextWeek}
              className="p-1.5 hover:bg-white text-slate-600 active:scale-95 transition-all"
              title="Tuần sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Target Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
        {progress.targets.map(({ target, currentSessions, targetSessions, totalMinutes, isCompleted }) => {
          const percent = Math.min(100, Math.round((currentSessions / targetSessions) * 100))

          return (
            <div
              key={target.id}
              className={`relative rounded-xl border p-4 transition-all duration-200 ${
                isCompleted
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              {/* Card top row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-xs font-semibold"
                    style={{ backgroundColor: target.color }}
                  >
                    {getSubjectIcon(target.iconName)}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">
                      {target.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Mục tiêu: <span className="font-semibold text-slate-700">{targetSessions} bữa</span>/tuần
                    </p>
                  </div>
                </div>

                {isCompleted ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Đạt</span>
                  </span>
                ) : (
                  <button
                    onClick={() => onQuickAddSubject(target)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 active:scale-95 transition-all shadow-xs"
                    title={`Thêm 1 buổi ${target.name}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-700">
                    {currentSessions} / {targetSessions} bữa
                  </span>
                  <span className="font-medium text-slate-500">
                    {percent}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: isCompleted ? '#10B981' : target.color
                    }}
                  />
                </div>
              </div>

              {/* Card Bottom Stats */}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600">
                <div className="flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Đã học: <strong className="text-slate-800">{formatMinutes(totalMinutes)}</strong></span>
                </div>
                {target.minDurationMinutes && (
                  <span className="text-[10px] text-slate-400">
                    ~{target.minDurationMinutes}m/bữa
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Week total summary footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <span>
            Tổng buổi tuần này: <strong className="text-slate-800 font-semibold">{progress.totalSessions} buổi</strong>
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Tổng thời gian: <strong className="text-slate-800 font-semibold">{formatMinutes(progress.totalMinutes)}</strong>
          </span>
        </div>
        <div className="text-slate-400 text-[11px]">
          * Bấm dấu + trên thẻ hoặc bấm ngày trên Calendar để ghi nhận buổi học.
        </div>
      </div>
    </div>
  )
}
