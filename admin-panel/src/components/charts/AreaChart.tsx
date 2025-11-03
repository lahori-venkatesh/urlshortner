import React from 'react';
import { AreaChart as RechartsAreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';

interface AreaChartProps {
  title?: string;
  data: {
    name: string;
    data: { x: string | number; y: number }[];
  }[];
  height?: number;
  stacked?: boolean;
  className?: string;
}

const AreaChart: React.FC<AreaChartProps> = ({
  title,
  data,
  height = 350,
  stacked = false,
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
        <RechartsAreaChart data={chartData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
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
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#3B82F6" 
            fillOpacity={1} 
            fill="url(#colorValue)" 
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default AreaChart;