import { useEffect, useState } from 'react';
import api from '../api/axios';

const LANGUAGES = ['Auto-detect', 'JavaScript', 'Python', 'Java', 'C', 'C++'];

export default function Explainer() {
  const [language, setLanguage] = useState('Auto-detect');
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadHistory = () =>
    api
      .get('/snippets')
      .then((res) => setHistory(res.data))
      .catch(() => {});

  useEffect(() => {
    loadHistory();
  }, []);

  const handleExplain = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const { data } = await api.post('/snippets/explain', {
        code,
        language: language === 'Auto-detect' ? undefined : language,
      });
      setResult(data);
      loadHistory();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const openPast = async (id) => {
    try {
      const { data } = await api.get(`/snippets/${id}`);
      setCode(data.code);
      setResult(data);
      setError('');
    } catch {
      setError('Could not open that snippet');
    }
  };

  const exp = result?.explanation;

  return (
    <div>
      <h1>Code Snippet Explainer</h1>

      <form onSubmit={handleExplain}>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <textarea
          rows={12}
          style={{ width: '100%', fontFamily: 'monospace', display: 'block', margin: '0.5rem 0' }}
          placeholder="Paste your code here"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? 'Explaining...' : 'Explain code'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {exp && (
        <section>
          <h2>Explanation</h2>
          <p>{exp.summary}</p>

          <h3>Line by line</h3>
          <ul>
            {exp.lineByLine?.map((l, i) => (
              <li key={i}>
                <strong>Lines {l.lines}:</strong> {l.explanation}
              </li>
            ))}
          </ul>

          <h3>Complexity</h3>
          <p>
            Time: <strong>{exp.timeComplexity}</strong> | Space:{' '}
            <strong>{exp.spaceComplexity}</strong>
          </p>
          <p>{exp.complexityReason}</p>

          {exp.improvements?.length > 0 && (
            <>
              <h3>Possible improvements</h3>
              <ul>
                {exp.improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}

      <h2>Recent snippets</h2>
      {history.length === 0 ? (
        <p>Nothing yet.</p>
      ) : (
        <ul>
          {history.map((h) => (
            <li key={h._id}>
              <button onClick={() => openPast(h._id)}>
                {h.language}: {h.code.slice(0, 40).replace(/\n/g, ' ')}...
              </button>{' '}
              {new Date(h.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}