
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
      <div className={`p-5 border border-slate-100 rounded-[1.5rem] transition-all duration-300 ${selectedFile ? 'bg-emerald-50/40 border-emerald-100' : 'bg-slate-50/50 hover:border-slate-200'}`}>
        <div className="flex justify-between items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-700 text-xs tracking-tight">{label} *</p>
            <p className="text-[10px] text-slate-400 mt-0.5 truncate">{selectedFile ? selectedFile.name : hint}</p>
          </div>
          <label className="cursor-pointer px-4 py-2 rounded-xl border border-slate-200 text-[9px] font-bold uppercase tracking-wider bg-white text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all shrink-0">
            {selectedFile ? 'Substituir' : 'Anexar'}
            <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleFileChange(category, label, e)} />
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-xl mx-auto px-6 py-16 animate-fadeIn">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-light text-slate-800 mb-2 tracking-tight">Portal <span className="font-bold">Desvinculação do CBPM</span></h1>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-8">Assessoria Especializada</p>
        <button onClick={onAdminClick} className="px-5 py-2 rounded-full border border-slate-200 text-slate-400 text-[9px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all">Área Restrita</button>
      </div>

      <div className="mb-12 flex justify-between items-center relative max-w-[240px] mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all duration-500 ${step >= i ? 'bg-slate-800 text-white' : 'bg-white border border-slate-100 text-slate-300'}`}>{i}</div>
        ))}
        <div className="absolute top-5 left-0 w-full h-[1px] bg-slate-100 -z-0"></div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-10 md:p-14 rounded-[3rem] shadow-xl shadow-slate-200/40 border border-slate-50">
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Identificação</h2>
              <p className="text-slate-400 text-xs">Informe seus dados básicos para início do processo.</p>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300" placeholder="Nome Completo" />
                <input required value={formData.re} onChange={handleREChange} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300" placeholder="RE Militar" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300" placeholder="E-mail" />
                <input required value={formData.phone} onChange={handlePhoneChange} className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-slate-200 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-300" placeholder="WhatsApp" />
              </div>
            </div>
            <button type="button" onClick={() => step < 3 && setStep(2)} className="w-full py-5 bg-slate-800 text-white rounded-[2rem] font-bold text-sm tracking-wide hover:bg-slate-900 transition-all shadow-lg shadow-slate-200 mt-4">Próximo Passo</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Anexos</h2>
              <p className="text-slate-400 text-xs">Formatos aceitos: JPG, PNG ou PDF (Max 15MB).</p>
            </div>
            <div className="space-y-4">
              {renderFileInput(FileCategory.COMMON, 'Identidade Funcional', 'Frente e verso visíveis')}
              {renderFileInput(FileCategory.COMMON, 'Carteira de Habilitação', 'CNH Digital ou física')}
              {renderFileInput(FileCategory.COMMON, 'Holerite Atualizado', 'Referente ao último mês')}
            </div>
            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-5 text-slate-400 text-sm font-bold hover:text-slate-600 transition-all">Voltar</button>
              <button type="button" onClick={() => setStep(3)} className="flex-1 py-5 bg-slate-800 text-white rounded-[2rem] font-bold text-sm hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">Continuar</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">3. Revisão, Compromisso e Honorários Advocatícios</h2>
            </div>
            
            <div className="space-y-5">
              <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100">
                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-2">ATENÇÃO</p>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  A confirmação desta solicitação resultará na desvinculação do CBPM e na cessação do desconto em folha referente ao benefício de saúde, para você e seus dependentes. A interrupção do desconto normalmente ocorre no mês subsequente ao protocolo do pedido.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                <p className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Honorários da Ação Judicial</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  O valor dos honorários advocatícios para o ajuizamento e acompanhamento da ação judicial é de <span className="font-bold text-slate-800">R$ 200,00 (duzentos reais)</span>.
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed mt-2">
                  A cobrança será realizada <span className="font-bold underline">somente após a efetiva cessação do desconto</span> no holerite, por meio de mensagem enviada ao WhatsApp informado no cadastro, contendo as orientações para pagamento.
                </p>
              </div>

              <div className="px-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Declaração de Ciência e Concordância</p>
                <label className="flex items-start gap-4 cursor-pointer group">
                  <input required type="checkbox" checked={formData.agreedToTerms} onChange={e => setFormData({...formData, agreedToTerms: e.target.checked})} className="mt-1 w-5 h-5 accent-slate-800 rounded-md border-slate-200 shadow-sm" />
                  <span className="text-[11px] text-slate-500 font-medium leading-relaxed group-hover:text-slate-800 transition-colors">
                    Declaro que revisei todas as informações prestadas, estou ciente da perda do benefício do CBPM e concordo com a cobrança dos honorários advocatícios no valor informado, após a cessação do desconto em folha. *
                  </span>
                </label>
              </div>

              <div className="pt-2 text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Assistência Jurídica Militar</p>
                <p className="text-[9px] text-slate-300 leading-relaxed">
                  Caso necessite de assessoria jurídica militar especializada para outros assuntos, entre em contato pelos canais oficiais.
                </p>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-5 text-slate-400 text-sm font-bold hover:text-slate-600 transition-all">Voltar</button>
              <button type="submit" disabled={isUploading} className={`flex-1 py-5 rounded-[2rem] font-bold text-sm text-white shadow-xl transition-all ${isUploading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900 shadow-slate-200'}`}>
                {isUploading ? 'Enviando...' : 'Confirmar e Enviar'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SubmissionForm;
