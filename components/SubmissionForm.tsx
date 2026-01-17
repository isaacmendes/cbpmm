
import React, { useState } from 'react';
import { OfficerSubmission, FileCategory } from '../types.ts';
import { supabase } from '../lib/supabase.ts';

interface SubmissionFormProps {
  onSubmit: (data: any) => void;
  onAdminClick: () => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSubmit, onAdminClick }) => {
  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    re: '',
    email: '',
    phone: '',
    isJudicial: true,
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

  const validateStep1 = () => {
    if (!formData.name || !formData.re || !formData.email || !formData.phone) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const requiredLabels = [
      'Identidade Funcional (RE)',
      'Carteira de Habilitação - CNH',
      'Último Holerite'
    ];
    const missingFiles = requiredLabels.filter(label => !getFileForLabel(label));
    return missingFiles.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1() || !validateStep2() || !formData.agreedToTerms) {
      alert("Verifique os campos obrigatórios e a concordância com os termos.");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedFilesMetadata = [];

      for (const item of files) {
        const fileExt = item.name.split('.').pop();
        const fileName = `${formData.re}_${Date.now()}_${item.label.replace(/\s+/g, '_')}.${fileExt}`;
        const filePath = `submissions/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, item.file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        uploadedFilesMetadata.push({
          category: item.category,
          name: item.name,
          url: urlData.publicUrl
        });
      }

      onSubmit({ ...formData, files: uploadedFilesMetadata });
    } catch (error) {
      console.error('Erro no upload:', error);
      alert('Falha ao enviar arquivos. Verifique se o bucket "documents" existe no Supabase e tem permissões públicas.');
    } finally {
      setIsUploading(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white text-slate-900 font-medium";

  const renderFileInput = (category: string, label: string, hint: string) => {
    const selectedFile = getFileForLabel(label);
    return (
      <div className={`p-4 border border-dashed rounded-xl transition-all ${selectedFile ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-300'}`}>
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-700">{label} *</p>
            <p className="text-xs text-slate-400 truncate">{selectedFile ? selectedFile.name : hint}</p>
          </div>
          <label className="cursor-pointer px-4 py-2 rounded-lg border text-sm font-bold bg-white text-indigo-600 hover:bg-indigo-50 transition-all shrink-0">
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
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Portal CBPM 2026</h1>
        <button onClick={onAdminClick} className="px-4 py-2 rounded-full bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-widest border border-slate-200">Área do Advogado</button>
      </div>

      <div className="mb-12 flex justify-between items-center relative max-w-sm mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold z-10 ${step >= i ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{i}</div>
        ))}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-200 -z-0"></div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">1. Dados Funcionais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={inputClasses} placeholder="Nome Completo *" />
              <input required value={formData.re} onChange={handleREChange} className={inputClasses} placeholder="RE: 123456-7 *" />
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={inputClasses} placeholder="E-mail *" />
              <input required value={formData.phone} onChange={handlePhoneChange} className={inputClasses} placeholder="WhatsApp *" />
            </div>
            <button type="button" onClick={() => validateStep1() && setStep(2)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold">Próximo</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">2. Documentos</h2>
            <div className="space-y-4">
              {renderFileInput(FileCategory.COMMON, 'Identidade Funcional (RE)', 'Foto legível')}
              {renderFileInput(FileCategory.COMMON, 'Carteira de Habilitação - CNH', 'PDF ou Foto')}
              {renderFileInput(FileCategory.COMMON, 'Último Holerite', 'PDF ou Foto')}
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold">Voltar</button>
              <button type="button" onClick={() => validateStep2() ? setStep(3) : alert('Anexe todos os documentos.')} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold">Próximo</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-slate-800">3. Finalização</h2>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-sm text-amber-900 leading-relaxed">
              <strong>ATENÇÃO:</strong> A confirmação resultará na cessação do desconto CBPM. Os honorários são de <strong>R$ 200,00</strong> pagos após a cessação.
            </div>
            <label className="flex items-start gap-3 cursor-pointer p-4 border rounded-xl hover:bg-slate-50 transition-all">
              <input required type="checkbox" checked={formData.agreedToTerms} onChange={e => setFormData({...formData, agreedToTerms: e.target.checked})} className="mt-1 w-5 h-5 accent-indigo-600" />
              <span className="text-sm text-slate-700">Declaro ciência da perda do benefício e concordo com os honorários advocatícios após a cessação. *</span>
            </label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold">Voltar</button>
              <button type="submit" disabled={isUploading} className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg ${isUploading ? 'bg-slate-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                {isUploading ? 'Enviando...' : 'Finalizar'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SubmissionForm;
