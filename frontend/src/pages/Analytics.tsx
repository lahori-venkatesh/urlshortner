import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Analytics: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const navigate = useNavigate();

  return (
    <div>
      <h1>ANALYTICS WORKING!</h1>
      <p>Short Code: {shortCode}</p>
      <button onClick={() => navigate('/dashboard/links')}>
        Back to Links
      </button>
      <div>
        <h2>Statistics</h2>
        <p>Total Clicks: 156</p>
        <p>Unique Visitors: 89</p>
        <p>Mobile %: 42%</p>
      </div>
    </div>
  );
};

export default Analytics;