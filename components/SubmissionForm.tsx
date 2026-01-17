
import React, { useState } from 'react';
import { OfficerSubmission, FileCategory } from '../types.ts';

interface SubmissionFormProps {
  onSubmit: (data: any) => void;
  onAdminClick: () => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSubmit, onAdminClick }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    re: '',
    email: '',
    phone: '',
    isJudicial: true, // Mantido como true internamente para o payload do banco
    agreedToTerms: false,
  });

  const [files, setFiles] = useState<{ category: string; label: string; name: string; file: File }[]>([]);

  const handleREChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 7) value = value.slice(0, 7);
    if (value.length > 6) {
      value = value.replace(/^(\d{6})(\d{1})/, '$1-$2');
    }
    setFormData({ ...formData, re: value });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 0) value = '(' + value;
    if (value.length > 3) value = value.replace(/^(\(\d{2})(\d)/, '$1) $2');
    if (value.length > 10) value = value.replace(/(\d{5})(\d{4})$/, '$1-$2');
    setFormData({ ...formData, phone: value });
  };

  const handleFileChange = (category: string, label: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFiles(prev => [
        ...prev.filter(f => f.label !== label), 
        {
          category,
          label,
          name: selectedFile.name,
          file: selectedFile 
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
        <button 
          onClick={onAdminClick} 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-all text-xs font-bold uppercase tracking-widest border border-slate-200"
        >
          Área do Advogado
        </button>
      </div>

      {/* Stepper ajustado para 3 passos */}
      <div className="mb-12 flex justify-between items-center relative max-w-sm mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col items-center z-10">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${step >= i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
              {i}
            </div>
          </div>
        ))}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-0"></div>
        <div className="absolute top-5 left-0 h-0.5 bg-indigo-600 transition-all duration-500 -z-0" style={{ width: `${(step - 1) * 50}%` }}></div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100">
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">1. Dados Funcionais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClasses} placeholder="Nome Completo" />
              <input required value={formData.re} onChange={handleREChange} className={inputClasses} placeholder="RE: 123456-7" maxLength={8} />
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClasses} placeholder="E-mail" />
              <input required value={formData.phone} onChange={handlePhoneChange} className={inputClasses} placeholder="Telefone/WhatsApp" maxLength={15} />
            </div>
            <button type="button" onClick={nextStep} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Próximo</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">2. Documentos Comuns</h2>
            <div className="space-y-4">
              {renderFileInput(FileCategory.COMMON, 'Identidade Funcional (RE)', 'Cópia frente e verso legível')}
              {renderFileInput(FileCategory.COMMON, 'Carteira de Habilitação - CNH', 'Exportar em PDF do Aplicativo CNH do Brasil')}
              {renderFileInput(FileCategory.COMMON, 'Último Holerite', 'Para comprovar o desconto ativo')}
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={prevStep} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Voltar</button>
              <button type="button" onClick={nextStep} className="flex-2 py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">Próximo</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">3. Revisão e Compromisso</h2>
            <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-sm text-red-700">
              <strong>AVISO:</strong> O cancelamento cessará o atendimento médico para você e dependentes. Esta ação solicita a cessação e o ressarcimento dos valores.
            </div>
            <label className="flex items-start gap-4 cursor-pointer p-4 rounded-xl border border-slate-200 bg-white">
              <input required type="checkbox" checked={formData.agreedToTerms} onChange={e => setFormData({...formData, agreedToTerms: e.target.checked})} className="mt-1 w-5 h-5 accent-indigo-600" />
              <p className="text-sm text-slate-700">Confirmo as informações e aceito a perda do benefício de saúde para fins de interrupção do desconto em folha.</p>
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
