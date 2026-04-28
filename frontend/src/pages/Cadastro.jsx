import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './auth.css';

export default function Cadastro() {
  const [form, setForm] = useState({ nome: '', periodo: '', email: '', senha: '', confirmar: '' });
  const [erro, setErro]     = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  function change(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/cadastro', form);
      if (data.sucesso) {
        login(data.token, data.usuario);
        navigate('/');
      } else {
        setErro(data.mensagem || 'Erro ao cadastrar.');
      }
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro ao cadastrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <img src="/logo-simpatia.png" alt="Simpat.IA" className="auth-logo"
          onError={e => { e.target.style.display = 'none'; }} />
        <h2 className="auth-title">Criar conta</h2>

        {erro && <div className="auth-erro">{erro}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>Nome completo</label>
          <input name="nome" value={form.nome} onChange={change} placeholder="Seu nome" required />

          <label>Período</label>
          <select name="periodo" value={form.periodo} onChange={change} required>
            <option value="" disabled hidden>Selecione o período</option>
            {[1,2,3,4,5,6,7,8].map(p => (
              <option key={p} value={p}>{p}º período</option>
            ))}
          </select>

          <label>E-mail</label>
          <input name="email" type="email" value={form.email} onChange={change}
            placeholder="seu@email.com" required />

          <label>Senha</label>
          <input name="senha" type="password" value={form.senha} onChange={change}
            placeholder="Mínimo 8 caracteres" required />

          <label>Confirmar senha</label>
          <input name="confirmar" type="password" value={form.confirmar} onChange={change}
            placeholder="Repita a senha" required />

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Cadastrando…' : 'Cadastrar'}
          </button>
        </form>

        <p className="auth-link">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
