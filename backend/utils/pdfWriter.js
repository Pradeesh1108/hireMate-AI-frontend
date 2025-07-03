import PDFKit from 'pdfkit';

export const generatePDFReport = async (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFKit();
      const chunks = [];
      
      // Collect PDF data
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });
      
      // Header
      doc.fontSize(24)
         .fillColor('#4F46E5')
         .text('CareerMate AI - Professional Report', 50, 50);
      
      doc.fontSize(12)
         .fillColor('#6B7280')
         .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, 80);
      
      // Overall Performance Section
      doc.fontSize(18)
         .fillColor('#111827')
         .text('Overall Performance', 50, 120);
      
      doc.fontSize(12)
         .text(`ATS Score: ${reportData.atsScore || 'N/A'}%`, 50, 150)
         .text(`Interview Score: ${reportData.interviewScore || 'N/A'}/10`, 50, 170)
         .text(`Overall Grade: ${reportData.overallGrade || 'N/A'}`, 50, 190);
      
      // Key Strengths Section
      doc.fontSize(16)
         .fillColor('#111827')
         .text('Key Strengths', 50, 230);
      
      let yPosition = 260;
      if (reportData.strengths && reportData.strengths.length > 0) {
        reportData.strengths.forEach((strength, index) => {
          doc.fontSize(10)
             .fillColor('#059669')
             .text(`✓ ${strength}`, 60, yPosition);
          yPosition += 20;
        });
      } else {
        doc.fontSize(10)
           .fillColor('#6B7280')
           .text('No strengths data available', 60, yPosition);
        yPosition += 20;
      }
      
      // Areas for Improvement Section
      yPosition += 20;
      doc.fontSize(16)
         .fillColor('#111827')
         .text('Areas for Improvement', 50, yPosition);
      
      yPosition += 30;
      if (reportData.improvements && reportData.improvements.length > 0) {
        reportData.improvements.forEach((improvement, index) => {
          doc.fontSize(10)
             .fillColor('#DC2626')
             .text(`• ${improvement}`, 60, yPosition);
          yPosition += 20;
        });
      } else {
        doc.fontSize(10)
           .fillColor('#6B7280')
           .text('No improvement suggestions available', 60, yPosition);
        yPosition += 20;
      }
      
      // Career Recommendations Section
      yPosition += 20;
      doc.fontSize(16)
         .fillColor('#111827')
         .text('Career Recommendations', 50, yPosition);
      
      yPosition += 30;
      if (reportData.careerSuggestions && reportData.careerSuggestions.length > 0) {
        reportData.careerSuggestions.forEach((suggestion, index) => {
          doc.fontSize(12)
             .fillColor('#4F46E5')
             .text(`${suggestion.role} (${suggestion.match}% match)`, 60, yPosition);
          
          doc.fontSize(10)
             .fillColor('#6B7280')
             .text(suggestion.description, 60, yPosition + 15);
          
          yPosition += 45;
        });
      } else {
        doc.fontSize(10)
           .fillColor('#6B7280')
           .text('No career recommendations available', 60, yPosition);
        yPosition += 20;
      }
      
      // Skill Development Section
      if (yPosition > 650) {
        doc.addPage();
        yPosition = 50;
      }
      
      yPosition += 20;
      doc.fontSize(16)
         .fillColor('#111827')
         .text('Recommended Skill Development', 50, yPosition);
      
      yPosition += 30;
      if (reportData.skillGaps && reportData.skillGaps.length > 0) {
        reportData.skillGaps.forEach((gap, index) => {
          doc.fontSize(12)
             .fillColor('#7C3AED')
             .text(`${gap.skill} (${gap.importance} Priority)`, 60, yPosition);
          
          if (gap.timeToLearn) {
            doc.fontSize(10)
               .fillColor('#6B7280')
               .text(`Time to learn: ${gap.timeToLearn}`, 60, yPosition + 15);
          }
          
          yPosition += 35;
        });
      } else {
        doc.fontSize(10)
           .fillColor('#6B7280')
           .text('No skill gaps identified', 60, yPosition);
        yPosition += 20;
      }
      
      // Learning Path Section
      if (yPosition > 600) {
        doc.addPage();
        yPosition = 50;
      }
      
      yPosition += 20;
      doc.fontSize(16)
         .fillColor('#111827')
         .text('Learning Path', 50, yPosition);
      
      yPosition += 30;
      if (reportData.learningPath && reportData.learningPath.length > 0) {
        reportData.learningPath.forEach((step, index) => {
          doc.fontSize(12)
             .fillColor('#1D4ED8')
             .text(`${index + 1}. ${step}`, 60, yPosition);
          
          yPosition += 25;
        });
      } else {
        doc.fontSize(10)
           .fillColor('#6B7280')
           .text('No learning path available', 60, yPosition);
      }
      
      // Footer
      doc.fontSize(8)
         .fillColor('#9CA3AF')
         .text('Generated by CareerMate AI - Your AI-Powered Career Assistant', 50, 750);
      
      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      reject(error);
    }
  });
};

export const generateDetailedReport = async (userData) => {
  // Enhanced report generation with more detailed sections
  const reportData = {
    ...userData,
    metadata: {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      type: 'Comprehensive Career Analysis'
    }
  };
  
  return generatePDFReport(reportData);
};