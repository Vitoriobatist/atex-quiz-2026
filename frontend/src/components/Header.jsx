import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  useEffect(() => {
    function fecharAoClicarFora(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener('mousedown', fecharAoClicarFora);
    return () => document.removeEventListener('mousedown', fecharAoClicarFora);
  }, []);

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
        {usuario && (
          <div className="app-header__user-menu" ref={menuRef}>
            <button
              className="app-header__user-btn"
              onClick={() => setMenuAberto(o => !o)}
            >
              <span className="app-header__avatar">
                {usuario.nome.charAt(0).toUpperCase()}
              </span>
              <span className="app-header__username">{usuario.nome.split(' ')[0]}</span>
              <svg className={`app-header__chevron ${menuAberto ? 'aberto' : ''}`} width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {menuAberto && (
              <div className="app-header__dropdown">
                <div className="app-header__dropdown-info">
                  <span className="app-header__dropdown-nome">{usuario.nome}</span>
                  <span className="app-header__dropdown-email">{usuario.email}</span>
                </div>
                <div className="app-header__dropdown-divider" />
                <button className="app-header__dropdown-sair" onClick={handleLogout}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Sair
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
