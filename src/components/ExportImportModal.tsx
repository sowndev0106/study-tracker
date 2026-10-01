import React, { useState, useRef } from 'react'
import { X, Download, Upload, FileSpreadsheet, FileJson, CheckCircle2, AlertCircle, Database } from 'lucide-react'
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportStatus({ type: null, message: '' })

    try {
      const text = await file.text()
      const parsed: AppDataExport = JSON.parse(text)

      if (!parsed.records || !Array.isArray(parsed.records)) {
        throw new Error('Tệp không đúng định dạng. Cần có mảng records.')
      }

      const res = await onImportData(parsed)
      setImportStatus({
        type: 'success',
        message: `Đã khôi phục thành công ${res.recordsCount} buổi học!`
      })
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err.message || 'Lỗi khi nhập dữ liệu. Vui lòng kiểm tra lại file JSON.'
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
                Xuất & Khôi phục dữ liệu
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Sao lưu hoặc xuất bảng tính ra Excel / Sheets
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Quick stats box */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <span className="text-slate-500">Tổng số buổi đã lưu:</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">{records.length} buổi</p>
            </div>
            <div>
              <span className="text-slate-500">Tổng thời gian học:</span>
              <p className="text-base font-bold text-blue-600 mt-0.5">{formatMinutes(totalMinutes)}</p>
            </div>
          </div>

          {/* Export Section */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tùy chọn Xuất dữ liệu (Export)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Export JSON */}
              <button
                onClick={handleExportJSON}
                className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all group shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1.5 rounded-md bg-blue-100 text-blue-600 group-hover:scale-105 transition-transform">
                    <FileJson className="w-4 h-4" />
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="font-bold text-xs text-slate-900">Export File JSON</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Sao lưu toàn bộ dữ liệu & mục tiêu tuần (R2 backup).
                </div>
              </button>

              {/* Export CSV */}
              <button
                onClick={handleExportCSV}
                className="p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all group shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 group-hover:scale-105 transition-transform">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <div className="font-bold text-xs text-slate-900">Export File CSV</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Dành cho Microsoft Excel hoặc Google Sheets.
                </div>
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="space-y-2.5 pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Khôi phục từ tệp sao lưu (Import)
            </h4>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full py-4 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-xl text-center transition-all group flex flex-col items-center justify-center gap-1.5"
            >
              <div className="p-2 rounded-full bg-slate-100 group-hover:bg-blue-100 group-hover:text-blue-600 text-slate-500 transition-colors">
                <Upload className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">
                {isImporting ? 'Đang đọc dữ liệu...' : 'Chọn file JSON để khôi phục'}
              </span>
              <span className="text-[11px] text-slate-400">
                Hỗ trợ tệp backup .json được xuất từ ứng dụng
              </span>
            </button>

            {/* Status alerts */}
            {importStatus.type === 'success' && (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{importStatus.message}</span>
              </div>
            )}

            {importStatus.type === 'error' && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{importStatus.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 rounded-lg transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
