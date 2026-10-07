/** Minimal className joiner — no external dependency */
export function cx(...parts) {
  return parts
    .flatMap((part) => {
      if (!part) return [];
      if (typeof part === "string") return part.split(" ").filter(Boolean);
      if (Array.isArray(part)) return part;
      if (typeof part === "object") {
        return Object.entries(part)
          .filter(([, on]) => Boolean(on))
          .map(([key]) => key);
      }
      return [];
    })
    .join(" ");
}
