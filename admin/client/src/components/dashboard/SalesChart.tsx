import { FC, useEffect, useRef } from 'react';
import { ChartData } from '@/lib/types';
import Chart from 'chart.js/auto';

interface SalesChartProps {
  data: ChartData;
}

const SalesChart: FC<SalesChartProps> = ({ data }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Destroy existing chart instance if it exists
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Add gradient backgrounds
        const blueGradient = ctx.createLinearGradient(0, 0, 0, 400);
        blueGradient.addColorStop(0, 'rgba(56, 189, 248, 0.5)');
        blueGradient.addColorStop(1, 'rgba(56, 189, 248, 0.1)');
        
        const tealGradient = ctx.createLinearGradient(0, 0, 0, 400);
        tealGradient.addColorStop(0, 'rgba(45, 212, 191, 0.5)');
        tealGradient.addColorStop(1, 'rgba(45, 212, 191, 0.1)');

        // Override dataset backgrounds with gradients
        const enhancedDatasets = data.datasets.map((dataset, index) => ({
          ...dataset,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 8,
          tension: 0.4,
          borderColor: index === 0 ? '#38BDF8' : '#2DD4BF',
          backgroundColor: index === 0 ? blueGradient : tealGradient,
          fill: true,
        }));

        chartInstance.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: data.labels,
            datasets: enhancedDatasets
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
              duration: 2000,
              easing: 'easeOutQuart'
            },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  color: '#7DD3FC',
                  font: {
                    family: 'Vazirmatn',
                    weight: 'bold'
                  },
                  padding: 20,
                  usePointStyle: true,
                  pointStyle: 'circle'
                }
              },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleColor: '#ffffff',
                bodyColor: '#ffffff',
                borderColor: 'rgba(56, 189, 248, 0.2)',
                borderWidth: 1,
                bodyFont: {
                  family: 'Vazirmatn'
                },
                titleFont: {
                  family: 'Vazirmatn',
                  weight: 'bold'
                },
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': ' + context.parsed.y + ' میلیون تومان';
                  }
                }
              }
            },
            scales: {
              x: {
                ticks: {
                  color: '#7DD3FC',
                  font: {
                    family: 'Vazirmatn'
                  }
                },
                grid: {
                  color: 'rgba(56, 189, 248, 0.1)',
                  borderDash: [5, 5]
                }
              },
              y: {
                beginAtZero: true,
                ticks: {
                  color: '#7DD3FC',
                  callback: function(value) {
                    return value + ' م';
                  }
                },
                grid: {
                  color: 'rgba(56, 189, 248, 0.1)',
                  borderDash: [5, 5]
                }
              }
            }
          }
        });
      }
    }

    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="h-80 p-2">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default SalesChart;
