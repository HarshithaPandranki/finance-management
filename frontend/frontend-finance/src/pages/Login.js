import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Login.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// Backend API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';;

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);

  // ✅ FIXED: calls /check-email (not /login) — only checks if email exists
  const validateEmail = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'This email is not registered in our database.');
        setIsEmailValid(false);
        return false;
      }

      setIsEmailValid(true);
      setError('');
      return true;
    } catch (err) {
      setError('Error checking email. Please try again.');
      setIsEmailValid(false);
      return false;
    }
  };

  const handleEmailBlur = async (e) => {
    const emailValue = e.target.value;
    if (emailValue) {
      await validateEmail(emailValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
      // Step 1: check email exists first
      const isValid = await validateEmail(email);
      if (!isValid) {
        setLoading(false);
        return;
      }

      // Step 2: now do the actual login with email + password
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Invalid password. Please try again.');
        } else {
          throw new Error(data.message || 'Login failed');
        }
      }

      login(data.user, data.token);
      navigate('/track');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className={styles.loginContainer}>
      <form className={styles.loginForm} onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <div className={styles.errorMessage}>{error}</div>}
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className={`${styles.input} ${!isEmailValid ? styles.inputError : ''}`}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            required
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="password">Password</label>
          <div className={styles.passwordContainer}>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              className={styles.input}
              required
            />
            <button
              type="button"
              className={styles.passwordToggle}
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>
        <div className={styles.formGroup}>
          <Link to="/forgot-password" className={styles.forgotPassword}>
            Forgot Password?
          </Link>
        </div>
        <button
          type="submit"
          className={styles.button}
          disabled={loading || !isEmailValid}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <div className={styles.signupLink}>
          Don't have an account? <Link to="/signup">Sign up</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;