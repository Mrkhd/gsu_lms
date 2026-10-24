export const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function weekNumberFromTitle(title: string | null | undefined): number | null {
  if (!title) return null
  const match = title.match(/week\s*[-–—:.]?\s*(\d+)/i)
  if (!match) return null
  const value = Number(match[1])
  return Number.isFinite(value) && value > 0 ? value : null
}

export function weekReleaseDate(enrollmentStart: Date, week: number): Date {
  return new Date(enrollmentStart.getTime() + (week - 1) * WEEK_MS)
}

export type LockReason = "time" | "assignment" | null

export type AccessState = {
  locked: boolean
  reason: LockReason
  releaseAt: Date | null
  week: number | null
}

export type AssignmentLike = { id: string; title: string | null }

function previousWeekSubmitted(input: {
  week: number
  allAssignments: AssignmentLike[]
  submittedIds: Set<string>
}) {
  const previous = input.allAssignments.filter(
    (assignment) => weekNumberFromTitle(assignment.title) === input.week - 1
  )
  if (previous.length === 0) return true
  return previous.every((assignment) => input.submittedIds.has(assignment.id))
}

/** Availability of a section, driven by each student's own weekly progression. */
export function sectionAvailability(input: {
  week: number | null
  sectionAvailableAt: Date | null
  enrollmentStart: Date
  now: number
  allAssignments: AssignmentLike[]
  submittedIds: Set<string>
}): AccessState {
  if (input.week === null) {
    if (input.sectionAvailableAt && input.sectionAvailableAt.getTime() > input.now) {
      return { locked: true, reason: "time", releaseAt: input.sectionAvailableAt, week: null }
    }
    return { locked: false, reason: null, releaseAt: null, week: null }
  }

  const releaseAt = weekReleaseDate(input.enrollmentStart, input.week)
  if (releaseAt.getTime() > input.now) {
    return { locked: true, reason: "time", releaseAt, week: input.week }
  }
  if (
    input.week > 1 &&
    !previousWeekSubmitted({
      week: input.week,
      allAssignments: input.allAssignments,
      submittedIds: input.submittedIds,
    })
  ) {
    return { locked: true, reason: "assignment", releaseAt: null, week: input.week }
  }
  return { locked: false, reason: null, releaseAt, week: input.week }
}

/** Availability of an assignment, based on its week (from the title). */
export function assignmentAvailability(input: {
  assignment: AssignmentLike
  allAssignments: AssignmentLike[]
  submittedIds: Set<string>
  enrollmentStart: Date
  now: number
}): AccessState {
  const week = weekNumberFromTitle(input.assignment.title)
  if (week === null) return { locked: false, reason: null, releaseAt: null, week: null }

  const releaseAt = weekReleaseDate(input.enrollmentStart, week)
  if (releaseAt.getTime() > input.now) {
    return { locked: true, reason: "time", releaseAt, week }
  }
  if (
    week > 1 &&
    !previousWeekSubmitted({
      week,
      allAssignments: input.allAssignments,
      submittedIds: input.submittedIds,
    })
  ) {
    return { locked: true, reason: "assignment", releaseAt: null, week }
  }
  return { locked: false, reason: null, releaseAt, week }
}
