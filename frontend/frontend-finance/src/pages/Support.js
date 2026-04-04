import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/support.css';

const Support = () => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Add form submission logic here
  };

  return (
    <>
      <nav>
        <div className="navbar">
          <Link to="/" className="logo">
            <i className="fas fa-chart-line"></i> Finance Tracker
          </Link>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/tracker">Use Tracker</Link></li>
            <li><Link to="/how-it-works">How it works</Link></li>
            <li><Link to="/support">Support</Link></li>
          </ul>
          <div className="buttons">
            <Link to="/login" className="btn-head">
              <i className="fas fa-sign-in-alt"></i> Log In
            </Link>
            <Link to="/signup" className="btn-head">
              <i className="fas fa-user-plus"></i> Sign Up
            </Link>
          </div>
        </div>
      </nav>

      <div className="container">
        <form className="signup-form" onSubmit={handleSubmit}>
          <h2>How can we help you?</h2>
          <div className="form-group">
            <label htmlFor="fullname">Full Name <span>*</span></label>
            <input type="text" id="fullname" name="fullname" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address <span>*</span></label>
            <input type="email" id="email" name="email" required />
          </div>
          <div className="form-group">
            <label htmlFor="query">Query <span>*</span></label>
            <textarea name="query" id="query"></textarea>
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>

      <footer>
        <div className="footer">
          <ul>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>
      </footer>
    </>
  );
};

export default Support;
