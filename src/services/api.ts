import { StudyRecord, WeeklyTarget, AppDataExport } from '../types'
import { DEFAULT_TARGETS } from '../../worker/r2'

const API_BASE = '/api'
const LOCAL_STORAGE_RECORDS = 'study_tracker_records_v1'
const LOCAL_STORAGE_TARGETS = 'study_tracker_targets_v1'

// Helper for local storage backup/fallback
function getLocalRecords(): StudyRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RECORDS)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocalRecords(records: StudyRecord[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_RECORDS, JSON.stringify(records))
  } catch (e) {
    console.error('Failed to save to localStorage', e)
  }
}

function getLocalTargets(): WeeklyTarget[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TARGETS)
    return raw ? JSON.parse(raw) : DEFAULT_TARGETS
  } catch {
    return DEFAULT_TARGETS
  }
}

function saveLocalTargets(targets: WeeklyTarget[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_TARGETS, JSON.stringify(targets))
  } catch (e) {
    console.error('Failed to save targets to localStorage', e)
  }
}

export const api = {
  // Check health and storage backend
  async checkHealth(): Promise<{ status: string; storage: string; r2Bound: boolean }> {
    try {
      const res = await fetch(`${API_BASE}/health`)
      if (!res.ok) throw new Error('Worker not responding')
      return await res.json()
    } catch {
      return {
        status: 'offline_mode',
        storage: 'Browser LocalStorage (Worker Offline/Dev)',
        r2Bound: false
      }
    }
  },

  // Targets
  async getTargets(): Promise<WeeklyTarget[]> {
    try {
      const res = await fetch(`${API_BASE}/targets`)
      if (!res.ok) throw new Error('Failed to fetch targets')
      const targets = (await res.json()) as WeeklyTarget[]
      saveLocalTargets(targets)
      return targets
    } catch (err) {
      console.warn('API targets offline, falling back to local storage:', err)
      return getLocalTargets()
    }
  },

  async updateTargets(targets: WeeklyTarget[]): Promise<WeeklyTarget[]> {
    saveLocalTargets(targets)
    try {
      const res = await fetch(`${API_BASE}/targets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targets)
      })
      if (!res.ok) throw new Error('Failed to update targets')
    } catch (err) {
      console.warn('API updateTargets offline, saved locally:', err)
    }
    return targets
  },

  // Records
  async getRecords(params?: { month?: string; date?: string; subject?: string }): Promise<StudyRecord[]> {
    try {
      const query = new URLSearchParams()
      if (params?.month) query.set('month', params.month)
      if (params?.date) query.set('date', params.date)
      if (params?.subject) query.set('subject', params.subject)

      const url = `${API_BASE}/records${query.toString() ? `?${query.toString()}` : ''}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch records')
      const records = (await res.json()) as StudyRecord[]
      // If fetching all records, cache locally
      if (!params || Object.keys(params).length === 0) {
        saveLocalRecords(records)
      }
      return records
    } catch (err) {
      console.warn('API records offline, using local storage:', err)
      let records = getLocalRecords()
      if (params?.month) {
        records = records.filter(r => r.date.startsWith(params.month!))
      }
      if (params?.date) {
        records = records.filter(r => r.date === params.date)
      }
      if (params?.subject) {
        records = records.filter(r => r.subject.toLowerCase() === params.subject!.toLowerCase())
      }
      return records.sort((a, b) => b.date.localeCompare(a.date))
    }
  },

  async createRecord(record: Omit<StudyRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudyRecord> {
    try {
      const res = await fetch(`${API_BASE}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      })
      if (!res.ok) throw new Error('Failed to create record')
      const created = (await res.json()) as StudyRecord
      
      const local = getLocalRecords()
      local.push(created)
      saveLocalRecords(local)
      return created
    } catch (err) {
      console.warn('API createRecord offline, saving locally:', err)
      const now = new Date().toISOString()
      const newRec: StudyRecord = {
        ...record,
        id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now
      }
      const local = getLocalRecords()
      local.push(newRec)
      saveLocalRecords(local)
      return newRec
    }
  },

  async updateRecord(id: string, updates: Partial<StudyRecord>): Promise<StudyRecord> {
    try {
      const res = await fetch(`${API_BASE}/records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      if (!res.ok) throw new Error('Failed to update record')
      const updated = (await res.json()) as StudyRecord

      const local = getLocalRecords()
      const idx = local.findIndex(r => r.id === id)
      if (idx !== -1) {
        local[idx] = updated
        saveLocalRecords(local)
      }
      return updated
    } catch (err) {
      console.warn('API updateRecord offline, updating locally:', err)
      const local = getLocalRecords()
      const idx = local.findIndex(r => r.id === id)
      if (idx !== -1) {
        local[idx] = { ...local[idx], ...updates, updatedAt: new Date().toISOString() }
        saveLocalRecords(local)
        return local[idx]
      }
      throw err
    }
  },

  async deleteRecord(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/records/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Failed to delete record')
    } catch (err) {
      console.warn('API deleteRecord offline, deleting locally:', err)
    }
    const local = getLocalRecords().filter(r => r.id !== id)
    saveLocalRecords(local)
    return true
  },

  // Export full bundle
  async exportData(): Promise<AppDataExport> {
    try {
      const res = await fetch(`${API_BASE}/export`)
      if (!res.ok) throw new Error('Failed to export from server')
      return await res.json()
    } catch {
      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        targets: getLocalTargets(),
        records: getLocalRecords()
      }
    }
  },

  // Import full bundle
  async importData(data: AppDataExport): Promise<{ success: boolean; recordsCount: number }> {
    saveLocalRecords(data.records)
    saveLocalTargets(data.targets)
    try {
      const res = await fetch(`${API_BASE}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!res.ok) throw new Error('Failed to import to server')
      return await res.json()
    } catch (err) {
      console.warn('API importData offline, imported locally only:', err)
      return {
        success: true,
        recordsCount: data.records.length
      }
    }
  }
}
