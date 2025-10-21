"use client";
import { useState, useEffect } from "react";
import { database } from "../util/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { QuizQuestion, UserAnswer, UserScore } from "../types";
import Link from "next/link"; 

interface DisplayUserScore extends UserScore {
  userName: string; 
  answersGiven: { [quizId: string]: number | undefined };
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<DisplayUserScore[]>([]);
  const [questions, setQuestions] = useState<{ [key: string]: QuizQuestion }>({});
  const [userAnswers, setUserAnswers] = useState<{
    [key: string]: { [key: string]: UserAnswer };
  }>({});
  
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false); 
  const [loading, setLoading] = useState(true);

  const getTimestampValue = (ts: any): number => {
    return typeof ts === 'number' ? ts : 0;
  };

  // 1. Fetch all quiz questions
  useEffect(() => {
    const questionsRef = ref(database, "quiz");
    const unsubscribe = onValue(questionsRef, (snapshot) => {
      const fetchedQuestions: { [key: string]: QuizQuestion } = {};
      snapshot.forEach((childSnapshot) => {
        const questionData: QuizQuestion = childSnapshot.val();
        fetchedQuestions[childSnapshot.key!] = {
          ...questionData,
          id: childSnapshot.key!,
        };
      });
      setQuestions(fetchedQuestions);
    });
    return () => unsubscribe();
  }, []);

  // 2. Fetch user answers and EventControl data
  useEffect(() => {
    const userAnswersRef = ref(database, "UserAnswers");
    const unsubscribeAnswers = onValue(userAnswersRef, (snapshot) => {
      const fetchedAnswers: { [key: string]: { [key: string]: UserAnswer } } = {};
      snapshot.forEach((userSnapshot) => {
        const userId = userSnapshot.key!; 
        fetchedAnswers[userId] = {};
        userSnapshot.forEach((answerSnapshot) => {
          const answerData: UserAnswer = answerSnapshot.val();
          fetchedAnswers[userId][answerSnapshot.key!] = answerData;
        });
      });
      setUserAnswers(fetchedAnswers);
    });

    const eventControlRef = ref(database, "EventControl");
    const unsubscribeControl = onValue(eventControlRef, (snapshot) => {
      const data = snapshot.val();
      setActiveQuizId(data?.currentQuizId || null);
      setIsAnswerRevealed(!!data?.isAnswerRevealed);
      setLoading(false);
    });

    return () => {
        unsubscribeAnswers();
        unsubscribeControl();
    };
  }, []);

  // 3. Calculate scores and ranking
  useEffect(() => {
    const scoresMap: { [key: string]: DisplayUserScore } = {};

    for (const userId in userAnswers) {
      const answersForUser = userAnswers[userId];
      
      const firstAnswerKey = Object.keys(answersForUser)[0];
      const userName = firstAnswerKey ? answersForUser[firstAnswerKey].userName : `User ${userId.substring(0, 4)}`;

      if (!scoresMap[userId]) {
        scoresMap[userId] = { 
          userId, 
          userName: userName, 
          score: 0, 
          lastAnswerTimestamp: 0,
          answersGiven: {}, 
        };
      }
      
      for (const questionId in answersForUser) {
        const userAnswer = answersForUser[questionId];
        const question = questions[questionId];

        scoresMap[userId].answersGiven[questionId] = userAnswer.answerId;

        if (question && userAnswer.answerId === question.rightAnswer) {
          scoresMap[userId].score++;

          const userTimestamp = getTimestampValue(userAnswer.timestamp);

          if (userTimestamp > (scoresMap[userId].lastAnswerTimestamp || 0)) {
            scoresMap[userId].lastAnswerTimestamp = userTimestamp;
          }
        }
      }
    }

    const scoreList: DisplayUserScore[] = Object.values(scoresMap);

    scoreList.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return (a.lastAnswerTimestamp || 0) - (b.lastAnswerTimestamp || 0);
    });

    setLeaderboard(scoreList);
  }, [questions, userAnswers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-purple-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xl font-semibold text-slate-700">Loading leaderboard...</span>
        </div>
      </div>
    );
  }
  
  const isGamePaused = !activeQuizId;
  const currentQuiz = activeQuizId ? questions[activeQuizId] : null;

  return (
    <div className="w-full p-8 min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto">
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Live Leaderboard</h1>
            <p className="text-sm text-slate-500">Real-time rankings and scores</p>
          </div>
        </div>
        
        {/* Status Card */}
        <div className={`mb-6 p-5 rounded-2xl border-2 shadow-lg ${
          isAnswerRevealed 
            ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300' 
            : 'bg-gradient-to-br from-slate-50 to-gray-100 border-slate-300'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
              isGamePaused ? 'bg-gray-500' : 'bg-green-500'
            }`}>
              {isGamePaused ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <p className="font-bold text-slate-800">
                Status: <span className={isGamePaused ? 'text-gray-600' : 'text-green-600'}>
                  {isGamePaused ? 'Game PAUSED' : 'Game ACTIVE'}
                </span>
              </p>
              <p className="text-sm text-slate-600">
                Answers are <span className={`font-semibold ${isAnswerRevealed ? "text-purple-600" : "text-slate-500"}`}>
                  {isAnswerRevealed ? "SHOWN" : "HIDDEN"}
                </span>
              </p>
            </div>
          </div>
          
          {isAnswerRevealed && currentQuiz && (
            <div className="mt-3 p-3 bg-yellow-100 border-2 border-yellow-300 rounded-xl">
              <p className="text-sm font-medium text-yellow-900">
                <span className="font-bold">Active Quiz:</span> {currentQuiz.question.substring(0, 50)}...
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                <span className="font-bold">Correct Answer:</span> 
                <span className="ml-2 underline">
                  {currentQuiz.answers.find(a => a.key === currentQuiz.rightAnswer)?.text || 'N/A'}
                </span>
              </p>
            </div>
          )}
        </div>
        
        {/* Leaderboard */}
        {leaderboard.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border-2 border-slate-200 shadow-lg text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-slate-500 text-lg">No users have submitted answers yet.</p>
          </div>
        ) : (
          <div className="rounded-2xl bg-white border-2 border-slate-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 flex items-center">
              <span className="w-16 font-bold">Rank</span>
              <span className="flex-1 font-bold">Player</span>
              <span className="w-32 text-right font-bold">Score</span>
            </div>
            
            {/* Leaderboard Rows */}
            <div className="divide-y divide-slate-200">
              {leaderboard.map((score, index) => {
                const isTop3 = index < 3;
                const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
                
                return (
                  <div
                    key={score.userId}
                    className={`p-4 flex items-center transition-all hover:bg-slate-50 ${
                      isTop3 ? 'bg-gradient-to-r from-purple-50 to-pink-50' : ''
                    }`}
                  >
                    {/* Rank */}
                    <div className="w-16 flex items-center gap-2">
                      {isTop3 ? (
                        <svg className={`w-6 h-6 ${medalColors[index]}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ) : (
                        <span className="text-slate-600 font-semibold text-lg">{index + 1}</span>
                      )}
                    </div>
                    
                    {/* User Name */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                          {score.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-slate-800">{score.userName}</span>
                      </div>
                    </div>
                    
                    {/* Score */}
                    <div className="w-32 text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600">{score.score}</span>
                        <span className="text-xs text-slate-400">pts</span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        {score.lastAnswerTimestamp ? `${score.lastAnswerTimestamp % 1000}ms` : '0ms'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;