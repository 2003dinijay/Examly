"use client";
import { useState } from "react";
import { database } from "../util/firebaseConfig";
import { ref, push, serverTimestamp } from "firebase/database";
import { QuizQuestion, AnswerOption } from "../types"; 

const initialAnswers: AnswerOption[] = [
  { key: 1, text: "" },
  { key: 2, text: "" },
  { key: 3, text: "" },
  { key: 4, text: "" },
];

const AddQuiz = () => {
  const [question, setQuestion] = useState<string>("");
  const [answers, setAnswers] = useState<AnswerOption[]>(initialAnswers);
  const [rightAnswer, setRightAnswer] = useState<number>(1);
  const [topic, setTopic] = useState<string>(""); 
  const [isLoading, setIsLoading] = useState<boolean>(false); 
  const [isQuizGenerated, setIsQuizGenerated] = useState<boolean>(false);

  const submitQuizToFirebase = (quizData: Omit<QuizQuestion, "id">) => {
    try {
      const quizRef = ref(database, "quiz");
      push(quizRef, quizData);
      
      setQuestion("");
      setAnswers(initialAnswers.map(ans => ({ ...ans, text: "" })));
      setRightAnswer(1);
      setTopic("");
      setIsQuizGenerated(false);
      
      alert("Quiz added successfully!");
    } catch (error) {
      console.error("Error submitting quiz:", error);
      alert("Failed to submit quiz.");
    }
  };

  const handleFinalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newQuiz: Omit<QuizQuestion, "id"> = {
      question,
      answers,
      rightAnswer,
      timestamp: serverTimestamp(), 
    };
    submitQuizToFirebase(newQuiz);
  };
  
  const handleAIGenerate = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic for the AI to generate a quiz.");
      return;
    }

    setIsLoading(true);
    setIsQuizGenerated(false);
    
    try {
      const response = await fetch("/api/generateQuiz", { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const aiQuizData = await response.json(); 

      setQuestion(aiQuizData.question);
      setAnswers(aiQuizData.answers.map((ans: any) => ({
             key: ans.key,
             text: ans.text,
        })));
      setRightAnswer(aiQuizData.rightAnswer);
      
      setIsQuizGenerated(true); 
      alert("Quiz generated successfully! Please review and click 'Submit Quiz' below.");

    } catch (error) {
      console.error("Error generating AI quiz:", error);
      alert("Failed to generate quiz from AI.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetAnswer = (value: string, ansKey: number) => {
    setAnswers((prevAnswers) =>
      prevAnswers.map((answer) =>
        answer.key === ansKey ? { ...answer, text: value } : answer
      )
    );
  };

  const submitButtonText = isQuizGenerated ? "Submit Generated Quiz" : "Submit Quiz";

  return (
    <div className="w-full p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Add New Quiz</h3>
          <p className="text-sm text-slate-500">Create manually or generate with AI</p>
        </div>
      </div>
      
      {/* AI GENERATION SECTION */}
      <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h4 className="text-lg font-bold text-purple-900">AI Quiz Generator</h4>
            <p className="text-xs text-purple-600">Let AI create a quiz for you instantly</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-purple-800 mb-2">Quiz Topic</label>
            <input
              type="text"
              placeholder="e.g., 'React Hooks', 'World Geography', 'JavaScript ES6'..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full border-2 border-purple-200 p-3 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none disabled:bg-purple-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            />
          </div>
          
          <button
            onClick={handleAIGenerate}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-xl hover:from-purple-600 hover:to-pink-600 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Generating Quiz...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Generate with AI</span>
              </>
            )}
          </button>
        </div>

        {isQuizGenerated && (
          <div className="mt-4 p-3 bg-green-100 border-2 border-green-300 rounded-xl flex items-center gap-2">
            <span className="text-green-600 text-xl">✓</span>
            <p className="text-green-700 font-medium text-sm">Quiz generated! Review the fields below and submit when ready.</p>
          </div>
        )}
      </div>

      {/* MANUAL/GENERATED FORM SECTION */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200 shadow-lg">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800">
            {isQuizGenerated ? "Review & Submit Quiz" : "Create Quiz Manually"}
          </h3>
        </div>
        
        <form onSubmit={handleFinalSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Question</label>
            <input
              type="text"
              placeholder="Enter your quiz question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none disabled:bg-slate-50 disabled:cursor-not-allowed text-slate-800 font-medium"
              disabled={isLoading}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Answer Options</label>
            <div className="space-y-3">
              {answers.map((answer, index) => (
                <div key={answer.key} className="flex items-center gap-3 group">
                  <div className="flex-shrink-0 relative">
                    <input
                      className="w-5 h-5 cursor-pointer accent-green-500"
                      type="radio"
                      name="rightAnswer"
                      value={answer.key}
                      checked={rightAnswer === answer.key}
                      onChange={(e) => setRightAnswer(parseInt(e.target.value))}
                      disabled={isLoading}
                    />
                    {rightAnswer === answer.key && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                    )}
                  </div>
                  
                  <div className="flex-1 relative">
                    <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm ${
                      rightAnswer === answer.key 
                        ? 'bg-green-500 text-white' 
                        : 'bg-slate-200 text-slate-600'
                    } transition-all duration-300`}>
                      {String.fromCharCode(65 + index)}
                    </div>
                    <input
                      type="text"
                      placeholder={`Enter answer option ${String.fromCharCode(65 + index)}`}
                      value={answer.text}
                      onChange={(e) => handleSetAnswer(e.target.value, answer.key)}
                      className={`w-full border-2 p-3 pl-12 rounded-xl transition-all outline-none disabled:bg-slate-50 disabled:cursor-not-allowed ${
                        rightAnswer === answer.key 
                          ? 'border-green-400 bg-green-50 focus:border-green-500 focus:ring-4 focus:ring-green-100' 
                          : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                      }`}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Select the radio button next to the correct answer
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              type="submit"
              className={`flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 ${
                isQuizGenerated 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
              }`}
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuiz;