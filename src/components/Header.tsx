import React from 'react'
import { Calendar, Download, Settings2, Plus, Database, Cloud } from 'lucide-react'

interface HeaderProps {
  onOpenNewSession: () => void
  onOpenTargets: () => void
  onOpenExport: () => void
  storageStatus: { status: string; storage: string; r2Bound: boolean }
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewSession,
  onOpenTargets,
  onOpenExport,
  storageStatus
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                  Study Tracker Calendar
                </h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Cloudflare R2
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>Daily Tracking & Weekly Targets</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1 font-medium text-[11px] text-slate-600">
                  {storageStatus.r2Bound ? (
                    <>
                      <Cloud className="w-3 h-3 text-sky-500" />
                      <span className="text-emerald-600 font-semibold">R2 Connected</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-3 h-3 text-amber-500" />
                      <span className="text-amber-600">Local / Dev Storage</span>
                    </>
                  )}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Mobile Action */}
          <button
            onClick={onOpenNewSession}
            className="sm:hidden p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
            title="Thêm buổi học"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
          {/* Target Config Button */}
          <button
            onClick={onOpenTargets}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-xs"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Mục tiêu tuần</span>
          </button>

          {/* Export / Backup Button */}
          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export & Backup</span>
          </button>

          {/* Primary Add Session Button */}
          <button
            onClick={onOpenNewSession}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ghi nhận buổi học</span>
          </button>
        </div>

      </div>
    </header>
  )
}
