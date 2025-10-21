import { useState } from 'react';
import { QuizQuestion } from '../types';

interface UpdateQuizFormProps {
  quiz: QuizQuestion;
  onUpdate: (updatedQuiz: QuizQuestion) => void;
}

const UpdateQuizForm = ({ quiz, onUpdate }: UpdateQuizFormProps) => {
  const [questionText, setQuestionText] = useState(quiz.question);
  const [answers, setAnswers] = useState(quiz.answers);
  const [rightAnswer, setRightAnswer] = useState(quiz.rightAnswer);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onUpdate({
      ...quiz,
      question: questionText,
      answers: answers,
      rightAnswer: rightAnswer,
    });
  };

  const handleSetAnswer = (value: string, key: number) => {
    setAnswers((prevAnswers) =>
      prevAnswers.map((answer) =>
        answer.key === key ? { ...answer, text: value } : answer
      )
    );
  };

  return (
    <div className="w-full p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Update Quiz</h3>
          <p className="text-sm text-slate-500">Edit quiz question and answers</p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200 shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Question</label>
            <input
              type="text"
              placeholder="Enter your quiz question"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full border-2 border-slate-200 p-3 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none text-slate-800 font-medium"
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
                      className={`w-full border-2 p-3 pl-12 rounded-xl transition-all outline-none ${
                        rightAnswer === answer.key 
                          ? 'border-green-400 bg-green-50 focus:border-green-500 focus:ring-4 focus:ring-green-100' 
                          : 'border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100'
                      }`}
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

          <div className="pt-4 flex justify-center gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Update Quiz
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateQuizForm;