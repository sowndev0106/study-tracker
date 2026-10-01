import React, { useState, useRef } from 'react'
import { X, Download, Upload, FileSpreadsheet, FileJson, CheckCircle2, AlertCircle, Database, Sparkles } from 'lucide-react'
import { StudyRecord, WeeklyTarget, AppDataExport } from '../types'
import { exportToCSV, exportToJSONFile, formatMinutes } from '../utils/helpers'

interface ExportImportModalProps {
  isOpen: boolean
  onClose: () => void
  records: StudyRecord[]
  targets: WeeklyTarget[]
  onImportData: (data: AppDataExport) => Promise<{ success: boolean; recordsCount: number }>
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  records,
  targets,
  onImportData
}) => {
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const totalMinutes = records.reduce((acc, r) => acc + (r.durationMinutes || 0), 0)

  const handleExportJSON = () => {
    const payload: AppDataExport = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      targets,
      records
    }
    exportToJSONFile(payload)
  }

  const handleExportCSV = () => {
    exportToCSV(records)
  }

  const handleLoadDemoData = async () => {
    setIsImporting(true)
    setImportStatus({ type: null, message: '' })

    try {
      const demoData: AppDataExport = {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        totalHoursTarget: 6.0,
        targets,
        records: [
          {
            id: `demo-${Date.now()}-1`,
            date: '2026-10-01',
            timeOfDay: 'morning',
            startTime: '07:30',
            subject: 'aws',
            subjectName: 'AWS Cloud',
            durationMinutes: 90,
            title: 'S3 Presigned URLs & IAM Cross-Account Policies',
            notes: '- Implemented presigned URLs with 15-minute expiration\n- Configured KMS key policy for SSE-KMS cross-account access\n- Reviewed CloudTrail data events for S3 GetObject',
            completed: true,
            createdAt: '2026-10-01T07:30:00.000Z',
            updatedAt: '2026-10-01T07:30:00.000Z'
          },
          {
            id: `demo-${Date.now()}-2`,
            date: '2026-10-01',
            timeOfDay: 'evening',
            startTime: '20:00',
            subject: 'golang',
            subjectName: 'Golang',
            durationMinutes: 60,
            title: 'Concurrency: Select Channel Timeouts & Context',
            notes: '- Built worker pool with buffered job queue\n- Avoided goroutine leaks using context.WithCancel()\n- Benchmarked channel communication vs sync.Mutex',
            completed: true,
            createdAt: '2026-10-01T20:00:00.000Z',
            updatedAt: '2026-10-01T20:00:00.000Z'
          },
          {
            id: `demo-${Date.now()}-3`,
            date: '2026-09-30',
            timeOfDay: 'morning',
            startTime: '08:00',
            subject: 'leetcode',
            subjectName: 'LeetCode',
            durationMinutes: 75,
            title: 'Graph Traversal: LC 200 (Number of Islands)',
            notes: '- Implemented BFS with queue and visited matrix\n- Also solved via DFS recursive flood fill (O(M*N))\n- Key takeaway: mutate grid in-place to save O(M*N) extra memory',
            completed: true,
            createdAt: '2026-09-30T08:00:00.000Z',
            updatedAt: '2026-09-30T08:00:00.000Z'
          },
          {
            id: `demo-${Date.now()}-4`,
            date: '2026-09-30',
            timeOfDay: 'evening',
            startTime: '21:00',
            subject: 'aws',
            subjectName: 'AWS Cloud',
            durationMinutes: 60,
            title: 'DynamoDB Partition Keys & Global Secondary Indexes',
            notes: '- Designed single-table schema with PK and SK composite keys\n- Added GSI for querying orders by customerId\n- Handled hot partition throttling with random suffixes',
            completed: true,
            createdAt: '2026-09-30T21:00:00.000Z',
            updatedAt: '2026-09-30T21:00:00.000Z'
          },
          {
            id: `demo-${Date.now()}-5`,
            date: '2026-09-29',
            timeOfDay: 'morning',
            startTime: '07:00',
            subject: 'golang',
            subjectName: 'Golang',
            durationMinutes: 90,
            title: 'Interface Implementation & Memory Escape Analysis',
            notes: '- Ran go build -gcflags="-m" to inspect heap allocations\n- Analyzed pointer receiver vs value receiver performance\n- Replaced slice appends with pre-allocated capacity make([]T, 0, n)',
            completed: true,
            createdAt: '2026-09-29T07:00:00.000Z',
            updatedAt: '2026-09-29T07:00:00.000Z'
          },
          {
            id: `demo-${Date.now()}-6`,
            date: '2026-09-28',
            timeOfDay: 'evening',
            startTime: '19:30',
            subject: 'leetcode',
            subjectName: 'LeetCode',
            durationMinutes: 60,
            title: 'Dynamic Programming: LC 322 (Coin Change)',
            notes: '- Set up bottom-up DP table dp[amount] initialized to amount+1\n- Recurrence: dp[i] = min(dp[i], dp[i-coin] + 1)\n- Solved LC 518 (Coin Change 2) combinations variation',
            completed: true,
            createdAt: '2026-09-28T19:30:00.000Z',
            updatedAt: '2026-09-28T19:30:00.000Z'
          },
          {
            id: `demo-${Date.now()}-7`,
            date: '2026-09-27',
            timeOfDay: 'morning',
            startTime: '08:30',
            subject: 'aws',
            subjectName: 'AWS Cloud',
            durationMinutes: 60,
            title: 'VPC Peering vs Transit Gateway Routing Tables',
            notes: '- Configured route table entries for CIDR 10.0.0.0/16\n- Set up Security Group ingress references to peer SG IDs\n- Noted non-transitive nature of standard VPC peering',
            completed: true,
            createdAt: '2026-09-27T08:30:00.000Z',
            updatedAt: '2026-09-27T08:30:00.000Z'
          }
        ]
      }

      const res = await onImportData(demoData)
      setImportStatus({
        type: 'success',
        message: `Successfully loaded ${res.recordsCount} sample study sessions!`
      })
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err.message || 'Error loading sample data.'
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportStatus({ type: null, message: '' })

    try {
      const text = await file.text()
      const parsed: AppDataExport = JSON.parse(text)

      if (!parsed.records || !Array.isArray(parsed.records)) {
        throw new Error('Invalid file format. A "records" array is required.')
      }

      const res = await onImportData(parsed)
      setImportStatus({
        type: 'success',
        message: `Successfully restored ${res.recordsCount} study sessions!`
      })
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err.message || 'Error importing data. Please check your JSON backup file.'
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Backup & Export Data
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Download your learning logs or export to Excel / Sheets
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Quick Summary */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-500">Total sessions recorded:</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{records.length} sessions</p>
            </div>
            <div>
              <span className="text-slate-500">Total study time:</span>
              <p className="text-base font-bold text-blue-600 mt-0.5">{formatMinutes(totalMinutes)}</p>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Export Options
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* JSON Export */}
              <button
                onClick={handleExportJSON}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-left flex flex-col justify-between group active:scale-98 cursor-pointer"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-xs text-slate-900">JSON Backup</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Full backup of all study sessions and weekly goals.
                  </p>
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </div>
              </button>

              {/* CSV Export */}
              <button
                onClick={handleExportCSV}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/30 transition-all text-left flex flex-col justify-between group active:scale-98 cursor-pointer"
              >
                <div>
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <h5 className="font-bold text-xs text-slate-900">CSV Spreadsheet</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    For Microsoft Excel or Google Sheets analysis.
                  </p>
                </div>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .csv</span>
                </div>
              </button>
            </div>
          </div>

          {/* Import / Restore */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Restore from Backup (Import)
            </h4>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-slate-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all text-center"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">
                {isImporting ? 'Reading backup data...' : 'Select JSON file to restore'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Supports .json backup files exported from this application
              </p>
            </div>

            {/* Status alerts */}
            {importStatus.type === 'success' && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{importStatus.message}</span>
              </div>
            )}

            {importStatus.type === 'error' && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>

          {/* Quick Demo Data Seeder */}
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Load Sample Study Records</span>
              </h5>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Populate 7 realistic sessions (AWS, Golang, LeetCode) across morning and evening with real notes.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLoadDemoData}
              disabled={isImporting}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load Sample Data</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50/50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportImportModal
