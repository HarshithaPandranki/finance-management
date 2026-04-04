import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Track.css';

// Backend API Configuration
const API_BASE_URL = 'https://finance-management-fnbj.onrender.com';// Deployed backend URL
 // Deployed backend URL

const Track = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('INR');
  const [editedTransaction, setEditedTransaction] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [showFiltered, setShowFiltered] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goals, setGoals] = useState({
    'Total Amount': 0,
    Utilities: 0,
    Groceries: 0,
    Transportation: 0,
    Housing: 0,
    'Food & Dinning': 0,
    Shopping: 0,
    Education: 0,
    Entertainment: 0,
    Health: 0,
    Others: 0
  });
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  
  const descriptionRef = useRef(null);
  const amountRef = useRef(null);
  const typeRef = useRef(null);
  const dateRef = useRef(null);

  // Add state to track if animations are visible
  const [animationVisible, setAnimationVisible] = useState(true);

  // Function to add delay for entrance animations
  useEffect(() => {
    // Set animation visible to false initially
    setAnimationVisible(false);
    
    // Add small delay before triggering animations
    const timer = setTimeout(() => {
      setAnimationVisible(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // Updated formatCurrency function with null check
  const formatCurrency = (amount, currencyCode) => {
    if (amount === undefined || amount === null) {
      return `${currencySymbols[currencyCode] || ""}0.00`;
    }
    const currencySymbols = {
      USD: "$",
      EUR: "€",
      INR: "₹",
    };
    const symbol = currencySymbols[currencyCode] || "";
    return `${symbol}${Number(amount).toFixed(2)}`;
  };

  // Format date as DD/MM/YYYY
  const formatDate = (date) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  };

  // Updated calculateBalance function
  const calculateBalance = (transactions) => {
    if (!Array.isArray(transactions)) return 0;
    
    return transactions.reduce((acc, transaction) => {
      const amount = Number(transaction.amount) || 0;
      return transaction.type === 'income' ? acc + amount : acc - amount;
    }, 0);
  };

  // Validate inputs
  const validateInputs = () => {
    const errors = {};
    
    if (!descriptionRef.current.value || descriptionRef.current.value === "Select type of expense") {
      errors.description = "Please select a type of expense";
    }

    if (!amountRef.current.value) {
      errors.amount = "Please enter an amount";
    } else if (isNaN(amountRef.current.value) || parseFloat(amountRef.current.value) <= 0) {
      errors.amount = "Please enter a valid positive amount";
    }

    if (!typeRef.current.value || typeRef.current.value === "Select income or expense") {
      errors.type = "Please select income or expense";
    }

    if (!dateRef.current.value) {
      errors.date = "Please select a transaction date";
    } else {
      const selectedDate = new Date(dateRef.current.value);
      const today = new Date();
      if (selectedDate > today) {
        errors.date = "Transaction date cannot be in the future";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Update the fetchWithAuth function
  const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      logout();
      navigate('/login');
      throw new Error('Session expired');
    }

    return response;
  };

  // Updated useEffect for initial data loading
  useEffect(() => {
    const fetchTransactionsAndBalance = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/transactions`);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setTransactions(data);
            // Calculate initial balance from transactions
            const calculatedBalance = calculateBalance(data);
            setBalance(calculatedBalance);
          } else {
            console.error('Unexpected response format:', data);
          }
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
        alert('Error loading transactions. Please try again.');
      }
    };

    fetchTransactionsAndBalance();
  }, []);

  // Add this useEffect to fetch goals when component mounts
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/goals`);
        if (response.ok) {
          const goalsData = await response.json();
          if (Array.isArray(goalsData) && goalsData.length > 0) {
            const formattedGoals = goalsData.reduce((acc, goal) => {
              acc[goal.description] = goal.amount;
              return acc;
            }, {});
            setGoals(prev => ({
              ...prev,
              ...formattedGoals
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching goals:', error);
      }
    };

    fetchGoals();
  }, []);

  // Updated addTransaction function
  const addTransaction = async () => {
    if (!validateInputs()) {
      return;
    }

    const submitButton = document.querySelector('button');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Adding...';

    const description = descriptionRef.current.value;
    const amount = parseFloat(amountRef.current.value);
    const type = typeRef.current.value;
    const chosenDate = new Date(dateRef.current.value);

    if (isNaN(amount)) {
      setValidationErrors(prev => ({
        ...prev,
        amount: "Please enter a valid number"
      }));
      return;
    }

    const newTransaction = {
      primeId: chosenDate.getTime(),
      description,
      amount,
      type,
      currency,
      date: chosenDate
    };

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransaction)
      });

      if (response.ok) {
        const savedTransaction = await response.json();
        setTransactions(prev => [savedTransaction, ...prev]);
        setBalance(prev => prev + (type === 'income' ? amount : -amount));
        clearForm();
        setValidationErrors({});
        
        // Show success notification
        setNotification({
          show: true,
          message: 'Transaction added successfully!',
          type: 'success'
        });
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setNotification({ show: false, message: '', type: '' });
        }, 3000);
      } else {
        const errorData = await response.json();
        alert(`Failed to save transaction: ${errorData.message}`);
      }
    } catch (error) {
      // Show error notification
      setNotification({
        show: true,
        message: 'Error saving transaction. Please try again.',
        type: 'error'
      });
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  };

  // Update delete transaction
  const deleteTransaction = async (primeId) => {
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/transactions/${primeId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTransactions = transactions.filter(t => t.primeId !== primeId);
        setTransactions(updatedTransactions);
        setBalance(data.currentBalance);
        localStorage.setItem('currentBalance', data.currentBalance);
      } else {
        alert('Failed to delete transaction');
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Error deleting transaction');
    }
  };

  // Edit transaction
  const editTransaction = (primeId) => {
    const transaction = transactions.find(t => t.primeId === primeId);
    if (transaction) {
      setEditedTransaction(transaction);
      descriptionRef.current.value = transaction.description;
      amountRef.current.value = transaction.amount;
      typeRef.current.value = transaction.type;
      dateRef.current.value = new Date(transaction.primeId).toISOString().split('T')[0];
      setValidationErrors({});
    }
  };

  // Update save transaction
  const saveTransaction = async () => {
    if (!editedTransaction) return;
    
    if (!validateInputs()) {
      return;
    }

    const updatedTransaction = {
      ...editedTransaction,
      description: descriptionRef.current.value,
      amount: parseFloat(amountRef.current.value),
      type: typeRef.current.value,
      primeId: new Date(dateRef.current.value).getTime(),
      currency: editedTransaction.currency
    };

    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/transactions/${editedTransaction.primeId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedTransaction)
      });

      if (response.ok) {
        const data = await response.json();
        const updatedTransactions = transactions.map(t => 
          t.primeId === editedTransaction.primeId ? data.transaction : t
        );
        setTransactions(updatedTransactions);
        setBalance(data.currentBalance);
        localStorage.setItem('currentBalance', data.currentBalance);
        setEditedTransaction(null);
        clearForm();
        setValidationErrors({});
      } else {
        alert('Failed to update transaction');
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error updating transaction');
    }
  };

  // Clear form
  const clearForm = () => {
    descriptionRef.current.value = "";
    amountRef.current.value = "";
    dateRef.current.value = "";
    typeRef.current.value = "";
    setValidationErrors({});
  };

  // Handle currency change
  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
  };

  // Export functions
  const handleDownload = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }
  
    try {
      const response = await fetchWithAuth(`${API_BASE_URL}/api/transactions/export?fromDate=${startDate}&toDate=${endDate}`);
      if (!response.ok) {
        throw new Error('Error fetching transactions for export');
      }
  
      const data = await response.json();
      if (data.length === 0) {
        alert('No transactions found for the selected date range');
        return;
      }
  
      setFilteredTransactions(data);
      setShowFiltered(true);
  
      const fileName = window.prompt("Enter file name to download") || "transactions";
      exportToCSV(data, fileName);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };
  
  // Function to export data to CSV
  const exportToCSV = (transactions, fileName) => {
    const csvContent = 
      "Date,Description,Amount,Type\n" +
      transactions.map(t => 
        `${formatDate(t.date)},${t.description},${formatCurrency(t.amount, t.currency || currency)},${t.type}`
      ).join("\n");
  
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.csv`;
    link.click();
  };
  

  // Update the saveGoals function to properly handle the request
  const saveGoals = async () => {
    try {
      // Filter out any goals with 0 or empty values
      const validGoals = Object.fromEntries(
        Object.entries(goals).filter(([_, value]) => value > 0)
      );

      const response = await fetchWithAuth(`${API_BASE_URL}/api/goals`, {
        method: 'POST',
        body: JSON.stringify({ goals: validGoals })
      });

      if (response.ok) {
        const savedGoals = await response.json();
        console.log('Saved goals:', savedGoals); // Debug log
        alert('Goals saved successfully!');
        setShowGoalModal(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save goals');
      }
    } catch (error) {
      console.error('Error saving goals:', error);
      alert('Error saving goals: ' + error.message);
    }
  };

  // Update the handleGoalUpdate function to properly handle number conversion
  const handleGoalUpdate = (category, value) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setGoals(prev => ({
      ...prev,
      [category]: numValue
    }));
  };

  // Get appropriate icon for each category
  const getCategoryIcon = (category) => {
    const icons = {
      'Total Amount': 'fa-money-bill-wave',
      'Utilities': 'fa-bolt',
      'Groceries': 'fa-shopping-basket',
      'Transportation': 'fa-car',
      'Housing': 'fa-home',
      'Food & Dinning': 'fa-utensils',
      'Shopping': 'fa-shopping-bag',
      'Education': 'fa-graduation-cap',
      'Entertainment': 'fa-film',
      'Health': 'fa-heartbeat',
      'Others': 'fa-star'
    };
    
    return icons[category] || 'fa-dollar-sign';
  };

  // Update the resetGoals function
  const resetGoals = async () => {
    const confirmed = window.confirm("Are you sure you want to reset all your financial goals?");
    if (!confirmed) return;
    
    try {
      // Send empty goals object to clear all goals
      const response = await fetchWithAuth(`${API_BASE_URL}/api/goals`, {
        method: 'POST',
        body: JSON.stringify({ goals: {} })
      });

      if (response.ok) {
        // Reset local state
        setGoals({
          'Total Amount': 0,
          Utilities: 0,
          Groceries: 0,
          Transportation: 0,
          Housing: 0,
          'Food & Dinning': 0,
          Shopping: 0,
          Education: 0,
          Entertainment: 0,
          Health: 0,
          Others: 0
        });
        
        // Show success notification
        setNotification({
          show: true,
          message: 'All goals have been reset!',
          type: 'success'
        });
        
        // Hide notification after 3 seconds
        setTimeout(() => {
          setNotification({ show: false, message: '', type: '' });
        }, 3000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reset goals');
      }
    } catch (error) {
      console.error('Error resetting goals:', error);
      
      // Show error notification
      setNotification({
        show: true,
        message: 'Error resetting goals. Please try again.',
        type: 'error'
      });
      
      setTimeout(() => {
        setNotification({ show: false, message: '', type: '' });
      }, 3000);
    }
  };

  // Add a function to calculate the width percentage for goal bars
  const calculateBarWidth = (category, amount) => {
    // Find the maximum goal amount to use as reference for percentage
    const maxGoal = Math.max(...Object.values(goals));
    
    // Ensure we have a valid divisor
    if (maxGoal <= 0) return 0;
    
    // Calculate percentage (minimum 10% for visibility)
    const percentage = Math.max(10, (amount / maxGoal) * 100);
    
    // Cap at 100%
    return Math.min(100, percentage);
  };

  // Add dynamic color generator for goals
  const getGoalColor = (category) => {
    const colorMap = {
      'Total Amount': '#4caf50',
      'Utilities': '#f44336',
      'Groceries': '#ff9800',
      'Transportation': '#2196f3',
      'Housing': '#9c27b0',
      'Food & Dinning': '#e91e63',
      'Shopping': '#00bcd4',
      'Education': '#3f51b5',
      'Entertainment': '#ff5722',
      'Health': '#009688',
      'Others': '#607d8b'
    };
    
    return colorMap[category] || `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
  };

  // Add a function to determine background gradient based on balance
  const getBackgroundGradient = () => {
    if (balance > 1000) {
      return 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(33, 150, 243, 0.15))';
    } else if (balance < 0) {
      return 'linear-gradient(135deg, rgba(244, 67, 54, 0.15), rgba(156, 39, 176, 0.15))';
    } else {
      return 'linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(121, 85, 72, 0.15))';
    }
  };

  return (
    <>
      <nav>
        <div className="navbar">
          <a href="#" className="logo">
            Personal Finance Manager
          </a>
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/predict">Predict</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a role="button" onClick={logout} className="logout-btn">Logout</a></li>
          </ul>
          <div className="menu-toggle">
            <i className="fas fa-bars"></i>
          </div>
        </div>
      </nav>
      {/* <nav>
        <div className="navbar">
          <Link to="/" className="logo">
            <i className="fas fa-chart-line"></i>Personal Finance Manager
          </Link>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/About">About</Link></li>
            <li><Link to="/support">Support</Link></li>
            <li><Link to="/dashboard"> Dashboard</Link></li>
          </ul>
          <div className="buttons">
            <button onClick={logout} className="btn-head">
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </nav> */}

      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}

      <section className="main-content" id="tracker">
        <div className="head-text">
          <h1>Access Your Personal Finance Manager</h1>
          <div className="under-head-text"></div>
        </div>
        <br />

        <div className="tracker-container">
          <div className="image-container">
            <div className="finance-animation" style={{ background: getBackgroundGradient() }}>
              <div className="animation-header">
                <h3>Your Financial Goals</h3>
              </div>
              <div className="animation-content">
                <div className="animated-visualization">
                  <div className="floating-icons-container">
                    {Object.keys(goals).map((category, index) => (
                      <div 
                        key={category} 
                        className={`floating-icon ${animationVisible ? 'visible' : ''}`}
                        style={{ 
                          animationDelay: `${index * 0.2}s`,
                          animationDuration: `${5 + index % 3}s`
                        }}
                      >
                        <div className="icon-bubble">
                          <i className={`fas ${getCategoryIcon(category)}`}></i>
                        </div>
                        <span className="icon-label">{category}</span>
                      </div>
                    ))}
                  </div>
                  <div className="animated-circles">
                    <div className="circle circle1"></div>
                    <div className="circle circle2"></div>
                    <div className="circle circle3"></div>
                    <div className="circle circle4"></div>
                    <div className="circle circle5"></div>
                  </div>
                  <div className="central-goal-icon">
                    <i className="fas fa-bullseye"></i>
                  </div>
                </div>
                <div className="set-goal-button-container">
                  <button 
                    className="set-goal-btn-inside"
                    onClick={() => setShowGoalModal(true)}
                  >
                    <i className="fas fa-bullseye"></i>
                    <span>Set Your Goals</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Add the Modal */}
          {showGoalModal && (
            <div className="goal-modal">
              <div className="goal-modal-content">
                <div className="goal-modal-header">
                  <h2><i className="fas fa-bullseye"></i> Set Your Financial Goals</h2>
                  <button 
                    className="close-modal-btn modal-close-top" 
                    onClick={() => setShowGoalModal(false)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                  <p className="goal-subheading">Define spending limits for each category to better manage your finances</p>
                </div>
                
                <div className="goal-grid">
                  {Object.keys(goals).map(category => (
                    <div key={category} className="goal-item">
                      <div className="goal-icon">
                        <i className={`fas ${getCategoryIcon(category)}`}></i>
                      </div>
                      <div className="goal-details">
                        <label>{category}</label>
                        <div className="goal-input-wrapper">
                          <span className="currency-symbol">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={goals[category] || ''}
                            onChange={(e) => handleGoalUpdate(category, e.target.value)}
                            placeholder="Set limit"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="goal-modal-buttons">
                  <button onClick={saveGoals} className="save-goals-btn">
                    <i className="fas fa-check"></i> Save Goals
                  </button>
                  <button onClick={resetGoals} className="reset-goals-btn">
                    <i className="fas fa-undo"></i> Reset
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="tracker-part">
            <div className="tracker-balance">
              Current Balance: <span className={`current-balance ${balance < 0 ? 'negative-balance' : 'positive-balance'}`}>
                {formatCurrency(balance, currency)}
              </span>
            </div>

            <div className="currency-filter">
              <div className="filter-left">
                <label htmlFor="currency">Select Currency:</label>
                <select id="currency" value={currency} onChange={handleCurrencyChange}>
                  <option value="INR">INR</option>
                </select>
              </div>
              <div className="filter-right date-range-container">
                <label>Export Date Range:</label>
                <div className="date-inputs">
                  <div className="date-input-group">
                    <span>From</span>
                    <input 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => setStartDate(e.target.value)}
                      className="modern-date-input"
                    />
                  </div>
                  <div className="date-input-group">
                    <span>To</span>
                    <input 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => setEndDate(e.target.value)}
                      className="modern-date-input"
                    />
                  </div>
                </div>
              </div>
              <div className="filter-right">
                <label htmlFor="date" className="date-box">Transaction Date:</label>
                <input type="date" id="date" ref={dateRef} className="modern-date-input" />
                {validationErrors.date && <span className="error" style={{color: '#ff3333', fontWeight: 'bold'}}>{validationErrors.date}</span>}
              </div>
            </div>

            <div className="transaction-form">
              <select ref={descriptionRef}>
                <option value="" disabled selected>Select category type</option>
                <option value="Total Amount">Total Amount</option>
                <option value="Utilities">Utilities</option>
                <option value="Groceries">Groceries</option>
                <option value="Transportation">Transportation</option>
                <option value="Housing">Housing</option>
                <option value="Food & Dinning">Food & Dinning</option>
                <option value="Shopping">Shopping</option>
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Health">Health </option>
                <option value="Others">Others</option>
              </select>
              {validationErrors.description && <span className="error" style={{color: '#ff3333', fontWeight: 'bold'}}>{validationErrors.description}</span>}
              
              <input type="number" ref={amountRef} placeholder="Amount" />
              {validationErrors.amount && <span className="error" style={{color: '#ff3333', fontWeight: 'bold'}}>{validationErrors.amount}</span>}
              
              <select ref={typeRef}>
                <option value="" disabled selected>Select income or expense</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              {validationErrors.type && <span className="error" style={{color: '#ff3333', fontWeight: 'bold'}}>{validationErrors.type}</span>}
              
              {!editedTransaction ? (
                <button onClick={addTransaction}>Add Transaction</button>
              ) : (
                <button onClick={saveTransaction}>Save Changes</button>
              )}
              <button onClick={handleDownload}>Export</button>
              <button onClick={() => window.location.href = '/transcations'}>
                show Transactions
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Track;