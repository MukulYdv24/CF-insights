import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
  Legend,
} from "recharts";
import {
  User,
  Trophy,
  TrendingUp,
  Code2,
  Search,
  AlertCircle,
  Star,
  Award,
  BarChart2,
  Activity,
  Loader2,
  ExternalLink,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api";

const RANK_COLORS = {
  newbie: "#808080",
  pupil: "#008000",
  specialist: "#03a89e",
  expert: "#0000ff",
  "candidate master": "#aa00aa",
  master: "#ff8c00",
  "international master": "#ff8c00",
  grandmaster: "#ff0000",
  "international grandmaster": "#ff0000",
  "legendary grandmaster": "#ff0000",
};

const getRankColor = (rank = "") =>
  RANK_COLORS[rank.toLowerCase()] ?? "#64748b";

const TAG_PALETTE = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316",
  "#eab308", "#22c55e", "#14b8a6", "#06b6d4", "#3b82f6",
];

// ─── Utility Components ───────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="flex items-center gap-3 bg-red-950/60 border border-red-700/50 text-red-300 rounded-xl px-5 py-4 my-6">
      <AlertCircle className="w-5 h-5 shrink-0" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color = "text-indigo-400" }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 flex items-start gap-4">
      <div className={`mt-0.5 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">
          {label}
        </p>
        <p className="text-2xl font-bold text-white truncate">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Custom Recharts Tooltip ──────────────────────────────────────────────────

function RatingTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 shadow-2xl text-xs max-w-xs">
      <p className="text-slate-300 font-semibold mb-1 truncate">{d.contestName}</p>
      <p className="text-slate-400">{d.date}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-indigo-400 font-bold text-lg">{d.newRating}</span>
        <span
          className={`font-semibold ${
            d.ratingChange >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {d.ratingChange >= 0 ? "+" : ""}
          {d.ratingChange}
        </span>
      </div>
      {d.rank && (
        <p className="text-slate-500 mt-1">Contest rank #{d.rank}</p>
      )}
    </div>
  );
}

// ─── Profile Card ─────────────────────────────────────────────────────────────

