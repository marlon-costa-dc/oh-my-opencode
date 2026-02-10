import { describe, expect, it } from "bun:test"
import { formatContextWindowLimitLabel } from "./format-context-limit"

describe("formatContextWindowLimitLabel", () => {
  it("formats thousands as k", () => {
    expect(formatContextWindowLimitLabel(1_000)).toBe("1k")
    expect(formatContextWindowLimitLabel(200_000)).toBe("200k")
    expect(formatContextWindowLimitLabel(1_000_000)).toBe("1000k")
  })

  it("formats non-thousands with commas", () => {
    expect(formatContextWindowLimitLabel(1_500)).toBe("1,500")
    expect(formatContextWindowLimitLabel(123_456)).toBe("123,456")
  })
})
