import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { calculateATSScore, extractSkills, parseSections } from '../utils/ats.js';

export const analyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    const filePath = req.file.path;
    
    // Read and parse PDF
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdf(dataBuffer);
    const resumeText = pdfData.text;

    // Extract information from resume
    const extractedInfo = {
      skills: extractSkills(resumeText),
      experience: calculateExperience(resumeText),
      education: extractEducation(resumeText),
      contact: extractContactInfo(resumeText)
    };

    // Calculate ATS scores
    const atsScore = calculateATSScore(resumeText);
    const sections = parseSections(resumeText);
    
    // Generate specific scores
    const keywordScore = calculateKeywordScore(resumeText);
    const formatScore = calculateFormatScore(resumeText, sections);
    const sectionScore = calculateSectionScore(sections);
    const contentScore = calculateContentScore(resumeText);

    // Generate improvement suggestions
    const suggestions = generateSuggestions(resumeText, sections, atsScore);

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    const response = {
      success: true,
      atsScore,
      keywordScore,
      formatScore,
      sectionScore,
      contentScore,
      extractedInfo,
      suggestions,
      sections: Object.keys(sections),
      wordCount: resumeText.split(' ').length,
      analysis: {
        hasContactInfo: extractedInfo.contact.email && extractedInfo.contact.phone,
        hasSkills: extractedInfo.skills.length > 0,
        hasExperience: extractedInfo.experience > 0,
        hasEducation: !!extractedInfo.education
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Resume analysis error:', error);
    
    // Clean up uploaded file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Failed to analyze resume', 
      details: error.message 
    });
  }
};

// Helper functions
const calculateExperience = (text) => {
  const experiencePatterns = [
    /(\d+)\s*years?\s*of\s*experience/i,
    /(\d+)\+?\s*years?\s*experience/i,
    /experience:\s*(\d+)\s*years?/i
  ];
  
  for (const pattern of experiencePatterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  // Try to calculate from dates
  const datePattern = /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi;
  const matches = [...text.matchAll(datePattern)];
  
  if (matches.length > 0) {
    let totalYears = 0;
    matches.forEach(match => {
      const startYear = parseInt(match[1]);
      const endYear = match[2].toLowerCase().includes('present') || match[2].toLowerCase().includes('current') 
        ? new Date().getFullYear() 
        : parseInt(match[2]);
      totalYears += Math.max(0, endYear - startYear);
    });
    return Math.min(totalYears, 20); // Cap at 20 years
  }
  
  return 0;
};

const extractEducation = (text) => {
  const educationKeywords = [
    'bachelor', 'master', 'phd', 'doctorate', 'degree', 'university', 'college',
    'bs', 'ba', 'ms', 'ma', 'mba', 'engineering', 'computer science', 'business'
  ];
  
  const lines = text.toLowerCase().split('\n');
  for (const line of lines) {
    if (educationKeywords.some(keyword => line.includes(keyword))) {
      return line.trim();
    }
  }
  
  return 'Not specified';
};

const extractContactInfo = (text) => {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phonePattern = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  
  const email = text.match(emailPattern)?.[0] || '';
  const phone = text.match(phonePattern)?.[0] || '';
  
  return { email, phone };
};

const calculateKeywordScore = (text) => {
  const commonKeywords = [
    'javascript', 'python', 'react', 'node', 'html', 'css', 'sql', 'git',
    'management', 'leadership', 'communication', 'project', 'team', 'analysis'
  ];
  
  const lowerText = text.toLowerCase();
  const foundKeywords = commonKeywords.filter(keyword => lowerText.includes(keyword));
  
  return Math.min(100, Math.round((foundKeywords.length / commonKeywords.length) * 100));
};

const calculateFormatScore = (text, sections) => {
  let score = 0;
  
  // Check for proper sections
  if (Object.keys(sections).length >= 3) score += 30;
  
  // Check for bullet points
  if (text.includes('•') || text.includes('-') || text.includes('*')) score += 25;
  
  // Check for consistent formatting
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length > 10) score += 25;
  
  // Check for proper length
  const wordCount = text.split(' ').length;
  if (wordCount >= 200 && wordCount <= 800) score += 20;
  
  return Math.min(100, score);
};

const calculateSectionScore = (sections) => {
  const requiredSections = ['experience', 'education', 'skills'];
  const optionalSections = ['summary', 'projects', 'certifications'];
  
  let score = 0;
  
  requiredSections.forEach(section => {
    if (sections[section]) score += 25;
  });
  
  optionalSections.forEach(section => {
    if (sections[section]) score += 8;
  });
  
  return Math.min(100, score);
};

const calculateContentScore = (text) => {
  let score = 0;
  
  // Check for action verbs
  const actionVerbs = [
    'developed', 'managed', 'led', 'created', 'implemented', 'designed',
    'built', 'optimized', 'achieved', 'improved', 'increased', 'reduced'
  ];
  
  const lowerText = text.toLowerCase();
  const foundVerbs = actionVerbs.filter(verb => lowerText.includes(verb));
  score += Math.min(40, foundVerbs.length * 5);
  
  // Check for quantifiable achievements
  const numberPattern = /\d+[%$]?/g;
  const numbers = text.match(numberPattern) || [];
  score += Math.min(30, numbers.length * 3);
  
  // Check for technical terms
  const techTerms = [
    'api', 'database', 'framework', 'algorithm', 'architecture', 'cloud',
    'agile', 'scrum', 'ci/cd', 'devops', 'microservices', 'docker'
  ];
  
  const foundTechTerms = techTerms.filter(term => lowerText.includes(term));
  score += Math.min(30, foundTechTerms.length * 3);
  
  return Math.min(100, score);
};

const generateSuggestions = (text, sections, atsScore) => {
  const suggestions = [];
  
  if (atsScore < 70) {
    suggestions.push('Add more relevant keywords from the job description');
  }
  
  if (!sections.summary && !sections.objective) {
    suggestions.push('Add a professional summary or objective section');
  }
  
  if (!sections.skills) {
    suggestions.push('Include a dedicated skills section');
  }
  
  const lowerText = text.toLowerCase();
  if (!lowerText.includes('achieved') && !lowerText.includes('improved')) {
    suggestions.push('Include quantifiable achievements and results');
  }
  
  const wordCount = text.split(' ').length;
  if (wordCount < 200) {
    suggestions.push('Expand your resume content - it appears too brief');
  } else if (wordCount > 800) {
    suggestions.push('Consider condensing your resume - it may be too lengthy');
  }
  
  if (!text.match(/\d+[%$]/)) {
    suggestions.push('Add specific numbers and percentages to showcase impact');
  }
  
  if (suggestions.length === 0) {
    suggestions.push('Your resume looks good! Consider tailoring it for specific job applications');
  }
  
  return suggestions;
};