function ProfileCard({ profile, totalSolved, totalContests }) {
  const rankColor = getRankColor(profile.rank);
  const maxRankColor = getRankColor(profile.maxRank);

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
      {/* Avatar */}
      <div className="relative shrink-0">
        <img
          src={profile.avatar}
          alt={profile.handle}
          className="w-24 h-24 rounded-2xl object-cover border-2 border-slate-600"
          onError={(e) => {
            e.target.src = `https://ui-avatars.com/api/?name=${profile.handle}&background=1e293b&color=818cf8&size=96`;
          }}
        />
        <span
          className="absolute -bottom-2 -right-2 text-xs font-bold px-2 py-0.5 rounded-full border-2 border-slate-800"
          style={{ background: rankColor, color: "#fff" }}
        >
          ★
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 text-center sm:text-left">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
          <a
            href={`https://codeforces.com/profile/${profile.handle}`}
            target="_blank"
            rel="noreferrer"
            className="text-2xl font-bold text-white hover:text-indigo-300 transition-colors flex items-center gap-1.5 justify-center sm:justify-start"
          >
            {profile.handle}
            <ExternalLink className="w-4 h-4 opacity-50" />
          </a>
          <span
            className="text-sm font-semibold capitalize px-2 py-0.5 rounded-full self-center"
            style={{ color: rankColor, background: `${rankColor}22` }}
          >
            {profile.rank || "unrated"}
          </span>
        </div>

        {profile.country && (
          <p className="text-slate-400 text-sm mb-3">{profile.country}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/60 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-0.5">Rating</p>
            <p className="text-lg font-bold" style={{ color: rankColor }}>
              {profile.rating || "—"}
            </p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-0.5">Max Rating</p>
            <p className="text-lg font-bold" style={{ color: maxRankColor }}>
              {profile.maxRating || "—"}
            </p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-0.5">Solved</p>
            <p className="text-lg font-bold text-emerald-400">{totalSolved}</p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-0.5">Contests</p>
            <p className="text-lg font-bold text-sky-400">{totalContests}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Rating History Chart ─────────────────────────────────────────────────────

function RatingChart({ data }) {
  const displayData = data.length > 100 ? data.slice(-100) : data;

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-indigo-400" />
        <h2 className="text-base font-semibold text-white">Rating History</h2>
        <span className="ml-auto text-xs text-slate-500">
          {data.length} contests
        </span>
      </div>

      {data.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-12">
          No contest history found.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={displayData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <defs>
              <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#475569", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "#475569", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={40}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<RatingTooltip />} />
            <Line
              type="monotone"
              dataKey="newRating"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: "#6366f1", stroke: "#1e293b", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Tag Distribution (Radar) ─────────────────────────────────────────────────

function TagRadarChart({ data }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Activity className="w-5 h-5 text-violet-400" />
        <h2 className="text-base font-semibold text-white">Top Problem Tags</h2>
      </div>

      {data.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-12">
          No tag data available.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={data}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis
              dataKey="tag"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <PolarRadiusAxis
              tick={{ fill: "#475569", fontSize: 10 }}
              axisLine={false}
            />
            <Radar
              name="Solved"
              dataKey="count"
              stroke="#6366f1"
              fill="#6366f1"
              fillOpacity={0.35}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                fontSize: 12,
                color: "#e2e8f0",
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Problems by Rating Bucket ────────────────────────────────────────────────

function ProblemsByRatingChart({ data }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart2 className="w-5 h-5 text-emerald-400" />
        <h2 className="text-base font-semibold text-white">Problems by Rating</h2>
      </div>

      {data.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-12">
          No rating data available.
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="rating"
              tick={{ fill: "#475569", fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: "#1e293b" }}
            />
            <YAxis
              tick={{ fill: "#475569", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                background: "#0f172a",
                border: "1px solid #334155",
                borderRadius: 8,
                fontSize: 12,
                color: "#e2e8f0",
              }}
              cursor={{ fill: "#1e293b" }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={TAG_PALETTE[i % TAG_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

// ─── Tag Bar Chart ────────────────────────────────────────────────────────────

function TagBarChart({ data }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Code2 className="w-5 h-5 text-sky-400" />
        <h2 className="text-base font-semibold text-white">Tag Frequency</h2>
      </div>

      {data.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-12">No data.</p>
      ) : (
        <div className="space-y-3">
          {data.map((item, i) => {
            const max = data[0].count;
            const pct = Math.round((item.count / max) * 100);
            return (
              <div key={item.tag} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-32 truncate capitalize">
                  {item.tag}
                </span>
                <div className="flex-1 bg-slate-900/60 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      background: TAG_PALETTE[i % TAG_PALETTE.length],
                    }}
                  />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right">
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [handle, setHandle] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async (h) => {
    if (!h.trim()) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const res = await fetch(`${API_BASE}/user/${encodeURIComponent(h.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail ?? `HTTP ${res.status}`);
      }
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (handle.trim()) {
      setQuery(handle.trim());
      fetchDashboard(handle.trim());
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* ── Header ── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Code2 className="w-6 h-6 text-indigo-400 shrink-0" />
          <span className="font-bold text-white tracking-tight">CP Dashboard</span>
          <span className="text-slate-600 text-xs ml-1">Powered by Codeforces</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* ── Search ── */}
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="Enter Codeforces handle..."
              className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !handle.trim()}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {loading ? "Loading…" : "Search"}
          </button>
        </form>

        {/* ── States ── */}
        {loading && <Spinner />}
        {error && <ErrorBanner message={error} />}

        {/* ── Dashboard ── */}
        {data && !loading && (
          <>
            {/* Profile */}
            <ProfileCard
              profile={data.profile}
              totalSolved={data.totalSolved}
              totalContests={data.totalContests}
            />

            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                icon={Trophy}
                label="Best Rank"
                value={data.profile.maxRank || "—"}
                color="text-amber-400"
              />
              <StatCard
                icon={Star}
                label="Max Rating"
                value={data.profile.maxRating || "—"}
                color="text-yellow-400"
              />
              <StatCard
                icon={Award}
                label="Contribution"
                value={
                  data.profile.contribution >= 0
                    ? `+${data.profile.contribution}`
                    : data.profile.contribution
                }
                color="text-emerald-400"
              />
              <StatCard
                icon={User}
                label="Friends of"
                value={data.profile.friendOfCount}
                color="text-sky-400"
              />
            </div>

            {/* Rating history (full width) */}
            <RatingChart data={data.ratingHistory} />

            {/* Radar + bar charts side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TagRadarChart data={data.tagDistribution} />
              <TagBarChart data={data.tagDistribution} />
            </div>

            {/* Problems by rating */}
            <ProblemsByRatingChart data={data.problemsByRating} />
          </>
        )}

        {/* ── Empty state ── */}
        {!data && !loading && !error && (
          <div className="text-center py-24 text-slate-600">
            <Code2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">Enter a Codeforces handle to get started</p>
            <p className="text-sm mt-1 opacity-70">
              Try searching for <em>tourist</em>, <em>jiangly</em>, or <em>Petr</em>
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
