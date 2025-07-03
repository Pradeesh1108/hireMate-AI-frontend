import { generateCareerAdvice } from '../utils/prompts.js';
import { generatePDFReport } from '../utils/pdfWriter.js';

export const careerAssistant = async (req, res) => {
  try {
    const { message, context, targetRole, currentExperience, careerGoals, resumeInfo } = req.body;
    
    // Handle chatbot conversation
    if (message) {
      const response = await generateChatbotResponse(message, context);
      return res.json({
        success: true,
        response
      });
    }
    
    // Handle comprehensive career advice (legacy endpoint)
    if (targetRole) {
      const advice = await generateCareerAdvice({
        targetRole,
        currentExperience,
        careerGoals,
        resumeInfo
      });
      
      return res.json({
        success: true,
        ...advice
      });
    }
    
    return res.status(400).json({ error: 'Message or target role is required' });
  } catch (error) {
    console.error('Career assistant error:', error);
    res.status(500).json({ 
      error: 'Failed to generate career advice', 
      details: error.message 
    });
  }
};

const generateChatbotResponse = async (message, context) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const input = message.toLowerCase();
  
  // Resume-related responses
  if (input.includes('resume') || input.includes('cv')) {
    return "Great question about resumes! Here are some key tips:\n\n• Use action verbs like 'developed', 'managed', 'implemented'\n• Include quantifiable achievements (e.g., 'Increased sales by 25%')\n• Tailor your resume to each job application\n• Keep it to 1-2 pages maximum\n• Use a clean, ATS-friendly format\n\nWould you like me to elaborate on any of these points?";
  }
  
  // Interview-related responses
  if (input.includes('interview') || input.includes('preparation')) {
    return "Interview preparation is crucial! Here's my advice:\n\n• Research the company thoroughly\n• Practice the STAR method for behavioral questions\n• Prepare specific examples of your achievements\n• Have thoughtful questions ready for the interviewer\n• Practice your elevator pitch\n\nWhat type of interview are you preparing for?";
  }
  
  // Skills and learning
  if (input.includes('skill') || input.includes('learn') || input.includes('development')) {
    return "Skill development is key to career growth! Consider:\n\n• Identify skills gaps in your target role\n• Focus on both technical and soft skills\n• Use online platforms like Coursera, Udemy, or LinkedIn Learning\n• Practice through personal projects\n• Seek mentorship or join professional communities\n\nWhat specific skills are you looking to develop?";
  }
  
  // Career change
  if (input.includes('career change') || input.includes('transition')) {
    return "Career transitions can be exciting! Here's how to approach it:\n\n• Identify transferable skills from your current role\n• Network with professionals in your target field\n• Consider taking relevant courses or certifications\n• Start with informational interviews\n• Update your LinkedIn profile to reflect your new direction\n\nWhat field are you considering transitioning to?";
  }
  
  // Salary negotiation
  if (input.includes('salary') || input.includes('negotiate')) {
    return "Salary negotiation is an important skill! Tips:\n\n• Research market rates for your role and location\n• Document your achievements and value-add\n• Practice your negotiation conversation\n• Consider the entire compensation package\n• Be prepared to walk away if needed\n\nRemember, negotiation shows you value yourself professionally!";
  }
  
  // Job search
  if (input.includes('job search') || input.includes('finding job')) {
    return "Effective job searching requires strategy:\n\n• Use multiple channels: job boards, networking, company websites\n• Customize your application for each role\n• Follow up professionally after applications\n• Leverage your network and ask for referrals\n• Consider working with recruiters in your field\n\nWhat industry or role are you targeting?";
  }
  
  // LinkedIn optimization
  if (input.includes('linkedin') || input.includes('profile')) {
    return "LinkedIn optimization is crucial for career success:\n\n• Use a professional headshot\n• Write a compelling headline and summary\n• Include relevant keywords for your industry\n• Showcase your achievements and projects\n• Engage with content in your field\n• Connect strategically with industry professionals\n\nWould you like specific tips for any section of your profile?";
  }
  
  // Default response
  return "That's an interesting question! I'd be happy to help you with career guidance. Could you provide more specific details about what you're looking for? I can assist with:\n\n• Resume and cover letter advice\n• Interview preparation strategies\n• Career planning and goal setting\n• Skill development recommendations\n• Job search strategies\n• Salary negotiation tips\n\nWhat area would you like to focus on?";
};

export const generateReport = async (req, res) => {
  try {
    const { reportData } = req.body;
    
    if (!reportData) {
      return res.status(400).json({ error: 'Report data is required' });
    }

    // Generate PDF report
    const pdfBuffer = await generatePDFReport(reportData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=CareerMate-Report.pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Report generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate report', 
      details: error.message 
    });
  }
};