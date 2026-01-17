
import React, { useState, useEffect } from 'react';
import { OfficerSubmission, ViewMode, Advogado } from './types.ts';
import SubmissionForm from './components/SubmissionForm.tsx';
import Dashboard from './components/Dashboard.tsx';
import { supabase } from './lib/supabase.ts';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.CLIENT);
  const [submissions, setSubmissions] = useState<OfficerSubmission[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [showLogin, setShowLogin] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState(''); // OAB
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserOAB, setCurrentUserOAB] = useState('');

  // Estados do cadastro
  const [regNome, setRegNome] = useState('');
  const [regOAB, setRegOAB] = useState('');
  const [regTel, setRegTel] = useState('');
  const [regSenha, setRegSenha] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    }
  }, [isAuthenticated]);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase.from('submissions').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setSubmissions(data.map(sub => ({
        id: String(sub.id),
        name: sub.name,
        re: sub.re,
        email: sub.email,
        phone: sub.phone,
        status: sub.status,
        createdAt: sub.created_at,
        files: sub.files || [],
        isJudicial: !!sub.is_judicial,
        agreedToTerms: true
      })));
    } catch (err) { console.error(err); }
  };

  const maskOAB = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 3) v = v.substring(0, 3) + "." + v.substring(3, 6);
    return v.substring(0, 7);
  };

  const maskPhone = (v: string) => {
    v = v.replace(/\D/g, "");
    if (v.length > 2) v = v.substring(0, 2) + " " + v.substring(2);
    if (v.length > 8) v = v.substring(0, 8) + "-" + v.substring(8, 12);
    return v.substring(0, 15);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const plainOAB = username.replace(/\D/g, '');

    if (plainOAB === '211160' && password === '715115') {
      setIsAuthenticated(true);
      setCurrentUserOAB(plainOAB);
      setShowLogin(false);
      setView(ViewMode.ADMIN);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('advogados')
        .select('*')
        .eq('oab', plainOAB)
        .eq('senha', password)
        .single();

      if (error || !data) {
        alert('OAB ou senha incorretos.');
        return;
      }

      if (data.status !== 'Ativo') {
        alert(`Seu acesso está ${data.status}. Aguarde a liberação.`);
        return;
      }

      setIsAuthenticated(true);
      setCurrentUserOAB(plainOAB);
      setShowLogin(false);
      setView(ViewMode.ADMIN);
    } catch (err) {
      alert('Erro ao autenticar.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const plainOAB = regOAB.replace(/\D/g, '');
    try {
      const { error } = await supabase.from('advogados').insert([{
        oab: plainOAB,
        nome_completo: regNome,
        telefone: regTel,
        senha: regSenha,
        status: 'Pendente'
      }]);
      if (error) throw error;
      alert('Cadastro realizado! Aguarde a aprovação.');
      setIsRegistering(false);
    } catch (err) {
      alert('Erro ao cadastrar.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setView(ViewMode.CLIENT);
    setCurrentUserOAB('');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center text-white">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-bold">Protocolando documentos...</p>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-6">
          <div className="bg-white max-w-sm w-full p-8 rounded-[2.5rem] shadow-2xl text-center animate-fadeIn">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Sucesso!</h3>
            <p className="text-slate-500 text-sm mb-8">Sua solicitação foi enviada. Entraremos em contato via WhatsApp em breve.</p>
            <button onClick={() => window.location.reload()} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold">Ok, entendi</button>
          </div>
        </div>
      )}

      {view === ViewMode.CLIENT ? (
        <SubmissionForm onSubmit={async (submissionData) => {
          setIsSubmitting(true);
          try {
            // O submissionData já contém as URLs geradas pelo upload no componente SubmissionForm
            const { error } = await supabase.from('submissions').insert([{
              name: submissionData.name, 
              re: submissionData.re, 
              email: submissionData.email, 
              phone: submissionData.phone, 
              is_judicial: submissionData.isJudicial, 
              status: 'Pendente', 
              files: submissionData.files // Salva a lista de {category, name, url}
            }]);
            
            if (error) throw error;
            setShowSuccess(true);
          } catch (e: any) { 
            console.error(e);
            alert('Erro ao salvar no banco: ' + e.message); 
          } finally { 
            setIsSubmitting(false); 
          }
        }} onAdminClick={() => setShowLogin(true)} />
      ) : (
        <Dashboard 
          submissions={submissions} 
          onBack={handleLogout} 
          isSuperAdmin={currentUserOAB === '211160'}
          onUpdateStatus={async (id, status) => {
             await supabase.from('submissions').update({ status }).eq('id', id);
             fetchSubmissions();
          }}
          onDeleteSubmission={async (id) => {
            const { error } = await supabase.from('submissions').delete().eq('id', id);
            fetchSubmissions();
            return !error;
          }}
        />
      )}

      {showLogin && (
        <div className="fixed inset-0 bg-white z-[120] flex items-center justify-center p-6">
          <div className="max-w-md w-full animate-fadeIn">
             <h2 className="text-3xl font-black mb-8 text-center">{isRegistering ? 'Cadastro' : 'Login'}</h2>
             {!isRegistering ? (
               <form onSubmit={handleLogin} className="space-y-4">
                 <input type="text" placeholder="OAB" className="w-full p-4 rounded-xl border" value={username} onChange={e => setUsername(maskOAB(e.target.value))} required />
                 <input type="password" placeholder="Senha" className="w-full p-4 rounded-xl border" value={password} onChange={e => setPassword(e.target.value)} required />
                 <button className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold">Entrar</button>
                 <div className="flex justify-between text-xs font-bold text-slate-400">
                    <button type="button" onClick={() => setShowLogin(false)}>Voltar</button>
                    <button type="button" onClick={() => setIsRegistering(true)} className="text-indigo-600">Criar Conta</button>
                 </div>
               </form>
             ) : (
               <form onSubmit={handleRegister} className="space-y-4">
                 <input type="text" placeholder="OAB" className="w-full p-4 rounded-xl border" value={regOAB} onChange={e => setRegOAB(maskOAB(e.target.value))} required />
                 <input type="text" placeholder="Nome" className="w-full p-4 rounded-xl border" value={regNome} onChange={e => setRegNome(e.target.value)} required />
                 <input type="password" placeholder="Senha" className="w-full p-4 rounded-xl border" value={regSenha} onChange={e => setRegSenha(e.target.value)} required />
                 <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold">Solicitar</button>
                 <button type="button" onClick={() => setIsRegistering(false)} className="w-full text-slate-400 text-xs">Voltar</button>
               </form>
             )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
