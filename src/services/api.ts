import { StudyRecord, WeeklyTarget, AppDataExport } from '../types'
import { DEFAULT_TARGETS, DEFAULT_TOTAL_HOURS_TARGET, DEFAULT_RECORDS } from '../../worker/r2'
import { authHeaders, reportUnauthorized } from './auth'

const API_BASE = '/api'
const LOCAL_STORAGE_RECORDS = 'study_tracker_records_v1'
const LOCAL_STORAGE_TARGETS = 'study_tracker_targets_v1'
const LOCAL_STORAGE_SETTINGS = 'study_tracker_settings_v1'

// Wraps fetch with the access token and flags the app to show the login screen on 401
async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(input, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers || {}) }
  })
  if (res.status === 401) {
    reportUnauthorized()
  }
  return res
}

// Helper for local storage backup/fallback
function getLocalRecords(): StudyRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_RECORDS)
    if (raw) {
      return JSON.parse(raw)
    }
    saveLocalRecords(DEFAULT_RECORDS)
    return DEFAULT_RECORDS
  } catch {
    return DEFAULT_RECORDS
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

function getLocalSettings(): { totalHoursTarget: number } {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS)
    return raw ? JSON.parse(raw) : { totalHoursTarget: DEFAULT_TOTAL_HOURS_TARGET }
  } catch {
    return { totalHoursTarget: DEFAULT_TOTAL_HOURS_TARGET }
  }
}

function saveLocalSettings(settings: { totalHoursTarget: number }) {
  try {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings to localStorage', e)
  }
}

export const api = {
  // Check health and storage backend
  async checkHealth(): Promise<{ status: string; storage: string; r2Bound: boolean }> {
    try {
      const res = await apiFetch(`${API_BASE}/health`)
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

  // Settings
  async getSettings(): Promise<{ totalHoursTarget: number }> {
    try {
      const res = await apiFetch(`${API_BASE}/settings`)
      if (!res.ok) throw new Error('Failed to fetch settings')
      const settings = (await res.json()) as { totalHoursTarget: number }
      saveLocalSettings(settings)
      return settings
    } catch (err) {
      console.warn('API settings offline, using local storage:', err)
      return getLocalSettings()
    }
  },

  async updateSettings(settings: { totalHoursTarget: number }): Promise<{ totalHoursTarget: number }> {
    saveLocalSettings(settings)
    try {
      const res = await apiFetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })
      if (!res.ok) throw new Error('Failed to update settings')
    } catch (err) {
      console.warn('API updateSettings offline, saved locally:', err)
    }
    return settings
  },

  // Targets
  async getTargets(): Promise<WeeklyTarget[]> {
    try {
      const res = await apiFetch(`${API_BASE}/targets`)
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
      const res = await apiFetch(`${API_BASE}/targets`, {
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
      const res = await apiFetch(url)
      if (!res.ok) throw new Error('Failed to fetch records')
      const records = (await res.json()) as StudyRecord[]
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
      const res = await apiFetch(`${API_BASE}/records`, {
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
      const res = await apiFetch(`${API_BASE}/records/${id}`, {
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
      const res = await apiFetch(`${API_BASE}/records/${id}`, {
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
      const res = await apiFetch(`${API_BASE}/export`)
      if (!res.ok) throw new Error('Failed to export from server')
      return await res.json()
    } catch {
      const settings = getLocalSettings()
      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        totalHoursTarget: settings.totalHoursTarget,
        targets: getLocalTargets(),
        records: getLocalRecords()
      }
    }
  },

  // Import full bundle
  async importData(data: AppDataExport): Promise<{ success: boolean; recordsCount: number }> {
    saveLocalRecords(data.records)
    saveLocalTargets(data.targets)
    if (data.totalHoursTarget) {
      saveLocalSettings({ totalHoursTarget: data.totalHoursTarget })
    }
    try {
      const res = await apiFetch(`${API_BASE}/import`, {
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
