# LVBP

Fetch the Venezuelan Professional Baseball League. No API key. No dependencies. One file.

## Why this exists

The LVBP lives inside the MLB Stats API, but the league id, sport id, and endpoints are not obvious. This repo shows the exact calls, with clean output you can reuse in a site, a bot, or a script.

## Quick start

Requires Node 18 or later.

```bash
node fetch-lvbp.js teams
node fetch-lvbp.js standings
node fetch-lvbp.js today
node fetch-lvbp.js schedule 2026-11-23
node fetch-lvbp.js live 869967
```

No install step. No key. No config file.

## The key facts

| Item | Value |
| --- | --- |
| API base | `https://statsapi.mlb.com/api/v1` |
| League id | `135` |
| Sport id | `17` (Winter Leagues) |
| Season | `2026` |
| Regular season | 2026-10-12 to 2026-12-27 |
| Playoffs | 2026-12-29 to 2027-01-31 |
| Teams | 8 |

## Teams

| Id | Abbreviation |
| --- | --- |
| 692 | ZUL |
| 693 | LAR |
| 694 | ORI |
| 695 | CAR |
| 696 | MAG |
| 697 | MAR |
| 698 | LAG |
| 699 | ARA |

Team names, venues, and records always come from the API. Nothing is hard-coded except the league id, sport id, and season above.

## Endpoints

### League

```
GET /leagues/135
```

Returns the league, season dates, and number of teams.

### Teams

```
GET /teams?sportId=17&leagueIds=135&season=2026
```

### Standings

```
GET /standings?leagueId=135&season=2026
```

### Schedule for one day

```
GET /schedule?sportId=17&leagueId=135&date=2026-11-23&hydrate=linescore,team
```

Use `date` in `YYYY-MM-DD` format. The schedule alone does not carry the live score for a game in progress. For that, use the linescore endpoint below.

### Live score

```
GET /game/{gamePk}/linescore
```

Returns runs, hits, errors, current inning, balls, strikes, and outs. `gamePk` comes from the schedule response.

## Example output

### `node fetch-lvbp.js standings`

```json
{
  "lastUpdated": "2026-11-23T13:20:30.480Z",
  "rows": [
    {
      "rank": 1,
      "team": "Tigres",
      "teamId": 699,
      "wins": 21,
      "losses": 11,
      "pct": ".656",
      "gamesBack": "-",
      "streak": "W10",
      "gamesPlayed": 32
    }
  ]
}
```

### `node fetch-lvbp.js today`

```json
[
  {
    "gamePk": 869967,
    "date": "2026-11-23T23:00:00Z",
    "status": "Pre-Game",
    "venue": "Estadio Universitario",
    "away": {
      "id": 693,
      "name": "Cardenales de Lara",
      "abbreviation": "LAR",
      "score": 0,
      "wins": 16,
      "losses": 14
    },
    "home": {
      "id": 698,
      "name": "Tiburones de La Guaira",
      "abbreviation": "LAG",
      "score": 0,
      "wins": 14,
      "losses": 18
    }
  }
]
```

A full example is in [`examples/today.json`](examples/today.json).

## Use it in your own code

```js
import { getTeams, getStandings, getSchedule, getLinescore } from "./fetch-lvbp.js";

const teams = await getTeams();
const standings = await getStandings();
const today = await getSchedule("2026-11-23");
const live = await getLinescore(869967);
```

## Notes

- The MLB Stats API is public and undocumented. It is free and needs no key, but it has no published rate limit and no support guarantee. Cache results. Do not call it on every page view.
- Suggested cache times: live score 60 seconds, standings 5 minutes, schedule 1 hour, teams 1 hour.
- Dates from the API are in UTC. Convert them to the local time zone where you display them.

## License

MIT. See [`LICENSE`](LICENSE).
