import { generateInterviewQuestions, evaluateInterviewAnswer } from '../utils/prompts.js';

export const generateQuestions = async (req, res) => {
  try {
    const { resumeInfo } = req.body;
    
    if (!resumeInfo) {
      return res.status(400).json({ error: 'Resume information is required' });
    }

    // Generate personalized interview questions
    const questions = await generateInterviewQuestions(resumeInfo);
    
    res.json({
      success: true,
      questions,
      totalQuestions: questions.length,
      estimatedTime: `${questions.length * 3}-${questions.length * 5} minutes`
    });
  } catch (error) {
    console.error('Question generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate questions', 
      details: error.message 
    });
  }
};

export const evaluateAnswer = async (req, res) => {
  try {
    const { question, answer } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    // Evaluate the interview answer
    const evaluation = await evaluateInterviewAnswer(question, answer);
    
    res.json({
      success: true,
      score: evaluation.score,
      feedback: evaluation.feedback,
      strengths: evaluation.strengths,
      improvements: evaluation.improvements,
      followUpQuestions: evaluation.followUpQuestions || []
    });
  } catch (error) {
    console.error('Answer evaluation error:', error);
    res.status(500).json({ 
      error: 'Failed to evaluate answer', 
      details: error.message 
    });
  }
};