import React from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { X, Plus, Clock, Edit2, Trash2, BookOpen } from 'lucide-react'
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

  const getSubjectColor = (subject: string): string => {
    const found = targets.find(t => t.subject.toLowerCase() === subject.toLowerCase())
    if (found) return found.color
    if (subject.toLowerCase() === 'aws') return '#FF9900'
    if (subject.toLowerCase() === 'golang') return '#00ADD8'
    if (subject.toLowerCase() === 'leetcode') return '#FEA015'
    return '#6366F1'
  }

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa buổi học "${title || 'này'}"?`)) {
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
                {format(date, 'EEEE, dd/MM/yyyy', { locale: vi })}
              </h3>
              {totalMinutes > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <Clock className="w-3 h-3 text-blue-600" />
                  {formatMinutes(totalMinutes)}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {dayRecords.length === 0
                ? 'Chưa có hoạt động học nào trong ngày'
                : `Đã hoàn thành ${dayRecords.length} buổi học`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddSession(date)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm buổi học</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
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
              <p className="text-sm font-semibold text-slate-700">Ngày này chưa có ghi chép nào</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Bấm nút "Thêm buổi học" để lưu lại những gì bạn đã học hôm nay (AWS, Golang, LeetCode...).
              </p>
              <button
                onClick={() => onAddSession(date)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Ghi nhận ngay</span>
              </button>
            </div>
          ) : (
            dayRecords.map((record) => {
              const color = getSubjectColor(record.subject)
              return (
                <div
                  key={record.id}
                  className="rounded-xl border border-slate-200 p-4 bg-white shadow-2xs hover:shadow-xs transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-md text-xs font-bold text-white shadow-2xs"
                        style={{ backgroundColor: color }}
                      >
                        {record.subjectName || record.subject.toUpperCase()}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {record.durationMinutes} phút
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditSession(record)}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id, record.title)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mt-2">
                    {record.title || '(Chưa đặt tiêu đề)'}
                  </h4>

                  {record.notes && (
                    <div className="mt-2.5 p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
                      {record.notes}
                    </div>
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
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
