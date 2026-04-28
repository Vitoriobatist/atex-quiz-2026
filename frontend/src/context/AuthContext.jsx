import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('usuario');
    if (t && u) {
      setToken(t);
      setUsuario(JSON.parse(u));
    }
    setCarregando(false);
  }, []);

  function login(tokenRecebido, usuarioRecebido) {
    localStorage.setItem('token', tokenRecebido);
    localStorage.setItem('usuario', JSON.stringify(usuarioRecebido));
    setToken(tokenRecebido);
    setUsuario(usuarioRecebido);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
