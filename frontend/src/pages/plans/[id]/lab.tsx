import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { planAPI } from '../../../lib/api';

type PlanData = {
  id: string;
  user_id: number;
  patient_data: {
    name: string;
    age?: number;
    gender?: string;
  };
  lab_results?: {
    file_url: string;
    notes: string;
    analyzed_data?: any;
  };
  professional_type: string;
  questionnaire_data?: any;
};

const LabResultsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Busca os dados do plano quando o componente é montado
  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await planAPI.getPlanById(id as string);
        const planData = response.data.plan || null;
        
        setPlan(planData);
        
        // Se já existem notas de laboratório, preenche o estado
        if (planData?.lab_results?.notes) {
          setNotes(planData.lab_results.notes);
        }
        
        setError(null);
      } catch (err: any) {
        setError('Erro ao carregar detalhes do plano: ' + (err.message || 'Tente novamente mais tarde'));
        console.error('Error fetching plan details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user && id) {
      fetchPlanDetails();
    }
  }, [user, id]);

  // Verifica se o plano tem dados de questionário preenchidos
  useEffect(() => {
    if (plan && !plan.questionnaire_data) {
      setError('É necessário preencher o questionário antes de enviar os resultados laboratoriais');
    }
  }, [plan]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Verificar o tipo e tamanho do arquivo
      if (!['application/pdf', 'image/jpeg', 'image/png'].includes(file.type)) {
        setError('Por favor, selecione um arquivo PDF, JPEG ou PNG');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setError('O arquivo deve ter no máximo 5MB');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
      
      // Cria URL para preview se for uma imagem
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    // Verifica se há um arquivo selecionado
    if (!selectedFile && !plan?.lab_results?.file_url) {
      setError('Por favor, selecione um arquivo de resultados laboratoriais');
      return;
    }
    
    try {
      setUploading(true);
      setSuccessMessage(null);
      setError(null);
      
      // Se há um arquivo selecionado, faz o upload
      if (selectedFile) {
        await planAPI.uploadLabResults(id as string, selectedFile);
      }
      
      // Busca o plano atualizado
      const response = await planAPI.getPlanById(id as string);
      setPlan(response.data.plan || null);
      
      setSuccessMessage('Resultados laboratoriais enviados com sucesso!');
      
      // Após o salvamento bem-sucedido, redirecionamos para a próxima etapa
      setTimeout(() => {
        router.push(`/plans/${id}/tcm`);
      }, 1500);
      
    } catch (err: any) {
      setError('Erro ao enviar resultados: ' + (err.message || 'Tente novamente mais tarde'));
      console.error('Error uploading lab results:', err);
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout title="Carregando Resultados Laboratoriais - Lyz">
        <div className="flex justify-center py-20">
          <div className="text-center">
            <div className="spinner-border h-10 w-10 text-primary-600 animate-spin"></div>
            <p className="mt-4 text-lg text-gray-600">Carregando dados...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  if (error && !plan) {
    return (
      <Layout title="Erro - Lyz">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-red-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-red-700 mb-2">Ocorreu um erro</h2>
            <p className="text-red-600">{error}</p>
            <div className="mt-4">
              <Link href="/plans" className="text-primary-600 font-medium hover:text-primary-500">
                ← Voltar para a lista de planos
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Resultados Laboratoriais - Lyz">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Resultados Laboratoriais</h1>
            <p className="text-sm text-gray-500 mt-1">
              Paciente: {plan?.patient_data?.name || ''}
            </p>
          </div>
          <Link href={`/plans/${id}`} className="btn-outline">
            Voltar ao Plano
          </Link>
        </div>

        {successMessage && (
          <div className="mb-6 bg-green-50 p-4 rounded-md">
            <p className="text-green-700">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {plan && !plan.questionnaire_data ? (
          <div className="bg-yellow-50 p-6 rounded-lg mb-6">
            <h2 className="text-lg font-medium text-yellow-700 mb-2">Etapa anterior pendente</h2>
            <p className="text-yellow-600 mb-4">É necessário preencher o questionário antes de enviar os resultados laboratoriais.</p>
            <Link href={`/plans/${id}/questionnaire`} className="btn-primary">
              Ir para o Questionário
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Arquivo de Resultados</h2>
                <div className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  
                  {plan?.lab_results?.file_url ? (
                    <div className="text-center">
                      <div className="mb-4">
                        <svg className="mx-auto h-12 w-12 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <p className="mt-1 text-sm text-gray-500">
                          Arquivo já enviado
                        </p>
                      </div>
                      <a 
                        href={plan.lab_results.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-outline text-sm"
                      >
                        Visualizar Arquivo
                      </a>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="ml-2 btn-text text-sm"
                      >
                        Substituir
                      </button>
                    </div>
                  ) : previewUrl ? (
                    <div className="text-center">
                      <div className="mb-4">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="mx-auto h-40 object-contain" 
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          {selectedFile?.name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="btn-text text-sm"
                      >
                        Remover
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="mt-1 text-sm text-gray-500">
                        Arraste e solte um arquivo, ou
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 btn-text"
                      >
                        Selecione um arquivo
                      </button>
                      <p className="mt-1 text-xs text-gray-500">
                        PDF, PNG ou JPG até 5MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Notas sobre os Resultados</h2>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Descreva observações importantes sobre os resultados laboratoriais, destacando valores fora da referência ou que mereçam atenção."
                />
              </div>

              {plan?.lab_results?.analyzed_data && (
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Análise dos Resultados</h2>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-md font-medium text-gray-900 mb-2">Análise IA</h3>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(plan.lab_results.analyzed_data, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end space-x-4">
              <Link 
                href={`/plans/${id}`}
                className="btn-outline"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={uploading || (!selectedFile && !plan?.lab_results?.file_url)}
                className="btn-primary"
              >
                {uploading ? 'Enviando...' : 'Salvar e Continuar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default LabResultsPage;
