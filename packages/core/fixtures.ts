import type { Fixture } from "./models.js";
import { baghdadDate } from "./names.js";
/** Keep cached results usable without presenting old fixtures as today's schedule. */
export function visibleFixtures(fixtures: Fixture[], now = Date.now()) {
  const priority = ["PD", "CL", "PL", "SA", "BL1", "FL1"];
  return fixtures
    .filter(
      (f) =>
        baghdadDate(Date.parse(f.kickoffUtc)) === baghdadDate(now) ||
        (f.favorite &&
          Date.parse(f.kickoffUtc) >= now &&
          Date.parse(f.kickoffUtc) < now + 7 * 86400000)
    )
    .sort(
      (a, b) =>
        Number(b.favorite) - Number(a.favorite) ||
        Number(b.status === "LIVE") - Number(a.status === "LIVE") ||
        priority.indexOf(a.competitionId) - priority.indexOf(b.competitionId) ||
        Date.parse(a.kickoffUtc) - Date.parse(b.kickoffUtc)
    );
}
