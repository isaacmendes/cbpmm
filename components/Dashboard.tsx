
import React, { useState } from 'react';
import { OfficerSubmission } from '../types';

interface DashboardProps {
  submissions: OfficerSubmission[];
  onBack: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ submissions, onBack }) => {
  const [selectedSubmission, setSelectedSubmission] = useState<OfficerSubmission | null>(null);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Painel de Controle Jurídico</h1>
        <button 
          onClick={onBack}
          className="text-slate-500 hover:text-slate-800 transition-colors"
        >
          ← Voltar ao Início
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-bottom border-slate-200">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600">RE</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Policial</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Data</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Tipo</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Status</th>
                <th className="px-6 py-4 font-semibold text-slate-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Nenhuma solicitação recebida ainda.</td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm text-slate-700">{sub.re}</td>
                    <td className="px-6 py-4 font-medium">{sub.name}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{new Date(sub.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${sub.isJudicial ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {sub.isJudicial ? 'Judicial' : 'Administrativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-1 rounded">
                        {sub.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedSubmission(sub)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                      >
                        Visualizar Detalhes
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold">Dossiê: {selectedSubmission.name}</h2>
              <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">✕</button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Informações de Contato</h3>
                  <p className="mb-2 text-slate-700"><strong>RE:</strong> {selectedSubmission.re}</p>
                  <p className="mb-2 text-slate-700"><strong>Email:</strong> {selectedSubmission.email}</p>
                  <p className="mb-2 text-slate-700"><strong>Telefone:</strong> {selectedSubmission.phone}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Configuração do Processo</h3>
                  <p className="mb-2 text-slate-700"><strong>Modalidade:</strong> {selectedSubmission.isJudicial ? 'Judicial + Administrativo' : 'Apenas Administrativo'}</p>
                  <p className="mb-2 text-slate-700"><strong>Data de Envio:</strong> {new Date(selectedSubmission.createdAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Documentos do Storage (Supabase)</h3>
              <div className="grid grid-cols-1 gap-3">
                {selectedSubmission.files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                         </svg>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase block leading-tight">{file.category}</span>
                        <span className="font-medium text-slate-700 block text-sm">{file.name}</span>
                      </div>
                    </div>
                    <a 
                      href={file.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Baixar
                    </a>
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
