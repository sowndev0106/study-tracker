import React from 'react'
import { Calendar, Target, BarChart2, Cloud, Database, Download, Settings2, GraduationCap } from 'lucide-react'

interface SidebarDockProps {
  activeTab?: string
  onSelectTab?: (tab: string) => void
  onOpenTargets: () => void
  onOpenExport: () => void
  storageStatus: { status: string; storage: string; r2Bound: boolean }
}

export const SidebarDock: React.FC<SidebarDockProps> = ({
  activeTab = 'calendar',
  onSelectTab,
  onOpenTargets,
  onOpenExport,
  storageStatus
}) => {
  return (
    <aside className="w-14 h-full rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col items-center justify-between py-3.5 shrink-0 select-none">
      {/* Top Nav Buttons & App Logo */}
      <div className="flex flex-col items-center gap-2">
        {/* App Brand Logo */}
        <button
          onClick={() => onSelectTab?.('calendar')}
          className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-500/25 text-white hover:scale-105 active:scale-95 transition-all cursor-pointer mb-0.5"
          title="Study Tracker"
        >
          <GraduationCap className="w-5 h-5 text-white" />
        </button>

        <div className="w-6 h-[1px] bg-slate-200/80 mb-0.5" />

        {/* Calendar Nav */}
        <button
          onClick={() => onSelectTab?.('calendar')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 active:scale-95'
              : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:scale-95'
          }`}
          title="Study Calendar"
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Weekly Goals Nav */}
        <button
          onClick={onOpenTargets}
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50/80 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          title="Weekly Goals"
        >
          <Target className="w-4 h-4" />
        </button>

        {/* Stats Nav */}
        <button
          onClick={() => onSelectTab?.('stats')}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            activeTab === 'stats'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 active:scale-95'
              : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50/80 active:scale-95'
          }`}
          title="Study Analytics & Stats"
        >
          <BarChart2 className="w-4 h-4" />
        </button>

        {/* Cloud Connection Indicator */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center relative cursor-help"
          title={storageStatus.r2Bound ? "Cloud Sync: Connected & Synced" : "Local Backup Active"}
        >
          {storageStatus.r2Bound ? (
            <>
              <Cloud className="w-4 h-4 text-sky-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 absolute top-2 right-2 ring-2 ring-white"></span>
            </>
          ) : (
            <>
              <Database className="w-4 h-4 text-amber-500" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-2 right-2 ring-2 ring-white"></span>
            </>
          )}
        </div>
      </div>

      {/* Bottom Nav Actions */}
      <div className="flex flex-col items-center gap-2">
        {/* Export / Backup */}
        <button
          onClick={onOpenExport}
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          title="Backup & Export Data"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Settings / Config Targets */}
        <button
          onClick={onOpenTargets}
          className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
          title="Goal Settings"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}

export default SidebarDock
