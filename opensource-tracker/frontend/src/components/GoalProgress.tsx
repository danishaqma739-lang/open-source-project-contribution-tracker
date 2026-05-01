import type { Goal } from "../types";

export function GoalProgress({ goal }: { goal: Goal }): JSX.Element {
  const percentage = Math.min(100, Math.round((goal.current_progress / goal.monthly_pr_target) * 100));
  return (
    <section className="card">
      <h3>Goal Progress</h3>
      <p className="muted">
        {goal.current_progress}/{goal.monthly_pr_target} PRs
      </p>
      <progress value={percentage} max={100} style={{ width: "100%", height: 12 }} />
    </section>
  );
}
