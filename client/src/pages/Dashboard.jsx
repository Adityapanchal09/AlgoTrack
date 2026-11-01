import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { DIFFICULTIES, STATUSES, PATTERNS } from '../constants';

const DIFFICULTY_COLORS = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' };
const STATUS_COLORS = { Solved: '#22c55e', Attempted: '#94a3b8', Revisit: '#f59e0b' };

const cardStyle = {
  border: '1px solid #ccc',
  borderRadius: '8px',
  padding: '1rem',
  minWidth: '140px',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/stats')
      .then((res) => setStats(res.data))
      .catch(() => setError('Could not load stats'));
  }, []);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!stats) return <p>Loading...</p>;

  if (stats.total === 0) {
    return (
      <div>
        <h1>Welcome, {user.name}</h1>
        <p>
          You haven't added any problems yet. <Link to="/problems">Add your first one</Link> to
          see your stats here.
        </p>
      </div>
    );
  }

  const cards = [
    { label: 'Total problems', value: stats.total },
    { label: 'Solved', value: stats.byStatus.Solved || 0 },
    { label: 'To revisit', value: stats.byStatus.Revisit || 0 },
    { label: 'Day streak', value: stats.streak },
  ];

  const difficultyData = DIFFICULTIES.map((d) => ({
    name: d,
    count: stats.byDifficulty[d] || 0,
  }));

  const statusData = STATUSES.map((s) => ({
    name: s,
    value: stats.byStatus[s] || 0,
  })).filter((d) => d.value > 0);

  const patternData = stats.byPattern.map((p) => ({
    pattern: p.pattern,
    Solved: p.solved,
    Revisit: p.revisit,
    Attempted: p.total - p.solved - p.revisit,
  }));

  const weakAreas = PATTERNS.map((pattern) => {
    const row = stats.byPattern.find((p) => p.pattern === pattern);
    return {
      pattern,
      solved: row ? row.solved : 0,
      revisit: row ? row.revisit : 0,
    };
  })
    .sort((a, b) => a.solved - b.solved || b.revisit - a.revisit)
    .slice(0, 3);

  return (
    <div>
      <h1>Welcome, {user.name}</h1>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        {cards.map((c) => (
          <div key={c.label} style={cardStyle}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{c.value}</div>
            <div>{c.label}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h2>By difficulty</h2>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={difficultyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count">
                  {difficultyData.map((d) => (
                    <Cell key={d.name} fill={DIFFICULTY_COLORS[d.name]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <h2>By status</h2>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={90} label>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={STATUS_COLORS[d.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <h2>By pattern</h2>
      <div style={{ width: '100%', height: Math.max(200, patternData.length * 40) }}>
        <ResponsiveContainer>
          <BarChart data={patternData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="pattern" width={150} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Solved" stackId="a" fill={STATUS_COLORS.Solved} />
            <Bar dataKey="Revisit" stackId="a" fill={STATUS_COLORS.Revisit} />
            <Bar dataKey="Attempted" stackId="a" fill={STATUS_COLORS.Attempted} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2>Needs attention</h2>
      <ul>
        {weakAreas.map((w) => (
          <li key={w.pattern}>
            <strong>{w.pattern}</strong>: {w.solved} solved
            {w.revisit > 0 ? `, ${w.revisit} to revisit` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}