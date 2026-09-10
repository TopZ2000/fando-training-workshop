export interface Progress {
  checks: Record<string, boolean>;
  notes: Record<string, string>;
  group: string;
}
export const emptyProgress = (): Progress => ({
  checks: {},
  notes: {},
  group: "",
});
/** 持久化数据属于不可信输入，只保留已定义的简单字段。 */
export function parseProgress(raw: string | null): Progress {
  if (!raw) return emptyProgress();
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("记录格式错误");
  const object = parsed as Record<string, unknown>;
  const checks: Record<string, boolean> = {};
  const notes: Record<string, string> = {};
  if (object.checks && typeof object.checks === "object")
    for (const [k, v] of Object.entries(object.checks))
      if (
        typeof v === "boolean" &&
        !["__proto__", "constructor", "prototype"].includes(k)
      )
        checks[k] = v;
  if (object.notes && typeof object.notes === "object")
    for (const [k, v] of Object.entries(object.notes))
      if (
        typeof v === "string" &&
        !["__proto__", "constructor", "prototype"].includes(k)
      )
        notes[k] = v.slice(0, 12000);
  return {
    checks,
    notes,
    group: typeof object.group === "string" ? object.group.slice(0, 80) : "",
  };
}
export function parseRoute(
  hash: string,
  courseIds: string[],
): { courseId: string; stage: number; step: number } {
  const parts = hash.replace(/^#\/?/, "").split("/");
  const integer = (value: string | undefined, max: number) => {
    const n = Number(value);
    return Number.isInteger(n) && n >= 0 && n <= max ? n : 0;
  };
  return {
    courseId: courseIds.includes(parts[0] || "") ? parts[0] || "" : "",
    stage: integer(parts[1], 4),
    step: integer(parts[2], 20),
  };
}
export function remainingSeconds(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
export function formatTimer(seconds: number): string {
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
