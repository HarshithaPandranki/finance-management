import React, { useState, useEffect, useRef } from 'react';
import { Link , useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar
} from 'recharts';
import { Card, Row, Col, DatePicker, Statistic, Radio } from 'antd';
import moment from 'moment';

// Backend API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Deployed backend URL

// Theme configuration
const darkTheme = {
  backgroundColor: '#1a1b3a',
  cardBg: '#242645',
  textColor: '#ffffff',
  secondaryText: '#8c8c8c',
  borderRadius: '10px',
  padding: '20px',
};

const Dashboard = () => {
  const { token, logout } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [stats, setStats] = useState({ total: 0, income: 0, expense: 0 });
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState([
    moment().subtract(30, 'days'),
    moment()
  ]);

  const COLORS = ['#FF8042', '#8884d8', '#00C49F', '#FFBB28', '#FF4560', 
    '#7D3C98', '#D35400', '#1ABC9C', '#3498DB', '#2ECC71']; // 10 Colors
    const GRADIENT_COLORS = ['#FF6B8B', '#8884d8', '#00C49F', '#FFBB28', '#FF4560', 
      '#7D3C98', '#D35400', '#1ABC9C', '#3498DB', '#2ECC71'];

  // Add time period options
  const timeOptions = [
    { label: 'Last Week', value: 'week' },
    { label: 'Last Month', value: 'month' },
    { label: 'Last Year', value: 'year' },
    { label: 'Last Decade', value: 'decade' }
  ];

  useEffect(() => {
    fetchTransactions();
}, [selectedPeriod]);  


const fetchTransactions = async () => {
  try {
      const token = localStorage.getItem('token');
      const endDate = moment().endOf('day');
      let startDate = getStartDate(selectedPeriod);

      const response = await axios.get(`${API_BASE_URL}/api/transactions`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { startDate: startDate.toISOString(), endDate: endDate.toISOString() }
      });

      if (response.data) {
          setTransactions(response.data);
          calculateStats(response.data);
      }
      setLoading(false);
  } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
  }
};
const getStartDate = (period) => {
  switch (period) {
      case 'week': return moment().subtract(1, 'week').startOf('day');
      case 'month': return moment().subtract(1, 'month').startOf('day');
      case 'year': return moment().subtract(1, 'year').startOf('day');
      default: return moment().subtract(1, 'month').startOf('day');
  }
};


const calculateStats = (data) => {
  const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  setStats({ income, expense, total: income - expense });
};


