import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMarket } from "../context/MarketContext";

export function NavBar() {
  const { user, logout } = useAuth();
  const { connected } = useMarket();

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">📈</span> PaperTrade
      </div>
      <nav className="navbar-links">
        <NavLink to="/" end>
          Market
        </NavLink>
        <NavLink to="/portfolio">Portfolio</NavLink>
        <NavLink to="/leaderboard">Leaderboard</NavLink>
      </nav>
      <div className="navbar-status">
        <span className={`status-dot ${connected ? "live" : "offline"}`} />
        {connected ? "Live" : "Connecting…"}
      </div>
      <div className="navbar-user">
        <span>{user?.username}</span>
        <button className="btn-link" onClick={logout}>
          Log out
        </button>
      </div>
    </header>
  );
}
