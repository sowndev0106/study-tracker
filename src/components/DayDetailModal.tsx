import React from 'react'
import { format } from 'date-fns'
import { X, Plus, Clock, Edit2, Trash2, BookOpen, Sun, Moon } from 'lucide-react'
import { StudyRecord, WeeklyTarget } from '../types'
import { formatMinutes } from '../utils/helpers'

interface DayDetailModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date | null
  records: StudyRecord[]
  targets: WeeklyTarget[]
  onAddSession: (date: Date) => void
  onEditSession: (record: StudyRecord) => void
  onDeleteSession: (id: string) => Promise<void>
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  isOpen,
  onClose,
  date,
  records,
  targets,
  onAddSession,
  onEditSession,
  onDeleteSession
}) => {
  if (!isOpen || !date) return null

  const dateStr = format(date, 'yyyy-MM-dd')
  const dayRecords = records.filter(r => r.date === dateStr)
  const totalMinutes = dayRecords.reduce((acc, r) => acc + (r.durationMinutes || 0), 0)

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

  const morningCount = dayRecords.filter(r => getRecordTimeOfDay(r) === 'morning').length
  const eveningCount = dayRecords.filter(r => getRecordTimeOfDay(r) === 'evening').length

  // Sort: Morning (AM) on top, Evening (PM) below, chronologically
  const sortedDayRecords = [...dayRecords].sort((a, b) => {
    const isMorningA = getRecordTimeOfDay(a) === 'morning'
    const isMorningB = getRecordTimeOfDay(b) === 'morning'
    if (isMorningA !== isMorningB) {
      return isMorningA ? -1 : 1
    }
    if (a.startTime && b.startTime) {
      const timeDiff = a.startTime.localeCompare(b.startTime)
      if (timeDiff !== 0) return timeDiff
    }
    if (a.startTime && !b.startTime) return -1
    if (!a.startTime && b.startTime) return 1
    if (a.createdAt && b.createdAt) {
      return a.createdAt.localeCompare(b.createdAt)
    }
    return 0
  })

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

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title || 'this study session'}"?`)) {
      await onDeleteSession(id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-slate-900 capitalize">
                {format(date, 'EEEE, MMMM d, yyyy')}
              </h3>
              {totalMinutes > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <Clock className="w-3 h-3 text-blue-600" />
                  {formatMinutes(totalMinutes)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
              <span>{dayRecords.length === 0 ? 'No study sessions recorded' : `${dayRecords.length} session(s) completed`}</span>
              {dayRecords.length > 0 && (
                <>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                    <Sun className="w-3 h-3 text-amber-500 fill-amber-500" />
                    {morningCount} Morning
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1 text-indigo-700 font-semibold">
                    <Moon className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                    {eveningCount} Evening
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddSession(date)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Session</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {dayRecords.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No study sessions logged for this day</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Click "Add Session" to record what you studied (AWS, Golang, LeetCode, etc.).
              </p>
              <button
                onClick={() => onAddSession(date)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log Session Now</span>
              </button>
            </div>
          ) : (
            sortedDayRecords.map((record) => {
              const color = getSubjectColor(record.subject)
              const isMorning = getRecordTimeOfDay(record) === 'morning'

              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-slate-200 p-4 bg-white shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Morning vs Evening Tag */}
                      {isMorning ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                          <Sun className="w-3 h-3 text-amber-500 fill-amber-500" />
                          <span>Morning Session</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/60">
                          <Moon className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                          <span>Evening Session</span>
                        </span>
                      )}

                      {/* Subject Tag */}
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-bold text-white shadow-2xs"
                        style={{ backgroundColor: color }}
                      >
                        {record.subjectName || record.subject.toUpperCase()}
                      </span>

                      {/* Duration */}
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {record.durationMinutes} mins ({formatMinutes(record.durationMinutes)})
                      </span>

                      {record.startTime && (
                        <span className="text-xs text-slate-400 font-mono">
                          at {record.startTime}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditSession(record)}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer"
                        title="Edit session"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id, record.title)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title / Topic */}
                  <h4 className="font-bold text-sm text-slate-900 mt-2">
                    {record.title || '(Untitled session)'}
                  </h4>

                  {/* Detailed Notes */}
                  {record.notes ? (
                    <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {record.notes}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400 italic">No notes recorded for this session.</p>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default DayDetailModal
