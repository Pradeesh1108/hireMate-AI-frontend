import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Upload as UploadIcon, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  ArrowRight,
  User,
  Briefcase,
  GraduationCap,
  Target
} from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const Upload = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [jobDescription, setJobDescription] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const navigate = useNavigate();

  // Restore state from session storage on component mount
  useEffect(() => {
    const restoreState = async () => {
      setIsRestoring(true);
      
      // Restore job description
      const savedJobDescription = sessionStorage.getItem('uploadJobDescription');
      if (savedJobDescription) {
        setJobDescription(savedJobDescription);
      }
      
      // Restore analysis results
      const savedAnalysis = sessionStorage.getItem('uploadAnalysis');
      if (savedAnalysis) {
        try {
          setAnalysis(JSON.parse(savedAnalysis));
        } catch (error) {
          console.error('Error parsing saved analysis:', error);
        }
      }
      
      // Restore file info (we can't restore the actual file, but we can show the filename)
      const savedFileName = sessionStorage.getItem('uploadFileName');
      const savedFileSize = sessionStorage.getItem('uploadFileSize');
      if (savedFileName && savedFileSize) {
        // Create a mock file object to display the file info
        const mockFile = {
          name: savedFileName,
          size: parseInt(savedFileSize),
          type: 'application/pdf'
        };
        setFile(mockFile);
      }
      
      setIsRestoring(false);
    };
    
    restoreState();
  }, []);

  // Save state to session storage whenever it changes
  useEffect(() => {
    if (!isRestoring) {
      if (jobDescription) {
        sessionStorage.setItem('uploadJobDescription', jobDescription);
      }
      if (analysis) {
        sessionStorage.setItem('uploadAnalysis', JSON.stringify(analysis));
      }
      if (file) {
        sessionStorage.setItem('uploadFileName', file.name);
        sessionStorage.setItem('uploadFileSize', file.size.toString());
      }
    }
  }, [jobDescription, analysis, file, isRestoring]);

  // Clear session storage when file is removed
  const clearUploadSession = () => {
    sessionStorage.removeItem('uploadJobDescription');
    sessionStorage.removeItem('uploadAnalysis');
    sessionStorage.removeItem('uploadFileName');
    sessionStorage.removeItem('uploadFileSize');
    sessionStorage.removeItem('resumeText');
    sessionStorage.removeItem('atsScore');
    sessionStorage.removeItem('jobDescription');
    setFile(null);
    setAnalysis(null);
    setJobDescription("");
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf') {
        setFile(file);
      } else {
        alert('Please upload a PDF file.');
      }
    }
  }, []);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert('Please select a PDF file.');
    }
  };

  const analyzeResume = async () => {
    if (!file || !jobDescription) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('resume', file);
    formData.append('job_description', jobDescription);
    
    try {
      const response = await axios.post(`${BACKEND_URL}/api/analyze-resume`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout
      });
      
      setAnalysis(response.data);
      if (response.data && response.data.resumeText) {
        sessionStorage.setItem('resumeText', response.data.resumeText);
        sessionStorage.setItem('atsScore', response.data.atsScore);
        sessionStorage.setItem('jobDescription', jobDescription);
      }
    } catch (error) {
      let errorMessage = 'Error analyzing resume. ';
      if (error.response?.status === 0) {
        errorMessage += 'Cannot connect to server. Please check your network connection.';
      } else if (error.response?.status === 404) {
        errorMessage += 'Server endpoint not found.';
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error occurred.';
      } else if (error.code === 'ECONNABORTED') {
        errorMessage += 'Request timed out. Please try again.';
      } else {
        errorMessage += error.response?.data?.error || error.message;
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const ScoreBar = ({ label, score, color = "indigo" }) => (
    <div className="mb-4">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-bold text-gray-900">{score}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`bg-${color}-600 h-3 rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Resume Analysis & ATS Scoring
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Upload your resume to get instant ATS compatibility scoring and detailed analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Your Resume</h2>
            
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all duration-200 ${
                  dragActive 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <UploadIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your PDF resume here
                </h3>
                <p className="text-gray-600 mb-6">or click to browse files</p>
                
                <label className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition-colors duration-200">
                  <UploadIcon className="h-5 w-5 mr-2" />
                  Select PDF File
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-red-600" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{file.name}</h3>
                      <p className="text-sm text-gray-600">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={analyzeResume}
                    disabled={uploading || !file || !jobDescription}
                    className="flex-1 inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors duration-200"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="h-5 w-5 mr-2" />
                        Analyze Resume
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={clearUploadSession}
                    className="px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Results */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis Results</h2>
            
            {!analysis ? (
              <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Upload and analyze your resume to see results</p>
              </div>
            ) : (
              <div className="analysis-results">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 shadow-md flex flex-col items-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Overall ATS Score</h3>
                  <div className="text-5xl font-extrabold text-indigo-600 mb-2">{analysis.atsScore}%</div>
                  <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                    <div 
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${analysis.atsScore}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6">
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2" htmlFor="jobDescription">
              Job Description
            </label>
            <textarea
              id="jobDescription"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={5}
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              required
            />
          </div>
        </div>

        {analysis && (
          <div className="mt-6 flex flex-col gap-4">
            <button
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold"
              onClick={() => navigate('/interview')}
            >
              Start Interview
            </button>
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold"
              onClick={() => navigate('/career-coach')}
            >
              Go to Career Coach
            </button>
            <button
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold"
              onClick={clearUploadSession}
            >
              Clear Analysis & Start Over
            </button>
          </div>
        )}

        {analysis && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Extracted Resume Text</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
              {analysis.resumeText}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;