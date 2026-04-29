import { useState } from 'react';
import {useEffect } from 'react';
import { Link } from "react-router-dom";
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Quiz.css';

export default function Quiz() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  const questoes   = state?.questoes  || [];
  const tema       = state?.tema      || 'Quiz';
  const nivel      = state?.nivel     || 'medio';
  const nivelLabel = state?.nivelRotulo || 'Médio';
  const materia_id = state?.materia_id || null;

  const [respostas, setRespostas] = useState(Array(questoes.length).fill(null));
  const [enviando, setEnviando]   = useState(false);
  const [erro, setErro]           = useState('');

  useEffect(() => {
    if (questoes.length === 0) {
      navigate('/');
    }
  }, [questoes, navigate]);

  function selecionar(questaoIdx, altIdx) {
    setRespostas(r => {
      const novo = [...r];
      novo[questaoIdx] = altIdx;
      return novo;
    });
  }

  const nivelMap = {
    facil: 1,
    medio: 2,
    dificil: 3,
    superior: 4
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setEnviando(true);
    try {
      const { data } = await api.post('/quiz/resultado', {
        questoes,
        respostas,
        tema,
        materia_id,
        nivel: nivelMap[nivel],
        nivelRotulo: nivelLabel,
      });
      navigate('/resultado', { state: { ...data, questoes, respostas, tema, nivelLabel } });
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao enviar respostas.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="quiz-page">
      <header className="quiz-topbar">
        <Link to="/">
          <img
            src="/logo-simpatia.png"
            alt="Simpat.IA"
            className="quiz-topbar__logo"
            onError={e => { e.target.style.display = 'none'; }}
          />
        </Link>
      </header>

      <div className="quiz-container">
        <h2 className="quiz-title">TESTE SEUS CONHECIMENTOS</h2>

        <form onSubmit={handleSubmit}>
          {questoes.map((q, i) => (
            <div key={i} className="questao-card">
              <p className="questao-enunciado">
                <strong>{i + 1}. {q.pergunta}</strong>
              </p>

              {q.alternativas.map((alt, j) => (
                <label
                  key={j}
                  className={`questao-alt ${respostas[i] === j ? 'selecionada' : ''}`}
                >
                  <input
                    type="radio"
                    name={`q${i}`}
                    value={j}
                    checked={respostas[i] === j}
                    onChange={() => selecionar(i, j)}
                  />
                  <span className="questao-alt__circulo" />
                  {alt}
                </label>
              ))}
            </div>
          ))}

          {erro && <p className="quiz-erro">{erro}</p>}

          <button type="submit" className="quiz-btn-submit" disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar Respostas'}
          </button>
        </form>
      </div>
    </div>
  );
}
