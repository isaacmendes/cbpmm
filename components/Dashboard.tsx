
import React, { useState } from 'react';
import { OfficerSubmission } from '../types';

interface DashboardProps {
  submissions: OfficerSubmission[];
  onBack: () => void;
  onUpdateStatus: (id: string, status: OfficerSubmission['status']) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ submissions, onBack, onUpdateStatus }) => {
  const [selectedSubmission, setSelectedSubmission] = useState<OfficerSubmission | null>(null);

  const exportToCSV = () => {
    const headers = ["ID", "Nome", "RE", "Email", "Telefone", "Status", "Tipo", "Data"];
    const rows = submissions.map(s => [
      s.id,
      s.name,
      s.re,
      s.email,
      s.phone,
      s.status,
      s.isJudicial ? "Judicial" : "Administrativo",
      new Date(s.createdAt).toLocaleDateString('pt-BR')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cbpm_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Concluído': return 'bg-emerald-100 text-emerald-700';
      case 'Ação Protocolada': return 'bg-indigo-100 text-indigo-700';
      case 'Aguardando Liminar': return 'bg-blue-100 text-blue-700';
      case 'Em Análise': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Painel Jurídico</h1>
          <p className="text-slate-500 text-sm">Gerenciamento de solicitações CBPM</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportToCSV}
            className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar Excel
          </button>
          <button 
            onClick={onBack}
            className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-black transition-all"
          >
            Sair do Painel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-400">RE / Nome</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-400">Data</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-400">Modalidade</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-400">Status Atual</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Nenhuma solicitação encontrada.</td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-slate-400">{sub.re}</span>
                        <span className="font-bold text-slate-800">{sub.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(sub.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${sub.isJudicial ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                        {sub.isJudicial ? 'Judicial' : 'Administrativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={sub.status}
                        onChange={(e) => onUpdateStatus(sub.id, e.target.value as any)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-full border-none outline-none ring-0 ${getStatusColor(sub.status)}`}
                      >
                        <option value="Pendente">Pendente</option>
                        <option value="Em Análise">Em Análise</option>
                        <option value="Ação Protocolada">Ação Protocolada</option>
                        <option value="Aguardando Liminar">Aguardando Liminar</option>
                        <option value="Concluído">Concluído</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedSubmission(sub)}
                        className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all"
                      >
                        Dossiê Completo
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-white/20">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Detalhes da Solicitação</span>
                <h2 className="text-xl font-bold text-slate-800">{selectedSubmission.name}</h2>
              </div>
              <button 
                onClick={() => setSelectedSubmission(null)} 
                className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-100 text-slate-400 hover:text-slate-800 transition-all"
              >✕</button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Contato Direto</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>RE:</strong> {selectedSubmission.re}</p>
                    <p className="text-sm"><strong>E-mail:</strong> <a href={`mailto:${selectedSubmission.email}`} className="text-indigo-600 underline">{selectedSubmission.email}</a></p>
                    <p className="text-sm"><strong>Telefone:</strong> <a href={`tel:${selectedSubmission.phone}`} className="text-indigo-600 underline">{selectedSubmission.phone}</a></p>
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Estratégia Adotada</h3>
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Modalidade:</strong> {selectedSubmission.isJudicial ? 'Judicial com Retroativo' : 'Apenas Administrativo'}</p>
                    <p className="text-sm"><strong>Protocolo Web:</strong> {new Date(selectedSubmission.createdAt).toLocaleString('pt-BR')}</p>
                    <p className="text-sm font-bold flex items-center gap-2">
                      <strong>Status:</strong> 
                      <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(selectedSubmission.status)}`}>{selectedSubmission.status}</span>
                    </p>
                  </div>
                </div>
              </div>
              
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Arquivos para Análise
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedSubmission.files.map((file, idx) => (
                  <div key={idx} className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                         </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] font-black text-indigo-400 uppercase block">{file.category}</span>
                        <span className="font-bold text-slate-700 block text-xs truncate max-w-[150px]">{file.name}</span>
                      </div>
                    </div>
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-slate-900 text-white p-2.5 rounded-xl hover:bg-black transition-all"
                      title="Baixar Documento"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">CBPM Cessação Judicial 2026</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
