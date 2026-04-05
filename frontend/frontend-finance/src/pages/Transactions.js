import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import '../styles/Transcations.css';
import '../styles/style.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://finance-management-fnbj.onrender.com';

const animationStyles = `
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideInFromTop { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes slideInFromLeft { from { transform: translateX(-50px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideInFromBottom { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .navbar-animated { animation: slideInFromTop 0.5s ease forwards; }
  .nav-item:hover { transform: scale(1.1); transition: transform 0.2s ease; }
  .filter-card { animation: slideInFromLeft 0.5s ease 0.2s both; }
  .transactions-header { animation: slideInFromBottom 0.5s ease 0.3s both; }
  .table-container-animated { animation: slideInFromBottom 0.5s ease 0.4s both; }
  .transaction-row { animation: fadeIn 0.3s ease forwards; transition: background-color 0.2s ease; }
  .transaction-row:hover { background-color: rgba(0,0,0,0.03); }
  .selected-row { background-color: rgba(0,0,0,0.05); }
  .selected-transaction-details { animation: fadeIn 0.3s ease forwards; }
  .btn:hover { transform: scale(1.05); transition: transform 0.2s ease; }
  .btn:active { transform: scale(0.95); transition: transform 0.1s ease; }
  .modal-content-animated { animation: scaleIn 0.3s ease forwards; }
`;

