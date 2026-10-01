import { StudyRecord, WeeklyTarget, AppDataExport } from '../src/types'

export const DEFAULT_TARGETS: WeeklyTarget[] = [
  {
    id: 'target-aws',
    subject: 'aws',
    name: 'AWS Cloud',
    targetSessionsPerWeek: 2,
    targetHoursPerWeek: 2.0,
    minDurationMinutes: 60,
    color: '#FF9900',
    iconName: 'cloud'
  },
  {
    id: 'target-golang',
    subject: 'golang',
    name: 'Golang',
    targetSessionsPerWeek: 2,
    targetHoursPerWeek: 2.0,
    minDurationMinutes: 60,
    color: '#00ADD8',
    iconName: 'terminal'
  },
  {
    id: 'target-leetcode',
    subject: 'leetcode',
    name: 'LeetCode',
    targetSessionsPerWeek: 2,
    targetHoursPerWeek: 2.0,
    minDurationMinutes: 60,
    color: '#FEA015',
    iconName: 'code'
  }
]

export const DEFAULT_TOTAL_HOURS_TARGET = 6.0 // 6 hours / week

const RECORDS_KEY = 'data/records.json'
const TARGETS_KEY = 'data/targets.json'
const SETTINGS_KEY = 'data/settings.json'

export const DEFAULT_RECORDS: StudyRecord[] = [
  {
    id: 'demo-1',
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
    id: 'demo-2',
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
    id: 'demo-3',
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
    id: 'demo-4',
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
    id: 'demo-5',
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
    id: 'demo-6',
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
    id: 'demo-7',
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

// In-memory fallback if R2 is not configured yet (local mock)
let memoryRecords: StudyRecord[] = [...DEFAULT_RECORDS]
let memoryTargets: WeeklyTarget[] = [...DEFAULT_TARGETS]
let memorySettings: { totalHoursTarget: number } = { totalHoursTarget: DEFAULT_TOTAL_HOURS_TARGET }

export async function getRecordsFromR2(bucket?: R2Bucket): Promise<StudyRecord[]> {
  if (!bucket) {
    return memoryRecords
  }

  try {
    const object = await bucket.get(RECORDS_KEY)
    if (!object) {
      await bucket.put(RECORDS_KEY, JSON.stringify(DEFAULT_RECORDS, null, 2), {
        httpMetadata: { contentType: 'application/json' }
      })
      return DEFAULT_RECORDS
    }
    const text = await object.text()
    const parsed = JSON.parse(text) as StudyRecord[]
    if (!parsed || parsed.length === 0) {
      await bucket.put(RECORDS_KEY, JSON.stringify(DEFAULT_RECORDS, null, 2), {
        httpMetadata: { contentType: 'application/json' }
      })
      return DEFAULT_RECORDS
    }
    return parsed
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

export async function getSettingsFromR2(bucket?: R2Bucket): Promise<{ totalHoursTarget: number }> {
  if (!bucket) {
    return memorySettings
  }

  try {
    const object = await bucket.get(SETTINGS_KEY)
    if (!object) {
      const initial = { totalHoursTarget: DEFAULT_TOTAL_HOURS_TARGET }
      await bucket.put(SETTINGS_KEY, JSON.stringify(initial, null, 2), {
        httpMetadata: { contentType: 'application/json' }
      })
      return initial
    }
    const text = await object.text()
    return JSON.parse(text)
  } catch (err) {
    console.error('Error fetching settings from R2:', err)
    return memorySettings
  }
}

export async function saveSettingsToR2(settings: { totalHoursTarget: number }, bucket?: R2Bucket): Promise<void> {
  memorySettings = settings
  if (!bucket) return

  await bucket.put(SETTINGS_KEY, JSON.stringify(settings, null, 2), {
    httpMetadata: { contentType: 'application/json' }
  })
}

export async function exportAllData(bucket?: R2Bucket): Promise<AppDataExport> {
  const [records, targets, settings] = await Promise.all([
    getRecordsFromR2(bucket),
    getTargetsFromR2(bucket),
    getSettingsFromR2(bucket)
  ])

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalHoursTarget: settings.totalHoursTarget,
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
    saveTargetsToR2(data.targets, bucket),
    data.totalHoursTarget
      ? saveSettingsToR2({ totalHoursTarget: data.totalHoursTarget }, bucket)
      : Promise.resolve()
  ])

  // Also create a timestamped backup in R2 for safety
  if (bucket) {
    const backupKey = `backups/backup-${Date.now()}.json`
    await bucket.put(backupKey, JSON.stringify(data, null, 2), {
      httpMetadata: { contentType: 'application/json' }
    })
  }
}
