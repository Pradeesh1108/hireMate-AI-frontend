import pdf from 'pdf-parse';

export const parsePDF = async (buffer) => {
  try {
    const data = await pdf(buffer);
    return {
      text: data.text,
      pages: data.numpages,
      info: data.info
    };
  } catch (error) {
    throw new Error(`PDF parsing failed: ${error.message}`);
  }
};

export const extractTextSections = (text) => {
  const sections = {};
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  let currentSection = 'general';
  let currentContent = [];
  
  const sectionHeaders = {
    'summary': ['summary', 'profile', 'objective', 'about'],
    'experience': ['experience', 'work', 'employment', 'career', 'professional'],
    'education': ['education', 'academic', 'degree', 'university', 'college'],
    'skills': ['skills', 'technical', 'technologies', 'tools', 'competencies'],
    'projects': ['projects', 'portfolio', 'work samples'],
    'certifications': ['certifications', 'certificates', 'licenses'],
    'achievements': ['achievements', 'awards', 'honors', 'accomplishments']
  };
  
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    let foundSection = null;
    
    // Check if line is a section header
    for (const [section, keywords] of Object.entries(sectionHeaders)) {
      if (keywords.some(keyword => lowerLine.includes(keyword) && line.length < 50)) {
        foundSection = section;
        break;
      }
    }
    
    if (foundSection) {
      // Save previous section
      if (currentContent.length > 0) {
        sections[currentSection] = currentContent.join('\n');
      }
      
      // Start new section
      currentSection = foundSection;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  });
  
  // Save last section
  if (currentContent.length > 0) {
    sections[currentSection] = currentContent.join('\n');
  }
  
  return sections;
};

export const extractContactInfo = (text) => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const linkedinRegex = /linkedin\.com\/in\/[a-zA-Z0-9-]+/i;
  const githubRegex = /github\.com\/[a-zA-Z0-9-]+/i;
  
  return {
    email: text.match(emailRegex)?.[0] || null,
    phone: text.match(phoneRegex)?.[0] || null,
    linkedin: text.match(linkedinRegex)?.[0] || null,
    github: text.match(githubRegex)?.[0] || null
  };
};

export const extractDates = (text) => {
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/g,
    /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}/gi
  ];
  
  const dates = [];
  datePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      dates.push(match[0]);
    }
  });
  
  return dates;
};

export const calculateExperienceYears = (text) => {
  const datePattern = /(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi;
  const matches = [...text.matchAll(datePattern)];
  
  if (matches.length === 0) return 0;
  
  let totalYears = 0;
  const currentYear = new Date().getFullYear();
  
  matches.forEach(match => {
    const startYear = parseInt(match[1]);
    const endYear = match[2].toLowerCase().includes('present') || 
                   match[2].toLowerCase().includes('current') 
                   ? currentYear 
                   : parseInt(match[2]);
    
    if (endYear >= startYear) {
      totalYears += endYear - startYear;
    }
  });
  
  return Math.min(totalYears, 30); // Cap at 30 years
};