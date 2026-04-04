import React, { useEffect, useState } from "react";
import axios from "axios";
import '../styles/Transcations.css';
import '../styles/style.css';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

// Backend API Configuration
const API_BASE_URL = 'https://finance-management-fnbj.onrender.com'; // Deployed backend URL
 // Deployed backend URL

// Add animation styles directly in the component
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInFromTop {
    from { transform: translateY(-50px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes slideInFromLeft {
    from { transform: translateX(-50px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideInFromBottom {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes scaleIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
  
  .navbar-animated {
    animation: slideInFromTop 0.5s ease forwards;
  }
  
  .nav-item:hover {
    transform: scale(1.1);
    transition: transform 0.2s ease;
  }
  
  .filter-card {
    animation: slideInFromLeft 0.5s ease 0.2s both;
  }
  
  .transactions-header {
    animation: slideInFromBottom 0.5s ease 0.3s both;
  }
  
  .table-container-animated {
    animation: slideInFromBottom 0.5s ease 0.4s both;
  }
  
  .transaction-row {
    animation: fadeIn 0.3s ease forwards;
    transition: background-color 0.2s ease;
  }
  
  .transaction-row:hover {
    background-color: rgba(0,0,0,0.03);
  }
  
  .selected-row {
    background-color: rgba(0,0,0,0.05);
  }
  
  .selected-transaction-details {
    animation: fadeIn 0.3s ease forwards;
  }
  
  .btn:hover {
    transform: scale(1.05);
    transition: transform 0.2s ease;
  }
  
  .btn:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
  
  .modal-content-animated {
    animation: scaleIn 0.3s ease forwards;
  }
`;

const Transactions = () => {
    const { token, logout } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        type: 'All',
        category: 'All',
        value: '',
        description: '',
        pending: false
    });
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [editForm, setEditForm] = useState({
        date: '',
        description: '',
        type: '',
        amount: '',
        category: ''
    });
    
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

    const fetchTransactions = (filterParams) => {
        axios.get(`${API_BASE_URL}/api/transactions?startDate=${filterParams.fromDate}&endDate=${filterParams.toDate}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(response => {
            let filteredData = response.data;

            // Apply client-side filters
            if (filterParams.type !== 'All') {
                filteredData = filteredData.filter(txn => txn.type === filterParams.type.toLowerCase());
            }
            if (filterParams.value) {
                filteredData = filteredData.filter(txn => txn.amount === parseFloat(filterParams.value));
            }
            if (filterParams.description) {
                filteredData = filteredData.filter(txn => 
                    txn.description.toLowerCase().includes(filterParams.description.toLowerCase())
                );
            }

            setTransactions(filteredData);
        })
        .catch(error => {
            console.error("Error fetching transactions:", error);
            if (error.response?.status === 401) {
                alert("Please login to view transactions");
            }
        });
    };

    useEffect(() => {
        fetchTransactions(filters);
    }, []);

    const handleFilterChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchTransactions(filters);
    };

    const handleFilterReset = () => {
        const resetFilters = {
            fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            toDate: new Date().toISOString().split('T')[0],
            type: 'All',
            category: 'All',
            value: '',
            description: '',
            pending: false
        };
        setFilters(resetFilters);
        fetchTransactions(resetFilters);
    };

    const handleTransactionClick = (txn) => {
        setSelectedTransaction(txn);
    };

    const handleEditFormChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEdit = (txn, e) => {
        e.stopPropagation();
        setEditingTransaction(txn);
        setEditForm({
            date: txn.date.split('T')[0],
            description: txn.description,
            type: txn.type,
            amount: txn.amount,
            category: txn.category || 'Others'
        });
        setShowEditModal(true);
    };

    const confirmEdit = () => {
        if (!editingTransaction) return;

        axios.put(`${API_BASE_URL}/api/transactions/${editingTransaction.primeId}`,
            editForm,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        )
        .then(response => {
            // Update the transactions list with the edited transaction
            setTransactions(transactions.map(t => 
                t.primeId === editingTransaction.primeId ? response.data : t
            ));
            setShowEditModal(false);
            setEditingTransaction(null);
            // Refresh the transactions list
            fetchTransactions(filters);
        })
        .catch(error => {
            console.error("Error updating transaction:", error);
            alert("Error updating transaction. Please try again.");
        });
    };

    const handleDelete = (txn, e) => {
        e.stopPropagation();
        setTransactionToDelete(txn);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!transactionToDelete) return;

        axios.delete(`${API_BASE_URL}/api/transactions/${transactionToDelete.primeId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        .then(() => {
            // Remove the deleted transaction from the state
            setTransactions(transactions.filter(t => t.primeId !== transactionToDelete.primeId));
            setShowDeleteModal(false);
            setTransactionToDelete(null);
            // Refresh the transactions list
            fetchTransactions(filters);
        })
        .catch(error => {
            console.error("Error deleting transaction:", error);
            alert("Error deleting transaction. Please try again.");
        });
    };

    return (
        <div className="container-fluid mt-3">
            {/* Add the animation styles */}
            <style>{animationStyles}</style>
            
            <nav className="navbar navbar-animated">
                <a href="#" className="logo">Personal Finance Manager</a>
                <ul className="nav-links">
                    <li className="nav-item"><a href="/home">Home</a></li>
                    <li className="nav-item"><a href="/about">About</a></li>
                    <li className="nav-item"><a href="/track">Track</a></li>
                    <li className="nav-item"><a href="/dashboard">Dashboard</a></li>
                    <li className="nav-item"><a href="/predict">Predict</a></li>
                    <li className="nav-item">
                        <a
                            role="button"
                            onClick={() => {
                                logout();
                                window.location.href = '/login';
                            }}
                            className="logout-btn"
                        >
                            Logout
                        </a>
                    </li>
                </ul>
            </nav>

            <div className="row" style={{ marginTop: '7rem' }}>
                <div className="col-md-3">
                    <div className="card p-3 filter-card" style={{ marginTop: '1rem' }}>
                        <h5>Filters</h5>
                        <form onSubmit={handleFilterSubmit}>
                            <label>From</label>
                            <input 
                                type="date" 
                                className="form-control mb-2" 
                                id="fromDate"
                                value={filters.fromDate}
                                onChange={handleFilterChange}
                            />
                            <label>To</label>
                            <input 
                                type="date" 
                                className="form-control mb-2" 
                                id="toDate"
                                value={filters.toDate}
                                onChange={handleFilterChange}
                            />
                            <label>Type</label>
                            <select 
                                className="form-control mb-2"
                                id="type"
                                value={filters.type}
                                onChange={handleFilterChange}
                            >
                                <option>All</option>
                                <option>Income</option>
                                <option>Expense</option>
                            </select>
                            <label>Value</label>
                            <input 
                                type="number" 
                                className="form-control mb-2"
                                id="value"
                                value={filters.value}
                                onChange={handleFilterChange}
                            />
                            <label>Description</label>
                            <input 
                                type="text" 
                                className="form-control mb-2"
                                id="description"
                                value={filters.description}
                                onChange={handleFilterChange}
                            />
                            <div className="form-check">
                                <input 
                                    className="form-check-input" 
                                    type="checkbox" 
                                    id="pending"
                                    checked={filters.pending}
                                    onChange={handleFilterChange}
                                />
                                <label className="form-check-label" htmlFor="pending">Pending</label>
                            </div>
                            <button type="submit" className="btn btn-primary mt-2 w-100">
                                Filter
                            </button>
                            <button 
                                type="button" 
                                className="btn btn-secondary mt-2 w-100"
                                onClick={handleFilterReset}
                            >
                                Reset
                            </button>
                        </form>
                    </div>
                </div>

                <div className="col-md-9">
                    <div className="d-flex justify-content-between align-items-center mb-3 transactions-header">
                        <h3>Transactions</h3>
                        {selectedTransaction && (
                           <div className="selected-transaction-details">
                              <p><strong>Date:</strong> {new Date(selectedTransaction.date).toLocaleDateString()}</p>
                              <p><strong>Description:</strong> {selectedTransaction.description}</p>
                              <p><strong>Amount:</strong> {selectedTransaction.amount} {selectedTransaction.currency}</p>
                           </div>
                        )}
                     </div>
                    <div className="table-container table-container-animated">
                        <table className="table table-striped">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Type</th>
                                    <th>Amount</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((txn, index) => (
                                    <tr 
                                        key={txn.primeId || index} 
                                        onClick={() => handleTransactionClick(txn)}
                                        className={`transaction-row ${selectedTransaction?.primeId === txn.primeId ? 'selected-row' : ''}`}
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <td>{new Date(txn.date).toLocaleDateString()}</td>
                                        <td>{txn.description}</td>
                                        <td>{txn.type}</td>
                                        <td className={txn.type === "expense" ? "text-danger" : "text-success"}>
                                            {txn.amount}
                                        </td>
                                        <td>
                                            <button 
                                                className="btn btn-sm btn-primary me-2"
                                                onClick={(e) => handleEdit(txn, e)}
                                                style={{ marginRight: '5px' }}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-danger"
                                                onClick={(e) => handleDelete(txn, e)}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan="3"><strong>Total</strong></td>
                                    <td className="text-dark" colSpan="2">
                                        <strong>
                                            {transactions.reduce((acc, txn) => acc + (txn.amount || 0), 0).toFixed(2)}
                                        </strong>
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="modal" tabIndex="-1" role="dialog" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog" role="document">
                        <div className="modal-content modal-content-animated">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Transaction</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <form>
                                    <div className="mb-3">
                                        <label className="form-label">Date</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            name="date"
                                            value={editForm.date}
                                            onChange={handleEditFormChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Description</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="description"
                                            value={editForm.description}
                                            onChange={handleEditFormChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Type</label>
                                        <select
                                            className="form-control"
                                            name="type"
                                            value={editForm.type}
                                            onChange={handleEditFormChange}
                                        >
                                            <option value="income">Income</option>
                                            <option value="expense">Expense</option>
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Amount</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            name="amount"
                                            value={editForm.amount}
                                            onChange={handleEditFormChange}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-control"
                                            name="category"
                                            value={editForm.category}
                                            onChange={handleEditFormChange}
                                        >
                                            <option value="Salary">Salary</option>
                                            <option value="Utilities">Utilities</option>
                                            <option value="Groceries">Groceries</option>
                                            <option value="Transportation">Transportation</option>
                                            <option value="Housing">Housing</option>
                                            <option value="Food & Dining">Food & Dining</option>
                                            <option value="Shopping">Shopping</option>
                                            <option value="Education">Education</option>
                                            <option value="Entertainment">Entertainment</option>
                                            <option value="Others">Others</option>
                                        </select>
                                    </div>
                                </form>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={confirmEdit}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal" tabIndex="-1" role="dialog" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog" role="document">
                        <div className="modal-content modal-content-animated">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to delete this transaction?</p>
                                <p><strong>Description:</strong> {transactionToDelete?.description}</p>
                                <p><strong>Amount:</strong> {transactionToDelete?.amount}</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-danger" onClick={confirmDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions; 