const Transactions = () => {
    const { token, logout } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState(null);
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
        type: 'All',
        value: '',
        description: '',
        pending: false
    });

    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [editForm, setEditForm] = useState({
        date: '', description: '', type: '', amount: '', category: ''
    });

    // ─── Stable auth headers ────────────────────────────────────────────────
    const authHeaders = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
    };

    // ─── Fetch (memoised) ────────────────────────────────────────────────────
    const fetchTransactions = useCallback(async (filterParams) => {
        setLoading(true);
        try {
            const { data } = await axios.get(
                `${API_BASE_URL}/api/transactions?startDate=${filterParams.fromDate}&endDate=${filterParams.toDate}`,
                { headers: authHeaders }
            );

            let filtered = data;

            if (filterParams.type !== 'All') {
                filtered = filtered.filter(t => t.type === filterParams.type.toLowerCase());
            }
            if (filterParams.value) {
                filtered = filtered.filter(t => t.amount === parseFloat(filterParams.value));
            }
            if (filterParams.description) {
                filtered = filtered.filter(t =>
                    t.description.toLowerCase().includes(filterParams.description.toLowerCase())
                );
            }

            setTransactions(filtered);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            if (error.response?.status === 401) {
                logout();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [token]);  // re-create only if token changes

    useEffect(() => {
        fetchTransactions(filters);
    }, []);  // run once on mount

    // ─── Filter handlers ─────────────────────────────────────────────────────
    const handleFilterChange = (e) => {
        const { id, value, type, checked } = e.target;
        setFilters(prev => ({ ...prev, [id]: type === 'checkbox' ? checked : value }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchTransactions(filters);
    };

    const handleFilterReset = () => {
        const reset = {
            fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            toDate: new Date().toISOString().split('T')[0],
            type: 'All', value: '', description: '', pending: false
        };
        setFilters(reset);
        fetchTransactions(reset);
    };

    // ─── Edit ────────────────────────────────────────────────────────────────
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

    const confirmEdit = async () => {
        if (!editingTransaction) return;
        try {
            const { data: updated } = await axios.put(
                `${API_BASE_URL}/api/transactions/${editingTransaction.primeId}`,
                editForm,
                { headers: authHeaders }
            );
            // ✅ Update local state directly — no extra network round-trip
            setTransactions(prev =>
                prev.map(t => t.primeId === editingTransaction.primeId ? updated : t)
            );
            setShowEditModal(false);
            setEditingTransaction(null);
        } catch (error) {
            console.error('Error updating transaction:', error);
            alert('Error updating transaction. Please try again.');
        }
    };

    // ─── Delete ──────────────────────────────────────────────────────────────
    const handleDelete = (txn, e) => {
        e.stopPropagation();
        setTransactionToDelete(txn);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!transactionToDelete) return;
        try {
            await axios.delete(
                `${API_BASE_URL}/api/transactions/${transactionToDelete.primeId}`,
                { headers: authHeaders }
            );
            // ✅ Remove from local state directly — no extra network round-trip
            setTransactions(prev => prev.filter(t => t.primeId !== transactionToDelete.primeId));
            setShowDeleteModal(false);
            setTransactionToDelete(null);
        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert('Error deleting transaction. Please try again.');
        }
    };

    return (
        <div className="container-fluid mt-3">
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
                        <a role="button" onClick={() => { logout(); window.location.href = '/login'; }} className="logout-btn">
                            Logout
                        </a>
                    </li>
                </ul>
            </nav>

            <div className="row" style={{ marginTop: '7rem' }}>
                {/* ─── Filters ─────────────────────────────────────────────── */}
                <div className="col-md-3">
                    <div className="card p-3 filter-card" style={{ marginTop: '1rem' }}>
                        <h5>Filters</h5>
                        <form onSubmit={handleFilterSubmit}>
                            <label>From</label>
                            <input type="date" className="form-control mb-2" id="fromDate" value={filters.fromDate} onChange={handleFilterChange} />
                            <label>To</label>
                            <input type="date" className="form-control mb-2" id="toDate" value={filters.toDate} onChange={handleFilterChange} />
                            <label>Type</label>
                            <select className="form-control mb-2" id="type" value={filters.type} onChange={handleFilterChange}>
                                <option>All</option>
                                <option>Income</option>
                                <option>Expense</option>
                            </select>
                            <label>Value</label>
                            <input type="number" className="form-control mb-2" id="value" value={filters.value} onChange={handleFilterChange} />
                            <label>Description</label>
                            <input type="text" className="form-control mb-2" id="description" value={filters.description} onChange={handleFilterChange} />
                            <div className="form-check">
                                <input className="form-check-input" type="checkbox" id="pending" checked={filters.pending} onChange={handleFilterChange} />
                                <label className="form-check-label" htmlFor="pending">Pending</label>
                            </div>
                            <button type="submit" className="btn btn-primary mt-2 w-100">Filter</button>
                            <button type="button" className="btn btn-secondary mt-2 w-100" onClick={handleFilterReset}>Reset</button>
                        </form>
                    </div>
                </div>

                {/* ─── Table ───────────────────────────────────────────────── */}
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

                    {loading ? (
                        <div className="text-center p-5">
                            <div className="spinner-border text-primary" role="status">
                                <span className="visually-hidden">Loading…</span>
                            </div>
                            <p className="mt-2 text-muted">Fetching transactions…</p>
                        </div>
                    ) : (
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
                                    {transactions.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="text-center text-muted py-4">
                                                No transactions found for the selected period.
                                            </td>
                                        </tr>
                                    ) : transactions.map((txn, index) => (
                                        <tr
                                            key={txn.primeId || index}
                                            onClick={() => setSelectedTransaction(txn)}
                                            className={`transaction-row ${selectedTransaction?.primeId === txn.primeId ? 'selected-row' : ''}`}
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <td>{new Date(txn.date).toLocaleDateString()}</td>
                                            <td>{txn.description}</td>
                                            <td>{txn.type}</td>
                                            <td className={txn.type === 'expense' ? 'text-danger' : 'text-success'}>
                                                {txn.amount}
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-primary me-2" onClick={(e) => handleEdit(txn, e)}>
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn btn-sm btn-danger" onClick={(e) => handleDelete(txn, e)}>
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
                                                {transactions.reduce((acc, t) => acc + (t.amount || 0), 0).toFixed(2)}
                                            </strong>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Edit Modal ─────────────────────────────────────────────────── */}
            {showEditModal && (
                <div className="modal" tabIndex="-1" role="dialog" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog" role="document">
                        <div className="modal-content modal-content-animated">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit Transaction</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Date</label>
                                    <input type="date" className="form-control" name="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Description</label>
                                    <input type="text" className="form-control" name="description" value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Type</label>
                                    <select className="form-control" name="type" value={editForm.type} onChange={e => setEditForm(p => ({ ...p, type: e.target.value }))}>
                                        <option value="income">Income</option>
                                        <option value="expense">Expense</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Amount</label>
                                    <input type="number" className="form-control" name="amount" value={editForm.amount} onChange={e => setEditForm(p => ({ ...p, amount: e.target.value }))} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Category</label>
                                    <select className="form-control" name="category" value={editForm.category} onChange={e => setEditForm(p => ({ ...p, category: e.target.value }))}>
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
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={confirmEdit}>Save Changes</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Delete Modal ────────────────────────────────────────────────── */}
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