import { z } from "zod";
import { arabic, canonical, competitions, baghdadDate } from "../core/names.js";
import type { Fixture } from "../core/models.js";
export interface SportsProvider {
  name: string;
  fixtures(date: string): Promise<Fixture[]>;
  standings(competition: string): Promise<unknown>;
}
export type JsonFetch = (
  url: string,
  headers: Record<string, string>
) => Promise<any>;
const defaultFetch: JsonFetch = async (url, headers) => {
  const r = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(10000),
    redirect: "error"
  });
  if (!r.ok) throw Error("PROVIDER_HTTP_" + r.status);
  const t = await r.text();
  if (t.length > 4e6) throw Error("PROVIDER_SIZE");
  return JSON.parse(t);
};
const base = (
  m: any,
  provider: string,
  code: string,
  home: string,
  away: string,
  kickoff: string,
  status: string,
  sh: number | null,
  sa: number | null
): Fixture => ({
  id: provider + "-" + m.id,
  provider,
  providerFixtureId: String(m.id),
  competitionId: code,
  competition: competitions[code] || code,
  home: arabic(home),
  away: arabic(away),
  homeTeamId: canonical(home),
  awayTeamId: canonical(away),
  kickoffUtc: new Date(kickoff).toISOString(),
  status,
  elapsed: m.minute ?? null,
  scoreHome: sh,
  scoreAway: sa,
  lastUpdatedAt: new Date().toISOString(),
  favorite: canonical(home) === "barcelona" || canonical(away) === "barcelona",
  delayed: provider === "football-data"
});
export class FootballData implements SportsProvider {
  name = "football-data";
  constructor(
    private key: string,
    private get: JsonFetch = defaultFetch
  ) {}
  async fixtures(date: string) {
    const data = await this.get(
      "https://api.football-data.org/v4/matches?dateFrom=" +
        new Date(new Date(date).getTime() - 86400000)
          .toISOString()
          .slice(0, 10) +
        "&dateTo=" +
        baghdadDate(new Date(date).getTime() + 86400000),
      { "X-Auth-Token": this.key }
    );
    const rows = z
      .array(
        z
          .object({
            id: z.number(),
            utcDate: z.string().datetime(),
            status: z.string(),
            competition: z.object({ code: z.string() }),
            homeTeam: z.object({ name: z.string() }),
            awayTeam: z.object({ name: z.string() }),
            score: z.object({
              fullTime: z.object({
                home: z.number().nullable(),
                away: z.number().nullable()
              })
            })
          })
          .passthrough()
      )
      .parse(data.matches);
    return rows
      .filter(
        (m) =>
          competitions[m.competition.code] &&
          baghdadDate(Date.parse(m.utcDate)) === date
      )
      .map((m) =>
        base(
          m,
          this.name,
          m.competition.code,
          m.homeTeam.name,
          m.awayTeam.name,
          m.utcDate,
          ["IN_PLAY", "PAUSED"].includes(m.status) ? "LIVE" : m.status,
          m.score.fullTime.home,
          m.score.fullTime.away
        )
      );
  }
  async standings(code: string) {
    if (!competitions[code]) throw Error("COMPETITION");
    return this.get(
      "https://api.football-data.org/v4/competitions/" + code + "/standings",
      { "X-Auth-Token": this.key }
    );
  }
}
export class ApiFootball implements SportsProvider {
  name = "api-football";
  constructor(
    private key: string,
    private get: JsonFetch = defaultFetch
  ) {}
  async fixtures(date: string) {
    const data = await this.get(
      "https://v3.football.api-sports.io/fixtures?date=" +
        date +
        "&timezone=Asia%2FBaghdad",
      { "x-apisports-key": this.key }
    );
    if (!data.response || Object.keys(data.errors || {}).length)
      throw Error("PROVIDER_RESPONSE");
    const ids: Record<number, string> = {
      140: "PD",
      2: "CL",
      39: "PL",
      135: "SA",
      78: "BL1",
      61: "FL1"
    };
    return data.response
      .filter((m: any) => ids[m.league.id])
      .map((m: any) =>
        base(
          { id: m.fixture.id, minute: m.fixture.status.elapsed },
          this.name,
          ids[m.league.id],
          m.teams.home.name,
          m.teams.away.name,
          m.fixture.date,
          ["1H", "2H", "HT", "ET", "P", "LIVE"].includes(m.fixture.status.short)
            ? "LIVE"
            : m.fixture.status.short,
          m.goals.home,
          m.goals.away
        )
      );
  }
  async standings(code: string) {
    const ids: Record<string, number> = {
      PD: 140,
      CL: 2,
      PL: 39,
      SA: 135,
      BL1: 78,
      FL1: 61
    };
    if (!ids[code]) throw Error("COMPETITION");
    const now = new Date(),
      season =
        now.getUTCMonth() < 6 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
    return this.get(
      `https://v3.football.api-sports.io/standings?league=${ids[code]}&season=${season}`,
      { "x-apisports-key": this.key }
    );
  }
}
export function demoFixtures(now = Date.now()): Fixture[] {
  const slate = [
    { id: 1, home: "Barcelona", away: "Real Madrid", code: "PD", status: "LIVE", h: 2, a: 1, offset: 0 },
    { id: 2, home: "Atletico Madrid", away: "Sevilla", code: "PD", status: "SCHEDULED", h: null, a: null, offset: 1 },
    { id: 3, home: "Arsenal", away: "Inter", code: "CL", status: "SCHEDULED", h: null, a: null, offset: 2 },
    { id: 4, home: "Liverpool", away: "Manchester City", code: "PL", status: "SCHEDULED", h: null, a: null, offset: 3 },
    { id: 5, home: "Bayern Munich", away: "Borussia Dortmund", code: "BL1", status: "SCHEDULED", h: null, a: null, offset: 4 },
    { id: 6, home: "Juventus", away: "AC Milan", code: "SA", status: "SCHEDULED", h: null, a: null, offset: 5 },
    { id: 7, home: "Paris Saint-Germain", away: "Marseille", code: "FL1", status: "SCHEDULED", h: null, a: null, offset: 6 },
    { id: 8, home: "Barcelona", away: "Arsenal", code: "CL", status: "SCHEDULED", h: null, a: null, offset: 7 }
  ];
  return slate.map((m) => ({
    ...base(
      m,
      "demo",
      m.code,
      m.home,
      m.away,
      new Date(now + m.offset * 3600000).toISOString(),
      m.status,
      m.h,
      m.a
    ),
    delayed: false
  }));
}
