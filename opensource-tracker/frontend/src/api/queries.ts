import { api } from "./client";
import type { Badge, GitHubProfile, Goal, LeaderboardEntry } from "../types";

export interface AuthUser {
  id: number;
  github_username: string;
  avatar_url?: string;
  email?: string;
}

export async function getAuthMe(): Promise<AuthUser> {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function getProfile(): Promise<GitHubProfile> {
  const { data } = await api.get("/github/profile");
  return data;
}

export async function getGoals(): Promise<Goal[]> {
  const { data } = await api.get("/goals");
  return data;
}

export interface GoalPayload {
  monthly_pr_target: number;
  current_progress: number;
}

export async function createGoal(payload: GoalPayload): Promise<Goal> {
  const { data } = await api.post("/goals", payload);
  return data;
}

export async function updateGoal(goalId: number, payload: GoalPayload): Promise<Goal> {
  const { data } = await api.put(`/goals/${goalId}`, payload);
  return data;
}

export async function getBadges(): Promise<Badge[]> {
  const { data } = await api.get("/badges");
  return data;
}

export async function calculateBadges(): Promise<Badge[]> {
  const { data } = await api.post("/badges/calculate");
  return data;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { data } = await api.get("/leaderboard");
  return data;
}

export interface PullRequestItem {
  id: number;
  title: string;
  state: "open" | "closed";
  created_at?: string;
  merged?: boolean;
}

export interface CommitsSummary {
  username: string;
  commit_count: number;
}

export interface ContributionPoint {
  date: string;
  pr_count: number;
  commit_count: number;
}

export async function getPullRequests(): Promise<PullRequestItem[]> {
  const { data } = await api.get("/github/pull-requests");
  return data;
}

export async function getCommitsSummary(): Promise<CommitsSummary> {
  const { data } = await api.get("/github/commits");
  return data;
}

export async function getContributions(): Promise<ContributionPoint[]> {
  const { data } = await api.get("/github/contributions");
  return data;
}
