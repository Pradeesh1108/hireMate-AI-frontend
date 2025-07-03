// Mock AI responses for demonstration purposes
// In production, replace with actual OpenAI/Gemini API calls

export const generateInterviewQuestions = async (resumeInfo) => {
  // Mock response - in production, use actual LLM API
  const mockQuestions = [
    `Tell me about yourself and your professional background.`,
    `I see you have experience with ${resumeInfo.skills?.slice(0, 2).join(' and ') || 'modern technologies'}. Can you walk me through a challenging project where you used these skills?`,
    `How do you stay updated with the latest trends in ${resumeInfo.skills?.[0] || 'technology'}?`,
    `Describe a time when you had to solve a complex technical problem. What was your approach?`,
    `Where do you see yourself in the next 5 years, and how does this role align with your career goals?`
  ];

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return mockQuestions;
};

export const evaluateInterviewAnswer = async (question, answer) => {
  // Mock evaluation - in production, use actual LLM API
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const answerLength = answer.trim().split(' ').length;
  const hasExamples = answer.toLowerCase().includes('example') || answer.toLowerCase().includes('project');
  const hasNumbers = /\d+/.test(answer);
  
  let score = 6; // Base score
  
  // Scoring logic
  if (answerLength > 30) score += 1;
  if (answerLength > 60) score += 1;
  if (hasExamples) score += 1;
  if (hasNumbers) score += 0.5;
  if (answer.length > 200) score += 0.5;
  
  score = Math.min(10, Math.max(4, score));
  
  const feedbackOptions = [
    "Great answer! You provided specific details and examples that demonstrate your experience.",
    "Good response. Consider adding more specific examples to strengthen your answer.",
    "Solid answer. Try to include quantifiable results or metrics to make it more impactful.",
    "Nice explanation. Adding a brief example would help illustrate your point better.",
    "Well articulated. Consider structuring your response using the STAR method for even better impact."
  ];
  
  const feedback = feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
  
  return {
    score: Math.round(score * 10) / 10,
    feedback,
    strengths: [
      "Clear communication",
      "Relevant experience mentioned",
      "Good understanding of concepts"
    ],
    improvements: [
      "Add more specific examples",
      "Include quantifiable achievements",
      "Structure response using STAR method"
    ],
    followUpQuestions: [
      "Can you provide more details about the technical implementation?",
      "What challenges did you face and how did you overcome them?",
      "How did you measure the success of this project?"
    ]
  };
};

export const generateCareerAdvice = async ({ targetRole, currentExperience, careerGoals, resumeInfo }) => {
  // Mock career advice - in production, use actual LLM API
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const roleFit = Math.floor(Math.random() * 20) + 75; // 75-95% range
  
  const skillGaps = [
    { skill: 'Cloud Platforms (AWS/Azure)', priority: 'High', timeToLearn: '3-6 months' },
    { skill: 'System Design', priority: 'High', timeToLearn: '4-8 months' },
    { skill: 'DevOps/CI-CD', priority: 'Medium', timeToLearn: '2-4 months' },
    { skill: 'Leadership Skills', priority: 'Medium', timeToLearn: '6-12 months' },
    { skill: 'Data Structures & Algorithms', priority: 'High', timeToLearn: '3-6 months' },
    { skill: 'Microservices Architecture', priority: 'Medium', timeToLearn: '2-3 months' }
  ];
  
  const recommendations = [
    `Focus on ${skillGaps[0].skill.toLowerCase()} - this is highly valued for ${targetRole} positions`,
    'Build a portfolio showcasing full-stack projects with modern technologies',
    'Contribute to open source projects to demonstrate collaboration skills',
    'Practice system design interviews for senior-level positions',
    'Network with professionals in your target industry through LinkedIn and tech meetups',
    'Consider obtaining relevant certifications to validate your skills'
  ];
  
  const learningResources = [
    {
      title: 'System Design Interview Course',
      provider: 'Educative',
      type: 'Online Course',
      duration: '40 hours',
      rating: 4.8,
      price: '$79',
      link: '#'
    },
    {
      title: 'AWS Certified Solutions Architect',
      provider: 'A Cloud Guru',
      type: 'Certification',
      duration: '60 hours',
      rating: 4.7,
      price: '$39/month',
      link: '#'
    },
    {
      title: 'The Complete Node.js Developer Course',
      provider: 'Udemy',
      type: 'Online Course',
      duration: '35 hours',
      rating: 4.6,
      price: '$89.99',
      link: '#'
    },
    {
      title: 'Docker & Kubernetes: The Complete Guide',
      provider: 'Udemy',
      type: 'Online Course',
      duration: '22 hours',
      rating: 4.5,
      price: '$94.99',
      link: '#'
    }
  ];
  
  const careerPath = [
    {
      step: 1,
      title: 'Skill Development (3-6 months)',
      description: 'Focus on closing critical skill gaps identified in the analysis',
      actions: [
        'Complete system design fundamentals course',
        'Get cloud platform certification (AWS/Azure)',
        'Build 2-3 portfolio projects showcasing new skills'
      ]
    },
    {
      step: 2,
      title: 'Experience Building (6-12 months)',
      description: 'Gain practical experience and build leadership capabilities',
      actions: [
        'Lead a project at current role or side project',
        'Mentor junior developers or contribute to open source',
        'Start networking in target industry'
      ]
    },
    {
      step: 3,
      title: 'Job Market Preparation (1-2 months)',
      description: 'Prepare for interviews and active job searching',
      actions: [
        'Practice technical and behavioral interviews',
        'Update resume with new skills and achievements',
        'Apply to target companies and leverage network'
      ]
    }
  ];
  
  const salaryInsights = {
    current: '$75,000 - $95,000',
    target: '$120,000 - $160,000',
    increase: '45-60%'
  };
  
  return {
    roleFit,
    fitAnalysis: `You have a ${roleFit}% match for ${targetRole} roles. Your technical foundation is solid, and with focused skill development in key areas, you'll be well-positioned for this career transition. Your ${currentExperience} experience level aligns well with the requirements.`,
    skillGaps: skillGaps.slice(0, 4),
    recommendations,
    learningResources,
    careerPath,
    salaryInsights
  };
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