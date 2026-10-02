import React from 'react'
import { Calendar, Cloud, Database } from 'lucide-react'

interface HeaderProps {
  activeTab?: string
  onSelectTab?: (tab: string) => void
  onOpenNewSession?: () => void
  onOpenTargets?: () => void
  onOpenExport?: () => void
  storageStatus?: { status: string; storage: string; r2Bound: boolean }
}

export const Header: React.FC<HeaderProps> = ({
  storageStatus
}) => {
  const isR2 = storageStatus?.r2Bound ?? false

  return (
    <header className="h-12 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-20">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xs shadow-blue-500/20 text-white">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        <h1 className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
          Study Tracker
        </h1>
      </div>

      {/* Cloud Sync Status Indicator */}
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/80 border border-slate-200/70 text-[11px] font-medium text-slate-600 shadow-2xs select-none"
          title={isR2 ? 'Cloud Storage: Cloudflare R2 Connected' : 'Local Storage Active'}
        >
          {isR2 ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200 animate-pulse shrink-0"></span>
              <span className="hidden sm:inline font-semibold text-slate-700">Cloud Synced</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-amber-200 shrink-0"></span>
              <span className="hidden sm:inline font-semibold text-slate-700">Local Mode</span>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
