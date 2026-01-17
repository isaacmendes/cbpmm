
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
      alert('Este arquivo não possui uma URL válida para visualização. Pode ter ocorrido um erro no upload original.');
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
      case 'Concluído': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Ação Protocolada': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
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
    <div className="max-w-7xl mx-auto px-4 py-12 font-inter">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Painel Jurídico</h1>
          <p className="text-slate-500 text-sm">Controle de solicitações</p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('submissions')} className={`px-4 py-2 text-xs font-bold rounded-lg ${activeTab === 'submissions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Solicitações</button>
              <button onClick={() => setActiveTab('advogados')} className={`px-4 py-2 text-xs font-bold rounded-lg ${activeTab === 'advogados' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Advogados</button>
            </div>
          )}
          <button onClick={onBack} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-all">Sair</button>
        </div>
      </div>

      {activeTab === 'submissions' ? (
        <>
          <div className="mb-6 flex gap-4">
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-3 rounded-xl border border-slate-200 outline-none font-bold">
              <option value="Todos">Todos</option>
              {['Pendente', 'Em Análise', 'Ação Protocolada', 'Concluído'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Oficial</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSubmissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{sub.name}</p>
                      <p className="text-[10px] text-slate-400">RE {sub.re}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select value={sub.status} onChange={e => onUpdateStatus(sub.id, e.target.value as any)} className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none ${getStatusColor(sub.status)}`}>
                        {['Pendente', 'Em Análise', 'Ação Protocolada', 'Concluído'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setSelectedSubmission(sub)} className="text-indigo-600 font-bold text-xs bg-indigo-50 px-3 py-1.5 rounded-lg">Dossiê</button>
                        <button disabled={isDeletingId === sub.id} onClick={() => handleDelete(sub)} className="text-rose-500 font-bold text-xs hover:bg-rose-50 px-3 py-1.5 rounded-lg">Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">Advogado</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400">OAB</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-400 text-center">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {advogados.map(adv => (
                <tr key={adv.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-bold text-slate-800">{adv.nome_completo}</td>
                  <td className="px-6 py-4 font-mono text-sm">{adv.oab}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      {['Ativo', 'Pendente', 'Bloqueado'].map(s => (
                        <button key={s} onClick={() => updateAdvogadoStatus(adv.id, s)} className={`px-2 py-1 rounded text-[9px] font-black uppercase ${adv.status === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{s}</button>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => deleteAdvogado(adv)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-500">Dossiê Jurídico</span>
                <h2 className="text-xl font-bold text-slate-800">{selectedSubmission.name}</h2>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="text-slate-400 hover:text-slate-800 text-2xl">✕</button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-6 rounded-2xl">
                <div><p className="text-[10px] uppercase text-slate-400 font-bold">Contato</p><p className="text-sm font-medium">{selectedSubmission.email}<br/>{selectedSubmission.phone}</p></div>
                <div><p className="text-[10px] uppercase text-slate-400 font-bold">RE</p><p className="text-sm font-medium">{selectedSubmission.re}</p></div>
              </div>
              <h3 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Arquivos do Protocolo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedSubmission.files.map((f, i) => (
                  <div key={i} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center hover:border-indigo-300 transition-all">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-indigo-400 uppercase leading-none mb-1">{f.category}</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{f.name}</p>
                    </div>
                    <button onClick={() => handleFileDownload(f.url)} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
