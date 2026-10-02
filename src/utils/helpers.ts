import { StudyRecord, WeeklyTarget, WeekProgressSummary } from '../types'
import {
  startOfWeek,
  endOfWeek,
  format,
  parseISO,
  isWithinInterval,
  getISOWeek
} from 'date-fns'
import confetti from 'canvas-confetti'

// Start week on Monday (weekStartsOn: 1)
export function getWeekBounds(date: Date = new Date()): { start: Date; end: Date; weekNumber: number } {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  const weekNumber = getISOWeek(date)
  return { start, end, weekNumber }
}

export function formatWeekRange(start: Date, end: Date): string {
  return `${format(start, 'dd/MM/yyyy')} - ${format(end, 'dd/MM/yyyy')}`
}

export function calculateWeekProgress(
  records: StudyRecord[],
  targets: WeeklyTarget[],
  referenceDate: Date = new Date(),
  totalHoursTarget?: number
): WeekProgressSummary {
  const { start, end, weekNumber } = getWeekBounds(referenceDate)
  const startStr = format(start, 'yyyy-MM-dd')
  const endStr = format(end, 'yyyy-MM-dd')

  const weekRecords = records.filter(r => {
    try {
      const rDate = parseISO(r.date)
      return isWithinInterval(rDate, { start, end })
    } catch {
      return false
    }
  })

  // Automatically count target subjects hours sum (e.g. 2 + 2 + 2 + 5 = 11h)
  const subjectsSum = Math.round(
    targets.reduce((acc, t) => acc + (Number(t.targetHoursPerWeek) || 0), 0) * 10
  ) / 10

  const resolvedTotalHoursTarget =
    subjectsSum > 0 ? subjectsSum : (totalHoursTarget && totalHoursTarget > 0 ? totalHoursTarget : 6.0)

  let totalMinutes = 0
  let totalSessions = 0

  const targetSummaries = targets.map(target => {
    // A session counts if subject matches and completed is true (or duration > 0)
    const matchingRecords = weekRecords.filter(
      r => r.subject.toLowerCase() === target.subject.toLowerCase() && r.completed
    )

    const subjectMinutes = matchingRecords.reduce((sum, r) => sum + (r.durationMinutes || 0), 0)
    const currentSessions = matchingRecords.length
    const actualHours = Math.round((subjectMinutes / 60) * 10) / 10
    const targetHours = target.targetHoursPerWeek || 2.0

    totalMinutes += subjectMinutes
    totalSessions += currentSessions

    const isSessionsCompleted = currentSessions >= target.targetSessionsPerWeek
    const isHoursCompleted = actualHours >= targetHours

    const pct = Math.min(100, Math.round((actualHours / (targetHours || 1)) * 100))

    return {
      target,
      currentSessions,
      targetSessions: target.targetSessionsPerWeek,
      totalMinutes: subjectMinutes,
      actualHours,
      targetHours,
      isSessionsCompleted,
      isHoursCompleted,
      isCompleted: isHoursCompleted,
      pct,
      records: matchingRecords
    }
  })

  const totalHours = Math.round((totalMinutes / 60) * 10) / 10
  const isTotalHoursCompleted = totalHours >= resolvedTotalHoursTarget

  return {
    weekStart: startStr,
    weekEnd: endStr,
    weekNumber,
    totalMinutes,
    totalHours,
    totalHoursTarget: resolvedTotalHoursTarget,
    isTotalHoursCompleted,
    totalSessions,
    targets: targetSummaries
  }
}

export function fireCelebration() {
  confetti({
    particleCount: 80,
    spread: 70,
    origin: { y: 0.6 }
  })
}

export function exportToCSV(records: StudyRecord[]): void {
  const headers = ['ID', 'Date', 'Time of Day', 'Start Time', 'Subject', 'Subject Name', 'Duration (Minutes)', 'Duration (Formatted)', 'Title / Topic', 'Notes', 'Completed', 'Created At']
  
  const rows = records.map(r => [
    r.id,
    r.date,
    r.timeOfDay || (new Date(r.createdAt).getHours() < 12 ? 'morning' : 'evening'),
    r.startTime || '',
    r.subject,
    `"${(r.subjectName || '').replace(/"/g, '""')}"`,
    r.durationMinutes,
    formatMinutes(r.durationMinutes),
    `"${(r.title || '').replace(/"/g, '""')}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`,
    r.completed ? 'Yes' : 'No',
    r.createdAt
  ])

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `study-tracking-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function exportToJSONFile(data: any, filename?: string): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || `study-tracking-backup-${format(new Date(), 'yyyy-MM-dd')}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  const rem = mins % 60
  return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`
}
