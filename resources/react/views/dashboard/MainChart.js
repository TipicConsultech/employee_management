import React, { useEffect, useRef } from 'react';
import { CChartBar } from '@coreui/react-chartjs';
import { getStyle } from '@coreui/utils';

const MainChart = (props) => {
  const chartRef = useRef(null);

  const getBarColor = (value) => {
    return value < 0 ? getStyle('--cui-danger') : getStyle('--cui-success'); // 'red' for negative values, green for positive
  };

  const labelName = (value) => {
    return value < 0 ? "Loss" : "Profit";
  };

  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (chartRef.current) {
        setTimeout(() => {
          chartRef.current.options.scales.x.grid.borderColor = getStyle(
            '--cui-border-color-translucent',
          );
          chartRef.current.options.scales.x.grid.color = getStyle('--cui-border-color-translucent');
          chartRef.current.options.scales.x.ticks.color = getStyle('--cui-body-color');
          chartRef.current.options.scales.y.grid.borderColor = getStyle(
            '--cui-border-color-translucent',
          );
          chartRef.current.options.scales.y.grid.color = getStyle('--cui-border-color-translucent');
          chartRef.current.options.scales.y.ticks.color = getStyle('--cui-body-color');
          chartRef.current.update();
        });
      }
    });
  }, [chartRef]);

  // Indian financial year months (April - March)
  const financialYearMonths = [
    'April', 'May', 'June', 'July', 'August', 'September', 
    'October', 'November', 'December', 'January', 'February', 'March'
  ];

  // Determine the current financial year dynamically
  const getCurrentFinancialYear = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0-based (0 = January, 3 = April)
    const currentYear = currentDate.getFullYear();
    
    // If we're in January to March (0, 1, 2), we're in the previous year's financial year
    // If we're in April to December (3-11), we're in the current year's financial year
    const financialYearStart = currentMonth < 3 ? currentYear - 1 : currentYear;
    const financialYearEnd = financialYearStart + 1;
    
    return { start: financialYearStart, end: financialYearEnd };
  };
  
  const { start: financialYearStart, end: financialYearEnd } = getCurrentFinancialYear();
  
  // Create labels with appropriate years for each month in the financial year
  const monthsWithYear = financialYearMonths.map((month, index) => {
    // For April-December, use start year; for January-March, use end year
    const year = index > 8 ? financialYearEnd : financialYearStart;
    return `${month} ${year}`;
  });

  // Get the data values from props or use empty array if not provided
  let calendarYearData = props.monthlyPandL || Array(12).fill(0);
  
  // IMPORTANT: Convert from calendar year (Jan[0]-Dec[11]) to financial year (Apr[0]-Mar[11])
  // For Indian FY, we need to take elements at positions 3,4,5,6,7,8,9,10,11,0,1,2
  const financialYearData = [
    // April (index 3) to December (index 11)
    ...calendarYearData.slice(3, 12),
    // January (index 0) to March (index 2) 
    ...calendarYearData.slice(0, 3)
  ];

  const labelProfitOrLoss = labelName(financialYearData[0] || 0);

  // Calculate the max value for Y-axis dynamically
  let maxValue = Math.max(...financialYearData.map(value => Math.abs(value))) + 10000;
  // Ensure we have a minimum scale even with no data
  maxValue = maxValue > 10000 ? maxValue : 50000;

  return (
    <>
      <CChartBar
        ref={chartRef}
        style={{ height: '300px', marginTop: '40px' }}
        data={{
          labels: monthsWithYear,
          datasets: [
            {
              label: labelProfitOrLoss,
              backgroundColor: financialYearData.map(value => getBarColor(value)),
              borderColor: financialYearData.map(value => getBarColor(value)),
              pointHoverBackgroundColor: getStyle('--cui-info'),
              borderWidth: 2,
              data: financialYearData,
              fill: true,
            },
          ],
        }}
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  const value = context.raw;
                  const label = labelName(value);
                  return `${label}: ${value}`;
                },
              },
            },
            datalabels: {
              color: 'white',
              display: true,
              formatter: (value) => value !== 0 ? value : '',
            },
          },
          scales: {
            x: {
              grid: {
                color: getStyle('--cui-border-color-translucent'),
                drawOnChartArea: false,
              },
              ticks: {
                color: getStyle('--cui-body-color'),
              },
            },
            y: {
              beginAtZero: true,
              border: {
                color: getStyle('--cui-border-color-translucent'),
              },
              grid: {
                color: getStyle('--cui-border-color-translucent'),
              },
              max: maxValue,
              ticks: {
                color: getStyle('--cui-body-color'),
                maxTicksLimit: 5,
                stepSize: Math.ceil(maxValue / 5),
              },
            },
          },
          elements: {
            line: {
              tension: 0.4,
            },
            point: {
              radius: 0,
              hitRadius: 10,
              hoverRadius: 4,
              hoverBorderWidth: 3,
            },
          },
        }}
      />
    </>
  );
};

export default MainChart;