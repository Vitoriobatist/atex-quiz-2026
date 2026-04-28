import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import './ChatWidget.css';

// todasQuestoes: array com todas as questões do quiz e seus resultados (usado na revisão)
// questaoFoco: número (1-based) da questão clicada no botão "Por que errei?"
export default function ChatWidget({ tipo = 'aluno', todasQuestoes = null, questaoFoco = null }) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState([]);
  const [input, setInput] = useState('');
  const [carregando, setCarregando] = useState(false);
  const messagesEndRef = useRef(null);
  const autoEnviado = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  // Ao montar com questaoFoco definida (via botão "Por que errei?"), abre e auto-envia
  useEffect(() => {
    if (questaoFoco !== null && todasQuestoes && !autoEnviado.current) {
      autoEnviado.current = true;
      setAberto(true);
      enviarMensagem(`Por que errei a questão ${questaoFoco}?`, questaoFoco);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function buildContexto(foco) {
    if (!todasQuestoes) return null;
    return { questoes: todasQuestoes, questaoFoco: foco ?? null };
  }

  async function enviarMensagem(texto, foco = null) {
    const pergunta = texto.trim();
    if (!pergunta) return;
    setInput('');
    setMensagens(prev => [...prev, { role: 'user', text: pergunta }]);
    setCarregando(true);
    try {
      const payload = todasQuestoes
        ? { pergunta, tipo: 'revisao', contexto: buildContexto(foco) }
        : { pergunta, tipo };
      const { data } = await api.post('/chat', payload);
      setMensagens(prev => [...prev, { role: 'bot', text: data.resposta }]);
    } catch {
      setMensagens(prev => [...prev, { role: 'bot', text: 'Erro ao conectar com o assistente.' }]);
    } finally {
      setCarregando(false);
    }
  }

  async function enviar(texto) {
    const msg = texto?.trim() || input.trim();
    if (!msg) return;
    setInput('');
    // Mensagens manuais não têm foco — a IA detecta o número pelo texto
    await enviarMensagem(msg, null);
  }

  function handleKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); enviar(); }
  }

  function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Reconhecimento de voz não suportado neste navegador.');
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.start();
    recognition.onresult = e => enviar(e.results[0][0].transcript);
  }

  const titulo = tipo === 'professor'
    ? 'Assistente do Professor'
    : todasQuestoes
      ? 'Tutor de Revisão'
      : 'Assistente Simpat.IA';

  return (
    <>
      <button className="chat-btn" onClick={() => setAberto(o => !o)} title="Assistente">
        💬
      </button>

      {aberto && (
        <div className="chat-box">
          <div className="chat-header">
            {titulo}
            <button className="chat-close" onClick={() => setAberto(false)}>✕</button>
          </div>

          <div className="chat-messages">
            {mensagens.length === 0 && todasQuestoes && (
              <div className="msg bot">
                Olá! Posso explicar qualquer questão do seu quiz. Pergunte, por exemplo: <em>"Por que errei a questão 3?"</em>
              </div>
            )}
            {mensagens.map((m, i) => (
              <div key={i} className={`msg ${m.role}`}>{m.text}</div>
            ))}
            {carregando && <div className="msg typing">Digitando...</div>}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <button className="chat-mic-btn" onClick={startVoice} title="Voz">🎤</button>
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={todasQuestoes ? 'Ex: Por que errei a questão 2?' : 'Como posso te ajudar?'}
            />
            <button className="chat-send-btn" onClick={() => enviar()}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
