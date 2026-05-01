import type { GitHubProfile } from "../types";

export function GitHubProfileCard({ profile }: { profile: GitHubProfile }): JSX.Element {
  return (
    <section className="card">
      <img src={profile.avatar_url} alt={profile.login} width={72} height={72} style={{ borderRadius: "50%" }} />
      <h3 style={{ marginBottom: 4 }}>{profile.name ?? profile.login}</h3>
      <p className="muted">@{profile.login}</p>
    </section>
  );
}
