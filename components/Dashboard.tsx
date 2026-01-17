
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
    const confirmed = window.confirm(`CUIDADO: Deseja realmente remover o acesso e o cadastro do advogado ${adv.nome_completo}?`);
    if (confirmed) {
      const { error } = await supabase.from('advogados').delete().eq('id', adv.id);
      if (error) {
        alert("Erro ao excluir advogado.");
      } else {
        fetchAdvogados();
      }
    }
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
      case 'Aguardando Liminar': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Em Análise': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const handleDelete = async (sub: OfficerSubmission) => {
    const confirmed = window.confirm(`ATENÇÃO: Você tem certeza que deseja EXCLUIR permanentemente o cadastro de ${sub.name} (RE: ${sub.re})? Esta ação não pode ser desfeita.`);
    if (confirmed) {
      setIsDeletingId(sub.id);
      await onDeleteSubmission(sub.id);
      setIsDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 relative font-inter">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Painel Jurídico</h1>
          <p className="text-slate-500 text-sm">Gerenciamento de solicitações CBPM 2026</p>
        </div>
        <div className="flex gap-2">
          {isSuperAdmin && (
            <div className="flex bg-slate-100 p-1 rounded-xl mr-4">
              <button onClick={() => setActiveTab('submissions')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'submissions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Solicitações</button>
              <button onClick={() => setActiveTab('advogados')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'advogados' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Advogados</button>
            </div>
          )}
          <button onClick={onBack} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-all">Sair do Painel</button>
        </div>
      </div>

      {activeTab === 'submissions' ? (
        <>
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <input type="text" placeholder="Buscar por Nome ou RE..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="sm:w-64 px-4 py-3 rounded-xl border border-slate-200 outline-none text-sm font-bold">
              <option value="Todos">Todos Status</option>
              {['Pendente', 'Em Análise', 'Ação Protocolada', 'Aguardando Liminar', 'Concluído'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Oficial</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Modalidade</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Visualizar</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{sub.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-wider">RE {sub.re}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md border ${sub.isJudicial ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                        {sub.isJudicial ? 'Judicial' : 'Adm'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={sub.status} 
                        onChange={e => onUpdateStatus(sub.id, e.target.value as any)} 
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border outline-none cursor-pointer transition-colors ${getStatusColor(sub.status)}`}
                      >
                        {['Pendente', 'Em Análise', 'Ação Protocolada', 'Aguardando Liminar', 'Concluído'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedSubmission(sub)} 
                        className="text-indigo-600 font-bold text-xs hover:underline bg-indigo-50 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Dossiê
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        disabled={isDeletingId === sub.id}
                        onClick={() => handleDelete(sub)} 
                        className={`text-rose-500 font-bold text-xs hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all ${isDeletingId === sub.id ? 'opacity-30' : ''}`}
                      >
                        {isDeletingId === sub.id ? '...' : 'Excluir'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-fadeIn">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Advogado</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">OAB</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Telefone</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Acesso</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {advogados.map(adv => (
                <tr key={adv.id} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-800">{adv.nome_completo}</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-sm">
                    {adv.oab.length === 6 ? `${adv.oab.substring(0,3)}.${adv.oab.substring(3)}` : adv.oab}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{adv.telefone}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => updateAdvogadoStatus(adv.id, 'Ativo')} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${adv.status === 'Ativo' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}>Ativo</button>
                      <button onClick={() => updateAdvogadoStatus(adv.id, 'Pendente')} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${adv.status === 'Pendente' ? 'bg-amber-500 text-white shadow-md shadow-amber-100' : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-600'}`}>Pendente</button>
                      <button onClick={() => updateAdvogadoStatus(adv.id, 'Bloqueado')} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${adv.status === 'Bloqueado' ? 'bg-slate-700 text-white shadow-md shadow-slate-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-900'}`}>Bloquear</button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => deleteAdvogado(adv)}
                      className="text-rose-500 hover:bg-rose-50 p-2 rounded-xl transition-all"
                      title="Excluir Advogado"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">Dossiê Completo</span>
                <h2 className="text-xl font-bold text-slate-800">{selectedSubmission.name}</h2>
              </div>
              <button onClick={() => setSelectedSubmission(null)} className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all">✕</button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div><p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Dados de Contato</p><p className="text-sm font-medium">{selectedSubmission.email}<br/>{selectedSubmission.phone}</p></div>
                <div><p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Identificação</p><p className="text-sm font-medium">RE: {selectedSubmission.re}</p></div>
              </div>
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Arquivos Anexados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedSubmission.files.map((f, i) => (
                  <div key={i} className="p-4 border border-slate-200 rounded-xl flex justify-between items-center hover:border-indigo-300 transition-all group">
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-black text-indigo-400 leading-none mb-1">{f.category}</p>
                      <p className="text-xs font-bold text-slate-700 truncate">{f.name}</p>
                    </div>
                    <a href={f.url} download={f.name} className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t text-center text-[10px] text-slate-400 font-bold tracking-widest">PORTAL CBPM 2026 - ASSESSORIA JURÍDICA MILITAR</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
