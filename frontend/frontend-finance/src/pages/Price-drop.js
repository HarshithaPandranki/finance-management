import React, { useState } from 'react';

const PriceDrop = () => {
  const [productDetails, setProductDetails] = useState({
    productName: '',
    currentPrice: '', 
    targetPrice: '',
    email: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Here you would typically make an API call to your backend
    // to store the price alert details and setup notifications
    try {
      console.log('Submitting price alert:', productDetails);
      // Add your API call here
      alert('Price alert has been set successfully!');
    } catch (error) {
      console.error('Error setting price alert:', error);
      alert('Failed to set price alert. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 16px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '16px' }}>
        Price Drop Alert
      </h1>
      
      <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '4px', marginTop: '16px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '24px' }}>
            <div>
              <input
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                placeholder="Product Name"
                name="productName"
                value={productDetails.productName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <input
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                placeholder="Current Price"
                name="currentPrice"
                type="number"
                value={productDetails.currentPrice}
                onChange={handleInputChange}
                required
              />
              
              <input
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                placeholder="Target Price"
                name="targetPrice"
                type="number"
                value={productDetails.targetPrice}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div>
              <input
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                placeholder="Email for Notifications"
                name="email"
                type="email"
                value={productDetails.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <button 
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Set Price Alert
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PriceDrop;
