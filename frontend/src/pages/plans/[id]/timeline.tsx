import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { planAPI } from '../../../lib/api';

type TimelineEvent = {
  age: number;
  event: string;
  type: 'health' | 'life' | 'other';
  description: string;
};

type TimelineData = {
  events: TimelineEvent[];
  developmental_factors: string;
  environmental_factors: string;
  nutritional_factors: string;
  psychosocial_factors: string;
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
  timeline_data?: TimelineData;
  professional_type: string;
};

const TimelinePage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [formData, setFormData] = useState<TimelineData>({
    events: [],
    developmental_factors: '',
    environmental_factors: '',
    nutritional_factors: '',
    psychosocial_factors: '',
    additional_notes: '',
  });
  
  const [newEvent, setNewEvent] = useState<TimelineEvent>({
    age: 0,
    event: '',
    type: 'health',
    description: '',
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
        
        // Se já existem dados de timeline, preenche o formulário
        if (planData?.timeline_data) {
          setFormData(planData.timeline_data);
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
        setError('É necessário preencher o questionário antes da timeline');
      } else if (!plan.lab_results) {
        setError('É necessário enviar os resultados laboratoriais antes da timeline');
      } else if (!plan.tcm_observations) {
        setError('É necessário preencher as observações TCM antes da timeline');
      }
    }
  }, [plan]);

  // Handlers para atualizar o estado do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNewEventChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEvent(prev => ({
      ...prev,
      [name]: name === 'age' ? parseInt(value) || 0 : value
    }));
  };

  const addEvent = () => {
    if (!newEvent.event || newEvent.age < 0) {
      setError('Preencha o evento e idade corretamente');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      events: [...prev.events, { ...newEvent }]
    }));
    
    // Reset new event form
    setNewEvent({
      age: 0,
      event: '',
      type: 'health',
      description: '',
    });
    
    setError(null);
  };

  const removeEvent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    try {
      setSaving(true);
      setSuccessMessage(null);
      setError(null);
      
      await planAPI.updateTimeline(id as string, formData);
      
      setSuccessMessage('Timeline salva com sucesso!');
      
      // Após o salvamento bem-sucedido, redirecionamos para a próxima etapa
      setTimeout(() => {
        router.push(`/plans/${id}/ifm`);
      }, 1500);
      
    } catch (err: any) {
      setError('Erro ao salvar timeline: ' + (err.message || 'Tente novamente mais tarde'));
      console.error('Error saving timeline:', err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout title="Carregando Timeline - Lyz">
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

  if (error && (!plan || (!plan.questionnaire_data || !plan.lab_results || !plan.tcm_observations))) {
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
              {plan?.questionnaire_data && plan?.lab_results && !plan?.tcm_observations && (
                <Link href={`/plans/${id}/tcm`} className="btn-primary">
                  Ir para Observações TCM
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
    <Layout title="Timeline do Plano - Lyz">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Timeline</h1>
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

        {error && plan?.questionnaire_data && plan?.lab_results && plan?.tcm_observations && (
          <div className="mb-6 bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
          <div className="space-y-8">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Eventos da Linha do Tempo</h2>
              
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-md">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Idade
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={newEvent.age}
                      onChange={handleNewEventChange}
                      min="0"
                      max="120"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Idade"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo
                    </label>
                    <select
                      name="type"
                      value={newEvent.type}
                      onChange={handleNewEventChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="health">Saúde</option>
                      <option value="life">Vida</option>
                      <option value="other">Outro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Evento
                    </label>
                    <input
                      type="text"
                      name="event"
                      value={newEvent.event}
                      onChange={handleNewEventChange}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="Nome do evento"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addEvent}
                      className="btn-primary w-full"
                    >
                      Adicionar Evento
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    value={newEvent.description}
                    onChange={handleNewEventChange}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Descrição detalhada do evento"
                  />
                </div>
              </div>
              
              {formData.events.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Idade
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Evento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.events.map((event, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.age}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {event.type === 'health' ? 'Saúde' : 
                             event.type === 'life' ? 'Vida' : 'Outro'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {event.event}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {event.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeEvent(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remover
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-md">
                  <p className="text-gray-500">Nenhum evento adicionado ainda</p>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Fatores Desenvolvimentais</h2>
              <textarea
                name="developmental_factors"
                value={formData.developmental_factors}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Fatores relacionados ao desenvolvimento desde a infância"
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Fatores Ambientais</h2>
              <textarea
                name="environmental_factors"
                value={formData.environmental_factors}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Exposições ambientais, moradia, trabalho, etc."
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Fatores Nutricionais</h2>
              <textarea
                name="nutritional_factors"
                value={formData.nutritional_factors}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Mudanças na dieta ao longo do tempo, padrões alimentares, etc."
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Fatores Psicossociais</h2>
              <textarea
                name="psychosocial_factors"
                value={formData.psychosocial_factors}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Eventos de vida estressantes, traumas, relacionamentos, etc."
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Observações Adicionais</h2>
              <textarea
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Quaisquer outras observações relevantes para a timeline do paciente"
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

export default TimelinePage;
