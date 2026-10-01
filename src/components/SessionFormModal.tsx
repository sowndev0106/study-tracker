import React, { useState, useEffect } from 'react'
import { X, Clock, BookOpen, FileText, Calendar as CalendarIcon, Check, Sun, Moon } from 'lucide-react'
import { StudyRecord, WeeklyTarget, TimeOfDay } from '../types'
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
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning')
  const [startTime, setStartTime] = useState<string>('')
  const [subject, setSubject] = useState<string>('aws')
  const [subjectName, setSubjectName] = useState<string>('AWS Cloud')
  const [durationMinutes, setDurationMinutes] = useState<number>(60)
  const [title, setTitle] = useState<string>('')
  const [notes, setNotes] = useState<string>('')
  const [completed, setCompleted] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [dateError, setDateError] = useState<string>('')

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  // Auto-detect Morning vs Evening with 12:00 PM (noon) landmark
  const detectSlot = (timeString?: string): TimeOfDay => {
    if (timeString && timeString.includes(':')) {
      const h = parseInt(timeString.split(':')[0], 10)
      if (!isNaN(h)) {
        return h < 12 ? 'morning' : 'evening'
      }
    }
    const currentHour = new Date().getHours()
    return currentHour < 12 ? 'morning' : 'evening'
  }

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date)
      setStartTime(initialData.startTime || '')
      if (initialData.timeOfDay) {
        setTimeOfDay(initialData.timeOfDay)
      } else if (initialData.startTime) {
        setTimeOfDay(detectSlot(initialData.startTime))
      } else {
        const h = new Date(initialData.createdAt).getHours()
        setTimeOfDay(h < 12 ? 'morning' : 'evening')
      }
      setSubject(initialData.subject)
      setSubjectName(initialData.subjectName)
      setDurationMinutes(initialData.durationMinutes)
      setTitle(initialData.title)
      setNotes(initialData.notes)
      setCompleted(initialData.completed)
    } else {
      setDate(format(defaultDate || new Date(), 'yyyy-MM-dd'))
      const now = new Date()
      const timeStr = format(now, 'HH:mm')
      setStartTime(timeStr)
      // Auto-detect slot: < 12:00 PM -> Morning, >= 12:00 PM -> Evening
      setTimeOfDay(detectSlot(timeStr))

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

  const handleDateChange = (value: string) => {
    setDate(value)
    setDateError(value > todayStr ? 'Cannot select future dates' : '')
  }

  const handleTimeChange = (value: string) => {
    setStartTime(value)
    // Auto-sync Time of Day Slot based on 12:00 PM noon cutoff
    if (value && value.includes(':')) {
      const h = parseInt(value.split(':')[0], 10)
      if (!isNaN(h)) {
        setTimeOfDay(h < 12 ? 'morning' : 'evening')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!date || !subject || durationMinutes <= 0) return
    if (date > todayStr) {
      setDateError('Cannot select future dates')
      return
    }

    try {
      setIsSubmitting(true)
      await onSave(
        {
          date,
          timeOfDay,
          startTime: startTime.trim(),
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
              {initialData ? 'Edit Study Session' : 'Log Study Session'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Record learning time, topics, and key takeaways
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Date & Start Time + Compact Slot Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                max={todayStr}
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  dateError ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                }`}
              />
              {dateError && (
                <p className="text-[11px] text-red-600 mt-1">{dateError}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Time & Slot</span>
                </label>

                {/* Compact slot selector (auto-detected, with manual override in case user forgot to track) */}
                <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200/80 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setTimeOfDay('morning')}
                    className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                      timeOfDay === 'morning'
                        ? 'bg-amber-100 text-amber-900 shadow-2xs font-extrabold ring-1 ring-amber-300'
                        : 'text-slate-400 hover:text-amber-700'
                    }`}
                    title="Morning session (< 12:00 PM)"
                  >
                    <Sun className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>AM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeOfDay('evening')}
                    className={`px-2 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer ${
                      timeOfDay === 'evening'
                        ? 'bg-indigo-100 text-indigo-900 shadow-2xs font-extrabold ring-1 ring-indigo-300'
                        : 'text-slate-400 hover:text-indigo-700'
                    }`}
                    title="Evening session (≥ 12:00 PM)"
                  >
                    <Moon className="w-3 h-3 text-indigo-500 fill-indigo-500" />
                    <span>PM</span>
                  </button>
                </div>
              </div>

              <input
                type="time"
                value={startTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Start time (auto AM/PM)"
              />
            </div>
          </div>

          {/* Subject Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Subject / Target</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {targets.map((t) => {
                const isSelected = subject.toLowerCase() === t.subject.toLowerCase()
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => handleSubjectChange(t.subject)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'border-transparent text-white shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    style={isSelected ? { backgroundColor: t.color } : {}}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? '#FFFFFF' : t.color }}
                    />
                    <span className="truncate">{t.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  Duration: <strong className="text-blue-600 font-bold">{durationMinutes} mins</strong>
                </span>
              </label>
              <span className="text-[11px] text-slate-400">
                ({(durationMinutes / 60).toFixed(1)} hrs)
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {DURATION_PRESETS.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    durationMinutes === mins
                      ? 'bg-blue-50 border-blue-400 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>

            <input
              type="number"
              min="5"
              max="720"
              step="5"
              required
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Duration in minutes (e.g. 60)"
            />
          </div>

          {/* Topic / Focus Area (Shown in Calendar) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Topic / Focus Area</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4: Goroutines & Channels, S3 Pre-signed URLs"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Detailed Study Notes & Key Takeaways */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Study Notes & Key Takeaways
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="- Learned how IAM Policies evaluate with S3 Bucket Policies&#10;- Practiced concurrency channels with select timeouts&#10;- Solved LeetCode 322 (Coin Change DP)"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-slate-400 font-mono"
            />
          </div>

          {/* Completion Checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="completed"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="completed" className="text-xs font-medium text-slate-700 cursor-pointer select-none">
              Mark session as completed (counts towards weekly goals)
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(dateError)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : initialData ? 'Update Session' : 'Save Session'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SessionFormModal
