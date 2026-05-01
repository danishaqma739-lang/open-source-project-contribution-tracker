import { Navigate, Route, Routes } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getAuthMe } from "./api/queries";
import { Navbar } from "./components/Navbar";
import { ContributionsPage } from "./pages/Contributions";
import { DashboardPage } from "./pages/Dashboard";
import { GoalsPage } from "./pages/Goals";
import { LeaderboardPage } from "./pages/Leaderboard";
import { LoginPage } from "./pages/Login";

function ProtectedRoute({ children }: { children: JSX.Element }): JSX.Element {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["auth-me"],
    queryFn: getAuthMe,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <main style={{ padding: "1rem" }}>Checking session...</main>;
  if (isError || !data) return <Navigate to="/" replace />;
  return children;
}

export default function App(): JSX.Element {
  const { data, isLoading } = useQuery({
    queryKey: ["auth-me"],
    queryFn: getAuthMe,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  return (
    <>
      {data ? <Navbar /> : null}
      <Routes>
        <Route path="/" element={isLoading ? <main style={{ padding: "1rem" }}>Loading...</main> : data ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/contributions" element={<ProtectedRoute><ContributionsPage /></ProtectedRoute>} />
        <Route path="/goals" element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
