import React from 'react';
import '../styles/style.css';
import makemeImage from '../assets/makeme.png';
import threeDImage from '../assets/3d-img.png';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div>
      {/* Navigation Bar */}
      <nav>
        <div className="navbar">
          <a href="/" className="logo">Personal Finance Manager
          </a>
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/track">Track</a></li>
            
            <li><a href="/login">Login</a></li>
          </ul>
          <div className="menu-toggle">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </nav>

      {/* Landing Section */}
      <section className="main-landing">
        <div className="content">
          <h1 className="under-welcome-h1">Welcome to Personal Finance Manager</h1>
          <div className="under-h1"></div>
          <p className="under-welcome-p">
            Take control of your personal finances with ease. Track your income, expenses, and manage your budget effortlessly.
          </p>
          <button className="under-welcome-btn" onClick={() => window.location.href = '/track'}>Get Started</button>
        </div>
        <div className="image">
          <img className="under-welcome-image" src={makemeImage} alt="Financial Dashboard" />
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="head-text">How It Works</h2>
        <div className="under-head-text"></div>
        <div className="working-content">
          <div className="left-working">
            <h3 className="working-head">Manage Your Finances in 3 Easy Steps</h3>
            <ul className="ul-items">
              <li className="check-list-items">
                <i className="icon-check">✓</i> Track your expenses and income effortlessly.
              </li>
              <li className="check-list-items">
                <i className="icon-check">✓</i> Analyze your financial data with powerful tools.
              </li>
              <li className="check-list-items">
                <i className="icon-check">✓</i> Make informed financial decisions.
              </li>
            </ul>
            <button className="sign-up-button-btn" onClick={() => window.location.href = '/signup'}>Sign Up Now</button>
          </div>
          <div className="right-working">
            <img className="right-working-image" src={threeDImage} alt="Steps to Manage Finances" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <p>&copy; 2025 Personal Finance Manager. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default Home;
