import { useEffect, useState } from "react";
import { api, type LeaderboardEntry } from "../api/client";
import { useAuth } from "../context/AuthContext";

export function LeaderboardPage() {
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    api.leaderboard().then((data) => {
      setBoard(data);
      setLoading(false);
    });
    const interval = setInterval(() => api.leaderboard().then(setBoard), 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="page-loading">Loading leaderboard…</div>;

  return (
    <div className="leaderboard-page">
      <h2>Leaderboard</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Trader</th>
            <th>Net worth</th>
            <th>Return</th>
          </tr>
        </thead>
        <tbody>
          {board.map((entry, i) => (
            <tr key={entry.username} className={entry.username === user?.username ? "you" : ""}>
              <td>{i + 1}</td>
              <td>{entry.username}</td>
              <td>${entry.netWorth.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              <td className={entry.returnPct >= 0 ? "positive" : "negative"}>
                {entry.returnPct >= 0 ? "+" : ""}
                {entry.returnPct}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
