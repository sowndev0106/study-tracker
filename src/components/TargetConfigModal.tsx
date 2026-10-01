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
        name: 'New Subject',
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
      alert('You must keep at least 1 goal target.')
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
                Configure Weekly Goals
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Set target sessions and total study hours per week
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
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
                <span>Total Weekly Hours Target:</span>
              </label>
              <span className="text-sm font-extrabold text-blue-700">
                {hoursGoal} hrs / week
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {HOURS_PRESETS.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHoursGoal(h)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    hoursGoal === h
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {h} hrs
                </button>
              ))}
              <div className="flex items-center gap-1 ml-auto">
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.5"
                  value={hoursGoal}
                  onChange={(e) => setHoursGoal(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="w-16 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded-lg bg-white"
                  placeholder="Custom"
                />
                <span className="text-xs font-semibold text-slate-500">hrs</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              * The app automatically tracks all study sessions completed during the week against this total goal.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-800">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Default goals: <strong>AWS (2 sessions/week)</strong>,{' '}
              <strong>Golang (2 sessions/week)</strong>, and <strong>LeetCode (2 sessions/week)</strong>.
            </p>
          </div>

          {/* Subject targets list */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Subject Targets Breakdown
            </h4>

            {targetList.map((target, idx) => (
              <div
                key={target.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="color"
                      value={target.color}
                      onChange={(e) => handleUpdateField(idx, 'color', e.target.value)}
                      className="w-6 h-6 rounded-md border border-slate-200 cursor-pointer p-0 bg-transparent"
                      title="Choose subject color"
                    />
                    <input
                      type="text"
                      value={target.name}
                      onChange={(e) => handleUpdateField(idx, 'name', e.target.value)}
                      placeholder="Subject Name (e.g. AWS Cloud)"
                      className="font-bold text-sm text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1 py-0.5 flex-1"
                    />
                  </div>

                  <button
                    onClick={() => handleRemoveTarget(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                    title="Remove subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                      Sessions / week
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="14"
                      value={target.targetSessionsPerWeek}
                      onChange={(e) =>
                        handleUpdateField(
                          idx,
                          'targetSessionsPerWeek',
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                      Hours / week
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="30"
                      step="0.5"
                      value={target.targetHoursPerWeek || 2.0}
                      onChange={(e) =>
                        handleUpdateField(
                          idx,
                          'targetHoursPerWeek',
                          Math.max(0.5, parseFloat(e.target.value) || 1)
                        )
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold block mb-1">
                      Min mins / session
                    </label>
                    <input
                      type="number"
                      min="15"
                      max="240"
                      step="15"
                      value={target.minDurationMinutes || 60}
                      onChange={(e) =>
                        handleUpdateField(
                          idx,
                          'minDurationMinutes',
                          Math.max(15, parseInt(e.target.value) || 60)
                        )
                      }
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddTarget}
              className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Subject</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default TargetConfigModal
