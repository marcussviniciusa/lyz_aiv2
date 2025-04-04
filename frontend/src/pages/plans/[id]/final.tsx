import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { planAPI } from '../../../lib/api';

type FinalPlan = {
  diagnosis: string;
  treatment_plan: string;
  nutritional_recommendations: {
    foods_to_include: string;
    foods_to_avoid: string;
    meal_timing: string;
    supplements: string;
  };
  lifestyle_recommendations: {
    exercise: string;
    sleep: string;
    stress_management: string;
    other: string;
  };
  follow_up: string;
  additional_notes: string;
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
  ifm_matrix?: any;
  final_plan?: FinalPlan;
  professional_type: string;
};

const FinalPlanPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [finalPlan, setFinalPlan] = useState<FinalPlan>({
    diagnosis: '',
    treatment_plan: '',
    nutritional_recommendations: {
      foods_to_include: '',
      foods_to_avoid: '',
      meal_timing: '',
      supplements: '',
    },
    lifestyle_recommendations: {
      exercise: '',
      sleep: '',
      stress_management: '',
      other: '',
    },
    follow_up: '',
    additional_notes: '',
  });
  
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
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
        
        // Se já existe um plano final, preenche o formulário
        if (planData?.final_plan) {
          setFinalPlan(planData.final_plan);
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
      const missingSteps = [];
      
      if (!plan.questionnaire_data) missingSteps.push('questionário');
      if (!plan.lab_results) missingSteps.push('resultados laboratoriais');
      if (!plan.tcm_observations) missingSteps.push('observações TCM');
      if (!plan.timeline_data) missingSteps.push('timeline');
      if (!plan.ifm_matrix) missingSteps.push('matriz IFM');
      
      if (missingSteps.length > 0) {
        setError(`É necessário preencher: ${missingSteps.join(', ')} antes de gerar o plano final.`);
      }
    }
  }, [plan]);

  // Handlers para atualizar o estado do plano
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, subsection] = name.split('.');
      setFinalPlan(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof FinalPlan] as any,
          [subsection]: value
        }
      }));
    } else {
      setFinalPlan(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleGeneratePlan = async () => {
    if (!id) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      const response = await planAPI.generatePlan(id as string);
      
      const generatedPlan = response.data.plan?.final_plan;
      if (generatedPlan) {
        setFinalPlan(generatedPlan);
        setSuccessMessage('Plano gerado com sucesso!');
      } else {
        setError('Não foi possível gerar o plano. Tente novamente mais tarde.');
      }
    } catch (err: any) {
      setError('Erro ao gerar plano: ' + (err.message || 'Tente novamente mais tarde'));
      console.error('Error generating plan:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    try {
      setSaving(true);
      setSuccessMessage(null);
      setError(null);
      
      // O endpoint de geração do plano já salva os dados
      await planAPI.updateFinalPlan(id as string, finalPlan);
      
      setSuccessMessage('Plano final salvo com sucesso!');
      
      // Após o salvamento bem-sucedido, redirecionamos para a visualização do plano
      setTimeout(() => {
        router.push(`/plans/${id}`);
      }, 1500);
      
    } catch (err: any) {
      setError('Erro ao salvar plano final: ' + (err.message || 'Tente novamente mais tarde'));
      console.error('Error saving final plan:', err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout title="Carregando Plano Final - Lyz">
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

  // Verifica se todas as etapas anteriores foram preenchidas
  const missingPreviousSteps = !plan || (!plan.questionnaire_data || !plan.lab_results || !plan.tcm_observations || !plan.timeline_data || !plan.ifm_matrix);

  if (error && missingPreviousSteps) {
    return (
      <Layout title="Etapa Anterior Pendente - Lyz">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-yellow-700 mb-2">Etapas anteriores pendentes</h2>
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
              {plan?.questionnaire_data && plan?.lab_results && plan?.tcm_observations && plan?.timeline_data && !plan?.ifm_matrix && (
                <Link href={`/plans/${id}/ifm`} className="btn-primary">
                  Ir para Matriz IFM
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
    <Layout title="Plano Final - Lyz">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Plano Final</h1>
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

        {error && !missingPreviousSteps && (
          <div className="mb-6 bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Geração do Plano</h2>
              
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={generating || missingPreviousSteps}
                className={`btn-primary ${(generating || missingPreviousSteps) ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {generating ? 'Gerando...' : 'Gerar Plano com IA'}
              </button>
            </div>
            
            <p className="mt-2 text-sm text-gray-500">
              Clique no botão para gerar automaticamente um plano baseado em todas as informações fornecidas anteriormente. Você poderá editar o plano gerado conforme necessário.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Diagnóstico</h3>
                <textarea
                  name="diagnosis"
                  value={finalPlan.diagnosis}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Diagnóstico funcional integrado baseado em todas as análises"
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Plano de Tratamento</h3>
                <textarea
                  name="treatment_plan"
                  value={finalPlan.treatment_plan}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Visão geral da abordagem terapêutica e intervenções principais"
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recomendações Nutricionais</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alimentos a Incluir
                    </label>
                    <textarea
                      name="nutritional_recommendations.foods_to_include"
                      value={finalPlan.nutritional_recommendations.foods_to_include}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Alimentos recomendados e seus benefícios"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alimentos a Evitar
                    </label>
                    <textarea
                      name="nutritional_recommendations.foods_to_avoid"
                      value={finalPlan.nutritional_recommendations.foods_to_avoid}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Alimentos a serem limitados ou evitados"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequência e Horário das Refeições
                    </label>
                    <textarea
                      name="nutritional_recommendations.meal_timing"
                      value={finalPlan.nutritional_recommendations.meal_timing}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Orientações sobre frequência, horário e estrutura das refeições"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Suplementos
                    </label>
                    <textarea
                      name="nutritional_recommendations.supplements"
                      value={finalPlan.nutritional_recommendations.supplements}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Suplementos recomendados, dosagens e justificativas"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recomendações de Estilo de Vida</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exercícios
                    </label>
                    <textarea
                      name="lifestyle_recommendations.exercise"
                      value={finalPlan.lifestyle_recommendations.exercise}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Recomendações sobre atividade física e movimento"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sono
                    </label>
                    <textarea
                      name="lifestyle_recommendations.sleep"
                      value={finalPlan.lifestyle_recommendations.sleep}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Recomendações para melhorar a qualidade do sono"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gerenciamento de Estresse
                    </label>
                    <textarea
                      name="lifestyle_recommendations.stress_management"
                      value={finalPlan.lifestyle_recommendations.stress_management}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Técnicas de redução de estresse e práticas de consciência plena"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Outras Recomendações
                    </label>
                    <textarea
                      name="lifestyle_recommendations.other"
                      value={finalPlan.lifestyle_recommendations.other}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Outras sugestões para melhorar a qualidade de vida"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Acompanhamento</h3>
                <textarea
                  name="follow_up"
                  value={finalPlan.follow_up}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Plano de acompanhamento, frequência de consultas e exames recomendados"
                />
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Observações Adicionais</h3>
                <textarea
                  name="additional_notes"
                  value={finalPlan.additional_notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Quaisquer outras informações ou recomendações relevantes"
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
                {saving ? 'Salvando...' : 'Salvar Plano'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default FinalPlanPage;
