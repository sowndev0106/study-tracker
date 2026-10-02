import React from 'react'
import { Calendar } from 'lucide-react'

interface HeaderProps {
  activeTab?: string
  onSelectTab?: (tab: string) => void
  onOpenNewSession?: () => void
  onOpenTargets?: () => void
  onOpenExport?: () => void
  storageStatus?: { status: string; storage: string; r2Bound: boolean }
}

export const Header: React.FC<HeaderProps> = () => {

  return (
    <header className="h-12 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex md:hidden items-center justify-between shrink-0 select-none z-20">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-xs shadow-blue-500/20 text-white">
          <Calendar className="w-3.5 h-3.5" />
        </div>
        <h1 className="font-extrabold text-sm sm:text-base text-slate-800 tracking-tight">
          Study Tracker
        </h1>
      </div>

      {/* Right side can remain clean or empty */}
    </header>
  )
}

export default Header
