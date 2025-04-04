import OpenAI from 'openai';
import dotenv from 'dotenv';
import { Prompt, TokenUsage, User, Company } from '../../models';

dotenv.config();

// Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Model pricing (per 1000 tokens, in USD)
const modelPricing = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-32k': { input: 0.06, output: 0.12 },
  'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
  'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
};

// Get prompt by step key
export const getPromptByStepKey = async (stepKey: string) => {
  try {
    const prompt = await Prompt.findOne({ where: { step_key: stepKey } });
    
    if (!prompt) {
      throw new Error(`Prompt not found for step: ${stepKey}`);
    }
    
    return prompt;
  } catch (error) {
    console.error('Error fetching prompt:', error);
    throw error;
  }
};

// Check if user/company has enough tokens
export const checkTokenLimit = async (userId: number, companyId: number) => {
  try {
    // Get company token limit
    const company = await Company.findByPk(companyId);
    
    if (!company) {
      throw new Error('Company not found');
    }
    
    // Calculate used tokens for the company
    const usedTokens = await TokenUsage.sum('tokens_used', {
      where: { company_id: companyId }
    }) || 0;
    
    // Check if company has enough tokens left
    if (usedTokens >= company.token_limit) {
      return {
        hasEnoughTokens: false,
        message: 'Company token limit reached'
      };
    }
    
    return {
      hasEnoughTokens: true,
      tokensLeft: company.token_limit - usedTokens
    };
  } catch (error) {
    console.error('Error checking token limit:', error);
    throw error;
  }
};

// Record token usage
export const recordTokenUsage = async (
  userId: number,
  companyId: number,
  promptId: number,
  tokensUsed: number,
  model: string
) => {
  try {
    // Calculate cost based on model
    const modelPrice = modelPricing[model as keyof typeof modelPricing] || modelPricing['gpt-3.5-turbo'];
    const cost = (tokensUsed / 1000) * modelPrice.output;
    
    // Record token usage
    await TokenUsage.create({
      user_id: userId,
      company_id: companyId,
      prompt_id: promptId,
      tokens_used: tokensUsed,
      cost
    });
  } catch (error) {
    console.error('Error recording token usage:', error);
    throw error;
  }
};

// Generate AI response
export const generateAIResponse = async (
  userId: number,
  companyId: number,
  stepKey: string,
  inputData: any,
  model = 'gpt-3.5-turbo'
) => {
  try {
    // Check token limit
    const tokenLimitCheck = await checkTokenLimit(userId, companyId);
    
    if (!tokenLimitCheck.hasEnoughTokens) {
      return {
        success: false,
        message: tokenLimitCheck.message
      };
    }
    
    // Get prompt for the step
    const promptTemplate = await getPromptByStepKey(stepKey);
    
    // Prepare messages
    const messages = [
      { role: 'system' as const, content: promptTemplate.content },
      { role: 'user' as const, content: JSON.stringify(inputData) }
    ];
    
    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model,
      messages,
      temperature: promptTemplate.temperature,
      max_tokens: promptTemplate.max_tokens,
    });
    
    // Record token usage
    const tokensUsed = response.usage?.total_tokens || 0;
    await recordTokenUsage(userId, companyId, promptTemplate.id, tokensUsed, model);
    
    return {
      success: true,
      data: response.choices[0].message?.content,
      tokensUsed
    };
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return {
      success: false,
      message: error.message || 'Error generating AI response'
    };
  }
};
