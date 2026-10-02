import { Calendar, Download, Settings2, Plus, BarChart2, Sparkles } from 'lucide-react'

interface HeaderProps {
  activeTab?: string
  onSelectTab?: (tab: string) => void
  onOpenNewSession: () => void
  onOpenTargets: () => void
  onOpenExport: () => void
  storageStatus?: { status: string; storage: string; r2Bound: boolean }
}

export const Header: React.FC<HeaderProps> = ({
  activeTab = 'calendar',
  onSelectTab,
  onOpenNewSession,
  onOpenTargets,
  onOpenExport,
  storageStatus: _storageStatus
}) => {
  return (
    <header className="h-12 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-20">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xs shadow-blue-500/20 text-white">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <h1 className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
            Study Tracker
          </h1>
        </div>

        {/* View Switcher: Calendar vs Analytics */}
        <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
          <button
            onClick={() => onSelectTab?.('calendar')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => onSelectTab?.('stats')}
            className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Analytics</span>
          </button>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        <a
          href="/preview.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 active:scale-95 transition-all shadow-2xs cursor-pointer"
          title="Xem và chọn Top 5 Bento Design Options"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden sm:inline">Top 5 Designs</span>
        </a>

        <button
          onClick={onOpenTargets}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
        >
          <Settings2 className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Study Goals</span>
        </button>

        <button
          onClick={onOpenExport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">Backup & Export</span>
        </button>

        <button
          onClick={onOpenNewSession}
          className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-xs shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Log Session</span>
          <span className="sm:hidden">Log</span>
        </button>
      </div>
    </header>
  )
}

export default Header
