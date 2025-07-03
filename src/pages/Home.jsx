import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Upload, BarChart3, MessageCircle, Brain, ArrowRight, CheckCircle } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: Upload,
      title: 'Upload Resume',
      description: 'Upload your PDF resume and get instant analysis with ATS compatibility scoring.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      icon: BarChart3,
      title: 'Get ATS Score',
      description: 'Receive detailed ATS score breakdown with actionable improvement suggestions.',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      icon: MessageCircle,
      title: 'Practice CV-Based Interviews',
      description: 'Practice personalized interview questions based on your resume content.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      icon: Brain,
      title: 'Receive Career Suggestions',
      description: 'Get AI-powered career guidance and personalized learning recommendations.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  const benefits = [
    'AI-powered resume analysis',
    'Real-time interview practice',
    'Personalized career guidance',
    'ATS optimization tips',
    'Comprehensive reporting',
    'Speech recognition technology',
  ];

  const [atsScore, setAtsScore] = useState(sessionStorage.getItem('atsScore') || '');
  const [resumeText, setResumeText] = useState(sessionStorage.getItem('resumeText') || '');

  useEffect(() => {
    setAtsScore(sessionStorage.getItem('atsScore') || '');
    setResumeText(sessionStorage.getItem('resumeText') || '');
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Empower Your Career
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                with AI
              </span>
            </h1>
            <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform your job search with our AI-powered platform. Get instant resume analysis, 
              practice interviews with speech recognition, and receive personalized career guidance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/upload"
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/career-coach"
                className="inline-flex items-center px-8 py-4 border-2 border-white text-lg font-medium rounded-lg text-white hover:bg-white hover:text-indigo-800 transition-all duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Career Enhancement Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform provides everything you need to advance your career
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.bgColor} ${feature.color} rounded-xl mb-6`}>
                  <feature.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Choose CareerMate AI?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our advanced AI technology analyzes your resume, provides personalized feedback, 
                and helps you practice for interviews with cutting-edge speech recognition.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-indigo-100 to-purple-100 p-12 rounded-3xl">
              <div className="text-center">
                <div className="bg-white p-8 rounded-2xl shadow-lg">
                  <BarChart3 className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">95%</h3>
                  <p className="text-gray-600">ATS Compatibility Rate</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Accelerate Your Career?
          </h2>
          <p className="text-xl text-indigo-200 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who have transformed their careers with CareerMate AI
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-indigo-900 bg-white hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;