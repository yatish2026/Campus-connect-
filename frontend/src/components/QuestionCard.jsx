import React from 'react';

// Safe QuestionCard stub
export default function QuestionCard({ question }) { return question ? <div>{question.title || question.text}</div> : null; }
