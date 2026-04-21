/**
 * Silence Node's DEP0040 punycode deprecation warning emitted by a
 * transitive dependency of `@anthropic-ai/sdk`. This is a side-effect
 * module — imported *first* in `index.ts` so it runs before any other
 * module body in the ES-module graph.
 */
// Node ≥25 makes `process.noDeprecation` read-only once the flag was set
// externally (e.g. via NODE_OPTIONS=--no-deprecation), so swallow the
// TypeError — the flag is already the value we want.
try {
  process.noDeprecation = true;
} catch {
  /* already read-only: fine */
}

const originalEmitWarning = process.emitWarning.bind(process);
process.emitWarning = ((warning: string | Error, ...rest: unknown[]) => {
  const message = typeof warning === "string" ? warning : warning?.message;
  if (message && /punycode/i.test(message)) return;
  return (originalEmitWarning as (...args: unknown[]) => void)(warning, ...rest);
}) as typeof process.emitWarning;
