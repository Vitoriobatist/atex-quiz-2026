import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Header from '../components/Header';
import ChatWidget from '../components/ChatWidget';
import './Home.css';

export default function Home() {
  const [materias, setMaterias]   = useState([]);
  const [aviso, setAviso]         = useState('');
  const [materiaId, setMateriaId] = useState('');
  const [quantidade, setQtd]      = useState('');
  const [erro, setErro]           = useState('');
  const [loading, setLoading]     = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/quiz/materias').then(({ data }) => {
      setMaterias(data.materias);
      if (data.aviso) setAviso(data.aviso);
      if (data.materias.length > 0) setMateriaId(String(data.materias[0].id));
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    const n = parseInt(quantidade);
    if (!quantidade || isNaN(n) || n < 1 || n > 20) {
      setErro('Informe um número inteiro entre 1 e 20.');
      return;
    }

    setLoading(true);
    try {
      const materia = materias.find(m => String(m.id) === String(materiaId));
      const { data } = await api.post('/quiz/gerar', {
        materia_id: materiaId,
        tema: materia?.nome || '',
        quantidade: n,
      });
      navigate('/quiz', { state: data });
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao gerar questões.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />

      <div className="home-hero">
        <div className="home-hero__inner">
          <img src="/frase1.png" alt="" className="home-hero__frase"
            onError={e => { e.target.style.display = 'none'; }} />
          <img src="/logo-bola.png" alt="" className="home-hero__bola"
            onError={e => { e.target.style.display = 'none'; }} />
          <img src="/homem.png" alt="" className="home-hero__homem"
            onError={e => { e.target.style.display = 'none'; }} />
          <img src="/fundo-azul.png" alt="" className="home-hero__fundo"
            onError={e => { e.target.style.display = 'none'; }} />
        </div>
      </div>

      <div className="home-container">
        {aviso && <div className="home-aviso">{aviso}</div>}

        <form onSubmit={handleSubmit} className="home-form">
          <div className="home-field">
            <label htmlFor="materia">Escolha a matéria:</label>
            <select
              id="materia"
              value={materiaId}
              onChange={e => setMateriaId(e.target.value)}
              required
            >
              {materias.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>

          <div className="home-field">
            <label htmlFor="quantidade">Quantidade de questões:</label>
            <input
              id="quantidade"
              type="number"
              min="1"
              max="20"
              step="1"
              inputMode="numeric"
              placeholder="1 a 20"
              value={quantidade}
              onChange={e => { setQtd(e.target.value); setErro(''); }}
              required
            />
          </div>

          {erro && <p className="home-erro">{erro}</p>}

          <div className="home-actions">
            <button type="submit" className="home-btn-primary" disabled={loading}>
              {loading
                ? <><span className="spinner" />Gerando questões…</>
                : 'Gerar Questões'}
            </button>
            <a href="/dashboard" className="home-btn-stats">Ver Estatísticas</a>
          </div>
        </form>
      </div>

      <ChatWidget tipo="aluno" />
    </>
  );
}
