import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const ehProfessor = usuario?.tipo === 'professor';

  return (
    <header className="app-header">
      <img
        src="/logo-simpatia.png"
        alt="Simpat.IA"
        className="app-header__logo"
        onError={e => { e.target.style.display = 'none'; }}
      />
      <div className="app-header__spacer" />
      <nav className="app-header__nav">
        {ehProfessor ? (
          <>
            <Link to="/professor" className="app-header__link">Painel</Link>
            <Link to="/professor/disciplinas" className="app-header__link">Disciplinas</Link>
          </>
        ) : (
          <>
            <Link to="/" className="app-header__link">Início</Link>
            <Link to="/dashboard" className="app-header__link">Estatísticas</Link>
          </>
        )}
        <button className="app-header__btn-logout" onClick={handleLogout}>Sair</button>
      </nav>
    </header>
  );
}
