import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';

export default function HomePage() {
  const year = useMemo(() => new Date().getFullYear(), []);

  return (
    <div>
      <NavBar />
      <main style={{ padding: 24 }}>
        <h1>Home</h1>
        <p>Frontend React/Vite migration foundation is ready.</p>

        <div style={{ marginTop: 16 }}>
          <Link to="/portal">Go to Portal</Link>
        </div>

        <footer style={{ marginTop: 48, opacity: 0.7 }}>
          © {year}
        </footer>
      </main>
    </div>
  );
}

