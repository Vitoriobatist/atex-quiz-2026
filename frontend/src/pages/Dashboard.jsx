import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import api from '../services/api';
import Header from '../components/Header';
import ChatWidget from '../components/ChatWidget';
import './Dashboard.css';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement
);

const pct = (a, t) => t > 0 ? parseFloat(((a / t) * 100).toFixed(1)) : 0;
const fmtLabel = d => d?.split(' ') || [''];

export default function Dashboard() {
  const [materias, setMaterias]   = useState([]);
  const [historico, setHistorico] = useState([]);
  const [filtroMateria, setFiltro] = useState('all');
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(({ data }) => {
      setMaterias(data.materias);
      setHistorico(data.historico);
      setLoading(false);
    });
  }, []);

  const dados = historico.filter(h =>
    filtroMateria === 'all' || String(h.materia_id) === String(filtroMateria)
  );

  const MAX = window.innerWidth <= 600 ? 5 : 7;
  const ultimos = dados.slice(-MAX);

  // gráfico 1 – aproveitamento por quiz
  const chartTodos = {
    labels: ultimos.map(r => fmtLabel(r.data)),
    datasets: [{ label: 'Aproveitamento (%)', data: ultimos.map(r => pct(r.acertos, r.total)),
      backgroundColor: '#4f46e5' }],
  };

  // gráfico 2 – evolução geral
  const chartEvol = {
    labels: ultimos.map(r => fmtLabel(r.data)),
    datasets: [{ label: 'Aproveitamento (%)', data: ultimos.map(r => pct(r.acertos, r.total)),
      borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,.15)', tension: .25, fill: true }],
  };

  // gráfico 3 – acertos vs erros
  const chartAE = {
    labels: ultimos.map(r => fmtLabel(r.data)),
    datasets: [
      { label: 'Acertos', data: ultimos.map(r => r.acertos), backgroundColor: '#10b981' },
      { label: 'Erros',   data: ultimos.map(r => r.erros),   backgroundColor: '#ef4444' },
    ],
  };

  // gráfico 4 – média por tema
  const byTema = {};
  dados.forEach(r => {
    const k = r.tema || '—';
    if (!byTema[k]) byTema[k] = { a: 0, t: 0, e: 0 };
    byTema[k].a += r.acertos;
    byTema[k].t += r.total;
    byTema[k].e += r.erros;
  });
  const temasKeys = Object.keys(byTema);

  const chartMedia = {
    labels: temasKeys,
    datasets: [{ label: 'Média (%)', data: temasKeys.map(k => pct(byTema[k].a, byTema[k].t)),
      backgroundColor: '#6366f1' }],
  };

  const chartErros = {
    labels: temasKeys,
    datasets: [{ label: 'Erros', data: temasKeys.map(k => byTema[k].e),
      backgroundColor: '#ef4444' }],
  };

  // gráfico 6 – dificuldade
  const buckets = { facil: { a: 0, t: 0 }, medio: { a: 0, t: 0 }, dificil: { a: 0, t: 0 } };
  dados.forEach(r => {
    const p = pct(r.acertos, r.total);
    const key = p >= 80 ? 'facil' : p >= 50 ? 'medio' : 'dificil';
    buckets[key].a += r.acertos;
    buckets[key].t += r.total;
  });
  const chartDif = {
    labels: ['Fácil (≥80%)', 'Médio (50-79%)', 'Difícil (<50%)'],
    datasets: [{ label: 'Média (%)',
      data: [pct(buckets.facil.a, buckets.facil.t), pct(buckets.medio.a, buckets.medio.t), pct(buckets.dificil.a, buckets.dificil.t)],
      backgroundColor: ['#10b981', '#f59e0b', '#ef4444'] }],
  };

  const optBar  = { responsive: true, scales: { y: { min: 0, max: 100 } } };
  const optCont = { responsive: true, scales: { y: { beginAtZero: true } } };

  if (loading) return <><Header /><div style={{ padding: 40, textAlign: 'center' }}>Carregando…</div></>;

  return (
    <>
      <Header />
      <main className="dash-main">
        <section className="dash-hero">
          <div>
            <h1>Dashboard de Desempenho</h1>
            <p>Analise seus resultados e acompanhe sua evolução.</p>
          </div>
          <div className="dash-filtro">
            <label htmlFor="filtro">Matéria:</label>
            <select id="filtro" value={filtroMateria} onChange={e => setFiltro(e.target.value)}>
              <option value="all">Todas as matérias</option>
              {materias.map(m => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>
        </section>

        <div className="charts-grid">
          <div className="chart-card"><h3>Aproveitamento por Quiz</h3><Bar data={chartTodos} options={optBar} /></div>
          <div className="chart-card"><h3>Evolução Geral</h3><Line data={chartEvol} options={{ responsive: true, scales: { y: { min: 0, suggestedMax: 100 } } }} /></div>
          <div className="chart-card"><h3>Acertos vs Erros</h3><Bar data={chartAE} options={optCont} /></div>
          <div className="chart-card"><h3>Média por Tema</h3><Bar data={chartMedia} options={optBar} /></div>
          <div className="chart-card"><h3>Erros por Tema</h3><Bar data={chartErros} options={optCont} /></div>
          <div className="chart-card"><h3>Desempenho por Dificuldade</h3><Bar data={chartDif} options={optBar} /></div>
        </div>

        <section className="table-section">
          <h2>Histórico Detalhado</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Matéria</th><th>Tema</th><th>Data</th>
                  <th>Total</th><th>Acertos</th><th>Erros</th>
                  <th>Aproveitamento</th><th>Revisão</th>
                </tr>
              </thead>
              <tbody>
                {dados.map((h, i) => (
                  <tr key={h.id}>
                    <td>{i + 1}</td>
                    <td>{h.materia}</td>
                    <td>{h.tema}</td>
                    <td>{h.data}</td>
                    <td>{h.total}</td>
                    <td>{h.acertos}</td>
                    <td>{h.erros}</td>
                    <td>
                      <span className={
                        h.percentual < 40 ? 'aprove-red' :
                        h.percentual < 60 ? 'aprove-yellow' : 'aprove-green'
                      }>{h.percentual}%</span>
                    </td>
                    <td>
                      {h.valido
                        ? <Link to={`/revisao/${h.id}`} className="review-btn">Ver novamente</Link>
                        : <span className="review-exp">expirado{h.expires_at ? ` em ${h.expires_at}` : ''}</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ marginTop: 18 }}>
          <Link to="/" className="dash-btn">Iniciar Novo Quiz</Link>
        </div>
      </main>

      <ChatWidget tipo="aluno" />
    </>
  );
}
