import React from 'react';
import { Link } from 'react-router-dom';

const NavLinks = () => {
  return (
    <>
      <Link to="/home">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/messages">Messages</Link>
    </>
  );
};

export default NavLinks;