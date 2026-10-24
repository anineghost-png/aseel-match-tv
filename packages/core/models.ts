export interface Fixture {
  id: string;
  provider: string;
  providerFixtureId: string;
  competitionId: string;
  competition: string;
  home: string;
  away: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffUtc: string;
  status: string;
  elapsed: number | null;
  scoreHome: number | null;
  scoreAway: number | null;
  lastUpdatedAt: string;
  favorite: boolean;
  delayed: boolean;
}
export interface Channel {
  id: string;
  providerId: string;
  tvgId: string;
  name: string;
  normalizedName: string;
  group: string;
  logo: string;
  enabled: boolean;
}
export interface Source {
  id: string;
  channelId: string;
  providerId: string;
  url: string;
  protocol: string;
  enabled: boolean;
  priorityOverride: number;
}
export interface Program {
  id: string;
  tvgId: string;
  title: string;
  description: string;
  startUtc: string;
  endUtc: string;
}
export interface Mapping {
  fixtureId: string;
  channelId: string;
  confidence: number;
  reasons: string[];
  status: "AUTO_CONFIRMED" | "MANUAL_CONFIRMED" | "NEEDS_REVIEW" | "REJECTED";
  updatedAt: string;
}
export interface Health {
  streamSourceId: string;
  timestamp: number;
  manifestOk: boolean;
  httpStatus: number;
  firstByteMs: number;
  segmentOkRatio: number;
  avgSegmentMbps: number;
  estimatedRequiredMbps: number;
  resolutionHeight: number;
  playlistAgeSec: number;
  codec: string;
  errors: string[];
}
