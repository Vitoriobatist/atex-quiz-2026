import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function Login() {
  const [email, setEmail]   = useState('');
  const [senha, setSenha]   = useState('');
  const [erro, setErro]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, senha });
      login(data.token, data.usuario);
      navigate(data.usuario.tipo === 'professor' ? '/professor' : '/');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <img src="/Logo1Simpatia.png" alt="Simpat.IA" className="auth-logo"
          onError={e => { e.target.style.display = 'none'; }} />
        <h2 className="auth-title">Entrar</h2>

        {erro && <div className="auth-erro">{erro}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com" required />

          <label>Senha</label>
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
            placeholder="••••••••" required />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="auth-link">
          Não tem conta? <Link to="/cadastro">Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
