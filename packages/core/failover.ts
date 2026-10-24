/** Server selection after the client has exhausted one local recovery attempt. */
export function nextFallback(
  current: string,
  candidates: string[],
  failed: string[],
  cooldowns: Record<string, number>,
  now: number,
  lastSwitch: number
) {
  if (now - lastSwitch < 10000) return { action: "wait" as const };
  const source = candidates.find(
    (id) =>
      id !== current && !failed.includes(id) && (cooldowns[id] || 0) <= now
  );
  return source
    ? { action: "switch" as const, source }
    : { action: "stop" as const };
}
