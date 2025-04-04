import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { planAPI } from '../../../lib/api';

type TCMObservations = {
  tongue: {
    color: string;
    coating: string;
    shape: string;
    moisture: string;
    notes: string;
  };
  pulse: {
    rate: string;
    strength: string;
    rhythm: string;
    quality: string;
    notes: string;
  };
  pattern_diagnosis: string;
  treatment_principles: string;
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
  tcm_observations?: TCMObservations;
  professional_type: string;
};

const TCMObservationsPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [formData, setFormData] = useState<TCMObservations>({
    tongue: {
      color: '',
      coating: '',
      shape: '',
      moisture: '',
      notes: '',
    },
    pulse: {
      rate: '',
      strength: '',
      rhythm: '',
      quality: '',
      notes: '',
    },
    pattern_diagnosis: '',
    treatment_principles: '',
    additional_notes: '',
  });
  
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
        
        // Se já existem observações TCM, preenche o formulário
        if (planData?.tcm_observations) {
          setFormData(planData.tcm_observations);
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
        setError('É necessário preencher o questionário antes das observações TCM');
      } else if (!plan.lab_results) {
        setError('É necessário enviar os resultados laboratoriais antes das observações TCM');
      }
    }
  }, [plan]);

  // Handlers para atualizar o estado do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof TCMObservations] as any,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    try {
      setSaving(true);
      setSuccessMessage(null);
      setError(null);
      
      await planAPI.updateTCM(id as string, formData);
      
      setSuccessMessage('Observações TCM salvas com sucesso!');
      
      // Após o salvamento bem-sucedido, redirecionamos para a próxima etapa
      setTimeout(() => {
        router.push(`/plans/${id}/timeline`);
      }, 1500);
      
    } catch (err: any) {
      setError('Erro ao salvar observações TCM: ' + (err.message || 'Tente novamente mais tarde'));
      console.error('Error saving TCM observations:', err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout title="Carregando Observações TCM - Lyz">
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

  if (error && (!plan || (!plan.questionnaire_data || !plan.lab_results))) {
    return (
      <Layout title="Etapa Anterior Pendente - Lyz">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-yellow-700 mb-2">Etapa anterior pendente</h2>
            <p className="text-yellow-600 mb-4">{error}</p>
            <div className="mt-4 flex space-x-4">
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
    <Layout title="Observações TCM - Lyz">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Observações TCM</h1>
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

        {error && plan?.questionnaire_data && plan?.lab_results && (
          <div className="mb-6 bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Observação da Língua</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cor
                  </label>
                  <input
                    type="text"
                    name="tongue.color"
                    value={formData.tongue.color}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Pálida, vermelha, púrpura, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saburra
                  </label>
                  <input
                    type="text"
                    name="tongue.coating"
                    value={formData.tongue.coating}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Fina, grossa, branca, amarela, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma
                  </label>
                  <input
                    type="text"
                    name="tongue.shape"
                    value={formData.tongue.shape}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Inchada, fina, fissuras, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Umidade
                  </label>
                  <input
                    type="text"
                    name="tongue.moisture"
                    value={formData.tongue.moisture}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Seca, úmida, pegajosa, etc."
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações adicionais sobre a língua
                </label>
                <textarea
                  name="tongue.notes"
                  value={formData.tongue.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Detalhes relevantes sobre marcas, áreas específicas, etc."
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Observação do Pulso</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Frequência
                  </label>
                  <input
                    type="text"
                    name="pulse.rate"
                    value={formData.pulse.rate}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Lento, rápido, normal, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Força
                  </label>
                  <input
                    type="text"
                    name="pulse.strength"
                    value={formData.pulse.strength}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Forte, fraco, vazio, cheio, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ritmo
                  </label>
                  <input
                    type="text"
                    name="pulse.rhythm"
                    value={formData.pulse.rhythm}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Regular, irregular, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualidade
                  </label>
                  <input
                    type="text"
                    name="pulse.quality"
                    value={formData.pulse.quality}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Deslizante, em corda, firme, etc."
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações adicionais sobre o pulso
                </label>
                <textarea
                  name="pulse.notes"
                  value={formData.pulse.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Posições específicas, diferenças entre direita e esquerda, etc."
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Diagnóstico de Padrões</h2>
              <textarea
                name="pattern_diagnosis"
                value={formData.pattern_diagnosis}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Identificação dos padrões de desarmonia segundo a Medicina Tradicional Chinesa"
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Princípios de Tratamento</h2>
              <textarea
                name="treatment_principles"
                value={formData.treatment_principles}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Princípios e estratégias de tratamento baseados na MTC"
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Observações Adicionais</h2>
              <textarea
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Quaisquer outras observações relevantes para o diagnóstico e tratamento"
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
    </Layout>
  );
};

export default TCMObservationsPage;
