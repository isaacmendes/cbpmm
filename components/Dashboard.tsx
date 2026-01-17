
import React, { useState, useMemo } from 'react';
import { OfficerSubmission } from '../types';

interface DashboardProps {
  submissions: OfficerSubmission[];
  onBack: () => void;
  onUpdateStatus: (id: string, status: OfficerSubmission['status']) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ submissions, onBack, onUpdateStatus }) => {
  const [selectedSubmission, setSelectedSubmission] = useState<OfficerSubmission | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  // Estados para Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      const matchesSearch = 
        sub.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        sub.re.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'Todos' || sub.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [submissions, searchTerm, statusFilter]);

  const handleStatusChange = async (id: string, newStatus: any) => {
    setUpdatingId(id);
    try {
      // Dispara a função que chama o Supabase no App.tsx
      await onUpdateStatus(id, newStatus);
      showNotification("Alteração salva permanentemente!");
    } catch (err) {
      console.error("Erro ao mudar status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const exportToCSV = () => {
    const headers = ["ID", "Nome", "RE", "Email", "Telefone", "Status", "Tipo", "Data"];
    const rows = filteredSubmissions.map(s => [
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
    showNotification("Relatório exportado!");
  };

  const handleDownloadFile = (base64Data: string, fileName: string) => {
    try {
      const parts = base64Data.split(';base64,');
      const contentType = parts[0].split(':')[1];
      const raw = window.atob(parts[1] || parts[0]);
      const rawLength = raw.length;
      const uInt8Array = new Uint8Array(rawLength);

      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
      }

      const blob = new Blob([uInt8Array], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showNotification(`Download: ${fileName}`);
    } catch (err) {
      console.error("Erro ao processar download:", err);
      alert("Erro ao baixar o arquivo.");
    }
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
    <div className="max-w-7xl mx-auto px-4 py-12 relative">
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-fadeIn">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/10">
            <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-xs font-bold">{notification}</span>
          </div>
        </div>
      )}

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

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input 
            type="text" 
            placeholder="Buscar por Nome ou RE..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
          />
        </div>
        <div className="sm:w-64 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Filtrar Status:</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-bold text-slate-700"
          >
            <option value="Todos">Todos</option>
            <option value="Pendente">Pendente</option>
            <option value="Em Análise">Em Análise</option>
            <option value="Ação Protocolada">Ação Protocolada</option>
            <option value="Aguardando Liminar">Aguardando Liminar</option>
            <option value="Concluído">Concluído</option>
          </select>
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
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">Nenhum resultado encontrado.</td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
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
                      <div className="flex items-center gap-2">
                        <select 
                          disabled={updatingId === sub.id}
                          value={sub.status}
                          onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-full border-none outline-none ring-0 cursor-pointer transition-all ${updatingId === sub.id ? 'opacity-50' : ''} ${getStatusColor(sub.status)}`}
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Em Análise">Em Análise</option>
                          <option value="Ação Protocolada">Ação Protocolada</option>
                          <option value="Aguardando Liminar">Aguardando Liminar</option>
                          <option value="Concluído">Concluído</option>
                        </select>
                        {updatingId === sub.id && (
                          <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedSubmission(sub)}
                        className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all"
                      >
                        Dossiê
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
              <button onClick={() => setSelectedSubmission(null)} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm border border-slate-100 text-slate-400 hover:text-slate-800 transition-all">✕</button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Contato</h3>
                  <p className="text-sm"><strong>RE:</strong> {selectedSubmission.re}</p>
                  <p className="text-sm"><strong>E-mail:</strong> {selectedSubmission.email}</p>
                  <p className="text-sm"><strong>Telefone:</strong> {selectedSubmission.phone}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Informações do Processo</h3>
                  <p className="text-sm"><strong>Tipo:</strong> {selectedSubmission.isJudicial ? 'Judicial' : 'Administrativo'}</p>
                  <p className="text-sm"><strong>Data:</strong> {new Date(selectedSubmission.createdAt).toLocaleString('pt-BR')}</p>
                  <p className="text-sm"><strong>Status:</strong> <span className={`px-2 py-0.5 rounded text-[10px] ${getStatusColor(selectedSubmission.status)}`}>{selectedSubmission.status}</span></p>
                </div>
              </div>
              
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">Documentos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedSubmission.files.map((file, idx) => (
                  <div key={idx} className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 hover:border-indigo-500 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-xs">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black text-indigo-400 uppercase block">{file.category}</span>
                        <span className="font-bold text-slate-700 block text-xs truncate max-w-[150px]">{file.name}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDownloadFile(file.url, file.name)}
                      className="bg-slate-900 text-white p-2 rounded-xl hover:bg-black transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 text-center text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">
              Assessoria Jurídica Militar 2026
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
