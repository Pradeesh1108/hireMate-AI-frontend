import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Download, 
  BarChart3, 
  Award, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle,
  Target,
  BookOpen,
  Briefcase,
  User,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const Report = () => {
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(null);
  const [atsScore, setAtsScore] = useState(sessionStorage.getItem('atsScore') || '');
  const [resumeText, setResumeText] = useState(sessionStorage.getItem('resumeText') || '');
  const [interviewResults, setInterviewResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasInterviewData, setHasInterviewData] = useState(false);

  useEffect(() => {
    setAtsScore(sessionStorage.getItem('atsScore') || '');
    setResumeText(sessionStorage.getItem('resumeText') || '');
    const results = sessionStorage.getItem('interviewResults');
    if (results) setInterviewResults(JSON.parse(results));
    const report = sessionStorage.getItem('interviewReport');
    if (report) setReportData(report);
    setLoading(false);
  }, []);

  const calculateOverallGrade = (atsScore, interviewScore) => {
    const average = (atsScore + (interviewScore * 10)) / 2;
    if (average >= 90) return 'A+';
    if (average >= 85) return 'A';
    if (average >= 80) return 'A-';
    if (average >= 75) return 'B+';
    if (average >= 70) return 'B';
    return 'B-';
  };

  const generateStrengths = (results) => {
    const strengths = ['Strong technical communication skills'];
    
    if (results.averageScore >= 8) {
      strengths.push('Excellent interview performance with detailed responses');
    }
    if (results.averageScore >= 7) {
      strengths.push('Good understanding of technical concepts');
    }
    
    strengths.push('Consistent performance across all interview questions');
    strengths.push('Clear career progression and goals');
    
    return strengths;
  };

  const generateImprovements = (results) => {
    const improvements = [];
    
    if (results.averageScore < 8) {
      improvements.push('Provide more specific examples in interview responses');
    }
    if (results.averageScore < 7) {
      improvements.push('Practice articulating technical concepts more clearly');
    }
    
    improvements.push('Include more quantifiable achievements and metrics');
    improvements.push('Expand on leadership and teamwork examples');
    improvements.push('Include relevant certifications or continuous learning');
    
    return improvements;
  };

  const generatePDF = () => {
    if (!reportData || !interviewResults) return;
    
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(79, 70, 229); // Indigo
    doc.text('CareerMate AI - Professional Report', 20, 30);
    
    // Date
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128); // Gray
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    
    // Overall Scores
    doc.setFontSize(16);
    doc.setTextColor(17, 24, 39); // Dark gray
    doc.text('Overall Performance', 20, 65);
    
    doc.setFontSize(12);
    doc.text(`ATS Score: ${atsScore}%`, 20, 80);
    doc.text(`Interview Score: ${interviewResults.averageScore}/10`, 20, 95);
    doc.text(`Overall Grade: ${calculateOverallGrade(atsScore, interviewResults.averageScore)}`, 20, 110);
    
    // Interview Summary
    doc.setFontSize(16);
    doc.text('Interview Summary', 20, 135);
    doc.setFontSize(12);
    doc.text(`Questions Answered: ${interviewResults.totalQuestions}`, 20, 150);
    doc.text(`Average Score: ${interviewResults.averageScore}/10`, 20, 165);
    doc.text(`Completed: ${new Date(interviewResults.completedAt).toLocaleDateString()}`, 20, 180);
    
    // Strengths
    doc.setFontSize(16);
    doc.text('Key Strengths', 20, 205);
    doc.setFontSize(10);
    generateStrengths(interviewResults).forEach((strength, index) => {
      doc.text(`• ${strength}`, 25, 220 + (index * 12));
    });
    
    // Areas for Improvement
    let yPos = 220 + (generateStrengths(interviewResults).length * 12) + 20;
    doc.setFontSize(16);
    doc.text('Areas for Improvement', 20, yPos);
    doc.setFontSize(10);
    generateImprovements(interviewResults).forEach((improvement, index) => {
      doc.text(`• ${improvement}`, 25, yPos + 15 + (index * 12));
    });
    
    // Save the PDF
    doc.save('CareerMate-AI-Interview-Report.pdf');
  };

  const downloadPDF = async () => {
    try {
      if (!interviewResults) {
        alert('Interview results not found. Complete an interview first.');
        return;
      }
      const response = await axios.post(`${BACKEND_URL}/api/generate-report`, {
        interviewData: interviewResults.answers,
        userName: sessionStorage.getItem('userName'),
        resumeText: resumeText
      }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'CareerMate-Report.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      alert('Failed to download PDF report.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Generating your comprehensive report...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
              <AlertCircle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">No Interview Report Found</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              You need to complete an interview session before viewing your report. 
              Start an interview to generate your personalized career analysis.
            </p>
            <Link to="/interview" className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold">Start Interview</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Interview Report</h1>
            <button
              onClick={downloadPDF}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors duration-200"
            >
              <Download className="h-5 w-5 mr-2" />
              Download PDF
            </button>
          </div>
          <pre className="bg-gray-100 p-4 rounded-lg text-sm whitespace-pre-wrap">{reportData}</pre>
        </div>
      </div>
    </div>
  );
};

export default Report;