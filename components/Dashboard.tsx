
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

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchesSearch = sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || sub.re.includes(searchTerm);
      const matchesStatus = statusFilter === 'Todos' || sub.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchTerm, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 relative font-inter">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Painel Jurídico</h1>
          <p className="text-slate-500 text-sm">Bem-vindo ao sistema de gestão CBPM</p>
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
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Modalidade</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800">{sub.name}</span>
                        <span className="text-[10px] text-slate-400">RE {sub.re}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${sub.isJudicial ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                        {sub.isJudicial ? 'Judicial' : 'Administrativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select value={sub.status} onChange={e => onUpdateStatus(sub.id, e.target.value as any)} className="text-xs font-bold px-3 py-1.5 rounded-full border-slate-200">
                        {['Pendente', 'Em Análise', 'Ação Protocolada', 'Aguardando Liminar', 'Concluído'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button onClick={() => setSelectedSubmission(sub)} className="text-indigo-600 font-bold text-xs">Dossiê</button>
                      <button onClick={() => onDeleteSubmission(sub.id)} className="text-rose-500 font-bold text-xs">Excluir</button>
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
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-400">Acesso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {advogados.map(adv => (
                <tr key={adv.id}>
                  <td className="px-6 py-4 font-bold text-slate-800">{adv.nome_completo}</td>
                  <td className="px-6 py-4 font-mono text-sm">{adv.oab.substring(0,3)}.{adv.oab.substring(3)}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{adv.telefone}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => updateAdvogadoStatus(adv.id, 'Ativo')} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${adv.status === 'Ativo' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}>Ativo</button>
                      <button onClick={() => updateAdvogadoStatus(adv.id, 'Pendente')} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${adv.status === 'Pendente' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-amber-50 hover:text-amber-600'}`}>Pendente</button>
                      <button onClick={() => updateAdvogadoStatus(adv.id, 'Bloqueado')} className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${adv.status === 'Bloqueado' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-600'}`}>Bloquear</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">{selectedSubmission.name}</h2>
              <button onClick={() => setSelectedSubmission(null)}>✕</button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 mb-8 bg-slate-50 p-6 rounded-2xl">
                <div><p className="text-xs uppercase text-slate-400 font-bold">Contato</p><p>{selectedSubmission.email}<br/>{selectedSubmission.phone}</p></div>
                <div><p className="text-xs uppercase text-slate-400 font-bold">RE</p><p>{selectedSubmission.re}</p></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedSubmission.files.map((f, i) => (
                  <div key={i} className="p-4 border rounded-xl flex justify-between items-center">
                    <div><p className="text-[10px] uppercase font-black text-indigo-400">{f.category}</p><p className="text-sm font-bold">{f.name}</p></div>
                    <a href={f.url} download={f.name} className="bg-indigo-600 text-white p-2 rounded-lg">↓</a>
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
