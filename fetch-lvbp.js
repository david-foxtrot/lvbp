// Fetch LVBP data.
// No API key. No dependencies. Node 18+ (uses the built-in fetch).
//
// The LVBP is league 135 inside sport 17 (Winter Leagues).
// Season 2026 runs from 2026-10-12 to 2026-12-27, playoffs to 2027-01-31.
//
// Usage:
//   node fetch-lvbp.js teams
//   node fetch-lvbp.js standings
//   node fetch-lvbp.js today
//   node fetch-lvbp.js schedule 2026-11-23
//   node fetch-lvbp.js live 869967

const BASE = "https://statsapi.mlb.com/api/v1";
const LEAGUE_ID = 135;
const SPORT_ID = 17;
const SEASON = 2026;

async function fetchJson(path, params = {}) {
  const url = new URL(path.replace(/^\//, ""), `${BASE}/`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  const response = await fetch(url, {
    signal: AbortSignal.timeout(8000),
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText} (${url})`);
  }
  return response.json();
}

function teamSummary(team) {
  return {
    id: team.id,
    name: team.name,
    abbreviation: team.abbreviation,
    location: team.locationName,
    teamName: team.teamName,
  };
}

function gameSummary(game) {
  return {
    gamePk: game.gamePk,
    date: game.gameDate,
    status: game.status?.detailedState ?? game.status?.abstractGameState ?? null,
    venue: game.venue?.name ?? null,
    away: {
      ...teamSummary(game.teams.away.team),
      score: game.teams.away.score,
      wins: game.teams.away.leagueRecord?.wins ?? null,
      losses: game.teams.away.leagueRecord?.losses ?? null,
    },
    home: {
      ...teamSummary(game.teams.home.team),
      score: game.teams.home.score,
      wins: game.teams.home.leagueRecord?.wins ?? null,
      losses: game.teams.home.leagueRecord?.losses ?? null,
    },
  };
}

export async function getLeague() {
  const data = await fetchJson(`/leagues/${LEAGUE_ID}`);
  return data.leagues[0];
}

export async function getTeams() {
  const data = await fetchJson("/teams", {
    sportId: SPORT_ID,
    leagueIds: LEAGUE_ID,
    season: SEASON,
  });
  return data.teams.map(teamSummary).sort((a, b) => a.name.localeCompare(b.name));
}

export async function getStandings() {
  const data = await fetchJson("/standings", {
    leagueId: LEAGUE_ID,
    season: SEASON,
  });
  const record = data.records?.[0];
  if (!record) return { lastUpdated: null, rows: [] };
  return {
    lastUpdated: record.lastUpdated ?? null,
    rows: record.teamRecords.map((row, index) => ({
      rank: Number(row.leagueRank ?? index + 1),
      team: row.team.name,
      teamId: row.team.id,
      wins: row.leagueRecord.wins,
      losses: row.leagueRecord.losses,
      pct: row.leagueRecord.pct,
      gamesBack: row.gamesBack,
      streak: row.streak?.streakCode ?? null,
      gamesPlayed: row.gamesPlayed,
    })),
  };
}

export async function getSchedule(date) {
  const data = await fetchJson("/schedule", {
    sportId: SPORT_ID,
    leagueId: LEAGUE_ID,
    date,
    hydrate: "linescore,team",
  });
  return (data.dates ?? []).flatMap((day) => day.games.map(gameSummary));
}

export async function getLinescore(gamePk) {
  const data = await fetchJson(`/game/${gamePk}/linescore`);
  return {
    gamePk: Number(gamePk),
    inning: data.currentInning ?? null,
    inningOrdinal: data.currentInningOrdinal ?? null,
    inningState: data.inningState ?? null,
    balls: data.balls ?? null,
    strikes: data.strikes ?? null,
    outs: data.outs ?? null,
    away: {
      runs: data.teams?.away?.runs ?? null,
      hits: data.teams?.away?.hits ?? null,
      errors: data.teams?.away?.errors ?? null,
    },
    home: {
      runs: data.teams?.home?.runs ?? null,
      hits: data.teams?.home?.hits ?? null,
      errors: data.teams?.home?.errors ?? null,
    },
  };
}

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const [command, arg] = process.argv.slice(2);

  const commands = {
    teams: getTeams,
    standings: getStandings,
    league: getLeague,
    today: () => getSchedule(todayDate()),
    schedule: () => getSchedule(arg),
    live: () => getLinescore(arg),
  };

  if (!command || !commands[command]) {
    console.log("Usage:");
    console.log("  node fetch-lvbp.js teams");
    console.log("  node fetch-lvbp.js standings");
    console.log("  node fetch-lvbp.js today");
    console.log("  node fetch-lvbp.js schedule 2026-11-23");
    console.log("  node fetch-lvbp.js live 869967");
    process.exit(1);
  }

  if ((command === "schedule" || command === "live") && !arg) {
    throw new Error(`Missing argument: node fetch-lvbp.js ${command} <value>`);
  }

  const result = await commands[command]();
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
