import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';


export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem',
        borderBottom: '1px solid #ccc',
      }}
    >
      <strong>AlgoTrack</strong>
      <Link to="/">Dashboard</Link>
      <Link to="/problems">Problems</Link>
      <Link to="/explainer">Explainer</Link>

      <span style={{ marginLeft: 'auto' }}>{user.name}</span>
      <button onClick={logout}>Log out</button>
    </nav>
  );
}