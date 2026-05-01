import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

async function handleLogout(): Promise<void> {
  try {
    await api.post("/auth/logout");
  } finally {
    window.location.href = "/";
  }
}

export function Navbar(): JSX.Element {
  const navigate = useNavigate();

  return (
    <nav className="nav">
      <strong className="nav-brand">OpenSource Tracker</strong>
      <button onClick={() => navigate("/dashboard")} className="nav-link">
        Dashboard
      </button>
      <button onClick={() => navigate("/contributions")} className="nav-link">
        Contributions
      </button>
      <button onClick={() => navigate("/goals")} className="nav-link">
        Goals
      </button>
      <button onClick={() => navigate("/leaderboard")} className="nav-link">
        Leaderboard
      </button>
      <button onClick={handleLogout} className="btn btn-secondary" style={{ marginLeft: "auto" }}>
        Logout
      </button>
    </nav>
  );
}
