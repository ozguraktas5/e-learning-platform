export interface Quiz {
  id: number;
  lesson_id: number;
  title: string;
  description: string;
  time_limit: number | null;
  passing_score: number;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question_text: string;
  question_type: 'multiple_choice';
  points: number;
  options: QuizOption[];
}

export interface QuizOption {
  id: number;
  question_id: number;
  option_text: string;
  is_correct: boolean;
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  user_id: number;
  score: number;
  started_at: string;
  completed_at: string | null;
  answers: QuizAnswer[];
}

export interface QuizAnswer {
  question_id: number;
  selected_option_id: number | null;
  is_correct: boolean;
  points_earned: number;
}