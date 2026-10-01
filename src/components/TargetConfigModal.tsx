import React, { useState, useEffect } from 'react'
import { X, Check, Plus, Trash2, Sliders, Info, Target } from 'lucide-react'
import { WeeklyTarget } from '../types'

interface TargetConfigModalProps {
  isOpen: boolean
  onClose: () => void
  targets: WeeklyTarget[]
  totalHoursTarget: number
  onSaveTargets: (targets: WeeklyTarget[]) => Promise<void>
  onSaveTotalHoursTarget: (hours: number) => Promise<void>
}

const HOURS_PRESETS = [4, 6, 8, 10, 12]

export const TargetConfigModal: React.FC<TargetConfigModalProps> = ({
  isOpen,
  onClose,
  targets,
  totalHoursTarget,
  onSaveTargets,
  onSaveTotalHoursTarget
}) => {
  const [targetList, setTargetList] = useState<WeeklyTarget[]>(targets)
  const [hoursGoal, setHoursGoal] = useState<number>(totalHoursTarget)
  const [isSaving, setIsSaving] = useState(false)

  // Reset when modal opens
  useEffect(() => {
    setTargetList(targets)
    setHoursGoal(totalHoursTarget)
  }, [targets, totalHoursTarget, isOpen])

  if (!isOpen) return null

  const handleUpdateField = (index: number, field: keyof WeeklyTarget, value: any) => {
    const updated = [...targetList]
    updated[index] = { ...updated[index], [field]: value }
    setTargetList(updated)
  }

  const handleAddTarget = () => {
    const newId = `target-${Date.now()}`
    setTargetList([
      ...targetList,
      {
        id: newId,
        subject: `subject_${Date.now()}`,
        name: 'Môn mới',
        targetSessionsPerWeek: 2,
        targetHoursPerWeek: 2.0,
        minDurationMinutes: 60,
        color: '#6366F1',
        iconName: 'code'
      }
    ])
  }

  const handleRemoveTarget = (index: number) => {
    if (targetList.length <= 1) {
      alert('Bạn phải giữ ít nhất 1 mục tiêu.')
      return
    }
    const updated = targetList.filter((_, idx) => idx !== index)
    setTargetList(updated)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      await Promise.all([
        onSaveTargets(targetList),
        onSaveTotalHoursTarget(Number(hoursGoal))
      ])
      onClose()
    } catch (err) {
      console.error('Failed to save targets & settings:', err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Cấu hình mục tiêu tuần
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Thiết lập số bữa học & tổng số tiếng mục tiêu mỗi tuần
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* TOTAL WEEKLY HOURS GOAL CONFIG */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Mục tiêu tổng số giờ học mỗi tuần:</span>
              </label>
              <span className="text-sm font-extrabold text-blue-700">
                {hoursGoal} tiếng / tuần
              </span>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {HOURS_PRESETS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHoursGoal(h)}
                  className={`px-2.5 py-1 text-xs rounded-md border font-semibold transition-all ${
                    hoursGoal === h
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {h} tiếng
                </button>
              ))}
              <input
                type="number"
                min="1"
                max="80"
                step="0.5"
                value={hoursGoal}
                onChange={(e) => setHoursGoal(Math.max(0.5, Number(e.target.value)))}
                className="w-20 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tự nhập"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              * Hệ thống sẽ tự động cộng dồn tất cả các buổi học trong tuần để đối chiếu với mục tiêu này.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/60 flex items-start gap-2.5 text-xs text-amber-800">
            <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p>
              Mục tiêu mặc định: <strong>AWS (2 bữa/tuần)</strong>,{' '}
              <strong>Golang (2 bữa/tuần)</strong>, và <strong>LeetCode (2 bữa/tuần)</strong>.
            </p>
          </div>

          {/* PER-SUBJECT TARGETS */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Chi tiết mục tiêu theo từng môn
            </h4>

            {targetList.map((target, idx) => (
              <div
                key={target.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={target.color}
                      onChange={(e) => handleUpdateField(idx, 'color', e.target.value)}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0"
                      title="Chọn màu đại diện"
                    />
                    <input
                      type="text"
                      value={target.name}
                      onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                      className="px-2.5 py-1 text-sm font-bold border border-slate-200 rounded-md flex-1 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveTarget(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Xóa môn này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">
                      Mục tiêu (bữa/tuần)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="14"
                      value={target.targetSessionsPerWeek}
                      onChange={(e) =>
                        handleUpdateField(idx, 'targetSessionsPerWeek', Math.max(1, Number(e.target.value)))
                      }
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">
                      Mục tiêu (tiếng/tuần)
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="40"
                      step="0.5"
                      value={target.targetHoursPerWeek || 2.0}
                      onChange={(e) =>
                        handleUpdateField(idx, 'targetHoursPerWeek', Math.max(0.5, Number(e.target.value)))
                      }
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1 font-medium">
                      Gợi ý (phút/bữa)
                    </label>
                    <input
                      type="number"
                      min="15"
                      step="5"
                      value={target.minDurationMinutes || 60}
                      onChange={(e) =>
                        handleUpdateField(idx, 'minDurationMinutes', Math.max(5, Number(e.target.value)))
                      }
                      className="w-full px-2 py-1.5 border border-slate-200 rounded-md font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddTarget}
            className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-xl text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm môn học mới</span>
          </button>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-sm transition-all disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
