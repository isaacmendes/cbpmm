
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
      if (selectedFile.size > 15 * 1024 * 1024) {
        alert("Arquivo muito pesado. O limite é 15MB.");
        return;
      }
      setFiles(prev => [
        ...prev.filter(f => f.label !== label), 
        { category, label, name: selectedFile.name, file: selectedFile }
      ]);
    }
  };

  const getFileForLabel = (label: string) => files.find(f => f.label === label);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.re || !formData.agreedToTerms) {
      alert("Preencha Nome, RE e aceite os termos.");
      return;
    }

    if (files.length < 3) {
      alert("Por favor, anexe todos os 3 documentos obrigatórios.");
      return;
    }

    setIsUploading(true);
    try {
      const uploadedFilesMetadata = [];
      const cleanRE = formData.re.replace(/\D/g, '');

      for (const item of files) {
        const fileExt = item.name.split('.').pop();
        const timestamp = Date.now();
        // Sanitização profunda do nome para o Storage
        const safeLabel = item.label.toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]/g, '_');
        
        const filePath = `${cleanRE}/${timestamp}_${safeLabel}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, item.file, {
            contentType: item.file.type,
            upsert: true
          });

        if (uploadError) {
          throw new Error(`Erro no arquivo ${item.label}: ${uploadError.message}`);
        }

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
    } catch (error: any) {
      alert(`Erro no protocolo: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const renderFileInput = (category: string, label: string, hint: string) => {
    const selectedFile = getFileForLabel(label);
    return (
      <div className={`p-4 border-2 border-dashed rounded-2xl transition-all ${selectedFile ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-slate-50/50'}`}>
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-800 text-sm">{label} *</p>
            <p className="text-[10px] text-slate-500 truncate">{selectedFile ? selectedFile.name : hint}</p>
          </div>
          <label className="cursor-pointer px-4 py-2 rounded-xl border-2 text-[10px] font-black uppercase tracking-wider bg-white text-indigo-600 hover:border-indigo-600 transition-all shrink-0">
            {selectedFile ? 'Trocar' : 'Anexar'}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileChange(category, label, e)} />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">Portal CBPM 2026</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-6">Assessoria para Oficiais PM</p>
        <button onClick={onAdminClick} className="px-6 py-2 rounded-full bg-slate-200/50 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 transition-all">Acesso Restrito</button>
      </div>

      <div className="mb-10 flex justify-between items-center relative max-w-[280px] mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black z-10 transition-all ${step >= i ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border-2 border-slate-100 text-slate-300'}`}>{i}</div>
        ))}
        <div className="absolute top-6 left-0 w-full h-1 bg-slate-100 -z-0"></div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100">
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Identificação</h2>
            <div className="grid grid-cols-1 gap-4">
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-indigo-600 outline-none transition-all font-medium" placeholder="Nome Completo" />
              <input required value={formData.re} onChange={handleREChange} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-indigo-600 outline-none transition-all font-medium" placeholder="RE Militar" />
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-indigo-600 outline-none transition-all font-medium" placeholder="E-mail" />
              <input required value={formData.phone} onChange={handlePhoneChange} className="w-full px-6 py-4 rounded-2xl border-2 border-slate-50 focus:border-indigo-600 outline-none transition-all font-medium" placeholder="WhatsApp" />
            </div>
            <button type="button" onClick={() => step < 3 && setStep(2)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Continuar</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Documentação</h2>
            <div className="space-y-4">
              {renderFileInput(FileCategory.COMMON, 'Identidade Funcional (RE)', 'Frente e verso nítidos')}
              {renderFileInput(FileCategory.COMMON, 'Carteira de Habilitação - CNH', 'Pode ser o print da CNH Digital')}
              {renderFileInput(FileCategory.COMMON, 'Último Holerite', 'Disponível no Portal do Militar')}
            </div>
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-50 text-slate-500 rounded-2xl font-bold hover:bg-slate-100 transition-all">Voltar</button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Próximo</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Assinatura Digital</h2>
            <div className="bg-indigo-50 p-6 rounded-[2rem] border-2 border-indigo-100 text-xs text-indigo-900 leading-relaxed font-medium">
              <p className="font-black text-sm mb-3 text-indigo-700">TERMOS JURÍDICOS:</p>
              <p className="mb-2">• Ao prosseguir, você solicita a cessação definitiva do desconto CBPM.</p>
              <p className="mb-2">• <strong>Honorários:</strong> Valor de R$ 200,00 pago uma única vez via PIX.</p>
              <p>• O boleto/chave PIX será enviado somente após a confirmação da parada do desconto em seu holerite.</p>
            </div>
            <label className="flex items-start gap-4 cursor-pointer p-6 border-2 border-slate-100 rounded-3xl hover:border-indigo-600 transition-all">
              <input required type="checkbox" checked={formData.agreedToTerms} onChange={e => setFormData({...formData, agreedToTerms: e.target.checked})} className="mt-1 w-6 h-6 accent-indigo-600 rounded-lg" />
              <span className="text-xs text-slate-600 font-bold leading-tight">Declaro estar ciente de que perderei a assistência médica da CBPM e concordo com os honorários advocatícios descritos acima. *</span>
            </label>
            <div className="flex gap-4">
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-5 bg-slate-50 text-slate-500 rounded-2xl font-bold">Voltar</button>
              <button type="submit" disabled={isUploading} className={`flex-1 py-5 rounded-2xl font-black text-white shadow-xl transition-all ${isUploading ? 'bg-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'}`}>
                {isUploading ? 'Protocolando...' : 'Finalizar Pedido'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SubmissionForm;
