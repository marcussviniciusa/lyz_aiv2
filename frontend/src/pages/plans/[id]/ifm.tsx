import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { planAPI } from '../../../lib/api';

type MatrixCategory = {
  name: string;
  items: Array<{
    name: string;
    value: 0 | 1 | 2 | 3;
    notes?: string;
  }>;
  notes?: string;
};

type IFMMatrix = {
  assimilation: MatrixCategory;
  defense_repair: MatrixCategory;
  energy: MatrixCategory;
  biotransformation_elimination: MatrixCategory;
  transport: MatrixCategory;
  communication: MatrixCategory;
  structural_integrity: MatrixCategory;
  notes: string;
};

type PlanData = {
  id: string;
  user_id: number;
  patient_data: {
    name: string;
    age?: number;
    gender?: string;
  };
  questionnaire_data?: any;
  lab_results?: any;
  tcm_observations?: any;
  timeline_data?: any;
  ifm_matrix?: IFMMatrix;
  professional_type: string;
};

const defaultCategoryItems = [
  { name: 'Item 1', value: 0 },
  { name: 'Item 2', value: 0 },
  { name: 'Item 3', value: 0 },
  { name: 'Item 4', value: 0 },
  { name: 'Item 5', value: 0 },
];

const defaultMatrix: IFMMatrix = {
  assimilation: {
    name: 'Assimilação',
    items: [
      { name: 'Digestão', value: 0 },
      { name: 'Absorção', value: 0 },
      { name: 'Microbioma/Disbiose', value: 0 },
      { name: 'Permeabilidade', value: 0 },
      { name: 'Alergia/Intolerância', value: 0 },
    ],
    notes: '',
  },
  defense_repair: {
    name: 'Defesa e Reparação',
    items: [
      { name: 'Imunidade', value: 0 },
      { name: 'Inflamação', value: 0 },
      { name: 'Infecção', value: 0 },
      { name: 'Estresse Oxidativo', value: 0 },
      { name: 'Cicatrização', value: 0 },
    ],
    notes: '',
  },
  energy: {
    name: 'Energia',
    items: [
      { name: 'Produção Energética', value: 0 },
      { name: 'Função Mitocondrial', value: 0 },
      { name: 'Atividade Tiroidiana', value: 0 },
      { name: 'Açúcar Sanguíneo', value: 0 },
      { name: 'Condicionamento Físico', value: 0 },
    ],
    notes: '',
  },
  biotransformation_elimination: {
    name: 'Biotransformação e Eliminação',
    items: [
      { name: 'Toxicidade', value: 0 },
      { name: 'Desintoxicação', value: 0 },
      { name: 'Função Hepática', value: 0 },
      { name: 'Eliminação', value: 0 },
      { name: 'Carga Tóxica Acumulada', value: 0 },
    ],
    notes: '',
  },
  transport: {
    name: 'Transporte',
    items: [
      { name: 'Cardiovascular', value: 0 },
      { name: 'Linfática', value: 0 },
      { name: 'Circulação', value: 0 },
      { name: 'Respiração', value: 0 },
      { name: 'Permeabilidade Celular', value: 0 },
    ],
    notes: '',
  },
  communication: {
    name: 'Comunicação',
    items: [
      { name: 'Hormônios', value: 0 },
      { name: 'Neurotransmissores', value: 0 },
      { name: 'Sistema Imune', value: 0 },
      { name: 'Sinais Celulares', value: 0 },
      { name: 'Equilíbrio', value: 0 },
    ],
    notes: '',
  },
  structural_integrity: {
    name: 'Integridade Estrutural',
    items: [
      { name: 'Membranas', value: 0 },
      { name: 'Sistema Esquelético', value: 0 },
      { name: 'Postura/Mecânica', value: 0 },
      { name: 'Sistema Tegumentar', value: 0 },
      { name: 'Sistema Muscular', value: 0 },
    ],
    notes: '',
  },
  notes: '',
};

const IFMMatrixPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [matrix, setMatrix] = useState<IFMMatrix>(defaultMatrix);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
        
        // Se já existem dados da matriz IFM, preenche o formulário
        if (planData?.ifm_matrix) {
          setMatrix(planData.ifm_matrix);
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

  // Verifica se as etapas anteriores foram preenchidas
  useEffect(() => {
    if (plan) {
      if (!plan.questionnaire_data) {
        setError('É necessário preencher o questionário antes da matriz IFM');
      } else if (!plan.lab_results) {
        setError('É necessário enviar os resultados laboratoriais antes da matriz IFM');
      } else if (!plan.tcm_observations) {
        setError('É necessário preencher as observações TCM antes da matriz IFM');
      } else if (!plan.timeline_data) {
        setError('É necessário preencher a timeline antes da matriz IFM');
      }
    }
  }, [plan]);

  // Handlers para atualizar o estado da matriz
  const handleItemValueChange = (category: keyof Omit<IFMMatrix, 'notes'>, index: number, value: 0 | 1 | 2 | 3) => {
    setMatrix(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        items: prev[category].items.map((item, i) => 
          i === index ? { ...item, value } : item
        )
      }
    }));
  };

  const handleCategoryNotesChange = (category: keyof Omit<IFMMatrix, 'notes'>, notes: string) => {
    setMatrix(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        notes
      }
    }));
  };

  const handleGeneralNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMatrix(prev => ({
      ...prev,
      notes: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    try {
      setSaving(true);
      setSuccessMessage(null);
      setError(null);
      
      await planAPI.updateIFMMatrix(id as string, matrix);
      
      setSuccessMessage('Matriz IFM salva com sucesso!');
      
      // Após o salvamento bem-sucedido, redirecionamos para a próxima etapa
      setTimeout(() => {
        router.push(`/plans/${id}/final`);
      }, 1500);
      
    } catch (err: any) {
      setError('Erro ao salvar matriz IFM: ' + (err.message || 'Tente novamente mais tarde'));
      console.error('Error saving IFM matrix:', err);
    } finally {
      setSaving(false);
    }
  };

  const renderValueSelector = (category: keyof Omit<IFMMatrix, 'notes'>, index: number, value: 0 | 1 | 2 | 3) => {
    return (
      <div className="flex space-x-1">
        {[0, 1, 2, 3].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => handleItemValueChange(category, index, val as 0 | 1 | 2 | 3)}
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
              ${value === val 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {val}
          </button>
        ))}
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <Layout title="Carregando Matriz IFM - Lyz">
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

  if (error && (!plan || (!plan.questionnaire_data || !plan.lab_results || !plan.tcm_observations || !plan.timeline_data))) {
    return (
      <Layout title="Etapa Anterior Pendente - Lyz">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-yellow-700 mb-2">Etapa anterior pendente</h2>
            <p className="text-yellow-600 mb-4">{error}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {!plan?.questionnaire_data && (
                <Link href={`/plans/${id}/questionnaire`} className="btn-primary">
                  Ir para o Questionário
                </Link>
              )}
              {plan?.questionnaire_data && !plan?.lab_results && (
                <Link href={`/plans/${id}/lab`} className="btn-primary">
                  Ir para Resultados Laboratoriais
                </Link>
              )}
              {plan?.questionnaire_data && plan?.lab_results && !plan?.tcm_observations && (
                <Link href={`/plans/${id}/tcm`} className="btn-primary">
                  Ir para Observações TCM
                </Link>
              )}
              {plan?.questionnaire_data && plan?.lab_results && plan?.tcm_observations && !plan?.timeline_data && (
                <Link href={`/plans/${id}/timeline`} className="btn-primary">
                  Ir para Timeline
                </Link>
              )}
              <Link href={`/plans/${id}`} className="btn-outline">
                Voltar ao Plano
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Matriz IFM - Lyz">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Matriz IFM</h1>
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

        {error && plan?.questionnaire_data && plan?.lab_results && plan?.tcm_observations && plan?.timeline_data && (
          <div className="mb-6 bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Legenda</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium mr-2">0</div>
                <span>Sem impacto</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium mr-2">1</div>
                <span>Impacto leve</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-xs font-medium mr-2">2</div>
                <span>Impacto moderado</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-xs font-medium mr-2">3</div>
                <span>Impacto severo</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-8">
              {(Object.keys(matrix) as Array<keyof IFMMatrix>).filter(key => key !== 'notes').map((category) => (
                <div key={category} className="border border-gray-200 rounded-md p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">{matrix[category].name}</h3>
                  
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Impacto
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {matrix[category].items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {renderValueSelector(category, index, item.value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações sobre {matrix[category].name}
                    </label>
                    <textarea
                      value={matrix[category].notes}
                      onChange={(e) => handleCategoryNotesChange(category, e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder={`Observações sobre ${matrix[category].name.toLowerCase()}`}
                    />
                  </div>
                </div>
              ))}

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Observações Gerais</h3>
                <textarea
                  value={matrix.notes}
                  onChange={handleGeneralNotesChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Observações gerais sobre a matriz IFM e suas implicações para o plano de tratamento"
                />
              </div>
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
                disabled={saving}
                className="btn-primary"
              >
                {saving ? 'Salvando...' : 'Salvar e Continuar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default IFMMatrixPage;
