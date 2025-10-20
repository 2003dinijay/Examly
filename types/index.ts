import { serverTimestamp } from 'firebase/database';

export interface AnswerOption {
 key: number;
 text: string;
}

export interface QuizQuestion {
 id?: string;
 question: string;
 answers: AnswerOption[];
 rightAnswer: number;
 timestamp: ReturnType<typeof serverTimestamp>;
}


export interface UserAnswer {
 userName: string; 
 questionId: string;
 answerId: number;
 timestamp: ReturnType<typeof serverTimestamp>;
}


export interface UserScore {
 userId: string; 
 score: number;
 lastAnswerTimestamp: number; 
}