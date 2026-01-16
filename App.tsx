
import React, { useState, useEffect } from 'react';
import { OfficerSubmission, ViewMode } from './types';
import SubmissionForm from './components/SubmissionForm';
import Dashboard from './components/Dashboard';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.CLIENT);
  const [submissions, setSubmissions] = useState<OfficerSubmission[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    }
  }, [isAuthenticated]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data) {
        const mapped = data.map(sub => ({
          id: sub.id,
          name: sub.name,
          re: sub.re,
          email: sub.email,
          phone: sub.phone,
          status: sub.status,
          createdAt: sub.created_at,
          files: sub.files,
          isJudicial: sub.is_judicial,
          agreedToTerms: true
        }));
        setSubmissions(mapped);
      }
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
  };

  const handleSubmission = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const uploadedFiles = [];

      for (const fileData of formData.files) {
        // Obter o blob do arquivo através da URL temporária criada no formulário
        const response = await fetch(fileData.url);
        const blob = await response.blob();
        
        // Gerar um nome único para evitar sobreposição
        const fileExt = fileData.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${formData.re.replace('-', '')}/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('officer-documents')
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('officer-documents')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          category: fileData.category,
          name: fileData.name,
          url: publicUrl
        });
      }

      // Inserção no banco PostgreSQL
      const { error: insertError } = await supabase
        .from('submissions')
        .insert([{
          name: formData.name,
          re: formData.re,
          email: formData.email,
          phone: formData.phone,
          is_judicial: formData.isJudicial,
          status: 'Pendente',
          files: uploadedFiles
        }]);

      if (insertError) throw insertError;

      setShowSuccess(true);
      if (isAuthenticated) fetchSubmissions();
    } catch (error: any) {
      console.error("Erro crítico na submissão:", error);
      alert("Falha no envio: " + (error.message || "Erro de conexão com o banco de dados."));
    } finally {
      setIsSubmitting(false);
    }
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
      alert('Credenciais administrativas incorretas.');
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
            <p className="text-slate-500 text-sm">Painel exclusivo para advogados</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" 
              placeholder="Usuário"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input 
              type="password" 
              placeholder="Senha"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg">Entrar</button>
            <button type="button" onClick={() => setShowLogin(false)} className="w-full py-2 text-slate-400 text-sm">Voltar</button>
          </form>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl text-center animate-fadeIn">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Enviado!</h2>
          <p className="text-slate-500 mb-8">Seus documentos foram salvos no banco de dados e a assessoria jurídica foi notificada.</p>
          <button onClick={() => setShowSuccess(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold">Novo Envio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-slate-50">
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-xs w-full animate-bounce">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-bold text-slate-800">Salvando no Banco...</p>
          </div>
        </div>
      )}

      {view === ViewMode.CLIENT ? (
        <SubmissionForm onSubmit={handleSubmission} onAdminClick={() => isAuthenticated ? setView(ViewMode.ADMIN) : setShowLogin(true)} />
      ) : (
        <Dashboard submissions={submissions} onBack={() => setView(ViewMode.CLIENT)} />
      )}
      
      <footer className="py-8 text-center text-slate-400 text-xs uppercase tracking-widest">
        <p>© 2026 Jurídico Militar • Supabase + Vercel Cloud Integration</p>
      </footer>
    </div>
  );
};

export default App;
