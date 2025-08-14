export function stripLeadTags(s?: string) {
  if (!s) return "";

  // Remove leading analysis/final markers with optional punctuation or spacing
  const text = s.replace(
    /^\s*(\*{0,2})?(analysis|final)(\*{0,2})?[\s:—-]*/i,
    "",
  );

  // If a "final" tag remains later in the string, strip everything before it
  const lower = text.toLowerCase();
  const idx = lower.lastIndexOf("final");
  if (idx !== -1 && (idx === 0 || /\W/.test(lower[idx - 1]))) {
    const after = text.slice(idx + "final".length);
    return after.replace(/^[\s:—-]*/, "");
  }

  return text;
}
