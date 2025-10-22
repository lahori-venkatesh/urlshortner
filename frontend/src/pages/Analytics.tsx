import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Analytics = () => {
  const { shortCode } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <button 
        onClick={() => navigate('/dashboard/links')}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          marginBottom: '20px',
          cursor: 'pointer'
        }}
      >
        ← Back to Links
      </button>
      
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        Analytics for /{shortCode}
      </h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Total Clicks</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#007bff' }}>156</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Unique Visitors</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#28a745' }}>89</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #dee2e6'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#495057' }}>Mobile %</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '0', color: '#6f42c1' }}>42%</p>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #dee2e6',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>Top Countries</h3>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span>United States</span>
            <span style={{ fontWeight: 'bold' }}>45</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span>United Kingdom</span>
            <span style={{ fontWeight: 'bold' }}>23</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span>Canada</span>
            <span style={{ fontWeight: 'bold' }}>18</span>
          </div>
        </div>
      </div>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '20px', 
        borderRadius: '8px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#495057' }}>Device Types</h3>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span>Desktop</span>
            <span style={{ fontWeight: 'bold' }}>78</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span>Mobile</span>
            <span style={{ fontWeight: 'bold' }}>65</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span>Tablet</span>
            <span style={{ fontWeight: 'bold' }}>13</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;