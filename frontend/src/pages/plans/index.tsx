import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '../../components/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { planAPI } from '../../lib/api';

type Plan = {
  id: string;
  patient_data: {
    name: string;
    age?: number;
    gender?: string;
  };
  professional_type: string;
  created_at: string;
  updated_at: string;
};

const PlansPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user && !authLoading) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await planAPI.getUserPlans();
        setPlans(response.data.plans || []);
        setError(null);
      } catch (err: any) {
        setError('Erro ao carregar planos: ' + (err.message || 'Tente novamente mais tarde'));
        console.error('Error fetching plans:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchPlans();
    }
  }, [user]);

  if (authLoading) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <Layout title="Meus Planos - Lyz">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Meus Planos</h1>
            <Link href="/plans/new" className="btn-primary">
              Criar Novo Plano
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="text-center">
                <div className="spinner-border h-8 w-8 text-primary-600 animate-spin"></div>
                <p className="mt-3 text-gray-600">Carregando planos...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-red-600">{error}</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-500 mb-4">Você ainda não criou nenhum plano.</p>
              <Link href="/plans/new" className="btn-primary">
                Criar seu primeiro plano
              </Link>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden rounded-md">
              <ul className="divide-y divide-gray-200">
                {plans.map((plan) => (
                  <li key={plan.id}>
                    <Link href={`/plans/${plan.id}`} className="block hover:bg-gray-50">
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-medium text-primary-600 truncate">
                            {plan.patient_data.name}
                          </p>
                          <div className="ml-2 flex-shrink-0 flex">
                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {plan.professional_type}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 sm:flex sm:justify-between">
                          <div className="sm:flex">
                            <p className="flex items-center text-sm text-gray-500">
                              {plan.patient_data.gender && plan.patient_data.age ? (
                                <>
                                  {plan.patient_data.gender === 'female' ? 'Feminino' : 'Masculino'},{' '}
                                  {plan.patient_data.age} anos
                                </>
                              ) : (
                                'Dados do paciente'
                              )}
                            </p>
                          </div>
                          <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                            <p>
                              Criado em{' '}
                              {new Date(plan.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default PlansPage;
