
import React, { useState, useEffect } from 'react';
import { OfficerSubmission, ViewMode } from './types';
import SubmissionForm from './components/SubmissionForm';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.CLIENT);
  const [submissions, setSubmissions] = useState<OfficerSubmission[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Login states
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load mock/saved data
  useEffect(() => {
    const saved = localStorage.getItem('cbpm_submissions');
    if (saved) {
      setSubmissions(JSON.parse(saved));
    }
  }, []);

  const handleSubmission = (data: Omit<OfficerSubmission, 'id' | 'createdAt' | 'status'>) => {
    const newSubmission: OfficerSubmission = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'Pendente'
    };
    
    const updated = [...submissions, newSubmission];
    setSubmissions(updated);
    localStorage.setItem('cbpm_submissions', JSON.stringify(updated));
    setShowSuccess(true);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '715115') {
      setIsAuthenticated(true);
      setShowLogin(false);
      setView(ViewMode.ADMIN);
      setUsername('');
      setPassword('');
    } else {
      alert('Usuário ou senha incorretos.');
    }
  };

  const openAdminArea = () => {
    if (isAuthenticated) {
      setView(ViewMode.ADMIN);
    } else {
      setShowLogin(true);
    }
  };

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 animate-fadeIn">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Acesso Restrito</h2>
            <p className="text-slate-500">Identifique-se para acessar o painel</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Usuário</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Senha</label>
              <input 
                type="password" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
            >
              Entrar
            </button>
            <button 
              type="button"
              onClick={() => setShowLogin(false)}
              className="w-full py-2 text-slate-400 hover:text-slate-600 transition-all text-sm font-medium"
            >
              Cancelar
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl text-center">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-4">Sucesso!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">Sua documentação foi enviada com sucesso para nossa equipe jurídica. Em breve entraremos em contato via WhatsApp/Email.</p>
          <button 
            onClick={() => setShowSuccess(false)}
            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
          >
            Fazer outro envio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {view === ViewMode.CLIENT ? (
        <SubmissionForm 
          onSubmit={handleSubmission} 
          onAdminClick={openAdminArea} 
        />
      ) : (
        <Dashboard 
          submissions={submissions} 
          onBack={() => setView(ViewMode.CLIENT)} 
        />
      )}
      
      {/* Global Footer */}
      <footer className="py-12 px-4 text-center text-slate-400 text-sm">
        <p>© 2026 Assessoria Jurídica Militar Especializada</p>
        <p className="mt-2">Lembre-se: O cancelamento cessa o atendimento na Cruz Azul para você e dependentes.</p>
      </footer>
    </div>
  );
};

export default App;
