import React, { useState, useEffect, useMemo } from 'react'
import { Header } from './components/Header'
import { LoginScreen } from './components/LoginScreen'
import { SidebarDock } from './components/SidebarDock'
import { CalendarView } from './components/CalendarView'
import { BentoRightPanel } from './components/BentoRightPanel'
import { DayDetailModal } from './components/DayDetailModal'
import { SessionFormModal } from './components/SessionFormModal'
import { TargetConfigModal } from './components/TargetConfigModal'
import { ExportImportModal } from './components/ExportImportModal'
import { StatsOverview } from './components/StatsOverview'
import { api } from './services/api'
import { StudyRecord, WeeklyTarget, AppDataExport } from './types'
import { calculateWeekProgress } from './utils/helpers'
import { getAuthToken, onUnauthorized } from './services/auth'
import { Loader2, Calendar, Target, BarChart2, Plus, Settings2 } from 'lucide-react'

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Boolean(getAuthToken()))
  const [records, setRecords] = useState<StudyRecord[]>([])
  const [targets, setTargets] = useState<WeeklyTarget[]>([])
  const [totalHoursTarget, setTotalHoursTarget] = useState<number>(6.0)
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date())
  const [selectedWeekDate, setSelectedWeekDate] = useState<Date>(new Date())
  const [activeTab, setActiveTab] = useState<string>('calendar')

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

  // Show the login screen whenever the API reports the access token is missing/invalid
  useEffect(() => {
    onUnauthorized(() => setIsAuthenticated(false))
  }, [])

  // Initial Data Fetch (re-runs after each successful login)
  useEffect(() => {
    if (!isAuthenticated) return

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
  }, [isAuthenticated])

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

  if (!isAuthenticated) {
    return <LoginScreen onSuccess={() => setIsAuthenticated(true)} />
  }

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 animate-bounce">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="mt-4 font-bold text-slate-800 text-sm tracking-tight">
          Initializing Study Tracker...
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Connecting Cloudflare Worker & R2 Storage
        </p>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-[#F8F9FB] text-slate-800 antialiased font-sans">
      {/* Slim Header (48px) */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewSession={() => handleOpenNewSession()}
        onOpenTargets={() => setTargetModalOpen(true)}
        onOpenExport={() => setExportModalOpen(true)}
        storageStatus={storageStatus}
      />

      {/* Main Single-Screen Workspace */}
      <main className="flex-1 min-h-0 flex gap-2 sm:gap-3.5 p-2 sm:p-3.5 pb-20 md:pb-3.5 overflow-hidden">
        {/* Left: Sidebar Dock (Desktop & Tablet only) */}
        <div className="hidden md:flex shrink-0">
          <SidebarDock
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab)
              if (tab === 'goals') setTargetModalOpen(true)
            }}
            onOpenTargets={() => setTargetModalOpen(true)}
            onOpenExport={() => setExportModalOpen(true)}
            storageStatus={storageStatus}
          />
        </div>

        {/* Center: Master Calendar, Stats, or Goals on Mobile (flex-1 h-full) */}
        <div className="flex-1 min-h-0 h-full overflow-hidden">
          {activeTab === 'stats' ? (
            <StatsOverview
              records={records}
              targets={targets}
              totalHoursTarget={totalHoursTarget}
              currentMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              onOpenNewSession={() => handleOpenNewSession()}
              onEditSession={handleEditRecord}
              onDeleteSession={handleDeleteSession}
              onSwitchToCalendar={() => setActiveTab('calendar')}
            />
          ) : activeTab === 'goals' ? (
            <div className="h-full overflow-y-auto px-1 py-1 flex justify-center scrollbar-none">
              <div className="w-full max-w-sm">
                <BentoRightPanel
                  weekProgress={weekProgress}
                  targets={targets}
                  records={records}
                  currentMonth={selectedMonth}
                  referenceDate={selectedWeekDate}
                  onChangeReferenceDate={setSelectedWeekDate}
                  onOpenNewSession={() => handleOpenNewSession()}
                  onOpenTargets={() => setTargetModalOpen(true)}
                  storageStatus={storageStatus}
                />
              </div>
            </div>
          ) : (
            <CalendarView
              currentMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              records={records}
              targets={targets}
              onSelectDay={(day) => setSelectedDay(day)}
              onAddSessionOnDay={(day) => handleOpenNewSession(day)}
            />
          )}
        </div>

        {/* Right: Bento Column (Visible on lg: and above) */}
        <div className="hidden lg:flex shrink-0">
          <BentoRightPanel
            weekProgress={weekProgress}
            targets={targets}
            records={records}
            currentMonth={selectedMonth}
            referenceDate={selectedWeekDate}
            onChangeReferenceDate={setSelectedWeekDate}
            onOpenNewSession={() => handleOpenNewSession()}
            onOpenTargets={() => setTargetModalOpen(true)}
            storageStatus={storageStatus}
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation Dock (< md screens) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200/90 z-40 px-3 flex items-center justify-around shadow-lg select-none">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px]">Calendar</span>
        </button>

        <button
          onClick={() => setActiveTab('goals')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'goals'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Target className="w-5 h-5" />
          <span className="text-[10px]">Goals</span>
        </button>

        {/* Floating Quick Add Button */}
        <button
          onClick={() => handleOpenNewSession()}
          className="w-11 h-11 -mt-5 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          title="Log Study Session"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setActiveTab('stats')}
          className={`flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'stats'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <BarChart2 className="w-5 h-5" />
          <span className="text-[10px]">Stats</span>
        </button>

        <button
          onClick={() => setTargetModalOpen(true)}
          className="flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
        >
          <Settings2 className="w-5 h-5" />
          <span className="text-[10px]">Config</span>
        </button>
      </nav>

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
