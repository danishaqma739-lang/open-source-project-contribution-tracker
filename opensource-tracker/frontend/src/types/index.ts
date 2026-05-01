export interface GitHubProfile {
  login: string;
  avatar_url: string;
  name?: string;
  public_repos?: number;
  followers?: number;
}

export interface Goal {
  id: number;
  user_id: number;
  monthly_pr_target: number;
  current_progress: number;
}

export interface Badge {
  id: number;
  user_id: number;
  badge_name: string;
  description: string;
}

export interface LeaderboardEntry {
  rank: number;
  username: string;
  points: number;
}
