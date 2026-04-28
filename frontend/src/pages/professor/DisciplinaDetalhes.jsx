import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Header from '../../components/Header';
import './professor.css';
import './DisciplinaDetalhes.css';

export default function DisciplinaDetalhes() {
  const { id } = useParams();
  const [dados, setDados]         = useState(null);
  const [selecionados, setSel]    = useState([]);
  const [msgAssoc, setMsgAssoc]   = useState('');
  const [uploading, setUploading] = useState(false);
  const [msgUpload, setMsgUpload] = useState('');
  const [erro, setErro]           = useState('');
  const fileRef = useRef();

  useEffect(() => {
    api.get(`/professor/disciplinas/${id}`).then(({ data }) => {
      setDados(data);
      setSel(data.alunos.map(a => a.id));
    });
  }, [id]);

  async function salvarAssociacoes() {
    setMsgAssoc('');
    try {
      await api.post(`/professor/disciplinas/${id}/associacoes`, { aluno_ids: selecionados });
      setMsgAssoc('Associações salvas com sucesso!');
      setTimeout(() => setMsgAssoc(''), 3000);
    } catch {
      setMsgAssoc('Erro ao salvar associações.');
    }
  }

  async function uploadArquivo(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true); setMsgUpload('');
    const fd = new FormData();
    fd.append('arquivo', file);
    try {
      const { data } = await api.post(`/professor/disciplinas/${id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDados(d => ({ ...d, arquivos: [...(d.arquivos || []), data.arquivo] }));
      setMsgUpload('Arquivo enviado com sucesso!');
      setTimeout(() => setMsgUpload(''), 3000);
    } catch {
      setMsgUpload('Erro ao enviar arquivo.');
    } finally {
      setUploading(false);
      fileRef.current.value = '';
    }
  }

  async function excluirArquivo(nome) {
    if (!window.confirm(`Remover "${nome}"?`)) return;
    await api.delete(`/professor/disciplinas/${id}/arquivo`, { data: { nome } });
    setDados(d => ({ ...d, arquivos: d.arquivos.filter(a => a !== nome) }));
  }

  function toggleAluno(alunoId) {
    setSel(prev =>
      prev.includes(alunoId) ? prev.filter(x => x !== alunoId) : [...prev, alunoId]
    );
  }

  if (!dados) return <><Header /><div style={{ padding: 40, textAlign: 'center' }}>Carregando…</div></>;

  const { disciplina, alunos: alunosVinculados, todosAlunos, arquivos } = dados;

  return (
    <>
      <Header />
      <div className="det-page">
        <div className="det-header">
          <h1>{disciplina.nome}</h1>
          {disciplina.descricao && <p className="det-desc">{disciplina.descricao}</p>}
          {disciplina.periodo && <span className="det-periodo">{disciplina.periodo}º período</span>}
        </div>

        {/* ARQUIVOS */}
        <section className="det-section">
          <h2 className="section-title">Material da disciplina (PDFs)</h2>

          <div className="det-arquivos">
            {(arquivos || []).length === 0
              ? <p className="det-muted">Nenhum arquivo enviado.</p>
              : arquivos.map(a => (
                <div key={a} className="det-arquivo-row">
                  <span>📄 {a}</span>
                  <button className="icon-btn" onClick={() => excluirArquivo(a)} title="Remover">
                    <svg viewBox="0 0 24 24"><path d="M9 3h6a1 1 0 0 1 1 1v1h4a1 1 0 1 1 0 2h-1.1l-1.2 12.1A3 3 0 0 1 14.7 23H9.3a3 3 0 0 1-2.97-2.89L5.1 7H4a1 1 0 1 1 0-2h4V4a1 1 0 0 1 1-1Zm1 2h4V5h-4V5Zm-2.9 2l1.17 11.5A1.5 1.5 0 0 0 9.3 20h5.4a1.5 1.5 0 0 0 1.43-1.5L17.3 7H7.1ZM10 9a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0v-6a1 1 0 0 1 1-1Z"/></svg>
                  </button>
                </div>
              ))
            }
          </div>

          <div className="det-upload-row">
            <input type="file" ref={fileRef} onChange={uploadArquivo} accept=".pdf,.txt"
              style={{ display: 'none' }} id="file-input" />
            <label htmlFor="file-input" className="det-upload-btn">
              {uploading ? 'Enviando…' : '+ Enviar arquivo'}
            </label>
            {msgUpload && <span className={msgUpload.includes('Erro') ? 'det-msg-err' : 'det-msg-ok'}>{msgUpload}</span>}
          </div>
        </section>

        {/* ASSOCIAR ALUNOS */}
        <section className="det-section">
          <h2 className="section-title">Alunos vinculados</h2>

          <div className="det-alunos-lista">
            {todosAlunos.length === 0
              ? <p className="det-muted">Nenhum aluno cadastrado.</p>
              : todosAlunos.map(al => (
                <label key={al.id} className={`det-aluno-item ${selecionados.includes(al.id) ? 'checked' : ''}`}>
                  <input
                    type="checkbox"
                    checked={selecionados.includes(al.id)}
                    onChange={() => toggleAluno(al.id)}
                  />
                  <span className="det-aluno-nome">{al.nome}</span>
                  <span className="det-aluno-email">{al.email}</span>
                </label>
              ))
            }
          </div>

          <button className="det-btn-salvar" onClick={salvarAssociacoes}>Salvar associações</button>
          {msgAssoc && (
            <span className={msgAssoc.includes('Erro') ? 'det-msg-err' : 'det-msg-ok'} style={{ marginLeft: 12 }}>
              {msgAssoc}
            </span>
          )}
        </section>

        <Link to="/professor/disciplinas" className="disc-voltar">← Voltar às disciplinas</Link>
      </div>
    </>
  );
}
