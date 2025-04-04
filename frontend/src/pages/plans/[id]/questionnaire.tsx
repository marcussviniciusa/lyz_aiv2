import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import { useAuth } from '../../../contexts/AuthContext';
import { planAPI } from '../../../lib/api';

// Definição dos tipos de dados para o questionário
type QuestionnaireData = {
  chiefComplaints: string;
  medicalHistory: string;
  familyHistory: string;
  medications: string;
  supplements: string;
  allergies: string;
  lifestyle: {
    diet: string;
    exercise: string;
    sleep: string;
    stress: string;
  };
  menstrualCycle?: {
    regular: boolean;
    duration: number;
    painLevel: number;
    flow: string;
    symptoms: string;
  };
  digestion: string;
  energy: string;
  additional: string;
};

type PlanData = {
  id: string;
  user_id: number;
  patient_data: {
    name: string;
    age?: number;
    gender?: string;
  };
  questionnaire_data?: QuestionnaireData;
  professional_type: string;
};

const QuestionnaireForm: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { id } = router.query;

  const [plan, setPlan] = useState<PlanData | null>(null);
  const [formData, setFormData] = useState<QuestionnaireData>({
    chiefComplaints: '',
    medicalHistory: '',
    familyHistory: '',
    medications: '',
    supplements: '',
    allergies: '',
    lifestyle: {
      diet: '',
      exercise: '',
      sleep: '',
      stress: '',
    },
    menstrualCycle: {
      regular: true,
      duration: 28,
      painLevel: 0,
      flow: 'normal',
      symptoms: '',
    },
    digestion: '',
    energy: '',
    additional: '',
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
        
        // Se já existem dados de questionário, preenche o formulário
        if (planData?.questionnaire_data) {
          setFormData(planData.questionnaire_data);
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

  // Handlers para atualizar o estado do formulário
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section as keyof QuestionnaireData] as any,
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

  const handleRadioChange = (name: string, value: boolean) => {
    setFormData(prev => ({
      ...prev,
      menstrualCycle: {
        ...prev.menstrualCycle as any,
        [name]: value
      }
    }));
  };

  const handleNumberChange = (name: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      menstrualCycle: {
        ...prev.menstrualCycle as any,
        [name]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    try {
      setSaving(true);
      setSuccessMessage(null);
      setError(null);
      
      await planAPI.updateQuestionnaire(id as string, { questionnaire_data: formData });
      
      setSuccessMessage('Questionário salvo com sucesso!');
      
      // Após o salvamento bem-sucedido, redirecionamos para a próxima etapa ou de volta para os detalhes do plano
      setTimeout(() => {
        router.push(`/plans/${id}/lab`);
      }, 1500);
      
    } catch (err: any) {
      setError('Erro ao salvar questionário: ' + (err.message || 'Tente novamente mais tarde'));
      console.error('Error saving questionnaire:', err);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <Layout title="Carregando Questionário - Lyz">
        <div className="flex justify-center py-20">
          <div className="text-center">
            <div className="spinner-border h-10 w-10 text-primary-600 animate-spin"></div>
            <p className="mt-4 text-lg text-gray-600">Carregando questionário...</p>
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
    <Layout title="Questionário do Plano - Lyz">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Questionário de Saúde</h1>
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

        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Queixas Principais</h2>
              <textarea
                name="chiefComplaints"
                value={formData.chiefComplaints}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Descreva as queixas principais do paciente"
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Histórico Médico</h2>
              <textarea
                name="medicalHistory"
                value={formData.medicalHistory}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Histórico de condições médicas, cirurgias, hospitalizações, etc."
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Histórico Familiar</h2>
              <textarea
                name="familyHistory"
                value={formData.familyHistory}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Condições médicas familiares relevantes"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Medicamentos Atuais</h2>
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Lista de medicamentos em uso"
                />
              </div>

              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Suplementos</h2>
                <textarea
                  name="supplements"
                  value={formData.supplements}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Vitaminas, minerais, ervas, etc."
                />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Alergias</h2>
              <textarea
                name="allergies"
                value={formData.allergies}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Alergias a medicamentos, alimentos ou ambientais"
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Estilo de Vida</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dieta
                  </label>
                  <textarea
                    name="lifestyle.diet"
                    value={formData.lifestyle.diet}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Padrões alimentares, restrições, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exercícios
                  </label>
                  <textarea
                    name="lifestyle.exercise"
                    value={formData.lifestyle.exercise}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Frequência, tipo, duração"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sono
                  </label>
                  <textarea
                    name="lifestyle.sleep"
                    value={formData.lifestyle.sleep}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Qualidade, duração, problemas"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estresse
                  </label>
                  <textarea
                    name="lifestyle.stress"
                    value={formData.lifestyle.stress}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Nível, fontes, técnicas de gerenciamento"
                  />
                </div>
              </div>
            </div>

            {plan?.patient_data?.gender === 'female' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Ciclo Menstrual</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      O ciclo é regular?
                    </label>
                    <div className="flex space-x-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          checked={formData.menstrualCycle?.regular === true}
                          onChange={() => handleRadioChange('regular', true)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2">Sim</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          checked={formData.menstrualCycle?.regular === false}
                          onChange={() => handleRadioChange('regular', false)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2">Não</span>
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duração média do ciclo (dias)
                    </label>
                    <input
                      type="number"
                      value={formData.menstrualCycle?.duration || 28}
                      onChange={(e) => handleNumberChange('duration', parseInt(e.target.value))}
                      min="1"
                      max="60"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nível de dor (0-10)
                    </label>
                    <input
                      type="number"
                      value={formData.menstrualCycle?.painLevel || 0}
                      onChange={(e) => handleNumberChange('painLevel', parseInt(e.target.value))}
                      min="0"
                      max="10"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fluxo
                    </label>
                    <select
                      value={formData.menstrualCycle?.flow || 'normal'}
                      onChange={(e) => {
                        setFormData(prev => ({
                          ...prev,
                          menstrualCycle: {
                            ...prev.menstrualCycle as any,
                            flow: e.target.value
                          }
                        }));
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="light">Leve</option>
                      <option value="normal">Normal</option>
                      <option value="heavy">Intenso</option>
                      <option value="irregular">Irregular</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sintomas associados
                  </label>
                  <textarea
                    value={formData.menstrualCycle?.symptoms || ''}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        menstrualCycle: {
                          ...prev.menstrualCycle as any,
                          symptoms: e.target.value
                        }
                      }));
                    }}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="TPM, cólicas, inchaço, mudanças de humor, etc."
                  />
                </div>
              </div>
            )}

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Digestão</h2>
              <textarea
                name="digestion"
                value={formData.digestion}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Padrões digestivos, problemas, frequência intestinal, etc."
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Níveis de Energia</h2>
              <textarea
                name="energy"
                value={formData.energy}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Flutuações de energia ao longo do dia, fadiga, etc."
              />
            </div>

            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Informações Adicionais</h2>
              <textarea
                name="additional"
                value={formData.additional}
                onChange={handleInputChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Qualquer outra informação relevante para o plano de saúde"
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

export default QuestionnaireForm;
