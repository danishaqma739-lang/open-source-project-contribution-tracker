import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

export function LoginPage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const loginUrl = `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}/auth/github/login`;
  const oauthError = searchParams.get("oauth_error");
  const oauthMessage = useMemo(() => {
    if (!oauthError) return "";
    if (oauthError === "missing_code") return "GitHub did not return an authorization code. Please try again.";
    if (oauthError === "token_missing") return "GitHub token was not returned. Please re-authorize the app.";
    if (oauthError === "github_auth_failed") return "GitHub authentication failed. Please retry in a moment.";
    return "Authentication could not be completed. Please try again.";
  }, [oauthError]);

  return (
    <main className="page">
      <section className="card" style={{ maxWidth: 720, margin: "2rem auto" }}>
      <h1>Open Source Contribution Tracker</h1>
      <p className="muted">Sign in with GitHub to track PRs, commits, streaks, goals, and badges.</p>
      {oauthMessage ? <p className="alert alert-error">{oauthMessage}</p> : null}
      <a href={loginUrl} className="btn" style={{ display: "inline-block", textDecoration: "none", marginTop: 8 }}>
        Continue with GitHub
      </a>
      </section>
    </main>
  );
}
