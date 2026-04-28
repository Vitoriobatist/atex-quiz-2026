import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Header from '../../components/Header';
import '../../pages/auth.css';

export default function NovaDisciplina() {
  const [form, setForm] = useState({ nome: '', descricao: '', periodo: '' });
  const [erro, setErro]   = useState('');
  const [ok, setOk]       = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function change(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro(''); setOk('');
    if (!form.nome.trim()) { setErro('O nome é obrigatório.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/professor/disciplinas', form);
      if (data.sucesso) {
        setOk('Disciplina cadastrada com sucesso!');
        setTimeout(() => navigate('/professor/disciplinas'), 1200);
      } else {
        setErro(data.mensagem || 'Erro ao cadastrar.');
      }
    } catch (err) {
      setErro(err.response?.data?.mensagem || 'Erro ao cadastrar disciplina.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <div className="auth-bg">
        <div className="auth-card" style={{ maxWidth: 500 }}>
          <h2 className="auth-title" style={{ fontSize: '1.4rem' }}>Cadastrar Disciplina</h2>

          {erro && <div className="auth-erro">{erro}</div>}
          {ok  && <div className="auth-sucesso">{ok}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <label>Nome</label>
            <input name="nome" value={form.nome} onChange={change} placeholder="Ex: Redes de Computadores" required />

            <label>Descrição</label>
            <input name="descricao" value={form.descricao} onChange={change} placeholder="Breve descrição (opcional)" />

            <label>Período</label>
            <select name="periodo" value={form.periodo} onChange={change}>
              <option value="">Sem período</option>
              {[1,2,3,4,5,6,7,8].map(p => (
                <option key={p} value={p}>{p}º período</option>
              ))}
            </select>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Cadastrando…' : 'Cadastrar'}
            </button>
          </form>

          <p className="auth-link">
            <Link to="/professor/disciplinas">← Voltar às disciplinas</Link>
          </p>
        </div>
      </div>
    </>
  );
}
