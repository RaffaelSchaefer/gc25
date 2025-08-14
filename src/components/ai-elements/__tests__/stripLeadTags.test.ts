import { describe, it, expect } from "vitest";
import { stripLeadTags } from "../strip-lead-tags";

describe("stripLeadTags", () => {
  it("removes leading analysis and returns remainder", () => {
    expect(stripLeadTags("analysis: hello"))
      .toBe("hello");
  });

  it("removes analysis and final markers in combined text", () => {
    const input = "analysisUser asks stuff finalWe answer";
    expect(stripLeadTags(input)).toBe("We answer");
  });

  it("handles simple final prefix without space", () => {
    expect(stripLeadTags("finalThanks"))
      .toBe("Thanks");
  });
});
