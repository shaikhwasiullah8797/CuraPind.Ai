"use client";

import React from 'react';
import Flashcard from '@/components/Flashcard';
import Quiz from '@/components/Quiz';
import { useLanguage } from '@/context/LanguageContext';

export default function LearnPage() {
  const { t } = useLanguage();

  const flashcards = t.flashcards || [
    {
      front: "What is an EVM?",
      back: "Electronic Voting Machine - A secure device used for casting votes without paper ballots."
    },
    {
      front: "What is VVPAT?",
      back: "Voter Verifiable Paper Audit Trail - A machine that prints a slip showing who you voted for, ensuring transparency."
    },
    {
      front: "What is an EPIC?",
      back: "Electors Photo Identity Card - Your official Voter ID card issued by the Election Commission of India."
    }
  ];

  const quizQuestions = [
    {
      question: "What is the minimum voting age in India?",
      options: ["16 years", "18 years", "21 years", "25 years"],
      correctAnswer: 1
    },
    {
      question: "Who conducts the Lok Sabha elections in India?",
      options: ["Supreme Court", "President of India", "Election Commission of India", "Parliament"],
      correctAnswer: 2
    },
    {
      question: "What does the NOTA option stand for?",
      options: ["None of the Above", "Not On The Agenda", "New Official To Appoint", "No Other To Ask"],
      correctAnswer: 0
    }
  ];

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 20px', minHeight: '80vh' }}>
      <header className="text-center mb-12">
        <h1 className="text-navy mb-4">{t.learnTitle}</h1>
        <p>{t.learnDesc}</p>
      </header>

      <section className="mb-16">
        <h2 className="text-center text-saffron mb-8">Flashcards</h2>
        <div className="flex justify-center" style={{ flexWrap: 'wrap', gap: '2rem' }}>
          {flashcards.map((card, index) => (
            <Flashcard key={index} frontContent={card.front} backContent={card.back} />
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-center text-green mb-8">Quick Quiz</h2>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Quiz questions={quizQuestions} />
        </div>
      </section>
    </div>
  );
}
