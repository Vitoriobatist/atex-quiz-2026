import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Header from '../../components/Header';
import ChatWidget from '../../components/ChatWidget';
import './professor.css';

export default function ProfessorPanel() {
  const [metricas, setMetricas] = useState(null);
  const [alunos, setAlunos]     = useState([]);
  const [vinculos, setVinculos] = useState({});
  const [modal, setModal]       = useState(null); // 'alunos' | 'vinculos'
  const [openCaps, setOpenCaps] = useState({});

  useEffect(() => {
    api.get('/professor/metricas').then(({ data }) => setMetricas(data));
    api.get('/professor/alunos').then(({ data }) => setAlunos(data.alunos));
    api.get('/professor/vinculos').then(({ data }) => setVinculos(data.vinculos));
  }, []);

  async function excluirAluno(id, nome) {
    if (!window.confirm(`Deseja realmente excluir o aluno "${nome}"?`)) return;
    await api.delete(`/professor/alunos/${id}`);
    setAlunos(a => a.filter(al => al.id !== id));
    setMetricas(m => m ? { ...m, totalAlunos: m.totalAlunos - 1 } : m);
  }

  function toggleCap(id) {
    setOpenCaps(o => ({ ...o, [id]: !o[id] }));
  }

  if (!metricas) return <><Header /><div style={{ padding: 40, textAlign: 'center' }}>Carregando…</div></>;

  return (
    <>
      <Header />
      <div className="prof-container">
        <div className="prof-hero">
          <h1>Painel do Professor</h1>
          <p>Gerencie suas disciplinas, alunos e associações.</p>
        </div>

        {/* métricas */}
        <section className="prof-metrics">
          <Link to="/professor/disciplinas" className="prof-metric">
            <span className="kpi">{metricas.totalDisciplinas}</span>
            <span className="label">Disciplinas</span>
          </Link>
          <button className="prof-metric" onClick={() => setModal('alunos')}>
            <span className="kpi">{metricas.totalAlunos}</span>
            <span className="label">Alunos</span>
          </button>
          <button className="prof-metric" onClick={() => setModal('vinculos')}>
            <span className="kpi">{metricas.totalVinculos}</span>
            <span className="label">Vínculos aluno ↔ disciplina</span>
          </button>
        </section>

        {/* atalhos */}
        <section className="prof-actions">
          <Link to="/professor/disciplinas/nova" className="prof-card">
            <span className="kicker">Cadastro</span>
            <span className="title">Cadastrar Disciplina</span>
            <span className="desc">Crie uma nova disciplina para seus alunos.</span>
          </Link>
          <Link to="/professor/disciplinas" className="prof-card">
            <span className="kicker">Gerenciamento</span>
            <span className="title">Visualizar Disciplinas</span>
            <span className="desc">Gerencie, associe alunos e edite detalhes.</span>
          </Link>
        </section>

        {/* últimas disciplinas */}
        <div className="section-title">Últimas disciplinas cadastradas</div>
        <div className="prof-list">
          {(metricas.ultimas || []).length === 0
            ? <div className="prof-list-row"><span style={{ color: '#64748b' }}>Nenhuma disciplina cadastrada ainda.</span></div>
            : metricas.ultimas.map(d => (
              <div key={d.id} className="prof-list-row">
                <span className="name">{d.nome}</span>
                <span className="desc">{d.descricao}</span>
                <span className="space" />
                <Link to={`/professor/disciplinas/${d.id}`} className="prof-link">Abrir</Link>
              </div>
            ))
          }
        </div>
      </div>

      {/* MODAL ALUNOS */}
      {modal === 'alunos' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <header>
              <h2>Alunos cadastrados ({alunos.length})</h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </header>
            <div className="prof-list">
              {alunos.length === 0
                ? <div className="prof-list-row"><span style={{ color: '#64748b' }}>Nenhum aluno.</span></div>
                : alunos.map(al => (
                  <div key={al.id} className="prof-list-row">
                    <span className="name">{al.nome}</span>
                    <span className="desc">{al.email}</span>
                    <span className="space" />
                    <button className="icon-btn" title="Excluir" onClick={() => excluirAluno(al.id, al.nome)}>
                      <svg viewBox="0 0 24 24"><path d="M9 3h6a1 1 0 0 1 .96.73L16.5 5H19a1 1 0 1 1 0 2h-1v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7H5a1 1 0 0 1 0-2h2.5l.54-1.27A1 1 0 0 1 9 3Zm1 6a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0v-7a1 1 0 0 0-1-1Zm4 0a1 1 0 0 0-1 1v7a1 1 0 1 0 2 0v-7a1 1 0 0 0-1-1Z"/></svg>
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}

      {/* MODAL VÍNCULOS */}
      {modal === 'vinculos' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <header>
              <h2>Vínculos aluno ↔ disciplina</h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </header>
            {Object.keys(vinculos).length === 0
              ? <p style={{ color: '#64748b' }}>Nenhum vínculo encontrado.</p>
              : Object.entries(vinculos).map(([alunoId, info]) => (
                <div key={alunoId} className={`capsule ${openCaps[alunoId] ? 'open' : ''}`}>
                  <div className="capsule-header" onClick={() => toggleCap(alunoId)}>
                    <div>
                      <span className="c-name">{info.nome}</span>
                      <span className="c-count">— {info.materias.length} disciplina(s)</span>
                      <div className="c-email">{info.email}</div>
                    </div>
                    <span className="capsule-chev" />
                  </div>
                  <div className="capsule-body">
                    <div className="chips">
                      {info.materias.map(m => (
                        <Link key={m.id} to={`/professor/disciplinas/${m.id}`} className="badge-chip"
                          onClick={() => setModal(null)}>
                          {m.nome}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      <ChatWidget tipo="professor" />
    </>
  );
}