const preparePieData = () => {
  const categoryData = {};
  transactions.forEach(t => {
      if (t.type === 'expense') {
          categoryData[t.description] = (categoryData[t.description] || 0) + Math.abs(Number(t.amount));
      }
  });
  return Object.entries(categoryData).map(([name, value]) => ({ name, value })).slice(0, 5);
};


  const prepareChartData = () => {
    const dailyData = {};
    let dateFormat;
    let intervalUnit;

    switch (selectedPeriod) {
      case 'week':
        dateFormat = 'ddd';
        intervalUnit = 'days';
        break;
      case 'month':
        dateFormat = 'DD MMM';
        intervalUnit = 'days';
        break;
      case 'year':
        dateFormat = 'MMM YYYY';
        intervalUnit = 'months';
        break;
      case 'decade':
        dateFormat = 'YYYY';
        intervalUnit = 'years';
        break;
      default:
        dateFormat = 'DD MMM';
        intervalUnit = 'days';
    }

    // Initialize data points for the entire range
    let current = moment(dateRange[0]);
    while (current <= dateRange[1]) {
      const dateKey = current.format(dateFormat);
      dailyData[dateKey] = { date: dateKey, income: 0, expense: 0, amount: 0 };
      current = current.add(1, intervalUnit);
    }

    // Aggregate transactions
    transactions.forEach(t => {
      const dateKey = moment(t.date).format(dateFormat);
      if (dailyData[dateKey]) {
        if (t.type === 'income') {
          dailyData[dateKey].income += Number(t.amount);
          dailyData[dateKey].amount += Number(t.amount);
        } else {
          dailyData[dateKey].expense += Number(t.amount);
          dailyData[dateKey].amount -= Number(t.amount);
        }
      }
    });

    return Object.values(dailyData);
  };

  const handlePeriodChange = (e) => {
    setSelectedPeriod(e.target.value);
    setLoading(true);
    fetchTransactions();
  };

  const formatIndianCurrency = (num) => {
    const value = Math.abs(num);
    const formattedNumber = value.toLocaleString('en-IN');
    return num < 0 ? `-${formattedNumber}` : formattedNumber;
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
      await logout();
      navigate('/login');
      throw new Error('Session expired');
    }

    return response;
  };
  const renderLineChart = () => (
    <LineChart width={800} height={400} data={prepareChartData()}
      style={{
        filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.2))',
        borderRadius: '10px'
      }}>
      <defs>
        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
          <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip 
        formatter={(value) => `₹${formatIndianCurrency(value)}`}
        contentStyle={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '8px',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
        }}
      />
      <Legend />
      <Line
        type="monotone"
        dataKey="amount"
        stroke="#8884d8"
        strokeWidth={3}
        dot={{ r: 6, strokeWidth: 2 }}
        activeDot={{ r: 8 }}
        fill="url(#colorAmount)"
      />
    </LineChart>
  );

  const renderPieChart = () => (
    <PieChart width={400} height={400}>
      <defs>
        {COLORS.map((color, index) => (
          <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={1}/>
            <stop offset="100%" stopColor={color} stopOpacity={0.7}/>
          </linearGradient>
        ))}
      </defs>
      <Pie
        data={preparePieData()}
        cx={200}
        cy={200}
        labelLine={false}
        outerRadius={120}
        innerRadius={60}
        paddingAngle={5}
        dataKey="value"
        label={({
          cx,
          cy,
          midAngle,
          innerRadius,
          outerRadius,
          percent,
          name
        }) => {
          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
          const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
          const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
          return (
            <text
              x={x}
              y={y}
              fill="white"
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
            >
              {`${(percent * 100).toFixed(0)}%`}
            </text>
          );
        }}
      >
        {preparePieData().map((entry, index) => (
          <Cell 
            key={`cell-${index}`} 
            fill={`url(#gradient-${index})`}
            stroke="#fff"
            strokeWidth={2}
          />
        ))}
      </Pie>
      <Tooltip 
        formatter={(value) => `₹${formatIndianCurrency(value)}`}
        contentStyle={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '8px',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)'
        }}
      />
      <Legend 
        formatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
      />
    </PieChart>
  );

  return (
    <div style={{ backgroundColor: darkTheme.backgroundColor, padding: darkTheme.padding, minHeight: '100vh' }}>
      <nav>
        <div className="navbar">
          <a href="/" className="logo">
          Personal Finance Manager
          </a>
          <ul className="nav-links">
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/track">Track</a></li>
            <li><a href="/predict">Predict</a></li>
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
      <h1>Financial Dashboard</h1>
      
      {/* Time Period Selector */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col span={24}>
          <Card style={{
            backgroundColor: darkTheme.cardBg,
            borderRadius: darkTheme.borderRadius,
            border: 'none'
          }}>
            <Radio.Group 
              value={selectedPeriod} 
              onChange={handlePeriodChange}
              buttonStyle="solid"
            >
              <Radio.Button value="week">Last Week</Radio.Button>
              <Radio.Button value="month">Last Month</Radio.Button>
              <Radio.Button value="year">Last Year</Radio.Button>
              <Radio.Button value="decade">Last Decade</Radio.Button>
            </Radio.Group>
          </Card>
        </Col>
      </Row>

      {/* Statistics Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: darkTheme.textColor }}>
          Loading...
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col span={8}>
              <Card style={{
                backgroundColor: darkTheme.cardBg,
                borderRadius: darkTheme.borderRadius,
                border: 'none'
              }}>
                <Statistic
                  title={<span style={{ color: darkTheme.secondaryText }}>Total Balance</span>}
                  value={stats.total}
                  valueStyle={{ color: darkTheme.textColor }}
                  prefix="₹"
                  formatter={formatIndianCurrency}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{
                backgroundColor: darkTheme.cardBg,
                borderRadius: darkTheme.borderRadius,
                border: 'none'
              }}>
                <Statistic
                  title={<span style={{ color: darkTheme.secondaryText }}>Total Income</span>}
                  value={stats.income}
                  valueStyle={{ color: '#00C49F' }}
                  prefix="₹"
                  formatter={formatIndianCurrency}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card style={{
                backgroundColor: darkTheme.cardBg,
                borderRadius: darkTheme.borderRadius,
                border: 'none'
              }}>
                <Statistic
                  title={<span style={{ color: darkTheme.secondaryText }}>Total Expenses</span>}
                  value={stats.expense}
                  valueStyle={{ color: '#FF8042' }}
                  prefix="₹"
                  formatter={formatIndianCurrency}
                />
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row gutter={[16, 16]}>
            <Col span={16}>
              <Card 
                title="Transaction Trend" 
                style={{ 
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  borderRadius: '10px'
                }}
              >
                {renderLineChart()}
              </Card>
            </Col>
            <Col span={8}>
              <Card 
                title="Transaction Distribution"
                style={{ 
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  borderRadius: '10px'
                }}
              >
                {renderPieChart()}
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard; 