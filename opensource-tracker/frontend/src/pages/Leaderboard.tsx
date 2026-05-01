import { useQuery } from "@tanstack/react-query";

import { getLeaderboard } from "../api/queries";
import { LeaderboardTable } from "../components/LeaderboardTable";
import { dummyLeaderboard } from "../config/dummyData";

export function LeaderboardPage(): JSX.Element {
  const leaderboard = useQuery({ queryKey: ["leaderboard"], queryFn: getLeaderboard });
  return (
    <main className="page">
      <h2>Leaderboard</h2>
      {leaderboard.isLoading ? (
        <section className="card">
          <p className="muted">Loading leaderboard...</p>
          <div className="skeleton-row" />
        </section>
      ) : null}
      {leaderboard.isError ? <p className="alert alert-error">Leaderboard failed to load. Showing fallback values.</p> : null}
      {!leaderboard.isLoading && (leaderboard.data?.length ?? 0) === 0 ? (
        <p className="muted">No leaderboard entries yet.</p>
      ) : null}
      <LeaderboardTable rows={leaderboard.data ?? dummyLeaderboard} />
    </main>
  );
}
