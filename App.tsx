
import React, { useState, useEffect } from 'react';
import { OfficerSubmission, ViewMode } from './types.ts';
import SubmissionForm from './components/SubmissionForm.tsx';
import Dashboard from './components/Dashboard.tsx';
import { supabase } from './lib/supabase.ts';

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
    } else {
      setSubmissions([]); // Limpa dados sensíveis ao deslogar
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
          id: String(sub.id),
          name: sub.name || 'Sem nome',
          re: sub.re || '---',
          email: sub.email || '',
          phone: sub.phone || '',
          status: sub.status || 'Pendente',
          createdAt: sub.created_at,
          files: sub.files || [],
          isJudicial: !!sub.is_judicial,
          agreedToTerms: true
        }));
        setSubmissions(mapped);
      }
    } catch (err) {
      console.error("Erro ao buscar dados:", err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: OfficerSubmission['status']) => {
    const previousState = [...submissions];
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));

    try {
      const numericId = parseInt(id, 10);
      const targetId = isNaN(numericId) ? id : numericId;

      const { error } = await supabase
        .from('submissions')
        .update({ status: newStatus })
        .eq('id', targetId);

      if (error) throw error;
    } catch (err: any) {
      console.error("Erro na atualização:", err);
      setSubmissions(previousState);
      alert(err.code === '42501' ? "Erro de Permissão: Crie a política de UPDATE no Supabase." : "Erro ao salvar status.");
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    try {
      const numericId = parseInt(id, 10);
      const targetId = isNaN(numericId) ? id : numericId;

      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', targetId);

      if (error) throw error;

      setSubmissions(prev => prev.filter(s => s.id !== id));
      return true;
    } catch (err: any) {
      console.error("Erro ao excluir:", err);
      alert(err.code === '42501' ? "Erro de Permissão: Crie a política de DELETE no Supabase." : "Erro ao excluir registro.");
      return false;
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setView(ViewMode.CLIENT);
    setShowLogin(false);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmission = async (formData: any) => {
    setIsSubmitting(true);
    try {
      const processedFiles = [];
      for (const fileObject of formData.files) {
        const base64Data = await fileToBase64(fileObject.file);
        processedFiles.push({
          category: fileObject.category,
          name: fileObject.name,
          url: base64Data,
          type: fileObject.file.type
        });
      }

      const payload = {
        name: formData.name,
        re: formData.re,
        email: formData.email,
        phone: formData.phone,
        is_judicial: formData.isJudicial,
        status: 'Pendente',
        files: processedFiles
      };

      const { error } = await supabase.from('submissions').insert([payload]);
      if (error) throw error;
      setShowSuccess(true);
    } catch (error: any) {
      alert(`Erro no envio: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Credenciais atualizadas: Usuário 211160 (OAB), mesma senha 715115
    if (username === '211160' && password === '715115') {
      setIsAuthenticated(true);
      setShowLogin(false);
      setView(ViewMode.ADMIN);
      setUsername('');
      setPassword('');
    } else {
      alert('OAB ou senha inválidos.');
    }
  };

  const handleOABChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setUsername(value);
  };

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl animate-fadeIn">
          <h2 className="text-3xl font-extrabold text-center mb-8 text-slate-800 tracking-tight">Login Jurídico</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">OAB</label>
              <input 
                type="text" 
                placeholder="Apenas números" 
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium" 
                value={username} 
                onChange={handleOABChange} 
                required 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha</label>
              <input 
                type="password" 
                placeholder="Sua senha" 
                className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 transform active:scale-[0.98]">Entrar</button>
            <button type="button" onClick={() => setShowLogin(false)} className="w-full py-2 text-slate-400 text-sm text-center font-medium hover:text-slate-600 transition-colors">Voltar ao Formulário</button>
          </form>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Envio Concluído!</h2>
          <p className="text-slate-500 mb-8">O Dr. Isaac recebeu sua documentação com sucesso.</p>
          <button onClick={() => setShowSuccess(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all">Fazer Outro Envio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-bold text-slate-800">Processando...</p>
          </div>
        </div>
      )}

      {view === ViewMode.CLIENT ? (
        <SubmissionForm onSubmit={handleSubmission} onAdminClick={() => isAuthenticated ? setView(ViewMode.ADMIN) : setShowLogin(true)} />
      ) : (
        <Dashboard 
          submissions={submissions} 
          onBack={handleLogout} 
          onUpdateStatus={handleUpdateStatus}
          onDeleteSubmission={handleDeleteSubmission}
        />
      )}
    </div>
  );
};

export default App;
