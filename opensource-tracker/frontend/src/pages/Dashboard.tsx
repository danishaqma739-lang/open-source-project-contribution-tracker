import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getBadges,
  calculateBadges,
  getCommitsSummary,
  getContributions,
  getGoals,
  getProfile,
  getPullRequests,
} from "../api/queries";
import { BadgeCard } from "../components/BadgeCard";
import { ContributionHeatmap } from "../components/ContributionHeatmap";
import { GitHubProfileCard } from "../components/GitHubProfileCard";
import { GoalProgress } from "../components/GoalProgress";
import { KpiCards } from "../components/KpiCards";
import { PRTimeline } from "../components/PRTimeline";
import {
  dummyBadges,
  dummyContributions,
  dummyGoals,
  dummyKpis,
  dummyPrTimeline,
  dummyProfile,
} from "../config/dummyData";

export function DashboardPage(): JSX.Element {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["profile"], queryFn: getProfile });
  const goals = useQuery({ queryKey: ["goals"], queryFn: getGoals });
  const badges = useQuery({ queryKey: ["badges"], queryFn: getBadges });
  const pullRequests = useQuery({ queryKey: ["pull-requests"], queryFn: getPullRequests });
  const commits = useQuery({ queryKey: ["commits-summary"], queryFn: getCommitsSummary });
  const contributions = useQuery({ queryKey: ["contributions"], queryFn: getContributions });

  const goal = goals.data && goals.data.length > 0 ? goals.data[0] : dummyGoals[0];
  const badgeList = badges.data && badges.data.length > 0 ? badges.data : dummyBadges;
  const prList = pullRequests.data && pullRequests.data.length > 0 ? pullRequests.data : dummyPrTimeline;
  const contributionData = contributions.data && contributions.data.length > 0 ? contributions.data : dummyContributions;

  const now = new Date();
  const monthPrs =
    pullRequests.data?.filter((pr) => {
      if (!pr.created_at) return true;
      const createdAt = new Date(pr.created_at);
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }) ?? [];

  const kpis = pullRequests.data
    ? {
        totalPrsThisMonth: monthPrs.length,
        mergedPrs: monthPrs.filter((pr) => pr.merged === true).length,
        openPrs: monthPrs.filter((pr) => pr.state === "open").length,
        commitsCount: commits.data?.commit_count ?? 0,
      }
    : dummyKpis;

  const calculateBadgesMutation = useMutation({
    mutationFn: calculateBadges,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badges"] });
    },
  });

  const isLoadingAny =
    profile.isLoading ||
    goals.isLoading ||
    badges.isLoading ||
    pullRequests.isLoading ||
    commits.isLoading ||
    contributions.isLoading;

  return (
    <main className="page">
      {isLoadingAny ? (
        <section className="card">
          <p className="muted">Loading dashboard data...</p>
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </section>
      ) : null}
      {profile.isError ? <p className="alert alert-error">Profile data failed to load. Showing fallback values.</p> : null}
      {pullRequests.isError ? <p className="alert alert-error">Pull request data failed to load. KPI metrics may be incomplete.</p> : null}
      {commits.isError ? <p className="alert alert-error">Commit summary failed to load. Commit count may be inaccurate.</p> : null}
      {goals.isError ? <p className="alert alert-error">Goals failed to load. Showing fallback goal progress.</p> : null}
      {badges.isError ? <p className="alert alert-error">Badges failed to load. Showing fallback badges.</p> : null}
      {contributions.isError ? <p className="alert alert-error">Contributions failed to load. Showing fallback heatmap.</p> : null}
      <GitHubProfileCard profile={profile.data ?? dummyProfile} />
      <KpiCards kpis={kpis} />
      <GoalProgress goal={goal} />
      <section style={{ display: "grid", gap: 8 }}>
        <button
          onClick={() => calculateBadgesMutation.mutate()}
          disabled={calculateBadgesMutation.isPending}
          className="btn"
          style={{ width: 220 }}
        >
          {calculateBadgesMutation.isPending ? "Calculating..." : "Calculate Badges"}
        </button>
        {calculateBadgesMutation.isError ? (
          <p style={{ color: "#b91c1c" }}>Badge calculation failed. Please try again.</p>
        ) : null}
        {!badges.isLoading && badgeList.length === 0 ? (
          <p className="muted">No badges yet. Reach your goal and click "Calculate Badges".</p>
        ) : null}
        {badgeList.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </section>
      <ContributionHeatmap data={contributionData} />
      <PRTimeline prs={prList.map((pr) => ({ title: pr.title, state: pr.state }))} />
    </main>
  );
}
