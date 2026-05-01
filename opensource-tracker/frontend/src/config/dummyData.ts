import type { Badge, GitHubProfile, Goal, LeaderboardEntry } from "../types";

export const dummyProfile: GitHubProfile = {
  login: "devmoh",
  name: "Moh Developer",
  avatar_url: "https://avatars.githubusercontent.com/u/583231?v=4",
  public_repos: 42,
  followers: 128,
};

export const dummyKpis = {
  totalPrsThisMonth: 18,
  mergedPrs: 12,
  openPrs: 6,
  commitsCount: 67,
};

export const dummyGoals: Goal[] = [
  { id: 1, user_id: 1, monthly_pr_target: 20, current_progress: 12 },
];

export const dummyBadges: Badge[] = [
  { id: 1, user_id: 1, badge_name: "First PR", description: "Opened first pull request." },
  { id: 2, user_id: 1, badge_name: "Goal Crusher", description: "Completed monthly goal." },
];

export const dummyContributions = Array.from({ length: 30 }).map((_, i) => ({
  date: `Day-${i + 1}`,
  pr_count: i % 4,
  commit_count: (i % 6) + 1,
}));

export const dummyPrTimeline = [
  { title: "Fix login callback bug", state: "merged" },
  { title: "Add leaderboard endpoint", state: "open" },
  { title: "Refactor heatmap component", state: "merged" },
];

export const dummyLeaderboard: LeaderboardEntry[] = [
  { rank: 1, username: "octocat", points: 120 },
  { rank: 2, username: "devmoh", points: 95 },
  { rank: 3, username: "contribqueen", points: 88 },
];
