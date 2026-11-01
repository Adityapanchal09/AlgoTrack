import { useEffect, useState } from 'react';
import api from '../api/axios';
import ProblemForm from '../components/ProblemForm';
import { DIFFICULTIES, STATUSES, PATTERNS } from '../constants';

export default function Problems() {
  const [problems, setProblems] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: '',
    status: '',
    pattern: '',
    search: '',
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;

    api
      .get('/problems', { params: filters })
      .then((res) => {
        if (!ignore) {
          setProblems(res.data);
          setError('');
        }
      })
      .catch(() => {
        if (!ignore) setError('Could not load problems');
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [filters, refreshKey]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/problems/${id}`, { status });
      setProblems((prev) => prev.map((p) => (p._id === id ? data : p)));
    } catch {
      setError('Could not update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this problem?')) return;

    try {
      await api.delete(`/problems/${id}`);
      setProblems((prev) => prev.filter((p) => p._id !== id));
    } catch {
      setError('Could not delete problem');
    }
  };

  return (
    <div>
      <h1>Problems</h1>

      <ProblemForm onSaved={() => setRefreshKey((k) => k + 1)} />

      <h2>Your problems</h2>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          name="search"
          placeholder="Search title"
          value={filters.search}
          onChange={handleFilterChange}
        />

        <select name="difficulty" value={filters.difficulty} onChange={handleFilterChange}>
          <option value="">All difficulties</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select name="pattern" value={filters.pattern} onChange={handleFilterChange}>
          <option value="">All patterns</option>
          {PATTERNS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : problems.length === 0 ? (
        <p>No problems found.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Difficulty</th>
              <th>Patterns</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {problems.map((p) => (
              <tr key={p._id}>
                <td>
                  {p.url ? (
                    <a href={p.url} target="_blank" rel="noreferrer">{p.title}</a>
                  ) : (
                    p.title
                  )}
                </td>
                <td>{p.difficulty}</td>
                <td>{p.patterns.join(', ')}</td>
                <td>
                  <select
                    value={p.status}
                    onChange={(e) => updateStatus(p._id, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>{new Date(p.dateSolved).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => handleDelete(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}