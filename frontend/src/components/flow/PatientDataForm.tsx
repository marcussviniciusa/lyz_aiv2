import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface PatientDataFormProps {
  onSubmit: (data: any) => void;
  onBack: () => void;
}

const PatientDataSchema = Yup.object().shape({
  name: Yup.string().required('Nome da paciente é obrigatório'),
  age: Yup.number()
    .required('Idade é obrigatória')
    .positive('Idade deve ser um número positivo')
    .integer('Idade deve ser um número inteiro'),
  email: Yup.string().email('Email inválido'),
  phone: Yup.string(),
  height: Yup.number()
    .positive('Altura deve ser um número positivo'),
  weight: Yup.number()
    .positive('Peso deve ser um número positivo'),
  menarche_age: Yup.number()
    .positive('Idade da menarca deve ser um número positivo')
    .integer('Idade da menarca deve ser um número inteiro'),
  cycle_length: Yup.number()
    .positive('Duração do ciclo deve ser um número positivo')
    .integer('Duração do ciclo deve ser um número inteiro'),
  period_length: Yup.number()
    .positive('Duração do período menstrual deve ser um número positivo')
    .integer('Duração do período menstrual deve ser um número inteiro'),
  is_menopausal: Yup.boolean(),
  main_complaints: Yup.string().required('Queixas principais são obrigatórias'),
  pregnancy_history: Yup.string(),
  medical_history: Yup.string(),
  family_history: Yup.string(),
  current_medications: Yup.string(),
  current_supplements: Yup.string(),
  sleep_quality: Yup.string(),
  exercise_routine: Yup.string(),
  stress_level: Yup.string(),
  treatment_goals: Yup.string().required('Objetivos do tratamento são obrigatórios'),
});

