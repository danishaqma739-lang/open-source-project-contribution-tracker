import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { createGoal, getGoals, updateGoal } from "../api/queries";
import { GoalProgress } from "../components/GoalProgress";
import { dummyGoals } from "../config/dummyData";

export function GoalsPage(): JSX.Element {
  const queryClient = useQueryClient();
  const goalsQuery = useQuery({ queryKey: ["goals"], queryFn: getGoals });
  const existingGoal = goalsQuery.data && goalsQuery.data.length > 0 ? goalsQuery.data[0] : null;

  const initialTarget = useMemo(() => (existingGoal ? existingGoal.monthly_pr_target : 20), [existingGoal]);
  const initialProgress = useMemo(() => (existingGoal ? existingGoal.current_progress : 0), [existingGoal]);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(initialTarget);
  const [currentProgress, setCurrentProgress] = useState<number>(initialProgress);
  const [submitError, setSubmitError] = useState<string>("");

  useEffect(() => {
    setMonthlyTarget(initialTarget);
    setCurrentProgress(initialProgress);
  }, [initialTarget, initialProgress]);

  const saveGoalMutation = useMutation({
    mutationFn: async () => {
      if (existingGoal) {
        return updateGoal(existingGoal.id, {
          monthly_pr_target: monthlyTarget,
          current_progress: currentProgress,
        });
      }
      return createGoal({
        monthly_pr_target: monthlyTarget,
        current_progress: currentProgress,
      });
    },
    onSuccess: () => {
      setSubmitError("");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    },
    onError: () => {
      setSubmitError("Could not save goal. Please try again.");
    },
  });

  const goalToShow = existingGoal ?? {
    ...dummyGoals[0],
    monthly_pr_target: monthlyTarget,
    current_progress: currentProgress,
  };

  const handleSave = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    if (monthlyTarget < 1 || currentProgress < 0) {
      setSubmitError("Please provide a valid target and progress.");
      return;
    }
    saveGoalMutation.mutate();
  };

  return (
    <main className="page">
      <h2>Goals</h2>
      {goalsQuery.isLoading ? (
        <section className="card">
          <p className="muted">Loading goal...</p>
          <div className="skeleton-row" />
        </section>
      ) : null}
      <form onSubmit={handleSave} className="card" style={{ display: "grid", gap: 12 }}>
        <label>
          Monthly PR Target
          <input
            type="number"
            min={1}
            value={monthlyTarget}
            onChange={(event) => setMonthlyTarget(Number(event.target.value))}
            className="input"
          />
        </label>
        <label>
          Current Progress
          <input
            type="number"
            min={0}
            value={currentProgress}
            onChange={(event) => setCurrentProgress(Number(event.target.value))}
            className="input"
          />
        </label>
        <button type="submit" disabled={saveGoalMutation.isPending} className="btn" style={{ width: 180 }}>
          {saveGoalMutation.isPending ? "Saving..." : existingGoal ? "Update Goal" : "Create Goal"}
        </button>
        {submitError ? <p style={{ color: "#b91c1c" }}>{submitError}</p> : null}
      </form>
      {!goalsQuery.isLoading && !existingGoal ? (
        <p className="muted">No saved goal yet. Create one to track your monthly progress.</p>
      ) : null}
      <GoalProgress goal={goalToShow} />
    </main>
  );
}
