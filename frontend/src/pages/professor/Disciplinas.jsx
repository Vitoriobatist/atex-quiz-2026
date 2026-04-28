import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Header from '../../components/Header';
import './professor.css';
import './Disciplinas.css';

export default function Disciplinas() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/professor/disciplinas').then(({ data }) => {
      setDisciplinas(data.disciplinas);
      setLoading(false);
    });
  }, []);

  async function excluir(id, nome, e) {
    e.stopPropagation();
    if (!window.confirm(`Deseja realmente apagar a disciplina "${nome}"?`)) return;
    await api.delete(`/professor/disciplinas/${id}`);
    setDisciplinas(d => d.filter(x => x.id !== id));
  }

  if (loading) return <><Header /><div style={{ padding: 40, textAlign: 'center' }}>Carregando…</div></>;

  return (
    <>
      <Header />
      <div className="disc-page">
        <h1>Visualizar Disciplinas</h1>

        <div className="disc-lista">
          {disciplinas.length === 0
            ? <p style={{ color: '#64748b', textAlign: 'center', padding: 24 }}>
                Nenhuma disciplina cadastrada.
              </p>
            : disciplinas.map(d => (
              <div key={d.id} className="disc-card" onClick={() => navigate(`/professor/disciplinas/${d.id}`)}>
                <h2 className="disc-card__nome">{d.nome}</h2>
                <p className="disc-card__desc">{d.descricao}</p>
                <button
                  className="icon-btn disc-card__trash"
                  onClick={e => excluir(d.id, d.nome, e)}
                  title="Apagar disciplina"
                >
                  <svg viewBox="0 0 24 24"><path d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1.1l-1.2 12.1A3 3 0 0 1 14.7 23H9.3a3 3 0 0 1-2.97-2.89L5.1 7H4a1 1 0 1 1 0-2h4V4a1 1 0 0 1 1-1Zm1 2h4V5h-4V5Zm-2.9 2l1.17 11.5A1.5 1.5 0 0 0 9.3 20h5.4a1.5 1.5 0 0 0 1.43-1.5L17.3 7H7.1ZM10 9a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z"/></svg>
                </button>
              </div>
            ))
          }
        </div>

        <Link to="/professor" className="disc-voltar">← Voltar ao Painel</Link>
      </div>
    </>
  );
}
