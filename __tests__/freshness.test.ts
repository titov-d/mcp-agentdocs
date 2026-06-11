import { describe, it, expect } from "vitest";
import { daysBetween, isStale, classifyDrift } from "../scripts/freshness.js";
import { toMarkdownUrl, normalizeSource } from "../scripts/source.js";

describe("daysBetween", () => {
  it("counts whole UTC days", () => {
    expect(daysBetween("2026-06-01", "2026-06-11")).toBe(10);
    expect(daysBetween("2026-06-11", "2026-06-11")).toBe(0);
  });
  it("crosses month boundaries", () => {
    expect(daysBetween("2026-05-22", "2026-06-11")).toBe(20);
  });
});

describe("isStale", () => {
  it("is false at and below the ceiling", () => {
    expect(isStale("2026-05-12", "2026-06-11", 30)).toBe(false); // exactly 30d
    expect(isStale("2026-06-11", "2026-06-11", 30)).toBe(false);
  });
  it("is true past the ceiling", () => {
    expect(isStale("2026-05-11", "2026-06-11", 30)).toBe(true); // 31d
  });
});

describe("classifyDrift", () => {
  it("flags a missing snapshot as unseeded", () => {
    expect(classifyDrift(null, "anything")).toBe("unseeded");
  });
  it("reports ok when snapshot equals current", () => {
    expect(classifyDrift("same text", "same text")).toBe("ok");
  });
  it("reports drift when they differ", () => {
    expect(classifyDrift("old text", "new text")).toBe("drift");
  });
});

describe("toMarkdownUrl", () => {
  it("appends .md for known doc hosts", () => {
    expect(toMarkdownUrl("https://modelcontextprotocol.io/specification/x")).toBe(
      "https://modelcontextprotocol.io/specification/x.md",
    );
    expect(toMarkdownUrl("https://platform.claude.com/docs/en/y")).toBe(
      "https://platform.claude.com/docs/en/y.md",
    );
  });
  it("leaves already-.md and unknown hosts untouched", () => {
    expect(toMarkdownUrl("https://modelcontextprotocol.io/x.md")).toBe(
      "https://modelcontextprotocol.io/x.md",
    );
    expect(toMarkdownUrl("https://example.com/x")).toBe("https://example.com/x");
  });
});

describe("normalizeSource", () => {
  it("strips a leading docs-index blockquote banner", () => {
    const raw =
      "> ## Documentation Index\n> Fetch the complete index at: https://x/llms.txt\n\n# Real Title\n\nBody.";
    expect(normalizeSource(raw)).toBe("# Real Title\n\nBody.");
  });
  it("normalizes CRLF and collapses blank lines", () => {
    expect(normalizeSource("a\r\n\r\n\r\n\r\nb\n")).toBe("a\n\nb");
  });
  it("is idempotent", () => {
    const raw = "> banner\n\n# T\n\n\n\nbody";
    expect(normalizeSource(normalizeSource(raw))).toBe(normalizeSource(raw));
  });
});
