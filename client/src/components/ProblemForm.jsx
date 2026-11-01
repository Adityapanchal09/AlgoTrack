import { useState } from 'react';
import api from '../api/axios';
import { DIFFICULTIES, STATUSES, PLATFORMS, PATTERNS } from '../constants';

const emptyForm = {
  title: '',
  platform: 'LeetCode',
  url: '',
  difficulty: 'Easy',
  status: 'Solved',
  notes: '',
};

export default function ProblemForm({ onSaved }) {
  const [form, setForm] = useState(emptyForm);
  const [patterns, setPatterns] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const togglePattern = (pattern) => {
    setPatterns((prev) =>
      prev.includes(pattern)
        ? prev.filter((p) => p !== pattern)
        : [...prev, pattern]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await api.post('/problems', { ...form, patterns });
      setForm(emptyForm);
      setPatterns([]);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save problem');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add a problem</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <input
        name="title"
        placeholder="Problem title"
        value={form.title}
        onChange={handleChange}
        required
      />

      <input
        name="url"
        placeholder="Problem link (optional)"
        value={form.url}
        onChange={handleChange}
      />

      <select name="platform" value={form.platform} onChange={handleChange}>
        {PLATFORMS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>

      <select name="difficulty" value={form.difficulty} onChange={handleChange}>
        {DIFFICULTIES.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      <select name="status" value={form.status} onChange={handleChange}>
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>

      <fieldset>
        <legend>Patterns</legend>
        {PATTERNS.map((pattern) => (
          <label key={pattern} style={{ marginRight: '1rem' }}>
            <input
              type="checkbox"
              checked={patterns.includes(pattern)}
              onChange={() => togglePattern(pattern)}
            />
            {pattern}
          </label>
        ))}
      </fieldset>

      <textarea
        name="notes"
        placeholder="Notes: approach, complexity, what tripped you up"
        value={form.notes}
        onChange={handleChange}
      />

      <button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Add problem'}
      </button>
    </form>
  );
}