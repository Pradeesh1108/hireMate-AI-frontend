export const calculateATSScore = (resumeText) => {
  let score = 0;
  const text = resumeText.toLowerCase();
  
  // Keyword density (30 points)
  const commonKeywords = [
    'javascript', 'python', 'react', 'node', 'html', 'css', 'sql', 'git',
    'management', 'leadership', 'communication', 'project', 'team', 'analysis',
    'problem solving', 'collaboration', 'agile', 'scrum'
  ];
  
  const foundKeywords = commonKeywords.filter(keyword => text.includes(keyword));
  score += Math.min(30, (foundKeywords.length / commonKeywords.length) * 30);
  
  // Format and structure (25 points)
  score += calculateFormatScore(resumeText);
  
  // Content quality (25 points)
  score += calculateContentQuality(resumeText);
  
  // Completeness (20 points)
  score += calculateCompleteness(resumeText);
  
  return Math.round(Math.min(100, score));
};

const calculateFormatScore = (text) => {
  let score = 0;
  
  // Check for bullet points
  if (text.includes('•') || text.includes('-') || text.includes('*')) {
    score += 8;
  }
  
  // Check for consistent sections
  const sections = ['experience', 'education', 'skills'];
  const foundSections = sections.filter(section => 
    text.toLowerCase().includes(section)
  );
  score += (foundSections.length / sections.length) * 10;
  
  // Check for proper length
  const wordCount = text.split(' ').length;
  if (wordCount >= 200 && wordCount <= 600) {
    score += 7;
  }
  
  return Math.min(25, score);
};

const calculateContentQuality = (text) => {
  let score = 0;
  const lowerText = text.toLowerCase();
  
  // Action verbs
  const actionVerbs = [
    'developed', 'managed', 'led', 'created', 'implemented', 'designed',
    'built', 'optimized', 'achieved', 'improved', 'increased', 'reduced',
    'coordinated', 'executed', 'delivered', 'established'
  ];
  
  const foundVerbs = actionVerbs.filter(verb => lowerText.includes(verb));
  score += Math.min(15, (foundVerbs.length / actionVerbs.length) * 15);
  
  // Quantifiable achievements
  const hasNumbers = /\d+[%$]?/.test(text);
  if (hasNumbers) score += 10;
  
  return Math.min(25, score);
};

const calculateCompleteness = (text) => {
  let score = 0;
  const lowerText = text.toLowerCase();
  
  // Required sections
  const requiredSections = ['experience', 'education', 'skills'];
  requiredSections.forEach(section => {
    if (lowerText.includes(section)) score += 5;
  });
  
  // Contact information
  const hasEmail = /@/.test(text);
  const hasPhone = /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(text);
  
  if (hasEmail) score += 2.5;
  if (hasPhone) score += 2.5;
  
  return Math.min(20, score);
};

export const extractSkills = (text) => {
  const skillKeywords = [
    // Programming Languages
    'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
    'typescript', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css',
    
    // Frameworks & Libraries
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring',
    'bootstrap', 'jquery', 'redux', 'nextjs', 'gatsby', 'nuxt',
    
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'cassandra',
    'oracle', 'sqlite', 'dynamodb',
    
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github',
    'gitlab', 'ci/cd', 'terraform', 'ansible',
    
    // Tools & Platforms
    'linux', 'windows', 'macos', 'visual studio', 'intellij', 'eclipse',
    'postman', 'figma', 'sketch', 'photoshop',
    
    // Soft Skills
    'leadership', 'communication', 'teamwork', 'problem solving', 'project management',
    'agile', 'scrum', 'analytical thinking'
  ];
  
  const lowerText = text.toLowerCase();
  const foundSkills = skillKeywords.filter(skill => 
    lowerText.includes(skill.toLowerCase())
  );
  
  // Remove duplicates and return unique skills
  return [...new Set(foundSkills)].slice(0, 15); // Limit to top 15 skills
};

export const parseSections = (text) => {
  const sections = {};
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  let currentSection = 'general';
  let currentContent = [];
  
  const sectionPatterns = {
    'summary': /^(summary|profile|objective|about)/i,
    'experience': /^(experience|work|employment|career|professional experience)/i,
    'education': /^(education|academic|degree|university|college)/i,
    'skills': /^(skills|technical skills|technologies|tools|competencies)/i,
    'projects': /^(projects|portfolio|work samples|personal projects)/i,
    'certifications': /^(certifications|certificates|licenses|credentials)/i,
    'achievements': /^(achievements|awards|honors|accomplishments)/i
  };
  
  lines.forEach(line => {
    let foundSection = null;
    
    // Check if line matches a section header
    for (const [section, pattern] of Object.entries(sectionPatterns)) {
      if (pattern.test(line) && line.length < 100) {
        foundSection = section;
        break;
      }
    }
    
    if (foundSection) {
      // Save previous section content
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n').trim();
      }
      
      // Start new section
      currentSection = foundSection;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  });
  
  // Save the last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n').trim();
  }
  
  return sections;
};

export const generateATSFeedback = (score, sections, skills) => {
  const feedback = {
    score,
    level: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Poor',
    strengths: [],
    improvements: []
  };
  
  // Strengths
  if (skills.length >= 10) {
    feedback.strengths.push('Strong technical skill set');
  }
  
  if (sections.experience) {
    feedback.strengths.push('Clear work experience section');
  }
  
  if (sections.education) {
    feedback.strengths.push('Education background included');
  }
  
  // Improvements
  if (score < 70) {
    feedback.improvements.push('Add more industry-relevant keywords');
  }
  
  if (!sections.summary && !sections.objective) {
    feedback.improvements.push('Consider adding a professional summary');
  }
  
  if (skills.length < 5) {
    feedback.improvements.push('Expand your skills section');
  }
  
  if (!sections.projects) {
    feedback.improvements.push('Include relevant projects or portfolio items');
  }
  
  return feedback;
};