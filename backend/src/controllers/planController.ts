import { Request, Response } from 'express';
import { PatientPlan, User } from '../models';
import { generateAIResponse } from '../services/ai/openaiService';
import { exportPlanAsPDF, exportPlanAsDOCX } from '../services/export/exportService';
import { minioClient } from '../config/minio';

// Start a new plan
export const startPlan = async (req: Request, res: Response) => {
  const { professional_type, patient_data } = req.body;
  const userId = req.user.id;
  const companyId = req.user.company_id;
  
  if (!professional_type || !patient_data) {
    return res.status(400).json({ message: 'Professional type and patient data are required' });
  }
  
  try {
    // Create new patient plan
    const plan = await PatientPlan.create({
      user_id: userId,
      company_id: companyId,
      professional_type,
      patient_data,
    });
    
    return res.status(201).json({
      message: 'Plan started successfully',
      plan_id: plan.id
    });
  } catch (error) {
    console.error('Error starting plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update questionnaire data
export const updateQuestionnaire = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { questionnaire_data } = req.body;
  const userId = req.user.id;
  
  if (!questionnaire_data) {
    return res.status(400).json({ message: 'Questionnaire data is required' });
  }
  
  try {
    // Find plan
    const plan = await PatientPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Check ownership
    if (plan.user_id !== userId && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to update this plan' });
    }
    
    // Update questionnaire data
    await plan.update({ questionnaire_data });
    
    // Process questionnaire using AI
    const aiResponse = await generateAIResponse(
      userId,
      plan.company_id,
      'questionnaire_organization',
      { patientData: plan.patient_data, questionnaireData: questionnaire_data }
    );
    
    if (aiResponse.success) {
      return res.status(200).json({
        message: 'Questionnaire updated successfully',
        analyzed_data: aiResponse.data
      });
    } else {
      return res.status(200).json({
        message: 'Questionnaire updated but analysis failed',
        error: aiResponse.message
      });
    }
  } catch (error) {
    console.error('Error updating questionnaire:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Upload and analyze lab results
export const updateLabResults = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  if (!req.file) {
    return res.status(400).json({ message: 'Lab results file is required' });
  }
  
  try {
    // Find plan
    const plan = await PatientPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Check ownership
    if (plan.user_id !== userId && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to update this plan' });
    }
    
    // Upload file to Minio
    const bucketName = process.env.MINIO_BUCKET || 'lyz-files';
    const fileName = `lab-results/${plan.id}/${Date.now()}_${req.file.originalname}`;
    
    await minioClient.putObject(
      bucketName,
      fileName,
      req.file.buffer,
      req.file.size,
      { 'Content-Type': req.file.mimetype }
    );
    
    // Generate presigned URL
    const fileUrl = await minioClient.presignedGetObject(bucketName, fileName, 24 * 60 * 60); // 24 hours
    
    // TODO: Implement text extraction from PDF
    // For now, we'll use placeholder text for lab results
    const extractedText = "Example lab results content - text extraction to be implemented";
    
    // Process lab results using AI
    const aiResponse = await generateAIResponse(
      userId,
      plan.company_id,
      'lab_results_analysis',
      { patientData: plan.patient_data, labResultsText: extractedText }
    );
    
    // Update plan with lab results and analysis
    const labResults = {
      fileUrl,
      fileName,
      extractedText,
      analysis: aiResponse.success ? aiResponse.data : 'Analysis failed'
    };
    
    await plan.update({ lab_results: labResults });
    
    return res.status(200).json({
      message: 'Lab results uploaded and analyzed successfully',
      lab_results: labResults
    });
  } catch (error) {
    console.error('Error processing lab results:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update TCM observations
export const updateTCMObservations = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { tcm_observations } = req.body;
  const userId = req.user.id;
  
  if (!tcm_observations) {
    return res.status(400).json({ message: 'TCM observations are required' });
  }
  
  try {
    // Find plan
    const plan = await PatientPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Check ownership
    if (plan.user_id !== userId && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to update this plan' });
    }
    
    // Update TCM observations
    await plan.update({ tcm_observations });
    
    // Process TCM observations using AI
    const aiResponse = await generateAIResponse(
      userId,
      plan.company_id,
      'tcm_analysis',
      { 
        patientData: plan.patient_data, 
        tcmObservations: tcm_observations,
        questionnaireData: plan.questionnaire_data
      }
    );
    
    if (aiResponse.success) {
      return res.status(200).json({
        message: 'TCM observations updated successfully',
        analyzed_data: aiResponse.data
      });
    } else {
      return res.status(200).json({
        message: 'TCM observations updated but analysis failed',
        error: aiResponse.message
      });
    }
  } catch (error) {
    console.error('Error updating TCM observations:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update timeline data
export const updateTimeline = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { timeline_data } = req.body;
  const userId = req.user.id;
  
  if (!timeline_data) {
    return res.status(400).json({ message: 'Timeline data is required' });
  }
  
  try {
    // Find plan
    const plan = await PatientPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Check ownership
    if (plan.user_id !== userId && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to update this plan' });
    }
    
    // Update timeline data
    await plan.update({ timeline_data });
    
    // Generate timeline using AI if requested
    if (req.body.generate_ai_timeline) {
      const aiResponse = await generateAIResponse(
        userId,
        plan.company_id,
        'timeline_generation',
        { 
          patientData: plan.patient_data, 
          questionnaireData: plan.questionnaire_data,
          labResults: plan.lab_results,
          tcmObservations: plan.tcm_observations
        }
      );
      
      if (aiResponse.success) {
        return res.status(200).json({
          message: 'Timeline updated successfully',
          ai_suggested_timeline: aiResponse.data
        });
      } else {
        return res.status(200).json({
          message: 'Timeline updated but AI suggestion failed',
          error: aiResponse.message
        });
      }
    }
    
    return res.status(200).json({
      message: 'Timeline updated successfully'
    });
  } catch (error) {
    console.error('Error updating timeline:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update IFM matrix
export const updateIFMMatrix = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ifm_matrix } = req.body;
  const userId = req.user.id;
  
  if (!ifm_matrix) {
    return res.status(400).json({ message: 'IFM matrix data is required' });
  }
  
  try {
    // Find plan
    const plan = await PatientPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Check ownership
    if (plan.user_id !== userId && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to update this plan' });
    }
    
    // Update IFM matrix
    await plan.update({ ifm_matrix });
    
    // Generate IFM matrix using AI if requested
    if (req.body.generate_ai_matrix) {
      const aiResponse = await generateAIResponse(
        userId,
        plan.company_id,
        'ifm_matrix_generation',
        { 
          patientData: plan.patient_data, 
          questionnaireData: plan.questionnaire_data,
          labResults: plan.lab_results,
          tcmObservations: plan.tcm_observations,
          timelineData: plan.timeline_data
        }
      );
      
      if (aiResponse.success) {
        return res.status(200).json({
          message: 'IFM matrix updated successfully',
          ai_suggested_matrix: aiResponse.data
        });
      } else {
        return res.status(200).json({
          message: 'IFM matrix updated but AI suggestion failed',
          error: aiResponse.message
        });
      }
    }
    
    return res.status(200).json({
      message: 'IFM matrix updated successfully'
    });
  } catch (error) {
    console.error('Error updating IFM matrix:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Generate final plan
export const generateFinalPlan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    // Find plan
    const plan = await PatientPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Check ownership
    if (plan.user_id !== userId && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to generate plan' });
    }
    
    // Check if all required data is present
    if (!plan.questionnaire_data) {
      return res.status(400).json({ message: 'Questionnaire data is required to generate plan' });
    }
    
    // Determine which prompt to use based on professional type
    const promptKey = plan.professional_type === 'medical_nutritionist' 
      ? 'plan_medical_nutritionist' 
      : 'plan_other_professional';
    
    // Generate plan using AI
    const aiResponse = await generateAIResponse(
      userId,
      plan.company_id,
      promptKey,
      { 
        patientData: plan.patient_data, 
        questionnaireData: plan.questionnaire_data,
        labResults: plan.lab_results,
        tcmObservations: plan.tcm_observations,
        timelineData: plan.timeline_data,
        ifmMatrix: plan.ifm_matrix
      }
    );
    
    if (!aiResponse.success) {
      return res.status(500).json({ 
        message: 'Failed to generate plan',
        error: aiResponse.message
      });
    }
    
    // Process AI response into structured plan
    // This is a simplified example - in a real implementation you'd parse the AI response
    const finalPlan = {
      patientData: plan.patient_data,
      generalPlan: {
        dietaryRecommendations: "Example dietary recommendations",
        supplementation: "Example supplementation recommendations",
        lifestyleChanges: "Example lifestyle changes",
        stressManagement: "Example stress management techniques"
      },
      cyclicalPlan: {
        follicular: "Example follicular phase recommendations",
        ovulatory: "Example ovulatory phase recommendations",
        luteal: "Example luteal phase recommendations",
        menstrual: "Example menstrual phase recommendations",
        menopausal: plan.patient_data.is_menopausal ? "Example menopausal recommendations" : null
      },
      aiGeneratedContent: aiResponse.data
    };
    
    // Update plan with final plan
    await plan.update({ final_plan: finalPlan });
    
    return res.status(200).json({
      message: 'Plan generated successfully',
      final_plan: finalPlan
    });
  } catch (error) {
    console.error('Error generating final plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Export plan
export const exportPlan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { format } = req.query;
  const userId = req.user.id;
  
  try {
    // Find plan
    const plan = await PatientPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Check ownership
    if (plan.user_id !== userId && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to export this plan' });
    }
    
    // Check if plan has been generated
    if (!plan.final_plan) {
      return res.status(400).json({ message: 'Plan has not been generated yet' });
    }
    
    // Export plan in requested format
    let exportResult;
    
    if (format === 'docx') {
      exportResult = await exportPlanAsDOCX(plan.id);
    } else {
      // Default to PDF
      exportResult = await exportPlanAsPDF(plan.id);
    }
    
    if (!exportResult.success) {
      return res.status(500).json({ 
        message: 'Failed to export plan',
        error: exportResult.message
      });
    }
    
    return res.status(200).json({
      message: 'Plan exported successfully',
      download_url: exportResult.url,
      file_name: exportResult.fileName
    });
  } catch (error) {
    console.error('Error exporting plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all plans for current user
export const getUserPlans = async (req: Request, res: Response) => {
  const userId = req.user.id;
  
  try {
    // Find all plans for user
    const plans = await PatientPlan.findAll({
      where: { user_id: userId },
      attributes: ['id', 'patient_data', 'professional_type', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']]
    });
    
    return res.status(200).json({ plans });
  } catch (error) {
    console.error('Error fetching user plans:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get plan by ID
export const getPlanById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  try {
    // Find plan
    const plan = await PatientPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Check ownership
    if (plan.user_id !== userId && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to view this plan' });
    }
    
    return res.status(200).json({ plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Update final plan
export const updateFinalPlan = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { final_plan } = req.body;
  const userId = req.user.id;
  
  if (!final_plan) {
    return res.status(400).json({ message: 'Final plan data is required' });
  }
  
  try {
    // Find plan
    const plan = await PatientPlan.findByPk(id);
    
    if (!plan) {
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    // Check ownership
    if (plan.user_id !== userId && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized to update this plan' });
    }
    
    // Update final plan data
    await plan.update({ final_plan });
    
    return res.status(200).json({
      message: 'Final plan updated successfully',
      final_plan
    });
  } catch (error) {
    console.error('Error updating final plan:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
