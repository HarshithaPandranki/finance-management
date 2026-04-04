import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';


const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleNavbar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <div className="site-logo">
            <img src="/logo.jpg" alt="Finance Manager" />
          </div>
          <span className="logo-text">Finance Manager</span>
        </Link>
        <div className="menu-icon" onClick={toggleNavbar}>
          <i className={isOpen ? 'fas fa-times' : 'fas fa-bars'} />
        </div>
        <ul className={isOpen ? 'nav-menu active' : 'nav-menu'}>
          <li className="nav-item">
            <Link to="/" className="nav-links" onClick={toggleNavbar}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/login" className="nav-links" onClick={toggleNavbar}>
              Login
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/signup" className="nav-links" onClick={toggleNavbar}>
              Signup
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/track" className="nav-links" onClick={toggleNavbar}>
              Track
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/dashboard" className="nav-links" onClick={toggleNavbar}>
              Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/about" className="nav-links" onClick={toggleNavbar}>
              About
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/transactions" className="nav-links" onClick={toggleNavbar}>
              Transactions
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/predict" className="nav-links" onClick={toggleNavbar}>
              Predict
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
