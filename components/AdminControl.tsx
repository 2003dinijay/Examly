"use client";
import { useState, useEffect } from "react";
import { database } from "../util/firebaseConfig";
import {
  ref,
  onValue,
  set,
  update,
  remove,
  serverTimestamp,
} from "firebase/database";

import { QuizQuestion } from "../types";

const AdminControl = () => {
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);

  useEffect(() => {
    const quizzesRef = ref(database, "quiz");
    const unsubscribe = onValue(quizzesRef, (snapshot) => {
      const fetchedQuizzes: QuizQuestion[] = [];
      snapshot.forEach((childSnapshot) => {
        const quizData: QuizQuestion = childSnapshot.val();
        fetchedQuizzes.push({
          id: childSnapshot.key!,
          ...quizData,
        });
      });
      setQuizzes(fetchedQuizzes);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const eventControlRef = ref(database, "EventControl");
    const unsubscribe = onValue(eventControlRef, (snapshot) => {
      const data = snapshot.val();
      setCurrentQuizId(data?.currentQuizId || null);
      setIsAnswerRevealed(!!data?.isAnswerRevealed);
    });
    return () => unsubscribe();
  }, []);

  const handleSetCurrentQuiz = (quizId: string) => {
    try {
      const eventControlRef = ref(database, "EventControl");
      set(eventControlRef, {
        currentQuizId: quizId,
        questionChangeTimestamp: serverTimestamp(),
        isAnswerRevealed: false,
      });
      alert(`Quiz with ID ${quizId} is now active (Answers hidden).`);
    } catch (error) {
      console.error("Error setting current quiz:", error);
    }
  };

  const handleClearCurrentQuiz = () => {
    try {
      const eventControlRef = ref(database, "EventControl/currentQuizId");
      remove(eventControlRef);
      alert("Active quiz ID has been cleared (Game Paused).");
    } catch (error) {
      console.error("Error clearing current quiz:", error);
    }
  };

  const handleToggleReveal = async () => {
    const newValue = !isAnswerRevealed;
    try {
      const eventControlRef = ref(database, "EventControl");
      await update(eventControlRef, {
        isAnswerRevealed: newValue,
      });
      alert(
        `Answers are now ${newValue ? "SHOWN" : "HIDDEN"} on the Leaderboard.`
      );
    } catch (error) {
      console.error("Error toggling reveal:", error);
    }
  };

  return (
    <div className="p-8 w-full">
      {/* Game Control Block */}
      <div className="mb-8 pb-6 border-b-2 border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Game Control
          </h2>
        </div>

        {/* Status Card */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 mb-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${currentQuizId ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm font-medium text-slate-600">Game Status:</span>
                <span className={`font-bold text-lg ${currentQuizId ? 'text-green-600' : 'text-red-600'}`}>
                  {currentQuizId ? 'ACTIVE' : 'PAUSED'}
                </span>
              </div>
              <div className="h-8 w-px bg-slate-300"></div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span className="text-sm font-medium text-slate-600">Answers:</span>
                <span className={`font-bold text-lg ${isAnswerRevealed ? 'text-purple-600' : 'text-slate-600'}`}>
                  {isAnswerRevealed ? 'VISIBLE' : 'HIDDEN'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-4">
          <button
            onClick={handleClearCurrentQuiz}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
              currentQuizId
                ? "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                : "bg-slate-400 cursor-not-allowed"
            }`}
            disabled={!currentQuizId}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pause Game
          </button>

          <button
            onClick={handleToggleReveal}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
              isAnswerRevealed
                ? "bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
                : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            }`}
          >
            {isAnswerRevealed ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                Hide Answers
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Show Answers
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quiz Selection */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Select Next Quiz</h2>
        </div>

        <div className="space-y-3">
          {quizzes.map((quiz, index) => (
            <div
              key={quiz.id}
              className={`group flex justify-between items-center p-5 rounded-xl transition-all duration-300 border-2 ${
                currentQuizId === quiz.id
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 shadow-md"
                  : "bg-white border-slate-200 hover:border-blue-300 hover:shadow-md"
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                  currentQuizId === quiz.id
                    ? "bg-green-500 text-white"
                    : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600"
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-lg leading-tight">{quiz.question}</p>
                  {currentQuizId === quiz.id && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                        CURRENTLY ACTIVE
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleSetCurrentQuiz(quiz.id!)}
                className={`px-5 py-3 min-w-[140px] rounded-xl text-white font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 ${
                  currentQuizId === quiz.id
                    ? "bg-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                }`}
                disabled={currentQuizId === quiz.id}
              >
                {currentQuizId === quiz.id ? "Active" : "Activate"}
              </button>
            </div>
          ))}
        </div>

        {quizzes.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">No quizzes available</p>
            <p className="text-slate-400 text-sm mt-1">Add a quiz from the Admin Panel below</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminControl;