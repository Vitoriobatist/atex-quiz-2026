import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login        from './pages/Login';
import Cadastro     from './pages/Cadastro';
import Home         from './pages/Home';
import Quiz         from './pages/Quiz';
import Resultado    from './pages/Resultado';
import Dashboard    from './pages/Dashboard';
import Revisao      from './pages/Revisao';

import ProfessorPanel      from './pages/professor/ProfessorPanel';
import Disciplinas         from './pages/professor/Disciplinas';
import DisciplinaDetalhes  from './pages/professor/DisciplinaDetalhes';
import NovaDisciplina      from './pages/professor/NovaDisciplina';

function PrivateRoute({ children, only }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  if (only === 'aluno'     && usuario.tipo !== 'aluno')     return <Navigate to="/professor" replace />;
  if (only === 'professor' && usuario.tipo !== 'professor') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"   element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />

          <Route path="/" element={
            <PrivateRoute only="aluno"><Home /></PrivateRoute>
          } />
          <Route path="/quiz" element={
            <PrivateRoute only="aluno"><Quiz /></PrivateRoute>
          } />
          <Route path="/resultado" element={
            <PrivateRoute only="aluno"><Resultado /></PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute only="aluno"><Dashboard /></PrivateRoute>
          } />
          <Route path="/revisao/:id" element={
            <PrivateRoute only="aluno"><Revisao /></PrivateRoute>
          } />

          <Route path="/professor" element={
            <PrivateRoute only="professor"><ProfessorPanel /></PrivateRoute>
          } />
          <Route path="/professor/disciplinas" element={
            <PrivateRoute only="professor"><Disciplinas /></PrivateRoute>
          } />
          <Route path="/professor/disciplinas/nova" element={
            <PrivateRoute only="professor"><NovaDisciplina /></PrivateRoute>
          } />
          <Route path="/professor/disciplinas/:id" element={
            <PrivateRoute only="professor"><DisciplinaDetalhes /></PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
