import type { LeaderboardEntry } from "../types";

export function LeaderboardTable({ rows }: { rows: LeaderboardEntry[] }): JSX.Element {
  return (
    <table className="card" style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", paddingBottom: 8 }}>Rank</th>
          <th style={{ textAlign: "left", paddingBottom: 8 }}>Username</th>
          <th style={{ textAlign: "left", paddingBottom: 8 }}>Points</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.username}>
            <td style={{ padding: "6px 0" }}>{row.rank}</td>
            <td style={{ padding: "6px 0" }}>{row.username}</td>
            <td style={{ padding: "6px 0" }}>{row.points}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
