
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

    // 1. Check Super Admin
    if (plainOAB === '211160' && password === '715115') {
      setIsAuthenticated(true);
      setCurrentUserOAB(plainOAB);
      setShowLogin(false);
      setView(ViewMode.ADMIN);
      return;
    }

    // 2. Check Database Advogados
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
        alert(`Seu acesso está ${data.status}. Aguarde a liberação pelo administrador.`);
        return;
      }

      setIsAuthenticated(true);
      setCurrentUserOAB(plainOAB);
      setShowLogin(false);
      setView(ViewMode.ADMIN);
    } catch (err) {
      alert('Erro ao tentar autenticar.');
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
      alert('Cadastro realizado! Aguarde a aprovação do administrador.');
      setIsRegistering(false);
      setRegOAB(''); setRegNome(''); setRegTel(''); setRegSenha('');
    } catch (err) {
      alert('Erro ao cadastrar. Talvez essa OAB já exista.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setView(ViewMode.CLIENT);
    setCurrentUserOAB('');
  };

  if (showLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-inter">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl animate-fadeIn">
          <h2 className="text-3xl font-extrabold text-center mb-8 text-slate-800 tracking-tight">
            {isRegistering ? 'Novo Advogado' : 'Login Jurídico'}
          </h2>
          
          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">OAB</label>
                <input type="text" placeholder="123.456" className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium" value={username} onChange={e => setUsername(maskOAB(e.target.value))} required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Senha</label>
                <input type="password" placeholder="Sua senha" className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-medium" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 transform active:scale-[0.98]">Entrar</button>
              <div className="flex justify-between items-center px-2">
                <button type="button" onClick={() => setShowLogin(false)} className="text-slate-400 text-xs font-bold hover:text-slate-600">Voltar ao Formulário</button>
                <button type="button" onClick={() => setIsRegistering(true)} className="text-indigo-600 text-xs font-bold hover:text-indigo-800">Cadastrar Advogado</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <input type="text" placeholder="Registro da OAB (ex: 123.456)" className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value={regOAB} onChange={e => setRegOAB(maskOAB(e.target.value))} required />
              <input type="text" placeholder="Nome Completo" className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value={regNome} onChange={e => setRegNome(e.target.value)} required />
              <input type="text" placeholder="Telefone ex: 16 99999-9999" className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value={regTel} onChange={e => setRegTel(maskPhone(e.target.value))} required />
              <input type="password" placeholder="Criar uma senha" title="Será sua senha de acesso" className="w-full px-5 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value={regSenha} onChange={e => setRegSenha(e.target.value)} required />
              <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg">Solicitar Cadastro</button>
              <button type="button" onClick={() => setIsRegistering(false)} className="w-full py-2 text-slate-400 text-sm font-medium">Voltar para Login</button>
            </form>
          )}
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
        <SubmissionForm onSubmit={async (formData) => {
          setIsSubmitting(true);
          try {
            const { error } = await supabase.from('submissions').insert([{
              name: formData.name, re: formData.re, email: formData.email, phone: formData.phone, is_judicial: formData.isJudicial, status: 'Pendente', files: formData.files
            }]);
            if (error) throw error;
            setShowSuccess(true);
          } catch (e) { alert('Erro no envio.'); }
          finally { setIsSubmitting(false); }
        }} onAdminClick={() => setShowLogin(true)} />
      ) : (
        <Dashboard 
          submissions={submissions} 
          onBack={handleLogout} 
          isSuperAdmin={currentUserOAB === '211160'}
          onUpdateStatus={async (id, status) => {
             const { error } = await supabase.from('submissions').update({ status }).eq('id', id);
             if (error) throw error;
             fetchSubmissions();
          }}
          onDeleteSubmission={async (id) => {
            const { error } = await supabase.from('submissions').delete().eq('id', id);
            if (error) return false;
            fetchSubmissions();
            return true;
          }}
        />
      )}
    </div>
  );
};

export default App;
