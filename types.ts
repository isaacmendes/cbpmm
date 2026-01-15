
export interface OfficerSubmission {
  id: string;
  name: string;
  re: string;
  email: string;
  phone: string;
  status: 'Pendente' | 'Em Análise' | 'Concluído';
  createdAt: string;
  files: {
    category: string;
    name: string;
    url: string;
  }[];
  isJudicial: boolean;
  agreedToTerms: boolean;
}

export enum ViewMode {
  CLIENT = 'CLIENT',
  ADMIN = 'ADMIN'
}

export enum FileCategory {
  COMMON = 'Documentos Comuns',
  ADMINISTRATIVE = 'Via Administrativa',
  JUDICIAL = 'Via Judicial'
}
