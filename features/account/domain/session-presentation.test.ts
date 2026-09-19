import { describe, expect, it } from "vitest"
import { lastSeenLabel, signedInLabel } from "./session-presentation"

const NOW = new Date("2026-09-19T12:00:00.000Z")

function minutesBefore(minutes: number): string {
  return new Date(NOW.getTime() - minutes * 60_000).toISOString()
}

describe("lastSeenLabel", () => {
  it("names the current device instead of timing it", () => {
    expect(lastSeenLabel({ current: true, lastSeenAt: minutesBefore(400) }, NOW)).toBe(
      "Este dispositivo"
    )
  })

  it.each([0, 1, 4.9])(
    "reads %s minutes ago as 'ahora mismo', because the server only records every five",
    (minutes) => {
      expect(lastSeenLabel({ current: false, lastSeenAt: minutesBefore(minutes) }, NOW)).toBe(
        "Activa ahora mismo"
      )
    }
  )

  it("switches to a relative time once the throttle window has passed", () => {
    const label = lastSeenLabel({ current: false, lastSeenAt: minutesBefore(45) }, NOW)

    expect(label).toContain("Última actividad")
    expect(label).toContain("hace")
  })

  it("says so rather than rendering 'hace 56 años' for a malformed timestamp", () => {
    // What date-fns produces from an invalid date is worse than admitting we
    // do not know, and a bad row must not make the list look broken.
    expect(lastSeenLabel({ current: false, lastSeenAt: "not-a-date" }, NOW)).toBe(
      "Actividad desconocida"
    )
  })

  it("does not claim 'ahora mismo' for a clock skewed into the future", () => {
    const future = new Date(NOW.getTime() + 60 * 60_000).toISOString()

    // Negative minutesAgo is below the five-minute threshold, so this lands on
    // "ahora mismo" — which is the right answer for a session that reports a
    // time we cannot have observed yet.
    expect(lastSeenLabel({ current: false, lastSeenAt: future }, NOW)).toBe("Activa ahora mismo")
  })
})

describe("signedInLabel", () => {
  it("describes when the session started", () => {
    expect(signedInLabel(minutesBefore(60 * 24 * 3))).toContain("inició")
  })

  it("returns nothing it cannot stand behind", () => {
    expect(signedInLabel("")).toBeNull()
  })
})