const PatientDataForm: React.FC<PatientDataFormProps> = ({ onSubmit, onBack }) => {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <div className="card-header">
          <h2 className="text-center text-xl font-bold text-gray-800">
            Dados da Paciente
          </h2>
        </div>
        <div className="card-body">
          <p className="text-gray-600 mb-6">
            Preencha as informações da paciente para personalização do plano cíclico.
          </p>

          <Formik
            initialValues={{
              name: '',
              age: '',
              email: '',
              phone: '',
              height: '',
              weight: '',
              menarche_age: '',
              cycle_length: '',
              period_length: '',
              is_menopausal: false,
              main_complaints: '',
              pregnancy_history: '',
              medical_history: '',
              family_history: '',
              current_medications: '',
              current_supplements: '',
              sleep_quality: '',
              exercise_routine: '',
              stress_level: '',
              treatment_goals: '',
            }}
            validationSchema={PatientDataSchema}
            onSubmit={onSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Informações Básicas */}
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2">
                      Informações Básicas
                    </h3>
                  </div>
                  
                  <div>
                    <label htmlFor="name" className="form-label">Nome Completo *</label>
                    <Field type="text" name="name" id="name" className="input-field" />
                    <ErrorMessage name="name" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="age" className="form-label">Idade *</label>
                    <Field type="number" name="age" id="age" className="input-field" />
                    <ErrorMessage name="age" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="form-label">Email</label>
                    <Field type="email" name="email" id="email" className="input-field" />
                    <ErrorMessage name="email" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="form-label">Telefone</label>
                    <Field type="text" name="phone" id="phone" className="input-field" />
                    <ErrorMessage name="phone" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="height" className="form-label">Altura (cm)</label>
                    <Field type="number" name="height" id="height" className="input-field" />
                    <ErrorMessage name="height" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="weight" className="form-label">Peso (kg)</label>
                    <Field type="number" name="weight" id="weight" className="input-field" />
                    <ErrorMessage name="weight" component="div" className="error-message" />
                  </div>
                  
                  {/* Histórico Menstrual */}
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2 mt-4">
                      Histórico Menstrual
                    </h3>
                  </div>
                  
                  <div>
                    <label htmlFor="menarche_age" className="form-label">Idade da Menarca</label>
                    <Field type="number" name="menarche_age" id="menarche_age" className="input-field" />
                    <ErrorMessage name="menarche_age" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="cycle_length" className="form-label">Duração do Ciclo (dias)</label>
                    <Field type="number" name="cycle_length" id="cycle_length" className="input-field" />
                    <ErrorMessage name="cycle_length" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="period_length" className="form-label">Duração da Menstruação (dias)</label>
                    <Field type="number" name="period_length" id="period_length" className="input-field" />
                    <ErrorMessage name="period_length" component="div" className="error-message" />
                  </div>
                  
                  <div className="flex items-center">
                    <Field 
                      type="checkbox" 
                      name="is_menopausal" 
                      id="is_menopausal"
                      className="h-4 w-4 text-primary-600 rounded" 
                    />
                    <label htmlFor="is_menopausal" className="ml-2 form-label">
                      Está em Climatério/Menopausa
                    </label>
                  </div>
                  
                  {/* Queixas e Histórico */}
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2 mt-4">
                      Queixas e Histórico
                    </h3>
                  </div>
                  
                  <div className="col-span-2">
                    <label htmlFor="main_complaints" className="form-label">Queixas Principais *</label>
                    <Field 
                      as="textarea" 
                      name="main_complaints" 
                      id="main_complaints" 
                      rows={4}
                      className="input-field" 
                    />
                    <ErrorMessage name="main_complaints" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="pregnancy_history" className="form-label">Histórico de Gestações</label>
                    <Field 
                      as="textarea" 
                      name="pregnancy_history" 
                      id="pregnancy_history" 
                      rows={3}
                      className="input-field" 
                    />
                    <ErrorMessage name="pregnancy_history" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="medical_history" className="form-label">Histórico Médico</label>
                    <Field 
                      as="textarea" 
                      name="medical_history" 
                      id="medical_history" 
                      rows={3}
                      className="input-field" 
                    />
                    <ErrorMessage name="medical_history" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="family_history" className="form-label">Histórico Familiar</label>
                    <Field 
                      as="textarea" 
                      name="family_history" 
                      id="family_history" 
                      rows={3}
                      className="input-field" 
                    />
                    <ErrorMessage name="family_history" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="current_medications" className="form-label">Medicamentos Atuais</label>
                    <Field 
                      as="textarea" 
                      name="current_medications" 
                      id="current_medications" 
                      rows={3}
                      className="input-field" 
                    />
                    <ErrorMessage name="current_medications" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="current_supplements" className="form-label">Suplementos Atuais</label>
                    <Field 
                      as="textarea" 
                      name="current_supplements" 
                      id="current_supplements" 
                      rows={3}
                      className="input-field" 
                    />
                    <ErrorMessage name="current_supplements" component="div" className="error-message" />
                  </div>
                  
                  {/* Estilo de Vida */}
                  <div className="col-span-2">
                    <h3 className="text-lg font-medium text-gray-800 mb-4 border-b pb-2 mt-4">
                      Estilo de Vida
                    </h3>
                  </div>
                  
                  <div>
                    <label htmlFor="sleep_quality" className="form-label">Qualidade do Sono</label>
                    <Field 
                      as="textarea" 
                      name="sleep_quality" 
                      id="sleep_quality" 
                      rows={3}
                      className="input-field" 
                    />
                    <ErrorMessage name="sleep_quality" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="exercise_routine" className="form-label">Rotina de Exercícios</label>
                    <Field 
                      as="textarea" 
                      name="exercise_routine" 
                      id="exercise_routine" 
                      rows={3}
                      className="input-field" 
                    />
                    <ErrorMessage name="exercise_routine" component="div" className="error-message" />
                  </div>
                  
                  <div>
                    <label htmlFor="stress_level" className="form-label">Nível de Estresse</label>
                    <Field as="select" name="stress_level" id="stress_level" className="input-field">
                      <option value="">Selecione</option>
                      <option value="baixo">Baixo</option>
                      <option value="moderado">Moderado</option>
                      <option value="alto">Alto</option>
                      <option value="muito alto">Muito Alto</option>
                    </Field>
                    <ErrorMessage name="stress_level" component="div" className="error-message" />
                  </div>
                  
                  <div className="col-span-2">
                    <label htmlFor="treatment_goals" className="form-label">Objetivos do Tratamento *</label>
                    <Field 
                      as="textarea" 
                      name="treatment_goals" 
                      id="treatment_goals" 
                      rows={4}
                      className="input-field" 
                    />
                    <ErrorMessage name="treatment_goals" component="div" className="error-message" />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={onBack}
                    className="btn-secondary"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Salvando...' : 'Continuar'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default PatientDataForm;
