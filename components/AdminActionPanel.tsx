"use client";
import { useState, useEffect } from "react";
import { database } from "../util/firebaseConfig";
import { ref, onValue, update, remove } from "firebase/database";
import { QuizQuestion } from "../types";
import Modal from "./Modal";
import UpdateQuizForm from "./UpdateQuizForm";

const AdminActionPanel = () => {
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion | null>(null);
  const [answerCounts, setAnswerCounts] = useState<{ [quizId: string]: number }>({});

  useEffect(() => {
    const quizzesRef = ref(database, "quiz");
    const unsubscribe = onValue(quizzesRef, (snapshot) => {
      const fetchedQuizzes: QuizQuestion[] = [];
      snapshot.forEach((childSnapshot) => {
        fetchedQuizzes.push({
          id: childSnapshot.key!,
          ...childSnapshot.val(),
        });
      });
      setQuizzes(fetchedQuizzes);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const userAnswersRef = ref(database, "UserAnswers");
    
    const unsubscribe = onValue(userAnswersRef, (snapshot) => {
      const counts: { [quizId: string]: number } = {};

      if (snapshot.exists()) {
        snapshot.forEach((userSnapshot) => {
          userSnapshot.forEach((quizAnswerSnapshot) => {
            const quizId = quizAnswerSnapshot.key!;
            counts[quizId] = (counts[quizId] || 0) + 1;
          });
        });
      }
      setAnswerCounts(counts);
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateClick = (quiz: QuizQuestion) => {
    setCurrentQuiz(quiz);
    setShowModal(true);
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      try {
        const quizRef = ref(database, `quiz/${quizId}`);
        await remove(quizRef);
        alert("Quiz deleted successfully!");
      } catch (error) {
        console.error("Error deleting quiz:", error);
      }
    }
  };
  
  const handleUpdate = async (updatedQuiz: QuizQuestion) => {
    try {
      const quizRef = ref(database, `quiz/${updatedQuiz.id}`);
      await update(quizRef, {
        question: updatedQuiz.question,
        answers: updatedQuiz.answers,
        rightAnswer: updatedQuiz.rightAnswer,
      });
      setShowModal(false);
      setCurrentQuiz(null);
      alert("Quiz updated successfully!");
    } catch (error) {
      console.error("Error updating quiz:", error);
    }
  };

  const handleClearUserAnswers = async () => {
    if (
      window.confirm(
        "ARE YOU SURE? This will permanently delete ALL user answers and reset the game progress!"
      )
    ) {
      try {
        const userAnswersRef = ref(database, "UserAnswers");
        await remove(userAnswersRef);
        alert("All user answers have been successfully cleared!");
      } catch (error) {
        console.error("Error clearing user answers:", error);
        alert("Failed to clear user answers.");
      }
    }
  };

  const handleClearAllQuizzes = async () => {
    if (
      window.confirm(
        "DANGER: This will permanently delete ALL QUIZ QUESTIONS! Are you absolutely sure you want to proceed?"
      )
    ) {
      try {
        const quizzesRef = ref(database, "quiz");
        await remove(quizzesRef);
        alert("All quizzes have been successfully deleted!");
      } catch (error) {
        console.error("Error clearing quizzes:", error);
        alert("Failed to clear quizzes.");
      }
    }
  };

  return (
    <div className="p-8 w-full">
      
      {/* Danger Zone */}
      <div className="mb-8 pb-6 border-b-2 border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white shadow-lg animate-pulse">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-700">Danger Zone</h2>
            <p className="text-sm text-red-600">These actions are irreversible</p>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-5 border-2 border-red-200">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleClearUserAnswers}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All User Answers
            </button>
            <button
              onClick={handleClearAllQuizzes}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-800 to-red-900 text-white rounded-xl hover:from-red-900 hover:to-red-950 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Delete ALL Quizzes
            </button>
          </div>
          <p className="text-xs mt-3 text-red-600 font-medium flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Warning: These actions cannot be undone. Use with extreme caution.
          </p>
        </div>
      </div>
      
      {/* Quiz Management */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-yellow-500 flex items-center justify-center text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Manage Quizzes</h2>
        </div>

        <div className="space-y-3">
          {quizzes.map((quiz, index) => {
            const count = answerCounts[quiz.id!] || 0; 
            return (
              <div
                key={quiz.id}
                className="group flex flex-col md:flex-row md:justify-between md:items-center gap-4 p-5 rounded-xl bg-white border-2 border-slate-200 hover:border-yellow-300 hover:shadow-md transition-all duration-300"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-lg leading-tight mb-2">{quiz.question}</p>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                        count > 0 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {count} {count === 1 ? 'response' : 'responses'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 md:flex-shrink-0">
                  <button
                    onClick={() => handleUpdateClick(quiz)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id!)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-300 font-semibold shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {quizzes.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">No quizzes found</p>
            <p className="text-slate-400 text-sm mt-1">Add a quiz using the &quot;Add Quiz&quot; panel above</p>
          </div>
        )}
      </div>

      {showModal && currentQuiz && (
        <Modal show={showModal} onClose={() => setShowModal(false)}>
          <UpdateQuizForm quiz={currentQuiz} onUpdate={handleUpdate} />
        </Modal>
      )}
    </div>
  );
};

export default AdminActionPanel;