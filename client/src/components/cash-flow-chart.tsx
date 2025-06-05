import { useEffect, useRef } from 'react';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { ComparisonData } from '@/types/deal-types';

Chart.register(...registerables);

interface CashFlowChartProps {
  comparisons: ComparisonData[];
  viewType: 'yearly' | 'cumulative';
  className?: string;
}

export default function CashFlowChart({ comparisons, viewType, className = '' }: CashFlowChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || comparisons.length === 0) return;

    // Destroy existing chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Get the maximum term length from all comparisons
    const maxTermLength = Math.max(...comparisons.map(c => c.results.cashFlow.length));
    const labels = Array.from({ length: maxTermLength }, (_, i) => `Year ${i + 1}`);

    const datasets = comparisons.map(comparison => {
      const data = Array(maxTermLength).fill(0);
      
      comparison.results.cashFlow.forEach((row, index) => {
        if (index < maxTermLength) {
          data[index] = viewType === 'yearly' ? row.netCashFlow : row.cumulative;
        }
      });

      return {
        label: comparison.label,
        data,
        backgroundColor: comparison.color + '20', // Add transparency
        borderColor: comparison.color,
        borderWidth: 2,
        tension: 0.1,
        fill: false,
        pointBackgroundColor: comparison.color,
        pointBorderColor: comparison.color,
        pointRadius: 4,
        pointHoverRadius: 6
      };
    });

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: 'white',
            bodyColor: 'white',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            cornerRadius: 8,
            callbacks: {
              label: function(context) {
                const value = context.parsed.y;
                return `${context.dataset.label}: $${value.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#6B7280'
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(107, 114, 128, 0.1)'
            },
            ticks: {
              color: '#6B7280',
              callback: function(value) {
                if (typeof value === 'number') {
                  return '$' + value.toLocaleString();
                }
                return value;
              }
            }
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      }
    };

    chartRef.current = new Chart(ctx, config);

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [comparisons, viewType]);

  return (
    <div className={`relative ${className}`}>
      <canvas 
        ref={canvasRef} 
        id="comparison-chart"
        className="w-full h-full"
      />
    </div>
  );
}
