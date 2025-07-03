import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

// Mock AI responses for demonstration purposes
// In production, replace with actual OpenAI/Gemini API calls

export const generateInterviewQuestions = async (resumeInfo) => {
  const prompt = `Generate 5 personalized interview questions based on this resume information:\n\nSkills: ${resumeInfo.skills?.join(', ') || 'Not specified'}\nExperience: ${resumeInfo.experience || 'Not specified'}\nEducation: ${resumeInfo.education || 'Not specified'}\nProjects: ${resumeInfo.projects?.join(', ') || 'Not specified'}\n\nQuestions should be:\n- Tailored to their background\n- Mix of technical and behavioral\n- Appropriate for their experience level\n- Include follow-up questions\n\nReturn only the questions as a numbered list.`;
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are a helpful AI interview assistant.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 512,
    temperature: 0.7
  });
  // Parse the response into an array of questions
  const text = completion.choices[0].message.content;
  const questions = text.split(/\n|\r/).filter(line => line.match(/^\d+\./)).map(line => line.replace(/^\d+\.\s*/, '').trim());
  return questions.length > 0 ? questions : text.split('\n').filter(Boolean);
};

export const evaluateInterviewAnswer = async (question, answer) => {
  const prompt = `Evaluate this interview answer:\n\nQuestion: ${question}\nAnswer: ${answer}\n\nProvide:\n1. Score (1-10)\n2. Detailed feedback\n3. Strengths demonstrated\n4. Areas for improvement\n5. Suggested follow-up questions\n\nFormat your response as JSON with keys: score, feedback, strengths, improvements, followUpQuestions.`;
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are a helpful AI interview evaluator.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 512,
    temperature: 0.5
  });
  // Parse the JSON from the response
  let data;
  try {
    data = JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    // fallback: try to extract JSON from text
    const match = completion.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (match) {
      data = JSON.parse(match[0]);
    } else {
      throw new Error('Failed to parse evaluation JSON from Groq response');
    }
  }
  return data;
};

export const generateCareerAdvice = async ({ targetRole, currentExperience, careerGoals, resumeInfo }) => {
  const prompt = `Provide detailed career advice for someone targeting the role: ${targetRole}.\n\nCurrent experience: ${currentExperience}\nCareer goals: ${careerGoals}\nResume info: ${JSON.stringify(resumeInfo)}\n\nInclude:\n- Role fit percentage\n- Fit analysis\n- Top 4 skill gaps (with priority and time to learn)\n- 5 actionable recommendations\n- 3 recommended learning resources (title, provider, type, duration, rating, price, link)\n- 3-step career path (step, title, description, actions)\n- Salary insights (current, target, increase)\n\nFormat your response as JSON with keys: roleFit, fitAnalysis, skillGaps, recommendations, learningResources, careerPath, salaryInsights.`;
  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: 'You are a helpful AI career coach.' },
      { role: 'user', content: prompt }
    ],
    max_tokens: 1024,
    temperature: 0.7
  });
  // Parse the JSON from the response
  let data;
  try {
    data = JSON.parse(completion.choices[0].message.content);
  } catch (e) {
    // fallback: try to extract JSON from text
    const match = completion.choices[0].message.content.match(/\{[\s\S]*\}/);
    if (match) {
      data = JSON.parse(match[0]);
    } else {
      throw new Error('Failed to parse career advice JSON from Groq response');
    }
  }
  return data;
};

// Helper function to generate personalized prompts (for future LLM integration)
export const createResumeAnalysisPrompt = (resumeText) => {
  return `
    Analyze the following resume and provide detailed feedback:
    
    Resume Text: ${resumeText}
    
    Please provide:
    1. ATS compatibility score (0-100)
    2. Key strengths
    3. Areas for improvement
    4. Missing sections or information
    5. Keyword optimization suggestions
    
    Format the response as JSON with structured data.
  `;
};

export const createInterviewQuestionPrompt = (resumeInfo) => {
  return `
    Generate 5 personalized interview questions based on this resume information:
    
    Skills: ${resumeInfo.skills?.join(', ') || 'Not specified'}
    Experience: ${resumeInfo.experience || 'Not specified'}
    Education: ${resumeInfo.education || 'Not specified'}
    Projects: ${resumeInfo.projects?.join(', ') || 'Not specified'}
    
    Questions should be:
    - Tailored to their background
    - Mix of technical and behavioral
    - Appropriate for their experience level
    - Include follow-up questions
  `;
};

export const createAnswerEvaluationPrompt = (question, answer) => {
  return `
    Evaluate this interview answer:
    
    Question: ${question}
    Answer: ${answer}
    
    Provide:
    1. Score (1-10)
    2. Detailed feedback
    3. Strengths demonstrated
    4. Areas for improvement
    5. Suggested follow-up questions
    
    Be constructive and specific in your feedback.
  `;
};