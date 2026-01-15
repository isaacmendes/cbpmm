
import React, { useState } from 'react';
import { OfficerSubmission, FileCategory } from '../types';

interface SubmissionFormProps {
  onSubmit: (data: Omit<OfficerSubmission, 'id' | 'createdAt' | 'status'>) => void;
  onAdminClick: () => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSubmit, onAdminClick }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    re: '',
    email: '',
    phone: '',
    isJudicial: true,
    agreedToTerms: false,
  });

  const [files, setFiles] = useState<{ category: string; label: string; name: string; url: string }[]>([]);

  // Função para aplicar máscara no RE (000000-0)
  const handleREChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (value.length > 7) value = value.slice(0, 7); // Limita a 7 dígitos
    
    if (value.length > 6) {
      value = value.replace(/^(\d{6})(\d{1})/, '$1-$2');
    }
    
    setFormData({ ...formData, re: value });
  };

  // Função para aplicar máscara no Telefone ( (00) 00000-0000 )
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos (DDD + 9 dígitos)

    if (value.length > 0) {
      value = '(' + value;
    }
    if (value.length > 3) {
      value = value.replace(/^(\(\d{2})(\d)/, '$1) $2');
    }
    if (value.length > 10) {
      value = value.replace(/(\d{5})(\d{4})$/, '$1-$2');
    }

    setFormData({ ...formData, phone: value });
  };

  const handleFileChange = (category: string, label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFiles(prev => [
        ...prev.filter(f => f.label !== label), 
        {
          category,
          label,
          name: file.name,
          url: URL.createObjectURL(file)
        }
      ]);
    }
  };

  const getFileForLabel = (label: string) => {
    return files.find(f => f.label === label);
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreedToTerms) return alert("Você deve aceitar os termos de ciência.");
    if (formData.re.length < 8) return alert("Por favor, insira um RE válido (6 dígitos + dígito verificador).");
    if (formData.phone.length < 14) return alert("Por favor, insira um telefone válido com DDD.");
    onSubmit({ ...formData, files });
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white text-slate-900 font-medium placeholder:text-slate-300";

  const renderFileInput = (category: string, label: string, hint: string) => {
    const selectedFile = getFileForLabel(label);
    return (
      <div className={`p-4 border border-dashed rounded-xl transition-all duration-300 ${selectedFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300 hover:bg-slate-50'}`}>
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className={`font-semibold transition-colors ${selectedFile ? 'text-emerald-700' : 'text-slate-700'}`}>{label}</p>
            {selectedFile ? (
              <p className="text-xs text-emerald-600 font-medium truncate flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {selectedFile.name}
              </p>
            ) : (
              <p className="text-xs text-slate-400">{hint}</p>
            )}
          </div>
          <label className={`cursor-pointer px-4 py-2 rounded-lg border text-sm font-bold transition-all shrink-0 ${selectedFile ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600' : 'bg-white border-slate-200 text-indigo-600 hover:bg-indigo-50'}`}>
            {selectedFile ? 'Alterar' : 'Selecionar'}
            <input type="file" className="hidden" onChange={(e) => handleFileChange(category, label, e)} />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Portal de Desvinculação CBPM</h1>
        <p className="text-slate-500 text-lg mb-6">Inicie sua solicitação de cessação de descontos compulsórios para 2026.</p>
        
        <button 
          onClick={onAdminClick} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-xs font-bold uppercase tracking-widest border border-slate-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Área do Advogado
        </button>
      </div>

      <div className="mb-12 flex justify-between items-center relative">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${step >= i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
              {i}
            </div>
          </div>
        ))}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-0"></div>
        <div className="absolute top-5 left-0 h-0.5 bg-indigo-600 transition-all duration-500 -z-0" style={{ width: `${(step - 1) * 33.33}%` }}></div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">1. Dados Funcionais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClasses} placeholder="Ex: João da Silva" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">RE (Registro Estatutário)</label>
                <input 
                  required 
                  value={formData.re} 
                  onChange={handleREChange} 
                  className={inputClasses} 
                  placeholder="123456-7" 
                  maxLength={8}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">E-mail</label>
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClasses} placeholder="email@exemplo.com" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Telefone/WhatsApp</label>
                <input 
                  required 
                  value={formData.phone} 
                  onChange={handlePhoneChange} 
                  className={inputClasses} 
                  placeholder="(11) 99999-9999" 
                  maxLength={15}
                />
              </div>
            </div>
            <button type="button" onClick={nextStep} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Próximo</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">2. Documentos Comuns</h2>
            <p className="text-slate-500 text-sm">Necessários para ambas as vias (Administrativa e Judicial).</p>
            
            <div className="space-y-4">
              {renderFileInput(FileCategory.COMMON, 'Identidade Funcional (RE)', 'Cópia frente e verso legível')}
              {renderFileInput(FileCategory.COMMON, 'Comprovante de Residência', 'Atualizado (últimos 3 meses)')}
              {renderFileInput(FileCategory.COMMON, 'Último Holerite', 'Para comprovar o desconto ativo')}
            </div>
            
            <div className="flex gap-4">
              <button type="button" onClick={prevStep} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Voltar</button>
              <button type="button" onClick={nextStep} className="flex-2 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Próximo</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">3. Definição de Estratégia</h2>
            
            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 mb-6">
              <label className="flex items-start gap-4 cursor-pointer">
                <input type="checkbox" checked={formData.isJudicial} onChange={e => setFormData({...formData, isJudicial: e.target.checked})} className="mt-1 w-5 h-5 accent-indigo-600" />
                <div>
                  <p className="font-bold text-indigo-900">Desejo ingressar com Ação Judicial de Repetição do Indébito</p>
                  <p className="text-sm text-indigo-700 mt-1">Busca a devolução dos valores descontados indevidamente nos últimos 5 anos corrigidos pela Taxa SELIC.</p>
                </div>
              </label>
            </div>

            {formData.isJudicial ? (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 border-l-4 border-indigo-600 pl-3">Documentos para Via Judicial</h3>
                {renderFileInput(FileCategory.JUDICIAL, 'Holerites dos últimos 5 anos', 'Para memória de cálculo')}
                {renderFileInput(FileCategory.JUDICIAL, 'Extrato de Consignações', 'Disponível no Portal SOU.SP')}
                {renderFileInput(FileCategory.JUDICIAL, 'Declaração de Hipossuficiência', 'Para Justiça Gratuita')}
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 border-l-4 border-blue-400 pl-3">Apenas Via Administrativa</h3>
                {renderFileInput(FileCategory.ADMINISTRATIVE, 'Termo de Declaração de Desligamento', 'Petição fundamentada na tese do STF (RE 573.540)')}
              </div>
            )}
            
            <div className="flex gap-4">
              <button type="button" onClick={prevStep} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Voltar</button>
              <button type="button" onClick={nextStep} className="flex-2 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Próximo</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">4. Revisão e Compromisso</h2>
            
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
              <h3 className="text-red-800 font-bold mb-2 flex items-center gap-2">
                ⚠️ AVISO IMPORTANTE
              </h3>
              <p className="text-sm text-red-700 leading-relaxed">
                O cancelamento da contribuição CBPM cessará imediatamente o atendimento médico-hospitalar para o servidor e seus dependentes na rede Cruz Azul e demais convênios vinculados à autarquia.
              </p>
            </div>

            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl">
              <p className="text-sm font-bold text-slate-400 uppercase">Resumo da Solicitação</p>
              <p className="text-slate-700"><strong>Nome:</strong> {formData.name}</p>
              <p className="text-slate-700"><strong>RE:</strong> {formData.re}</p>
              <p className="text-slate-700"><strong>Via:</strong> {formData.isJudicial ? 'Administrativa + Judicial (Retroativo 5 anos)' : 'Apenas Administrativa (Cessação Futura)'}</p>
              <p className="text-slate-700"><strong>Total de Documentos:</strong> {files.length} arquivos anexados</p>
            </div>

            <label className="flex items-start gap-4 cursor-pointer p-4 rounded-xl border border-slate-200 bg-white">
              <input required type="checkbox" checked={formData.agreedToTerms} onChange={e => setFormData({...formData, agreedToTerms: e.target.checked})} className="mt-1 w-5 h-5 accent-indigo-600" />
              <p className="text-sm text-slate-700 font-medium">
                Estou ciente de que o cancelamento acarretará na perda do benefício de saúde para mim e meus dependentes. Confirmo que as informações prestadas são verídicas.
              </p>
            </label>

            <div className="flex gap-4">
              <button type="button" onClick={prevStep} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Voltar</button>
              <button type="submit" className="flex-2 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Finalizar Solicitação</button>
            </div>
          </div>
        )}

      </form>
    </div>
  );
};

export default SubmissionForm;
