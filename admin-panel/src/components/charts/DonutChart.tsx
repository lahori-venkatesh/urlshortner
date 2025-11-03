import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import Card from '../common/Card';

interface DonutChartProps {
  title?: string;
  data: {
    labels: string[];
    series: number[];
  };
  height?: number;
  showLegend?: boolean;
  className?: string;
}

const DonutChart: React.FC<DonutChartProps> = ({
  title,
  data,
  height = 350,
  showLegend = true,
  className = ''
}) => {
  const { isDark } = useTheme();

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  // Transform data for Recharts
  const chartData = data.labels.map((label, index) => ({
    name: label,
    value: data.series[index],
    color: COLORS[index % COLORS.length]
  }));

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
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={120}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
              border: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
              borderRadius: '8px',
              color: isDark ? '#F3F4F6' : '#111827'
            }}
          />
          {showLegend && (
            <Legend 
              wrapperStyle={{
                color: isDark ? '#9CA3AF' : '#6B7280'
              }}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default DonutChart;