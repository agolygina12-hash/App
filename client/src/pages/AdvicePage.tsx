import { useEffect, useState } from "react";
import { api, type AdviceTip } from "../api/client";

const severityIcon: Record<AdviceTip["severity"], string> = {
  warning: "⚠️",
  positive: "✅",
  info: "💡",
};

export function AdvicePage() {
  const [tips, setTips] = useState<AdviceTip[] | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const res = await api.advice();
    setTips(res.tips);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="advice-page">
      <div className="advice-header">
        <h2>Advice</h2>
        <button className="btn-secondary" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      <p className="advice-disclaimer">
        These tips are generated automatically from your current portfolio to highlight common beginner
        patterns — concentration, big swings, idle cash. They're educational only, not real financial advice.
      </p>

      {loading && !tips ? (
        <div className="page-loading">Analyzing your portfolio…</div>
      ) : (
        <div className="advice-list">
          {tips?.map((tip) => (
            <div key={tip.id} className={`advice-card severity-${tip.severity}`}>
              <span className="advice-icon">{severityIcon[tip.severity]}</span>
              <div>
                <h3>{tip.title}</h3>
                <p>{tip.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
