import React, { useState, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import styles from '../styles/predict.module.css';
import { uploadFile, fetchFromDatabase } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Predict = () => {
    const COLORS = ['#FF8042', '#8884d8', '#00C49F', '#FFBB28', '#FF4560',
        '#7D3C98', '#D35400', '#1ABC9C', '#3498DB', '#2ECC71'];
    const [file, setFile] = useState(null);
    const [source, setSource] = useState('csv');
    const [predictions, setPredictions] = useState(null);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [saveLoading, setSaveLoading] = useState(false);
    const navigate = useNavigate();
    const { token, logout } = useAuth();
    const resultsRef = useRef(null);
    
    const chartData = predictions
        ? Object.entries(predictions).map(([name, value]) => ({ name, value }))
        : [];

    const handleFileChange = (event) => setFile(event.target.files[0]);
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
            await logout();
            navigate('/login');
            throw new Error('Session expired');
        }

        return response;
    };

    const handlePrediction = async () => {
        if (source === 'csv' && !file) return alert('Please select a file');
    
        setLoading(true);
        setPredictions(null);
    
        try {
            let result;
            if (source === 'csv') {
                result = await uploadFile(file);
            } else {
                result = await fetchFromDatabase();
            }
    
            console.log("Raw API Response:", JSON.stringify(result, null, 2)); // Better debugging
    
            // Standardized handling for both CSV and database responses
            let predictionsData = null;
            
            // Case 1: Response has predictions directly
            if (result?.predictions && typeof result.predictions === 'object' && 
                Object.keys(result.predictions).length > 0 && 
                !result.predictions.predictions) {
                
                predictionsData = result.predictions;
                console.log("Found predictions directly:", predictionsData);
            } 
            // Case 2: Response has nested predictions
            else if (result?.predictions?.predictions && 
                    typeof result.predictions.predictions === 'object' &&
                    Object.keys(result.predictions.predictions).length > 0) {
                
                predictionsData = result.predictions.predictions;
                console.log("Found nested predictions:", predictionsData);
            }
            
            if (predictionsData && Object.keys(predictionsData).length > 0) {
                console.log("Setting predictions:", predictionsData);
                setPredictions(predictionsData);
            } else {
                console.error('Invalid or empty predictions structure:', result);
                alert('No prediction data available.');
            }
        } catch (error) {
            console.error('Error fetching predictions:', error);
            alert('Error fetching predictions: ' + error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSaveResults = async () => {
        if (!predictions) return;
        
        setSaveLoading(true);
        try {
            // In a real app, we would save to the backend
            const saveData = {
                predictions,
                timestamp: new Date().toISOString(),
                source: source
            };
            
            // Simulate saving to backend
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate successful save
            alert('Results saved successfully!');
        } catch (error) {
            console.error('Error saving results:', error);
            alert('Error saving results: ' + error.message);
        } finally {
            setSaveLoading(false);
        }
    };
    
    const handleExportPDF = async () => {
        if (!resultsRef.current) return;
        
        setExportLoading(true);
        try {
            const element = resultsRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('prediction-results.pdf');
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Error exporting PDF: ' + error.message);
        } finally {
            setExportLoading(false);
        }
    };
    
    const getPercentage = (value) => {
        return ((value / total) * 100).toFixed(1) + '%';
    };
    
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className={styles.container}>
            <nav>
                <div className="navbar">
                    <a href="/" className="logo">
                        <div className="site-logo">
                            <img src="/logo.jpg" alt="Finance Manager" />
                        </div>
                        <span>Personal Finance Manager</span>
                    </a>
                    <ul className="nav-links">
                        <li><a href="/">Home</a></li>
                        <li><a href="/about">About</a></li>
                        <li><a href="/track">Track</a></li>
                        <li><a href="/dashboard">Dashboard</a></li>
                        <li>
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
                    <div className="menu-toggle">
                        <i className="fas fa-bars"></i>
                    </div>
                </div>
            </nav>
            <h2 className={styles.heading}>Upload Your Finance Data</h2>
            <div className={styles.uploadSection}>
                <div className={styles.optionContainer}>
                    <h3 className={styles.uploadSubheading}>Select Data Source</h3>
                <div className={styles.optionSection}>
                        <label className={`${styles.optionLabel} ${source === 'csv' ? styles.optionActive : ''}`}>
                            <input 
                                type="radio" 
                                value="csv" 
                                checked={source === 'csv'} 
                                onChange={() => setSource('csv')} 
                                className={styles.optionInput}
                            />
                            <span className={styles.optionIcon}>📄</span>
                            <span className={styles.optionText}>Upload CSV</span>
                    </label>
                        <label className={`${styles.optionLabel} ${source === 'database' ? styles.optionActive : ''}`}>
                            <input 
                                type="radio" 
                                value="database" 
                                checked={source === 'database'} 
                                onChange={() => setSource('database')} 
                                className={styles.optionInput}
                            />
                            <span className={styles.optionIcon}>🗄️</span>
                            <span className={styles.optionText}>Fetch from Database</span>
                    </label>
                    </div>
                </div>

                {source === 'csv' && (
                    <div className={styles.fileInputContainer}>
                        <label htmlFor="fileInput" className={styles.fileInputLabel}>
                            <span className={styles.fileIcon}>📎</span>
                            <span>{file ? file.name : 'Choose a CSV file'}</span>
                        </label>
                        <input 
                            id="fileInput"
                            type="file" 
                            accept=".csv" 
                            onChange={handleFileChange} 
                            className={styles.fileInput} 
                        />
                    </div>
                )}

                <button 
                    onClick={handlePrediction} 
                    className={styles.uploadButton} 
                    disabled={loading || (source === 'csv' && !file)}
                >
                    {loading ? (
                        <span className={styles.loadingSpinner}>
                            <span className={styles.spinnerIcon}></span>
                            Processing...
                        </span>
                    ) : (
                        <>
                            <span className={styles.buttonIcon}>✨</span>
                            Generate Prediction
                        </>
                    )}
                </button>
            </div>

            {predictions && (
                <div className={styles.resultsSection} ref={resultsRef}>
                    <div className={styles.resultsHeader}>
                        <span className={styles.resultsIcon}>📊</span>
                    <h3 className={styles.resultsTitle}>Prediction Results</h3>
                    </div>

                    <div className={styles.resultsContainer}>
                        <div className={styles.textResultsContainer}>
                            <h4 className={styles.resultsSectionTitle}>Expense Breakdown</h4>
                            <div className={styles.textResults}>
                                <ul className={styles.resultsList}>
                                    {chartData.map(({ name, value }, index) => (
                                        <li key={name} className={styles.resultItem}>
                                            <div className={styles.itemLabel}>
                                                <span className={styles.colorIndicator} style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                                <span className={styles.itemName}>{name}</span>
                                            </div>
                                            <div className={styles.itemValueContainer}>
                                                <span className={styles.itemValue}>₹{value.toLocaleString()}</span>
                                                <span className={styles.itemPercentage}>{getPercentage(value)}</span>
                                            </div>
                                        </li>
                                    ))}
                                    <li className={styles.total}>
                                        <div className={styles.totalRow}>
                                            <span className={styles.totalLabel}>Total</span>
                                            <span className={styles.totalValue}>₹{total.toLocaleString()}</span>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <div className={styles.chartWrapper}>
                            <h4 className={styles.resultsSectionTitle}>Visual Distribution</h4>
                            <div className={styles.chartContainer}>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie 
                                            data={chartData} 
                                            cx="50%" 
                                            cy="50%" 
                                            innerRadius={60} 
                                            outerRadius={110} 
                                            fill="#8884d8" 
                                            paddingAngle={5} 
                                            dataKey="value"
                                            animationDuration={1000}
                                            animationBegin={0}
                                            isAnimationActive={true}
                                        >
                                            {chartData.map(({ name, value }, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={COLORS[index % COLORS.length]} 
                                                    className={styles.pieCell}
                                                />
                                            ))}
                                            <Label
                                                position="center"
                                                value={`₹${total.toLocaleString()}`}
                                                className={styles.centerLabel}
                                                fontSize={18}
                                                fontWeight={600}
                                                fill="#3b82f6"
                                            />
                                    </Pie>
                                        <Tooltip 
                                            formatter={(value, name) => [`₹${value.toLocaleString()} (${getPercentage(value)})`, name]}
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                                                border: 'none',
                                                padding: '10px'
                                            }}
                                        />
                                        <Legend 
                                            verticalAlign="bottom" 
                                            height={36} 
                                            iconType="circle"
                                        />
    </PieChart>
                                </ResponsiveContainer>
                            </div>
</div>
                    </div>
                    <div className={styles.actionButtons}>
                        <button 
                            className={styles.actionButton} 
                            onClick={handleSaveResults}
                            disabled={saveLoading}
                        >
                            {saveLoading ? (
                                <span className={styles.buttonLoadingSpinner}>
                                    <span className={styles.smallSpinnerIcon}></span>
                                    Saving...
                                </span>
                            ) : (
                                <>
                                    <span className={styles.buttonIcon}>💾</span>
                                    Save Results
                                </>
                            )}
                        </button>
                        <button 
                            className={styles.actionButton} 
                            onClick={handleExportPDF}
                            disabled={exportLoading}
                        >
                            {exportLoading ? (
                                <span className={styles.buttonLoadingSpinner}>
                                    <span className={styles.smallSpinnerIcon}></span>
                                    Exporting...
                                </span>
                            ) : (
                                <>
                                    <span className={styles.buttonIcon}>📤</span>
                                    Export as PDF
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Predict;