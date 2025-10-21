"use client";
import { useState, useEffect } from "react";
import { database } from "../util/firebaseConfig";
import { ref, onValue, set, serverTimestamp } from "firebase/database";
import { QuizQuestion } from "../types";
import { useAuth } from "../util/AuthContext";
import Link from "next/link";

const SubmitAnswer = () => {
  const { user: fbUser, loading } = useAuth();

  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: number }>({});
  const [hasAnswered, setHasAnswered] = useState(false); 

  const getUserId = (user: any): string | null => {
    return user?.uid || null;
  }
  
  useEffect(() => {
    if (loading) return; 

    const userId = getUserId(fbUser);
    
    if (!fbUser) {
        setCurrentQuiz(null);
        setHasAnswered(false);
        return;
    }

    const eventControlRef = ref(database, "EventControl/currentQuizId");
    
    const unsubscribe = onValue(eventControlRef, (snapshot) => {
      const quizId = snapshot.val();
      
      setHasAnswered(false); 
      setCurrentQuiz(null); 

      if (quizId) {
        const quizRef = ref(database, `quiz/${quizId}`);
        
        const quizUnsubscribe = onValue(quizRef, (quizSnapshot) => {
          if (quizSnapshot.exists()) {
            const fetchedQuiz = {
              id: quizId,
              ...quizSnapshot.val(),
            };
            setCurrentQuiz(fetchedQuiz as QuizQuestion);
            
            if (userId) {
              const userAnswerRef = ref(database, `UserAnswers/${userId}/${quizId}`);
              onValue(userAnswerRef, (answerSnapshot) => {
                if (answerSnapshot.exists()) {
                  setHasAnswered(true);
                } else {
                  setHasAnswered(false);
                }
              }, { onlyOnce: true });
            }
            
          } else {
            setCurrentQuiz(null);
            setHasAnswered(false);
          }
        });
        return () => quizUnsubscribe();
      } else {
        setCurrentQuiz(null);
      }
    });
    return () => unsubscribe();
  }, [fbUser, loading]); 

  const handleAnswerChange = (quizId: string, selectedAnswerId: string) => {
    setUserAnswers((prevAnswers) => ({
      ...prevAnswers,
      [quizId]: parseInt(selectedAnswerId),
    }));
  };

  const handleSubmit = (quizId: string) => {
    if (!fbUser) {
      alert("You must be logged in to submit an answer.");
      return;
    }
    
    const answerId = userAnswers[quizId];
    if (answerId === undefined) {
      alert("Please select an answer.");
      return;
    }
    
    if (hasAnswered) {
        alert("You have already submitted an answer for this quiz.");
        return;
    }

    const userId = getUserId(fbUser);
    if (!userId) return;

    const answerRef = ref(database, `UserAnswers/${userId}/${quizId}`);

    try {
      set(answerRef, {
        answerId: answerId,
        userName: fbUser.email, 
        timestamp: serverTimestamp(),
      });
      setHasAnswered(true); 
      alert("Answer submitted successfully! Waiting for the next quiz...");
    } catch (error) {
      console.error("Error submitting quiz:", error);
    }
  };
  
  // Loading State
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xl font-semibold text-slate-700">Checking authentication...</span>
        </div>
      </div>
    );
  }
  
  // Login Required
  if (!fbUser) {
    return(
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white border-2 border-red-200 shadow-lg text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-3 text-red-600">Login Required</h2>
          <p className="mb-6 text-slate-600">You need to log in to submit answers. Go to the home page to log in with your provided credentials.</p>
          <Link href="/" className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-md hover:shadow-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            Go to Login
          </Link>
        </div>
      </div>
    )
  }
  
  // Quiz Display Screen
  return (
    <div className="w-full min-h-screen p-8 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-6 font-medium transition-colors group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Current Quiz</h2>
            <p className="text-sm text-slate-500">Playing as: <span className="font-semibold text-blue-600">{fbUser.email}</span></p>
          </div>
        </div>

        {currentQuiz ? (
          <div className="p-6 rounded-2xl bg-white border-2 border-slate-200 shadow-lg">
            {/* Question */}
            <div className="mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 leading-relaxed">{currentQuiz.question}</h3>
              </div>
            </div>
            
            {/* Status Message */}
            {hasAnswered ? (
              <div className="mb-6 p-4 bg-green-100 border-2 border-green-300 rounded-xl flex items-center gap-3">
                <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-green-700 font-semibold">
                  Answer submitted! Waiting for the next question...
                </p>
              </div>
            ) : (
              <div className="mb-6 p-4 bg-blue-100 border-2 border-blue-300 rounded-xl flex items-center gap-3">
                <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-blue-700 font-semibold">
                  Select your answer below
                </p>
              </div>
            )}

            {/* Answer Options */}
            <div className="space-y-3 mb-6">
              {currentQuiz.answers.map((answer, index) => {
                const isSelected = userAnswers[currentQuiz.id!] === answer.key;
                return (
                  <label 
                    key={answer.key}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      hasAnswered 
                        ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200' 
                        : isSelected
                          ? 'bg-blue-50 border-blue-400 shadow-md'
                          : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <input
                        type="radio"
                        name={`quiz-${currentQuiz.id}`}
                        value={answer.key}
                        checked={isSelected}
                        onChange={(e) => handleAnswerChange(currentQuiz.id!, e.target.value)}
                        disabled={hasAnswered}
                        className="w-5 h-5 cursor-pointer accent-blue-500"
                      />
                      {isSelected && !hasAnswered && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        isSelected && !hasAnswered
                          ? 'bg-blue-500 text-white' 
                          : 'bg-slate-200 text-slate-600'
                      } transition-all duration-300`}>
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>
                        {answer.text}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Submit Button */}
            <button
              onClick={() => handleSubmit(currentQuiz.id!)}
              className={`w-full flex items-center justify-center gap-2 p-4 rounded-xl font-semibold transition-all duration-300 shadow-md ${
                hasAnswered 
                  ? 'bg-slate-400 text-white cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]'
              }`}
              disabled={hasAnswered}
            >
              {hasAnswered ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submitted
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit Answer
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-12 rounded-2xl bg-white border-2 border-slate-200 shadow-lg text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl text-slate-500 font-medium">
              No active quiz at the moment.
            </p>
            <p className="text-sm text-slate-400 mt-2">
              Please wait for the next question.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmitAnswer;