import { useLocation, useNavigate, Link } from 'react-router-dom';
import './Resultado.css';

export default function Resultado() {
  const { state } = useLocation();
  const navigate  = useNavigate();

  if (!state?.questoes) { navigate('/'); return null; }

  const { questoes, respostas, acertos, total, percentual, tema, nivelLabel, tentativa_id } = state;

  return (
    <div className="res-page">
      <div className="res-topbar">
        <img src="/logo-simpatia.png" alt="Simpat.IA" className="res-topbar__logo"
          onError={e => { e.target.style.display = 'none'; }} />
        <Link to="/" className="res-logout-btn">Sair</Link>
      </div>

      <div className="res-container">
        <h2>Resultado</h2>

        <p className="res-meta">
          Tema: <strong>{tema}</strong>
          {nivelLabel && <span className="res-badge">{nivelLabel}</span>}
        </p>

        <p className="res-resumo">
          Você acertou <strong>{acertos}</strong> de <strong>{total}</strong> questões&nbsp;
          (<strong>{percentual}%</strong> de aproveitamento).
        </p>

        {questoes.map((q, i) => {
          const idxCor  = parseInt(q.resposta_correta);
          const idxMar  = respostas[i] !== undefined && respostas[i] !== null ? parseInt(respostas[i]) : null;
          const acertou = idxMar !== null && idxMar === idxCor;
          const alts    = q.alternativas || [];
          const justAlt = Array.isArray(q.justificativas_alternativas) ? q.justificativas_alternativas : [];

          return (
            <div key={i} className="res-questao">
              <div className={`res-q-header ${acertou ? 'certa' : 'errada'}`}>
                {acertou ? '✓ Você acertou!' : '✗ Resposta incorreta.'}
              </div>
              <div className="res-q-body">
                <p className="res-pergunta">{i + 1}. {q.pergunta}</p>

                {alts.map((alt, j) => {
                  const isCor  = j === idxCor;
                  const isMarc = idxMar !== null && j === idxMar;
                  let cls = 'res-alt';
                  if (isCor)            cls += ' correta';
                  if (isMarc && !isCor) cls += ' marcada-errada';

                  const just = justAlt[j] || (isCor ? q.justificativa_correta : null);

                  return (
                    <div key={j} className={cls}>
                      <div className="res-alt__chips">
                        <span className="chip">{String.fromCharCode(65 + j)}</span>
                        {isMarc && <span className="chip chip--marcada">sua escolha</span>}
                        {isCor  && <span className="chip chip--correta">correta</span>}
                      </div>
                      <div className="res-alt__texto">
                        {alt}
                        {just && <div className="res-just">{just}</div>}
                      </div>
                    </div>
                  );
                })}

                {!acertou && q.justificativa_correta && (
                  <div className="res-just-geral">
                    <span className="chip chip--correta">Por que a resposta correta</span>
                    <div style={{ marginTop: 6 }}>{q.justificativa_correta}</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div className="res-rodape">
          <Link to="/" className="res-btn">Novo Quiz</Link>
          <Link to="/dashboard" className="res-btn">Ver Estatísticas</Link>
        </div>
      </div>
    </div>
  );
}
