"use client";

import React, { useState } from 'react';

interface Question {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizProps {
  questions: Question[];
}

export default function Quiz({ questions }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswer = (index: number) => {
    setSelectedAnswer(index);
    if (index === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
      } else {
        setShowResult(true);
      }
    }, 1000);
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
  };

  if (showResult) {
    return (
      <div className="glass-panel p-8 text-center">
        <h2 className="text-navy mb-4">Quiz Completed!</h2>
        <p className="text-2xl mb-6">Your Score: <span className="text-saffron font-bold">{score}</span> / {questions.length}</p>
        <button className="btn btn-primary" onClick={resetQuiz}>Restart Quiz</button>
      </div>
    );
  }

  const question = questions[currentQuestion];

  return (
    <div className="glass-panel p-8">
      <div className="flex justify-between mb-6 text-sm text-muted">
        <span>Question {currentQuestion + 1} of {questions.length}</span>
        <span>Score: {score}</span>
      </div>
      
      <h3 className="mb-6">{question.question}</h3>
      
      <div className="flex-col gap-4">
        {question.options.map((option, index) => {
          let btnClass = "btn btn-outline";
          if (selectedAnswer !== null) {
            if (index === question.correctAnswer) {
              btnClass = "btn btn-secondary"; // Green for correct
            } else if (index === selectedAnswer) {
              btnClass = "btn btn-primary"; // Saffron for wrong selected
            }
          }
          
          return (
            <button 
              key={index} 
              className={btnClass}
              onClick={() => selectedAnswer === null && handleAnswer(index)}
              disabled={selectedAnswer !== null}
              style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start' }}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
