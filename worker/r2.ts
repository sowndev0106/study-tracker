import { StudyRecord, WeeklyTarget, AppDataExport } from '../src/types'

export const DEFAULT_TARGETS: WeeklyTarget[] = [
  {
    id: 'target-aws',
    subject: 'aws',
    name: 'AWS Cloud',
    targetSessionsPerWeek: 2,
    minDurationMinutes: 45,
    color: '#FF9900',
    iconName: 'cloud'
  },
  {
    id: 'target-golang',
    subject: 'golang',
    name: 'Golang',
    targetSessionsPerWeek: 2,
    minDurationMinutes: 45,
    color: '#00ADD8',
    iconName: 'terminal'
  },
  {
    id: 'target-leetcode',
    subject: 'leetcode',
    name: 'LeetCode',
    targetSessionsPerWeek: 2,
    minDurationMinutes: 45,
    color: '#FEA015',
    iconName: 'code'
  }
]

const RECORDS_KEY = 'data/records.json'
const TARGETS_KEY = 'data/targets.json'

// In-memory fallback if R2 is not configured yet (local mock)
let memoryRecords: StudyRecord[] = []
let memoryTargets: WeeklyTarget[] = [...DEFAULT_TARGETS]

export async function getRecordsFromR2(bucket?: R2Bucket): Promise<StudyRecord[]> {
  if (!bucket) {
    return memoryRecords
  }

  try {
    const object = await bucket.get(RECORDS_KEY)
    if (!object) {
      // First time initialization: empty list
      await bucket.put(RECORDS_KEY, JSON.stringify([], null, 2), {
        httpMetadata: { contentType: 'application/json' }
      })
      return []
    }
    const text = await object.text()
    return JSON.parse(text) as StudyRecord[]
  } catch (err) {
    console.error('Error fetching records from R2:', err)
    return memoryRecords
  }
}

export async function saveRecordsToR2(records: StudyRecord[], bucket?: R2Bucket): Promise<void> {
  memoryRecords = records
  if (!bucket) return

  await bucket.put(RECORDS_KEY, JSON.stringify(records, null, 2), {
    httpMetadata: { contentType: 'application/json' }
  })
}

export async function getTargetsFromR2(bucket?: R2Bucket): Promise<WeeklyTarget[]> {
  if (!bucket) {
    return memoryTargets
  }

  try {
    const object = await bucket.get(TARGETS_KEY)
    if (!object) {
      // First time initialization: write default targets
      await bucket.put(TARGETS_KEY, JSON.stringify(DEFAULT_TARGETS, null, 2), {
        httpMetadata: { contentType: 'application/json' }
      })
      return DEFAULT_TARGETS
    }
    const text = await object.text()
    return JSON.parse(text) as WeeklyTarget[]
  } catch (err) {
    console.error('Error fetching targets from R2:', err)
    return memoryTargets
  }
}

export async function saveTargetsToR2(targets: WeeklyTarget[], bucket?: R2Bucket): Promise<void> {
  memoryTargets = targets
  if (!bucket) return

  await bucket.put(TARGETS_KEY, JSON.stringify(targets, null, 2), {
    httpMetadata: { contentType: 'application/json' }
  })
}

export async function exportAllData(bucket?: R2Bucket): Promise<AppDataExport> {
  const [records, targets] = await Promise.all([
    getRecordsFromR2(bucket),
    getTargetsFromR2(bucket)
  ])

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    targets,
    records
  }
}

export async function importAllData(data: AppDataExport, bucket?: R2Bucket): Promise<void> {
  if (!Array.isArray(data.records) || !Array.isArray(data.targets)) {
    throw new Error('Invalid backup format: records and targets arrays required')
  }

  await Promise.all([
    saveRecordsToR2(data.records, bucket),
    saveTargetsToR2(data.targets, bucket)
  ])

  // Also create a timestamped backup in R2 for safety
  if (bucket) {
    const backupKey = `backups/backup-${Date.now()}.json`
    await bucket.put(backupKey, JSON.stringify(data, null, 2), {
      httpMetadata: { contentType: 'application/json' }
    })
  }
}
