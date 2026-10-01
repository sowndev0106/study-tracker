import { Hono } from 'hono'
import { cors } from 'hono/cors'
import {
  getRecordsFromR2,
  saveRecordsToR2,
  getTargetsFromR2,
  saveTargetsToR2,
  exportAllData,
  importAllData
} from './r2'
import { StudyRecord, WeeklyTarget, AppDataExport } from '../src/types'

export type Env = {
  TRACKING_BUCKET?: R2Bucket
  ASSETS?: Fetcher
}

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', cors())

// API sub-router
const api = new Hono<{ Bindings: Env }>()

// Health & Status
api.get('/health', (c) => {
  const hasR2 = Boolean(c.env.TRACKING_BUCKET)
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    storage: hasR2 ? 'Cloudflare R2 Bucket' : 'In-Memory Fallback (Dev/No-R2)',
    r2Bound: hasR2
  })
})

// --- Targets API ---
api.get('/targets', async (c) => {
  const targets = await getTargetsFromR2(c.env.TRACKING_BUCKET)
  return c.json(targets)
})

api.put('/targets', async (c) => {
  const body = await c.req.json<WeeklyTarget[]>()
  if (!Array.isArray(body)) {
    return c.json({ error: 'Payload must be an array of targets' }, 400)
  }
  await saveTargetsToR2(body, c.env.TRACKING_BUCKET)
  return c.json({ success: true, targets: body })
})

// --- Records CRUD API ---
api.get('/records', async (c) => {
  const records = await getRecordsFromR2(c.env.TRACKING_BUCKET)
  const month = c.req.query('month') // e.g. "2026-10"
  const date = c.req.query('date') // e.g. "2026-10-01"
  const subject = c.req.query('subject')

  let filtered = [...records]

  if (month) {
    filtered = filtered.filter(r => r.date.startsWith(month))
  }
  if (date) {
    filtered = filtered.filter(r => r.date === date)
  }
  if (subject) {
    filtered = filtered.filter(r => r.subject.toLowerCase() === subject.toLowerCase())
  }

  // Sort descending by date, then createdAt
  filtered.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date)
    }
    return b.createdAt.localeCompare(a.createdAt)
  })

  return c.json(filtered)
})

api.post('/records', async (c) => {
  try {
    const data = await c.req.json<Partial<StudyRecord>>()
    if (!data.date || !data.subject || data.durationMinutes === undefined) {
      return c.json({ error: 'date, subject, and durationMinutes are required' }, 400)
    }

    const records = await getRecordsFromR2(c.env.TRACKING_BUCKET)
    const now = new Date().toISOString()

    const newRecord: StudyRecord = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: data.date,
      subject: data.subject,
      subjectName: data.subjectName || data.subject.toUpperCase(),
      durationMinutes: Number(data.durationMinutes) || 0,
      title: data.title || '',
      notes: data.notes || '',
      completed: data.completed !== undefined ? Boolean(data.completed) : true,
      createdAt: now,
      updatedAt: now
    }

    records.push(newRecord)
    await saveRecordsToR2(records, c.env.TRACKING_BUCKET)

    return c.json(newRecord, 201)
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to create record' }, 500)
  }
})

api.put('/records/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json<Partial<StudyRecord>>()
  const records = await getRecordsFromR2(c.env.TRACKING_BUCKET)

  const index = records.findIndex(r => r.id === id)
  if (index === -1) {
    return c.json({ error: 'Record not found' }, 404)
  }

  const existing = records[index]
  const updated: StudyRecord = {
    ...existing,
    ...body,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  }

  records[index] = updated
  await saveRecordsToR2(records, c.env.TRACKING_BUCKET)

  return c.json(updated)
})

api.delete('/records/:id', async (c) => {
  const id = c.req.param('id')
  const records = await getRecordsFromR2(c.env.TRACKING_BUCKET)

  const initialLength = records.length
  const filtered = records.filter(r => r.id !== id)

  if (filtered.length === initialLength) {
    return c.json({ error: 'Record not found' }, 404)
  }

  await saveRecordsToR2(filtered, c.env.TRACKING_BUCKET)
  return c.json({ success: true, id })
})

// --- Export & Import ---
api.get('/export', async (c) => {
  const data = await exportAllData(c.env.TRACKING_BUCKET)
  return c.json(data)
})

api.post('/import', async (c) => {
  try {
    const data = await c.req.json<AppDataExport>()
    await importAllData(data, c.env.TRACKING_BUCKET)
    return c.json({
      success: true,
      recordsCount: data.records.length,
      targetsCount: data.targets.length
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to import backup' }, 400)
  }
})

// Mount API router
app.route('/api', api)

// Asset fallback (SPA static frontend)
app.all('*', async (c) => {
  if (c.env.ASSETS) {
    return await c.env.ASSETS.fetch(c.req.raw)
  }
  return c.text('Cloudflare Tracking Calendar Worker is running. Connect ASSETS to serve frontend.', 200)
})

export default app
