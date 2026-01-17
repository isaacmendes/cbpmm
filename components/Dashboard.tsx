
import React, { useState, useMemo, useEffect } from 'react';
import { OfficerSubmission, Advogado } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  submissions: OfficerSubmission[];
  onBack: () => void;
  onUpdateStatus: (id: string, status: OfficerSubmission['status']) => void;
  onDeleteSubmission: (id: string) => Promise<boolean>;
  isSuperAdmin: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ submissions, onBack, onUpdateStatus, onDeleteSubmission, isSuperAdmin }) => {
  const [activeTab, setActiveTab] = useState<'submissions' | 'advogados'>('submissions');
  const [advogados, setAdvogados] = useState<Advogado[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<OfficerSubmission | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isSuperAdmin && activeTab === 'advogados') {
      fetchAdvogados();
    }
  }, [activeTab]);

  const fetchAdvogados = async () => {
    const { data } = await supabase.from('advogados').select('*').order('created_at', { ascending: false });
    if (data) setAdvogados(data);
  };

  const updateAdvogadoStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('advogados').update({ status }).eq('id', id);
    if (!error) fetchAdvogados();
  };

  const deleteAdvogado = async (adv: Advogado) => {
    const confirmed = window.confirm(`Deseja remover o advogado ${adv.nome_completo}?`);
    if (confirmed) {
      const { error } = await supabase.from('advogados').delete().eq('id', adv.id);
      if (!error) fetchAdvogados();
    }
  };

  const handleFileDownload = (url: string) => {
    if (!url || url === '#' || url === '') {
      alert('Este arquivo não possui uma URL válida.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || sub.re.includes(searchTerm);
      const matchesStatus = statusFilter === 'Todos' || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'Ação Protocolada': return 'bg-slate-800 text-white border-transparent';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const handleDelete = async (sub: OfficerSubmission) => {
    if (window.confirm(`Excluir permanentemente o cadastro de ${sub.name}?`)) {
      setIsDeletingId(sub.id);
      await onDeleteSubmission(sub.id);
      setIsDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 animate-fadeIn font-inter">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-12 gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Painel de Gestão</h1>
          <p className="text-slate-400 text-sm mt-1">Monitoramento de protocolos CBPM 2026</p>
        </div>
        <div className="flex items-center gap-3">
          {isSuperAdmin && (
            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
              <button onClick={() => setActiveTab('submissions')} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'submissions' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Solicitações</button>
              <button onClick={() => setActiveTab('advogados')} className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'advogados' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}>Membros</button>
            </div>
          )}
          <button onClick={onBack} className="bg-slate-50 text-slate-400 border border-slate-200 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-rose-500 hover:border-rose-100 transition-all">Sair</button>
        </div>
      </div>

      {activeTab === 'submissions' ? (
        <>
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <input type="text" placeholder="Pesquisar por nome ou RE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 px-6 py-4 rounded-2xl border border-slate-100 bg-white shadow-sm outline-none focus:border-slate-300 transition-all text-sm font-medium" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-6 py-4 rounded-2xl border border-slate-100 bg-white shadow-sm outline-none font-bold text-xs text-slate-500 cursor-pointer">
              <option value="Todos">Status: Todos</option>
              {['Pendente', 'Em Análise', 'Ação Protocolada', 'Concluído'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Oficial</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSubmissions.length > 0 ? filteredSubmissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <p className="font-bold text-slate-700 text-sm">{sub.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">RE {sub.re}</p>
                      </td>
                      <td className="px-8 py-6">
                        <select 
                          value={sub.status} 
                          onChange={e => onUpdateStatus(sub.id, e.target.value as any)} 
                          className={`text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-full border outline-none cursor-pointer transition-all ${getStatusColor(sub.status)}`}
                        >
                          {['Pendente', 'Em Análise', 'Ação Protocolada', 'Concluído'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => setSelectedSubmission(sub)} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-all bg-slate-100 px-4 py-2 rounded-xl">Dossiê</button>
                          <button disabled={isDeletingId === sub.id} onClick={() => handleDelete(sub)} className="text-[10px] font-black uppercase tracking-widest text-rose-300 hover:text-rose-500 transition-all px-4 py-2">Remover</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-8 py-16 text-center text-slate-300 font-medium text-sm">Nenhum registro encontrado</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Advogado</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">OAB</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
                  <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {advogados.map(adv => (
                  <tr key={adv.id} className="hover:bg-slate-50/50">
                    <td className="px-8 py-6 font-bold text-slate-700 text-sm">{adv.nome_completo}</td>
                    <td className="px-8 py-6 font-mono text-xs text-slate-400">{adv.oab}</td>
                    <td className="px-8 py-6">
                      <div className="flex justify-center gap-2">
                        {['Ativo', 'Pendente', 'Bloqueado'].map(s => (
                          <button 
                            key={s} 
                            onClick={() => updateAdvogadoStatus(adv.id, s)} 
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${adv.status === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-300 hover:text-slate-400'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button onClick={() => deleteAdvogado(adv)} className="text-rose-200 hover:text-rose-500 transition-all text-sm">✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 z-[100] animate-fadeIn">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2 block">Dossiê de Protocolo</span>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedSubmission.name}</h2>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 hover:text-slate-800 hover:border-slate-200 transition-all">✕</button>
            </div>
            <div className="p-10 overflow-y-auto">
              <div className="grid grid-cols-2 gap-8 mb-12 bg-slate-50/50 p-8 rounded-[2rem] border border-slate-50">
                <div>
                  <p className="text-[9px] uppercase text-slate-400 font-black tracking-widest mb-2">Informações de Contato</p>
                  <p className="text-sm font-semibold text-slate-600">{selectedSubmission.email}</p>
                  <p className="text-sm font-semibold text-slate-600 mt-1">{selectedSubmission.phone}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-slate-400 font-black tracking-widest mb-2">Registro Militar</p>
                  <p className="text-sm font-bold text-slate-800">RE {selectedSubmission.re}</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Protocolado em {new Date(selectedSubmission.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <h3 className="text-[9px] font-black uppercase text-slate-400 mb-6 tracking-[0.2em]">Documentação Digitalizada</h3>
              <div className="space-y-3">
                {selectedSubmission.files.map((f, i) => (
                  <div key={i} className="group p-5 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:border-slate-300 transition-all duration-300">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black text-slate-300 uppercase leading-none mb-1.5 tracking-widest group-hover:text-slate-400 transition-colors">{f.category}</p>
                      <p className="text-xs font-bold text-slate-600 truncate">{f.name}</p>
                    </div>
                    <button onClick={() => handleFileDownload(f.url)} className="flex items-center gap-2 bg-slate-50 text-slate-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all">
                      Abrir
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
