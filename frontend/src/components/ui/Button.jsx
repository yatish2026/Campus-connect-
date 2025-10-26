import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({ children, to, onClick, className = '', variant = 'primary', ...rest }) => {
  const base = 'inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-transform focus:outline-none';
  const variants = {
    primary: 'text-white bg-cc-primary',
    ghost: 'bg-white border text-slate-700',
  };

  if (to) {
    // use react-router Link for internal routes for SPA navigation
    if (typeof to === 'string' && to.startsWith('/')) {
      return (
        <Link to={to} className={`${base} ${variants[variant] || ''} ${className} dark:opacity-95`} {...rest}>
          {children}
        </Link>
      );
    }

    return (
      <a href={to} className={`${base} ${variants[variant] || ''} ${className}`} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={`${base} ${variants[variant] || ''} ${className}`} style={style} {...rest}>
      {children}
    </button>
  );
};

export default Button;
