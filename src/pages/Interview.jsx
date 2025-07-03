import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Play, 
  Pause, 
  Mic, 
  MicOff, 
  Volume2, 
  Send,
  CheckCircle,
  ArrowRight,
  Clock,
  MessageCircle,
  Award,
  BarChart3,
  Bot,
  User,
  Loader
} from 'lucide-react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const Interview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [chatHistory, setChatHistory] = useState([]); // {question, answer}
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [atsScore, setAtsScore] = useState(sessionStorage.getItem('atsScore') || '');
  const [resumeText, setResumeText] = useState(sessionStorage.getItem('resumeText') || '');
  const [userIntro, setUserIntro] = useState('');
  const [showIntroPrompt, setShowIntroPrompt] = useState(true);
  const [userName, setUserName] = useState('');
  const [interviewResults, setInterviewResults] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const mediaRecorderRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    if (resumeText) {
      const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) setUserName(lines[0]);
    }
  }, [resumeText]);

  useEffect(() => {
    setAtsScore(sessionStorage.getItem('atsScore') || '');
    setResumeText(sessionStorage.getItem('resumeText') || '');
    const results = sessionStorage.getItem('interviewResults');
    if (results) setInterviewResults(JSON.parse(results));
    
    // Restore interview state from sessionStorage
    const savedInterviewState = sessionStorage.getItem('interviewState');
    console.log('Saved interview state:', savedInterviewState);
    
    if (savedInterviewState) {
      try {
        const state = JSON.parse(savedInterviewState);
        console.log('Parsed interview state:', state);
        
        // Only restore if we have resume text (interview is valid)
        if (sessionStorage.getItem('resumeText')) {
          console.log('Restoring interview state...');
          setIsRestoring(true);
          
          // If interview is started or has chat history, we should not show intro prompt
          const hasInterviewProgress = state.interviewStarted || (state.chatHistory && state.chatHistory.length > 0);
          const shouldShowIntro = hasInterviewProgress ? false : (state.showIntroPrompt !== undefined ? state.showIntroPrompt : true);
          setShowIntroPrompt(shouldShowIntro);
          setInterviewStarted(hasInterviewProgress);
          setInterviewCompleted(state.interviewCompleted || false);
          setUserIntro(state.userIntro || '');
          setCurrentQuestion(state.currentQuestion || '');
          setChatHistory(state.chatHistory || []);
          setChatMessages(state.chatMessages || []);
          setWaitingForAnswer(state.waitingForAnswer || false);
          setInterviewResults(state.interviewResults || null);
          
          console.log('Interview state restored:', {
            showIntroPrompt: state.showIntroPrompt,
            interviewStarted: state.interviewStarted,
            interviewCompleted: state.interviewCompleted,
            chatHistoryLength: state.chatHistory?.length || 0,
            chatMessagesLength: state.chatMessages?.length || 0
          });
          
          // Set a timeout to allow state updates to complete
          setTimeout(() => {
            setIsRestoring(false);
          }, 1000);
        } else {
          console.log('No resume text found, clearing interview state');
          sessionStorage.removeItem('interviewState');
        }
      } catch (error) {
        console.error('Error parsing interview state:', error);
        sessionStorage.removeItem('interviewState');
      }
    } else {
      console.log('No saved interview state found');
    }
  }, []);

  useEffect(() => {
    if (chatMessages.length === 0) return;
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (lastMsg.type === 'bot' && !lastMsg.isTyping && lastMsg.content) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(lastMsg.content);
      utterance.lang = 'en-US';
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, [chatMessages]);

  // Cleanup MediaRecorder on unmount or state changes
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.error('Error cleaning up MediaRecorder:', error);
        }
        mediaRecorderRef.current = null;
      }
    };
  }, []);

  // Stop recording when interview state changes
  useEffect(() => {
    if (!waitingForAnswer && isRecording) {
      stopRecording();
    }
  }, [waitingForAnswer]);

  // Save interview state whenever key states change
  useEffect(() => {
    // Don't save if we're in the middle of restoring state
    if (!isRestoring) {
      saveInterviewState();
    }
  }, [showIntroPrompt, interviewStarted, interviewCompleted, userIntro, currentQuestion, chatHistory, chatMessages, waitingForAnswer, interviewResults, isRestoring]);

  // Ensure intro prompt is hidden if interview is started
  useEffect(() => {
    if (interviewStarted && showIntroPrompt) {
      console.log('Hiding intro prompt because interview is started');
      setShowIntroPrompt(false);
    }
  }, [interviewStarted, showIntroPrompt]);

  const fetchNextQuestion = async (history, intro = undefined) => {
    if (!resumeText) {
      setLoading(false);
      alert('Resume text is missing. Please analyze your resume first.');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        resumeText,
        chatHistory: history
      };
      if (intro !== undefined) payload.userIntro = intro;
      const response = await axios.post(`${BACKEND_URL}/api/interview/next-question`, payload);
      if (response.data.question) {
        setCurrentQuestion(response.data.question);
        setChatMessages(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            type: 'bot',
            content: response.data.question,
            timestamp: new Date(),
            isTyping: false
          }
        ]);
        setWaitingForAnswer(true);
      } else {
        alert('Failed to generate next question.');
      }
    } catch (error) {
      if (error.response && error.response.status === 429) {
        alert('Gemini API quota exceeded. Please try again later or upgrade your plan.');
      } else if (error.response && error.response.data && error.response.data.error) {
        alert('Error: ' + error.response.data.error);
      } else {
        alert('Error connecting to the backend. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const startInterview = () => {
    if (!resumeText) {
      alert('Please upload and analyze your resume before starting the interview.');
      return;
    }
    setInterviewStarted(true);
    setChatHistory([]);
    setChatMessages([]);
    fetchNextQuestion([], userIntro);
  };

  const clearInterviewState = () => {
    sessionStorage.removeItem('interviewState');
    setShowIntroPrompt(true);
    setInterviewStarted(false);
    setInterviewCompleted(false);
    setUserIntro('');
    setCurrentQuestion('');
    setChatHistory([]);
    setChatMessages([]);
    setWaitingForAnswer(false);
    setInterviewResults(null);
  };

  const submitAnswer = async () => {
    if (!userAnswer.trim()) return;
    setIsEvaluating(true);
    setWaitingForAnswer(false);
    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        type: 'user',
        content: userAnswer,
        timestamp: new Date(),
        isTyping: false
      }
    ]);
    const typingId = Date.now() + Math.random();
    setChatMessages(prev => [
      ...prev,
      {
        id: typingId,
        type: 'bot',
        content: '',
        timestamp: new Date(),
        isTyping: true
      }
    ]);
    const newHistory = [
      ...chatHistory,
      { question: currentQuestion, answer: userAnswer }
    ];
    setChatHistory(newHistory);
    try {
      const nextQRes = await axios.post(`${BACKEND_URL}/api/interview/next-question`, {
        resumeText,
        chatHistory: newHistory
      });
      const nextQ = nextQRes.data.question || 'No next question.';
      axios.post(`${BACKEND_URL}/api/interview/evaluate`, {
        question: currentQuestion,
        answer: userAnswer,
        resumeText
      }).then(res => {
        if (res.data && typeof res.data.score === 'number') {
          setChatHistory(prev => prev.map((item, idx) =>
            idx === prev.length - 1 ? { ...item, score: res.data.score } : item
          ));
        }
      }).catch(() => {});
      setTimeout(() => {
        setChatMessages(prev => prev.map(msg =>
          msg.id === typingId ? { ...msg, content: nextQ, isTyping: false } : msg
        ));
        setTimeout(() => {
          if (newHistory.length < 6) {
            setCurrentQuestion(nextQ);
            setWaitingForAnswer(true);
            setUserAnswer('');
            textareaRef.current?.focus();
          } else {
            setInterviewCompleted(true);
            generateReport(newHistory);
          }
        }, 1500);
      }, 1200);
    } catch (error) {
      setChatMessages(prev => prev.map(msg =>
        msg.id === typingId ? { ...msg, content: 'Error getting next question.', isTyping: false } : msg
      ));
    } finally {
      setIsEvaluating(false);
      setUserAnswer('');
      textareaRef.current?.focus();
    }
  };

  const autoSubmitAnswer = async (transcribedText) => {
    if (!transcribedText.trim() || !waitingForAnswer || isEvaluating) return;
    
    console.log('Auto-submitting answer:', transcribedText);
    setIsAutoSubmitting(true);
    
    // Set the transcribed text as the answer
    setUserAnswer(transcribedText);
    
    // Wait a moment for state to update, then submit
    setTimeout(async () => {
      try {
        setIsEvaluating(true);
        setWaitingForAnswer(false);
        
        // Add user message to chat
        setChatMessages(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            type: 'user',
            content: transcribedText,
            timestamp: new Date(),
            isTyping: false
          }
        ]);
        
        const typingId = Date.now() + Math.random();
        setChatMessages(prev => [
          ...prev,
          {
            id: typingId,
            type: 'bot',
            content: '',
            timestamp: new Date(),
            isTyping: true
          }
        ]);
        
        const newHistory = [
          ...chatHistory,
          { question: currentQuestion, answer: transcribedText }
        ];
        setChatHistory(newHistory);
        
        // Get next question
        const nextQRes = await axios.post(`${BACKEND_URL}/api/interview/next-question`, {
          resumeText,
          chatHistory: newHistory
        });
        const nextQ = nextQRes.data.question || 'No next question.';
        
        // Evaluate answer (optional)
        axios.post(`${BACKEND_URL}/api/interview/evaluate`, {
          question: currentQuestion,
          answer: transcribedText,
          resumeText
        }).then(res => {
          if (res.data && typeof res.data.score === 'number') {
            setChatHistory(prev => prev.map((item, idx) =>
              idx === prev.length - 1 ? { ...item, score: res.data.score } : item
            ));
          }
        }).catch(() => {});
        
        // Show next question
        setTimeout(() => {
          setChatMessages(prev => prev.map(msg =>
            msg.id === typingId ? { ...msg, content: nextQ, isTyping: false } : msg
          ));
          setTimeout(() => {
            if (newHistory.length < 6) {
              setCurrentQuestion(nextQ);
              setWaitingForAnswer(true);
              setUserAnswer('');
              textareaRef.current?.focus();
            } else {
              setInterviewCompleted(true);
              generateReport(newHistory);
            }
          }, 1500);
        }, 1200);
        
      } catch (error) {
        console.error('Auto-submission error:', error);
        setChatMessages(prev => prev.map(msg =>
          msg.id === typingId ? { ...msg, content: 'Error getting next question.', isTyping: false } : msg
        ));
      } finally {
        setIsEvaluating(false);
        setIsAutoSubmitting(false);
        setUserAnswer('');
        textareaRef.current?.focus();
      }
    }, 500); // Wait 500ms for state to update
  };

  const generateReport = async (history) => {
    setLoading(true);
    try {
      const interviewData = chatMessages
        .filter(msg => msg.type === 'bot' && !msg.isTyping && msg.content !== currentQuestion)
        .map((msg, i) => ({
          question: history[i]?.question,
          answer: history[i]?.answer,
          feedback: msg.content
        }));
      const response = await axios.post(`${BACKEND_URL}/api/interview/report`, {
        interviewData,
        userName,
        resumeText
      });
      sessionStorage.setItem('interviewReport', response.data.report);
      navigate('/report');
    } catch (error) {
      alert('Error generating report.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const goToReport = () => {
    const averageScore = chatHistory.length > 0 
      ? Math.round(chatHistory.reduce((sum, answer) => sum + answer.score, 0) / chatHistory.length)
      : 0;

    const interviewResults = {
      answers: chatHistory,
      averageScore,
      totalQuestions: chatHistory.length,
      completedAt: new Date().toISOString(),
      duration: '15-20 minutes'
    };

    sessionStorage.setItem('interviewResults', JSON.stringify(interviewResults));
    navigate('/report');
  };

  const averageScore = chatHistory.length > 0 
    ? Math.round(chatHistory.reduce((sum, answer) => sum + answer.score, 0) / chatHistory.length)
    : 0;

  const saveInterviewState = () => {
    if (isRestoring) {
      console.log('Skipping save during restoration');
      return;
    }
    
    const state = {
      showIntroPrompt,
      interviewStarted,
      interviewCompleted,
      userIntro,
      currentQuestion,
      chatHistory,
      chatMessages,
      waitingForAnswer,
      interviewResults
    };
    console.log('Saving interview state:', state);
    sessionStorage.setItem('interviewState', JSON.stringify(state));
  };

  const handleIntroSubmit = () => {
    if (!userIntro.trim()) return;
    setShowIntroPrompt(false);
    startInterview();
  };

  // Voice input logic using MediaRecorder API
  const startRecording = async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder with fallback options
      let mediaRecorder;
      const mimeTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/wav'
      ];
      
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          mediaRecorder = new MediaRecorder(stream, { mimeType });
          break;
        }
      }
      
      if (!mediaRecorder) {
        mediaRecorder = new MediaRecorder(stream);
      }
      
      const chunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        setIsProcessing(true);
        
        // Convert audio chunks to blob
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        
        // Send to backend for speech-to-text conversion
        try {
          console.log('Audio blob size:', audioBlob.size, 'bytes');
          console.log('Audio blob type:', audioBlob.type);
          
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');
          
          console.log('Sending audio to backend...');
          const response = await axios.post(`${BACKEND_URL}/api/speech-to-text`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            timeout: 30000, // 30 second timeout
          });
          
          console.log('Backend response:', response.data);
          
          if (response.data.success) {
            const transcribedText = response.data.text;
            console.log('Transcribed text:', transcribedText);
            
            // Automatically submit the transcribed answer
            autoSubmitAnswer(transcribedText);
          } else {
            console.error('Speech recognition failed:', response.data.error);
            alert('Speech recognition failed: ' + response.data.error);
          }
        } catch (error) {
          console.error('Error sending audio to backend:', error);
          if (error.response) {
            console.error('Error response:', error.response.data);
            alert('Backend error: ' + (error.response.data.error || error.response.statusText));
          } else if (error.request) {
            console.error('No response received');
            alert('No response from backend. Please check if the server is running.');
          } else {
            alert('Failed to convert speech to text: ' + error.message);
          }
          
          // Fallback to browser speech recognition if backend fails
          console.log('Trying browser speech recognition as fallback...');
          try {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
              const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
              const recognition = new SpeechRecognition();
              recognition.lang = 'en-US';
              recognition.interimResults = false;
              recognition.continuous = false;
              
              recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('Browser recognition result:', transcript);
                
                // Automatically submit the transcribed answer
                autoSubmitAnswer(transcript);
              };
              
              recognition.onerror = (event) => {
                console.error('Browser recognition error:', event.error);
              };
              
              recognition.start();
            }
          } catch (fallbackError) {
            console.error('Fallback recognition also failed:', fallbackError);
          }
        } finally {
          setIsProcessing(false);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('Recording error occurred. Please try again.');
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };
      
      // Start recording
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotAllowedError') {
        alert('Microphone access denied. Please allow microphone access and try again.');
      } else {
        alert('Failed to start recording: ' + error.message);
      }
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  if (showIntroPrompt) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-xl w-full flex flex-col items-center">
          <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <Bot className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Your AI Interview</h1>
          <p className="text-lg text-gray-600 mb-6 text-center">
            Before we begin, please introduce yourself briefly. This helps your AI interviewer personalize your experience!
          </p>
          <textarea
            className="w-full p-4 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
            rows={4}
            value={userIntro}
            onChange={e => setUserIntro(e.target.value)}
            placeholder="Write a short introduction about yourself..."
          />
          <button
            onClick={handleIntroSubmit}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">AI Interview Practice</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Start your technical interview based on your resume. You will be asked 6 diverse questions.
          </p>
          <button
            onClick={startInterview}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <MessageCircle className="h-6 w-6 mr-2" />
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (interviewCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Interview Completed!</h1>
            <p className="text-xl text-gray-600">Excellent work! Here's your performance summary.</p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-indigo-50 rounded-xl">
                <Award className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-indigo-600">{averageScore}/10</div>
                <div className="text-sm text-gray-600">Average Score</div>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <MessageCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{chatHistory.length}</div>
                <div className="text-sm text-gray-600">Questions Answered</div>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">~15</div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>
            </div>

            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={goToReport}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors duration-200"
              >
                <BarChart3 className="h-5 w-5 mr-2" />
                View Full Report
              </button>
              <button
                onClick={clearInterviewState}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Start New Interview
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="h-[60vh] overflow-y-auto p-6 space-y-4 bg-gray-50">
            {chatMessages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                }`}
              >
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  message.type === 'user' 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white border-2 border-gray-200 text-gray-600'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-5 w-5" />
                  ) : (
                    <Bot className="h-5 w-5" />
                  )}
                </div>
                
                <div className={`flex-1 max-w-xs sm:max-w-md lg:max-w-lg ${
                  message.type === 'user' ? 'text-right' : ''
                }`}>
                  <div className={`inline-block p-4 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                  }`}>
                    {message.isTyping ? (
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-line">{message.content}</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-2">
                    {message.timestamp && new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {!interviewCompleted && (
            <div className="p-6 border-t border-gray-200 bg-white">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    className="w-full p-4 border border-gray-300 rounded-lg mb-4"
                    rows={3}
                    value={userAnswer}
                    onChange={e => setUserAnswer(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isEvaluating && waitingForAnswer && userAnswer.trim()) submitAnswer();
                      }
                    }}
                    placeholder="Type your answer..."
                    disabled={isEvaluating || !waitingForAnswer}
                  />
                </div>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-3 rounded-full transition-colors duration-200 ${isRecording ? 'bg-red-500 text-white animate-pulse' : isProcessing ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-indigo-100'}`}
                    title={isRecording ? 'Stop Recording' : isProcessing ? 'Processing Audio...' : 'Start Voice Input'}
                    type="button"
                    disabled={isEvaluating || !waitingForAnswer || isProcessing}
                  >
                    {isRecording ? <MicOff className="h-5 w-5" /> : isProcessing ? <Loader className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
                  </button>
                  {isRecording && (
                    <div className="text-xs text-red-500 text-center animate-pulse">
                      Recording...
                    </div>
                  )}
                  {isProcessing && (
                    <div className="text-xs text-blue-500 text-center animate-pulse">
                      Processing...
                    </div>
                  )}
                  {isAutoSubmitting && (
                    <div className="text-xs text-green-600 text-center animate-pulse">
                      Auto-submitting in 1s...
                    </div>
                  )}
                  <button
                    onClick={submitAnswer}
                    disabled={!userAnswer.trim() || isEvaluating || !waitingForAnswer || isAutoSubmitting}
                    className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                    title="Send Answer"
                  >
                    {isEvaluating ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : isAutoSubmitting ? (
                      <Loader className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Interview;