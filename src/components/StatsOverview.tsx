import React from 'react'
import { StudyRecord, WeeklyTarget } from '../types'
import { formatMinutes } from '../utils/helpers'
import { Clock, BookCheck, TrendingUp } from 'lucide-react'
import { format, isSameMonth } from 'date-fns'

interface StatsOverviewProps {
  records: StudyRecord[]
  targets: WeeklyTarget[]
  currentMonth: Date
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  records,
  targets,
  currentMonth
}) => {
  const monthRecords = records.filter(r => {
    try {
      return isSameMonth(new Date(r.date), currentMonth)
    } catch {
      return false
    }
  })

  const totalMinutesMonth = monthRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
  const totalSessionsMonth = monthRecords.length


  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2.5">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Thống kê tháng {format(currentMonth, 'MM/yyyy')}</span>
        </h3>
        <span className="text-xs text-slate-500 font-medium">
          {monthRecords.length} buổi học đã ghi nhận
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Time */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Tổng giờ học</span>
          </div>
          <div className="text-lg font-extrabold text-slate-900 mt-1">
            {formatMinutes(totalMinutesMonth)}
          </div>
        </div>

        {/* Total Sessions */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
          <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
            <BookCheck className="w-3 h-3 text-slate-400" />
            <span>Tổng buổi học</span>
          </div>
          <div className="text-lg font-extrabold text-blue-600 mt-1">
            {totalSessionsMonth} buổi
          </div>
        </div>

        {/* By Subject breakdown */}
        {targets.slice(0, 2).map(target => {
          const subRecords = monthRecords.filter(
            r => r.subject.toLowerCase() === target.subject.toLowerCase()
          )
          const subMins = subRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)

          return (
            <div key={target.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5 truncate">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: target.color }}
                />
                <span className="truncate">{target.name}</span>
              </div>
              <div className="text-base font-bold text-slate-900 mt-1">
                {subRecords.length} buổi <span className="text-xs font-normal text-slate-500">({formatMinutes(subMins)})</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
