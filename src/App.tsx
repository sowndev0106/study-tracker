import React, { useState, useEffect, useMemo } from 'react'
import { Header } from './components/Header'
import { WeeklyGoalTracker } from './components/WeeklyGoalTracker'
import { CalendarView } from './components/CalendarView'
import { DayDetailModal } from './components/DayDetailModal'
import { SessionFormModal } from './components/SessionFormModal'
import { TargetConfigModal } from './components/TargetConfigModal'
import { ExportImportModal } from './components/ExportImportModal'
import { StatsOverview } from './components/StatsOverview'
import { api } from './services/api'
import { StudyRecord, WeeklyTarget, AppDataExport } from './types'
import { calculateWeekProgress } from './utils/helpers'
import { Loader2 } from 'lucide-react'

export const App: React.FC = () => {
  const [records, setRecords] = useState<StudyRecord[]>([])
  const [targets, setTargets] = useState<WeeklyTarget[]>([])
  const [totalHoursTarget, setTotalHoursTarget] = useState<number>(6.0)
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(new Date())

  // Modal states
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<StudyRecord | null>(null)
  const [sessionDefaultDate, setSessionDefaultDate] = useState<Date>(new Date())
  const [sessionDefaultSubject, setSessionDefaultSubject] = useState<string>('aws')
  const [targetModalOpen, setTargetModalOpen] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)

  // Status & loading
  const [isLoading, setIsLoading] = useState(true)
  const [storageStatus, setStorageStatus] = useState<{
    status: string
    storage: string
    r2Bound: boolean
  }>({
    status: 'checking',
    storage: 'Checking connection...',
    r2Bound: false
  })

  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
      try {
        setIsLoading(true)
        const [health, targetsData, recordsData, settingsData] = await Promise.all([
          api.checkHealth(),
          api.getTargets(),
          api.getRecords(),
          api.getSettings()
        ])

        setStorageStatus(health)
        setTargets(targetsData)
        setRecords(recordsData)
        if (settingsData?.totalHoursTarget) {
          setTotalHoursTarget(settingsData.totalHoursTarget)
        }
      } catch (err) {
        console.error('Initialization error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initData()
  }, [])

  // Calculate week progress
  const weekProgress = useMemo(() => {
    return calculateWeekProgress(records, targets, selectedWeekDate, totalHoursTarget)
  }, [records, targets, selectedWeekDate, totalHoursTarget])

  // --- Handlers ---
  const handleOpenNewSession = (date?: Date, subject?: string) => {
    setEditingRecord(null)
    setSessionDefaultDate(date || new Date())
    if (subject) setSessionDefaultSubject(subject)
    setSessionModalOpen(true)
  }

  const handleEditRecord = (record: StudyRecord) => {
    setEditingRecord(record)
    setSessionModalOpen(true)
  }

  const handleSaveSession = async (
    recordData: Omit<StudyRecord, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    if (id) {
      const updated = await api.updateRecord(id, recordData)
      setRecords(prev => prev.map(r => (r.id === id ? updated : r)))
    } else {
      const created = await api.createRecord(recordData)
      setRecords(prev => [created, ...prev])
    }
  }

  const handleDeleteSession = async (id: string) => {
    await api.deleteRecord(id)
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  const handleSaveTargets = async (newTargets: WeeklyTarget[]) => {
    const saved = await api.updateTargets(newTargets)
    setTargets(saved)
  }

  const handleSaveTotalHoursTarget = async (hours: number) => {
    await api.updateSettings({ totalHoursTarget: hours })
    setTotalHoursTarget(hours)
  }

  const handleImportData = async (data: AppDataExport) => {
    const res = await api.importData(data)
    setRecords(data.records)
    setTargets(data.targets)
    if (data.totalHoursTarget) {
      setTotalHoursTarget(data.totalHoursTarget)
    }
    return res
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 animate-bounce">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="mt-4 font-semibold text-slate-700 text-sm">
          Đang khởi tạo Study Tracker...
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Kết nối Cloudflare Worker & R2 Storage
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header */}
      <Header
        onOpenNewSession={() => handleOpenNewSession()}
        onOpenTargets={() => setTargetModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        storageStatus={storageStatus}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Weekly Goals Progress Card */}
        <WeeklyGoalTracker
          progress={weekProgress}
          referenceDate={selectedWeekDate}
          onChangeReferenceDate={setSelectedWeekDate}
          onQuickAddSubject={(target) => handleOpenNewSession(new Date(), target.subject)}
        />

        {/* Monthly Stats Overview */}
        <StatsOverview
          records={records}
          targets={targets}
          currentMonth={selectedMonth}
        />

        {/* Interactive Calendar */}
        <CalendarView
          currentMonth={selectedMonth}
          onChangeMonth={setSelectedMonth}
          records={records}
          targets={targets}
          onSelectDay={(day) => setSelectedDay(day)}
          onAddSessionOnDay={(day) => handleOpenNewSession(day)}
        />
      </main>

      {/* Day Details Modal */}
      <DayDetailModal
        isOpen={Boolean(selectedDay)}
        onClose={() => setSelectedDay(null)}
        date={selectedDay}
        records={records}
        targets={targets}
        onAddSession={(day) => {
          setSelectedDay(null)
          handleOpenNewSession(day)
        }}
        onEditSession={(rec) => {
          setSelectedDay(null)
          handleEditRecord(rec)
        }}
        onDeleteSession={handleDeleteSession}
      />

      {/* Session Create/Edit Modal */}
      <SessionFormModal
        isOpen={sessionModalOpen}
        onClose={() => {
          setSessionModalOpen(false)
          setEditingRecord(null)
        }}
        onSave={handleSaveSession}
        initialData={editingRecord}
        defaultDate={sessionDefaultDate}
        defaultSubject={sessionDefaultSubject}
        targets={targets}
      />

      {/* Target Config Modal */}
      <TargetConfigModal
        isOpen={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        targets={targets}
        totalHoursTarget={totalHoursTarget}
        onSaveTargets={handleSaveTargets}
        onSaveTotalHoursTarget={handleSaveTotalHoursTarget}
      />

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        records={records}
        targets={targets}
        onImportData={handleImportData}
      />
    </div>
  )
}

export default App
