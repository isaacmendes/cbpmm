
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
        <h1 className="text-3xl font-bold text-slate-800">Painel de Controle</h1>
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
          <div className="bg-white rounded-2xl w-full max-w-4xl max-height-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Dossiê: {selectedSubmission.name}</h2>
              <button onClick={() => setSelectedSubmission(null)} className="p-2 hover:bg-slate-100 rounded-full">✕</button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Informações de Contato</h3>
                  <p className="mb-2"><strong>RE:</strong> {selectedSubmission.re}</p>
                  <p className="mb-2"><strong>Email:</strong> {selectedSubmission.email}</p>
                  <p className="mb-2"><strong>Telefone:</strong> {selectedSubmission.phone}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Configuração do Processo</h3>
                  <p className="mb-2"><strong>Modalidade:</strong> {selectedSubmission.isJudicial ? 'Judicial + Administrativo' : 'Apenas Administrativo'}</p>
                  <p className="mb-2"><strong>Termo de Ciência:</strong> Aceito em {new Date(selectedSubmission.createdAt).toLocaleString('pt-BR')}</p>
                </div>
              </div>
              
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Documentos Anexados</h3>
              <div className="space-y-3">
                {selectedSubmission.files.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-xs font-bold text-indigo-500 uppercase block mb-1">{file.category}</span>
                      <span className="font-medium text-slate-700">{file.name}</span>
                    </div>
                    <a href="#" className="text-indigo-600 hover:underline text-sm font-semibold">Download PDF</a>
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
