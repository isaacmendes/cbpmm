
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
      const folderName = formData.re.replace(/[^0-9]/g, '');

      for (const fileObject of formData.files) {
        const fileExt = fileObject.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${folderName}/${fileName}`;

        // Converter File para ArrayBuffer antes do upload
        // Isso às vezes ajuda a evitar que o navegador trate como uma requisição "complexa"
        const arrayBuffer = await fileObject.file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('officer-documents')
          .upload(filePath, arrayBuffer, {
            contentType: fileObject.file.type,
            upsert: true
          });

        if (uploadError) {
          console.error("Erro de Upload:", uploadError);
          throw new Error(uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('officer-documents')
          .getPublicUrl(filePath);

        uploadedFiles.push({
          category: fileObject.category,
          name: fileObject.name,
          url: publicUrl
        });
      }

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

      if (insertError) {
        throw new Error(`Erro no Banco: ${insertError.message}`);
      }

      setShowSuccess(true);
      if (isAuthenticated) fetchSubmissions();
    } catch (error: any) {
      console.error("Erro na submissão:", error);
      const msg = error.message || "Erro desconhecido";
      
      if (msg.toLowerCase().includes("fetch") || msg.includes("Failed to fetch")) {
        alert("O Supabase bloqueou a conexão (CORS).\n\nComo você não achou a opção no painel, tente:\n1. Clique em 'Storage' no menu lateral\n2. Clique em 'Settings' dentro do Storage\n3. Verifique se existe um botão 'CORS' lá (às vezes ele muda de lugar)");
      } else {
        alert(`Falha no envio: ${msg}`);
      }
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
      alert('Credenciais incorretas.');
    }
  };

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl">
          <h2 className="text-2xl font-bold text-center mb-6 text-slate-800">Acesso Administrativo</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Usuário" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input type="password" placeholder="Senha" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">Entrar</button>
            <button type="button" onClick={() => setShowLogin(false)} className="w-full py-2 text-slate-400 text-sm">Voltar</button>
          </form>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 animate-fadeIn">
        <div className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl text-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Sucesso!</h2>
          <p className="text-slate-500 mb-8">Seus documentos foram enviados corretamente.</p>
          <button onClick={() => setShowSuccess(false)} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all">Novo Envio</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-3xl shadow-2xl text-center max-w-xs w-full">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-bold text-slate-800">Enviando Arquivos...</p>
          </div>
        </div>
      )}

      {view === ViewMode.CLIENT ? (
        <SubmissionForm onSubmit={handleSubmission} onAdminClick={() => isAuthenticated ? setView(ViewMode.ADMIN) : setShowLogin(true)} />
      ) : (
        <Dashboard submissions={submissions} onBack={() => setView(ViewMode.CLIENT)} />
      )}
    </div>
  );
};

export default App;
