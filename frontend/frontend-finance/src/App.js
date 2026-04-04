import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Track from './pages/Track';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import './styles/style.css';
import './styles/global-logo.css';
import About from './pages/About';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
// import 'antd/dist/antd.css';
import 'antd/dist/reset.css';
import Transactions from './pages/Transactions';
import Predict from './pages/predict';

// Add these to your index.html or install via npm
// import '@fortawesome/fontawesome-free/css/all.min.css';
// import 'feather-icons/dist/feather.min.css';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [currency, setCurrency] = useState('$');

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/track" 
            element={
              <ProtectedRoute>
                <Track 
                  transactions={transactions} 
                  setTransactions={setTransactions}
                  currency={currency}
                  setCurrency={setCurrency}
                />
              </ProtectedRoute>
            } 
          />
          <Route path="/dashboard" element={ 
    <ProtectedRoute>
    <Dashboard transactions={transactions} currency={currency} />
  </ProtectedRoute>
} />

          <Route path="/about" element={<About />} />
          <Route path="/transcations" element={<Transactions />} />
<Route path="/transactions" element={  
    <ProtectedRoute>  
      <Transactions />  
    </ProtectedRoute>  
  } />  

          <Route path="/predict" element={  
  <ProtectedRoute>  
    <Predict />  
  </ProtectedRoute>  
} />  


        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
