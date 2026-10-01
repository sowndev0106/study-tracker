import React, { useState, useEffect } from 'react'
import { X, Clock, BookOpen, FileText, Calendar as CalendarIcon, Check } from 'lucide-react'
import { StudyRecord, WeeklyTarget } from '../types'
import { format } from 'date-fns'

interface SessionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (record: Omit<StudyRecord, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => Promise<void>
  initialData?: StudyRecord | null
  defaultDate?: Date
  defaultSubject?: string
  targets: WeeklyTarget[]
}

const DURATION_PRESETS = [30, 45, 60, 90, 120]

export const SessionFormModal: React.FC<SessionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultDate,
  defaultSubject,
  targets
}) => {
  const [date, setDate] = useState<string>(format(defaultDate || new Date(), 'yyyy-MM-dd'))
  const [subject, setSubject] = useState<string>('aws')
  const [subjectName, setSubjectName] = useState<string>('AWS Cloud')
  const [durationMinutes, setDurationMinutes] = useState<number>(60)
  const [title, setTitle] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [completed, setCompleted] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date)
      setSubject(initialData.subject)
      setSubjectName(initialData.subjectName)
      setDurationMinutes(initialData.durationMinutes)
      setTitle(initialData.title)
      setNotes(initialData.notes)
      setCompleted(initialData.completed)
    } else {
      setDate(format(defaultDate || new Date(), 'yyyy-MM-dd'))
      const sub = defaultSubject || (targets.length > 0 ? targets[0].subject : 'aws')
      setSubject(sub)
      const targetObj = targets.find(t => t.subject === sub)
      setSubjectName(targetObj ? targetObj.name : sub.toUpperCase())
      setDurationMinutes(targetObj?.minDurationMinutes || 60)
      setTitle('')
      setNotes('')
      setCompleted(true)
    }
  }, [initialData, defaultDate, defaultSubject, targets, isOpen])

  if (!isOpen) return null

  const handleSubjectChange = (newSubject: string) => {
    setSubject(newSubject)
    const matched = targets.find(t => t.subject === newSubject)
    if (matched) {
      setSubjectName(matched.name)
      if (!initialData && matched.minDurationMinutes) {
        setDurationMinutes(matched.minDurationMinutes)
      }
    } else {
      setSubjectName(newSubject.toUpperCase())
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !subject || durationMinutes <= 0) return

    try {
      setIsSubmitting(true)
      await onSave(
        {
          date,
          subject,
          subjectName,
          durationMinutes: Number(durationMinutes),
          title: title.trim(),
          notes: notes.trim(),
          completed
        },
        initialData?.id
      )
      onClose()
    } catch (err) {
      console.error('Failed to save session:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              {initialData ? 'Chỉnh sửa buổi học' : 'Ghi nhận buổi học mới'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi chi tiết thời gian và nội dung bài học
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Date Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Ngày học</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-slate-400" />
              <span>Môn học / Mục tiêu</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {targets.map((t) => {
                const isSelected = subject === t.subject
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSubjectChange(t.subject)}
                    className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                      isSelected
                        ? 'border-blue-600 ring-2 ring-blue-500/20 text-slate-900 bg-blue-50/50'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    <span>{t.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Duration Tracking */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Thời lượng học: <strong className="text-blue-600 font-bold">{durationMinutes} phút</strong></span>
              </label>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              {DURATION_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDurationMinutes(m)}
                  className={`px-2.5 py-1 text-xs rounded-md border font-medium transition-all ${
                    durationMinutes === m
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m}m
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDurationMinutes(prev => prev + 15)}
                className="px-2.5 py-1 text-xs rounded-md border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-semibold"
              >
                +15m
              </button>
            </div>

            <input
              type="number"
              min="5"
              max="720"
              step="5"
              required
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Math.max(1, Number(e.target.value)))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Số phút học (ví dụ: 60)"
            />
          </div>

          {/* Title / Topic */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Chủ đề / Bài học hôm nay</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: AWS S3 & CloudFront, Goroutines & Channels, LeetCode #15 3Sum..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Detailed Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Chi tiết đã học được (ghi chú, takeaways, links...)
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="- Nắm được cách thức IAM Policy kết hợp với S3 Bucket Policy&#10;- Thực hành tạo Pre-signed URL bằng Golang SDK&#10;- Lưu ý về race condition khi xài goroutine..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none font-mono text-xs leading-relaxed"
            />
          </div>

          {/* Mark completed */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="completedCheck"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="completedCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
              Đánh dấu đã hoàn thành buổi học (tính vào mục tiêu tuần)
            </label>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Lưu buổi học'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
