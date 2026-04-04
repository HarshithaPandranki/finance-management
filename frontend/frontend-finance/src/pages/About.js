import React from 'react';
import '../styles/About.css';
import '../styles/style.css';
import { motion } from 'framer-motion';
import { FaChartLine, FaShieldAlt, FaPiggyBank, FaUserClock } from 'react-icons/fa';

const About = () => {
  return (
    <div>
      {/* Navigation Bar */}
      <nav>
        <div className="navbar">
          <a href="#" className="logo">
            <i className="fas fa-chart-bar"></i>Personal Finance Manager
          </a>
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/track">Track</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href ="/predict">Predict</a></li>
          </ul>
          <div className="menu-toggle">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </nav>

      {/* Added margin-top to prevent navbar overlap */}
      <div className="about-container" style={{ marginTop: "80px" }}>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="about-header"
        >
          <h1>About Personal Finance Manager</h1>
          <p className="tagline">Your Journey to Financial Freedom Starts Here</p>
        </motion.div>

        <div className="features-grid">
          <motion.div 
            className="feature-card"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <FaChartLine className="feature-icon" />
            <h3>Smart Analytics</h3>
            <p>Visualize your spending patterns and track your financial progress with intuitive charts and graphs.</p>
          </motion.div>

          <motion.div 
            className="feature-card"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <FaShieldAlt className="feature-icon" />
            <h3>Secure & Private</h3>
            <p>Your financial data is protected with bank-level security and encryption protocols.</p>
          </motion.div>

          <motion.div 
            className="feature-card"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <FaPiggyBank className="feature-icon" />
            <h3>Budget Planning</h3>
            <p>Create custom budgets and savings goals to help you achieve your financial objectives.</p>
          </motion.div>

          <motion.div 
            className="feature-card"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          >
            <FaUserClock className="feature-icon" />
            <h3>Real-time Tracking</h3>
            <p>Monitor your expenses and income in real-time to make informed financial decisions.</p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="about-content"
        >
          <h2>Why Choose Us?</h2>
          <p>
            Personal Finance Manager is designed to simplify your financial life. Whether you're saving for a big purchase, 
            planning for retirement, or just wanting to get better control of your spending, we provide the tools you need 
            to succeed.
          </p>
          <p>
            Our platform combines powerful features with an easy-to-use interface, making financial management accessible 
            to everyone. Start your journey toward financial wellness today!
          </p>
        </motion.div>

        <motion.div 
          className="cta-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          <h2>Ready to Take Control of Your Finances?</h2>
          <button className="cta-button" onClick={() => window.location.href='/login'}>Get Started Now</button>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
