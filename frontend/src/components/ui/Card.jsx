import React from 'react';

const Card = ({ children, className = '', variant = 'default' }) => {
  let variantClass = 'bg-white dark:bg-cc-darkblue';
  if (variant === 'softBlue') {
    variantClass = 'bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900 dark:to-slate-800';
  } else if (variant === 'softGreen') {
    variantClass = 'bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900 dark:to-slate-800';
  } else if (variant === 'softRose') {
    variantClass = 'bg-gradient-to-br from-rose-50 to-white dark:from-rose-900 dark:to-slate-800';
  }

  return (
    <div className={`${variantClass} rounded-xl shadow-sm p-6 border border-transparent hover:shadow-lg transition ${className}`}>
      {children}
    </div>
  );
};

export default Card;
