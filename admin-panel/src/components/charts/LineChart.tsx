import React from 'react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';

interface LineChartProps {
  title?: string;
  data: {
    name: string;
    data: { x: string | number; y: number }[];
  }[];
  height?: number;
  showToolbar?: boolean;
  className?: string;
}

const LineChart: React.FC<LineChartProps> = ({
  title,
  data,
  height = 350,
  showToolbar = true,
  className = ''
}) => {
  const { isDark } = useTheme();

  // Transform data for Recharts
  const chartData = data[0]?.data.map(item => ({
    name: new Date(item.x).toLocaleDateString(),
    value: item.y,
  })) || [];

  return (
    <Card className={className}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsLineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E5E7EB'} />
          <XAxis 
            dataKey="name" 
            stroke={isDark ? '#9CA3AF' : '#6B7280'}
            fontSize={12}
          />
          <YAxis 
            stroke={isDark ? '#9CA3AF' : '#6B7280'}
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '8px',
              color: isDark ? '#F3F4F6' : '#111827'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#3B82F6" 
            strokeWidth={3}
            dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default LineChart;