// import { CButton, CFormSelect, CTabs, CTabList, CTabPanel, CTabContent, CTab, CFormInput } from '@coreui/react';
// import React, { useState, useCallback, useEffect } from 'react';
// import { Year, Custom, Months, Quarter, Week } from './Dates';
// import { getAPICall } from '../../../util/api';
// import All_Tables from './AllTables';
// import { Button, Dropdown } from '/resources/react/views/pages/report/ButtonDropdowns';
// import { MantineProvider } from '@mantine/core';
// import { useToast } from '../../common/toast/ToastContext';

// function All_Reports() {
//   const [selectedOption, setSelectedOption] = useState('3');
//   const [stateCustom, setStateCustom] = useState({ start_date: '', end_date: '' });
//   const [stateMonth, setStateMonth] = useState({ start_date: '', end_date: '' });
//   const [stateQuarter, setStateQuarter] = useState({ start_date: '', end_date: '' });
//   const [stateYear, setStateYear] = useState({ start_date: '', end_date: '' });
//   const [activeTab1, setActiveTab] = useState('Year');
//   const [stateWeek, setStateWeek] = useState({ start_date: '', end_date: '' });
//   const { showToast } = useToast();

//   const ReportOptions = [
//     { label: 'Sales', value: '1' },
//     { label: 'Expense', value: '2' },
//     { label: 'Profit & Loss', value: '3' },
//   ];

//   //for Sales Report
//   const [salesData, setSalesData] = useState({
//     data: [],
//     totalSales: 0,
//     totalPaid: 0,
//     totalRemaining: 0
//   });

//   //for Expence Report
//   const [expenseData, setExpenseData] = useState({
//     data: [],
//     totalExpense: 0
//   });
//   const [expenseType, setExpenseType] = useState({});

//   //Profit & Loss
//   const [pnlData, setPnLData] = useState({
//     Data: [],
//     totalSales: 0,
//     totalExpenses: 0,
//     totalProfitOrLoss: 0
//   });

//   const handleTabChange = (value) => {
//     setActiveTab(value);
//   };

//   const fetchReportData = async() => {
//     try {
//       let date = {};
//       let rawSalesData = [];
//       let rawExpenseData = [];
//       switch (activeTab1) {
//         case 'Custom':
//           date = stateCustom;
//           break;
//         case 'Month':
//           date = stateMonth;
//           break;
//         case 'Quarter':
//           date = stateQuarter;
//           break;
//         case 'Year':
//           date = stateYear;
//           break;
//         case 'Week':
//           date = stateWeek;
//           break;
//         default:
//           break;
//       }

//       if (!date.start_date || !date.end_date) {
//         alert("Please select dates before fetching data.");
//         return;
//       }
//       if (selectedOption === '1' || selectedOption === '3') {
//         const resp = await getAPICall(
//           '/api/reportSales?startDate=' + date.start_date + '&endDate=' + date.end_date,
//         )
//         if (resp && resp.orders) {
//           // Updated to handle the new response structure
//           const groupedSales = resp.orders.reduce((acc, sale) => {
//             if (!acc[sale.invoiceDate]) {
//               acc[sale.invoiceDate] = {
//                 invoiceDate: sale.invoiceDate,
//                 totalAmount: 0,
//                 paidAmount: 0,
//               }
//             }
//             acc[sale.invoiceDate].totalAmount += sale.totalAmount
//             acc[sale.invoiceDate].paidAmount += sale.paidAmount
//             return acc
//           }, {})

//           const salesArray = Object.values(groupedSales).map(sale => ({
//             ...sale,
//             totalAmount: Math.round(sale.totalAmount),
//             paidAmount: Math.round(sale.paidAmount),
//             remainingAmount: Math.round(sale.totalAmount - sale.paidAmount)
//           }))

//           rawSalesData = [...salesArray];

//           // Use summary data from API if available, otherwise calculate
//           if (resp.summary && resp.summary.sales) {
//             setSalesData((prev) => {
//               return {
//                 ...prev,
//                 data: salesArray,
//                 totalSales: Math.round(resp.summary.sales.totalAmount),
//                 totalPaid: Math.round(resp.summary.sales.totalPaidAmount),
//                 totalRemaining: Math.round(resp.summary.sales.totalRemainingAmount)
//               }
//             })
//           } else {
//             // Fallback to manual calculation
//             const totalSales = salesArray.reduce((acc, current) => acc + current.totalAmount, 0)
//             const totalPaid = salesArray.reduce((acc, current) => acc + current.paidAmount, 0)
//             const totalRemaining = salesArray.reduce((acc, current) => acc + current.remainingAmount, 0)
//             setSalesData((prev) => {
//               return {
//                 ...prev,
//                 data: salesArray,
//                 totalSales: Math.round(totalSales),
//                 totalPaid: Math.round(totalPaid),
//                 totalRemaining: Math.round(totalRemaining)
//               }
//             })
//           }
//         } else {
//           showToast('danger', 'Failed to fetch records');
//         }
//       }

//       if (selectedOption === '2' || selectedOption === '3') {
//         const resp = await getAPICall(
//           '/api/expense?startDate=' + date.start_date + '&endDate=' + date.end_date,
//         )

//         if (resp) {
//           rawExpenseData = [...resp];

//           // Use summary data from API if available, otherwise calculate
//           if (resp.summary && resp.summary.expense) {
//             setExpenseData(prev => {
//               return {
//                 ...prev,
//                 data: resp.data || resp,
//                 totalExpense: Math.round(resp.summary.expense.totalCost)
//               }
//             })
//           } else {
//             const totalExp = resp.reduce((acc, current) => {
//               if (current.show) {
//                 return acc + current.total_price
//               }
//               return acc
//             }, 0)
//             setExpenseData(prev => {
//               return {
//                 ...prev,
//                 data: resp,
//                 totalExpense: Math.round(totalExp)
//               }
//             })
//           }

//           // Grouping expenses by expense_date and summing total_price
//           const groupedExpenses = resp.reduce((acc, expense) => {
//             if (!acc[expense.expense_date]) {
//               acc[expense.expense_date] = {
//                 expense_date: expense.expense_date,
//                 totalExpense: 0,
//               }
//             }
//             acc[expense.expense_date].totalExpense += expense.total_price
//             return acc
//           }, {})

//           const expensesArray = Object.values(groupedExpenses)

//         } else {
//           showToast('danger', 'Failed to fetch records');
//         }
//       }

//       if (selectedOption === '3') {
//         // Check if we have summary data from either of the API calls
//         const salesResp = await getAPICall(
//           '/api/reportSales?startDate=' + date.start_date + '&endDate=' + date.end_date,
//         );

//         if (salesResp && salesResp.summary && salesResp.summary.profitLoss) {
//           // Use summary data from API
//           setPnLData(prev => ({
//             ...prev,
//             Data: calculatePnL(rawExpenseData, rawSalesData),
//             totalSales: Math.round(salesResp.summary.profitLoss.totalSales),
//             totalExpenses: Math.round(salesResp.summary.profitLoss.totalExpenses),
//             totalProfitOrLoss: Math.round(salesResp.summary.profitLoss.totalProfitLoss)
//           }));
//         } else {
//           // Fallback to manual calculation
//           const pnlDataArray = calculatePnL(rawExpenseData, rawSalesData);
//           setPnLData(prev => ({
//             ...prev,
//             Data: pnlDataArray,
//             totalSales: pnlDataArray.reduce((acc, current) => acc + current.totalSales, 0),
//             totalExpenses: pnlDataArray.reduce((acc, current) => acc + current.totalExpenses, 0),
//             totalProfitOrLoss: pnlDataArray.reduce((acc, current) => acc + current.profitOrLoss, 0)
//           }));
//         }
//       }
//     } catch (error) {
//       showToast('danger', 'Error occured ' + error);
//     }
//   };

//   const calculatePnL = (rawExpenseData, rawSalesData) => {
//     try {
//       const combinedData = [...rawExpenseData, ...rawSalesData]
//       const groupedData = combinedData.reduce((acc, entry) => {
//         const date = entry.invoiceDate || entry.expense_date
//         if (!acc[date]) {
//           acc[date] = {
//             date,
//             totalSales: 0,
//             totalExpenses: 0,
//           }
//         }
//         if (entry.totalAmount) {
//           acc[date].totalSales += entry.totalAmount
//         }
//         if (entry.total_price) {
//           acc[date].totalExpenses += entry.total_price;
//         }
//         return acc
//       }, {})

//       // Convert the grouped data into an array and calculate profit or loss
//       const pnlData = Object.values(groupedData).map(data => ({
//         ...data,
//         profitOrLoss: data.totalSales - data.totalExpenses,
//       }));

//       return pnlData;
//     } catch (error) {
//       showToast('danger', error.message);
//       return [];
//     }
//   }

//   // Function to format numbers with commas for Indian currency format (e.g., 1,00,000)
//   const formatIndianCurrency = (num) => {
//     const numStr = Math.abs(num).toString();
//     let formattedNum = '';

//     // For numbers less than 1000
//     if (numStr.length <= 3) {
//       return numStr;
//     }

//     // Process the last 3 digits
//     formattedNum = numStr.slice(-3);
//     let remaining = numStr.slice(0, -3);

//     // Process the rest in groups of 2
//     while (remaining.length > 0) {
//       const chunk = remaining.slice(-2);
//       formattedNum = (chunk ? chunk + ',' : '') + formattedNum;
//       remaining = remaining.slice(0, -2);
//     }

//     return formattedNum;
//   };

//   // Determine profit margin percentage for P&L
//   const calculateProfitMargin = () => {
//     if (!pnlData.totalSales) return 0;
//     return Math.round((pnlData.totalProfitOrLoss / pnlData.totalSales) * 100);
//   };

//   // Determine icon and color based on profit/loss
//   const getProfitLossIcon = () => {
//     return pnlData.totalProfitOrLoss >= 0
//       ? '↑' // Up arrow for profit
//       : '↓'; // Down arrow for loss
//   };

//   const getProfitLossColor = () => {
//     return pnlData.totalProfitOrLoss >= 0
//       ? 'text-success' // Green for profit
//       : 'text-danger';  // Red for loss
//   };

//   // Get arrow icons based on value trend
//   const getArrowIcon = (value) => {
//     return value >= 0 ? '↑' : '↓';
//   };

//   // Get color class based on value trend
//   const getColorClass = (value, inverse = false) => {
//     if (inverse) {
//       return value >= 0 ? 'text-danger' : 'text-success';
//     }
//     return value >= 0 ? 'text-success' : 'text-danger';
//   };

//   // Render summary cards based on selected option
//   const renderSummaryCards = () => {
//     return (
//       <div className="summary-cards mb-4">
//         <div className="row">
//           {/* SALES REPORT - Show all three sales cards */}
//           {selectedOption === '1' && (
//             <>
//               {/* Total Sales Card */}
//               <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
//                 <div className="card h-100 border-0 shadow-sm">
//                   <div className="card-body">
//                     <div className="d-flex align-items-center mb-3">
//                       <div className="icon-container bg-primary-light rounded-circle p-3 me-3">
//                         <span className="text-primary fs-4">📈</span>
//                       </div>
//                       <h5 className="card-title mb-0 text-primary">Total Sales</h5>
//                     </div>
//                     <h2 className="mb-2">₹{formatIndianCurrency(salesData.totalSales)}</h2>
//                     <p className="text-muted">For selected period</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Total Paid Card */}
//               <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
//                 <div className="card h-100 border-0 shadow-sm">
//                   <div className="card-body">
//                     <div className="d-flex align-items-center mb-3">
//                       <div className="icon-container bg-success-light rounded-circle p-3 me-3">
//                         <span className="text-success fs-4">✓</span>
//                       </div>
//                       <h5 className="card-title mb-0 text-success">Paid Amount</h5>
//                     </div>
//                     <h2 className="mb-2 text-success">₹{formatIndianCurrency(salesData.totalPaid)}</h2>
//                     <p className="text-muted">{Math.round((salesData.totalPaid / salesData.totalSales) * 100) || 0}% of total sales</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Total Remaining Card */}
//               <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
//                 <div className="card h-100 border-0 shadow-sm">
//                   <div className="card-body">
//                     <div className="d-flex align-items-center mb-3">
//                       <div className="icon-container bg-warning-light rounded-circle p-3 me-3">
//                         <span className="text-warning fs-4">⏱</span>
//                       </div>
//                       <h5 className="card-title mb-0 text-warning">Remaining Amount</h5>
//                     </div>
//                     <h2 className="mb-2 text-warning">₹{formatIndianCurrency(salesData.totalRemaining)}</h2>
//                     <p className="text-muted">{Math.round((salesData.totalRemaining / salesData.totalSales) * 100) || 0}% of total sales</p>
//                   </div>
//                 </div>
//               </div>
//             </>
//           )}

//           {/* EXPENSE REPORT - Show only expense card */}
//           {selectedOption === '2' && (
//             <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
//               <div className="card h-100 border-0 shadow-sm">
//                 <div className="card-body">
//                   <div className="d-flex align-items-center mb-3">
//                     <div className="icon-container bg-danger-light rounded-circle p-3 me-3">
//                       <span className="text-danger fs-4">↓</span>
//                     </div>
//                     <h5 className="card-title mb-0 text-danger">Total Expenses</h5>
//                   </div>
//                   <h2 className="mb-2">₹{formatIndianCurrency(expenseData.totalExpense)}</h2>
//                   <p className="text-muted">{expenseData.data.length} expense entries</p>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* PROFIT & LOSS REPORT - Show only total sales, total expenses, and net profit */}
//           {selectedOption === '3' && (
//             <>
//               {/* Total Sales Card */}
//               <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
//                 <div className="card h-100 border-0 shadow-sm">
//                   <div className="card-body">
//                     <div className="d-flex align-items-center mb-3">
//                       <div className="icon-container bg-primary-light rounded-circle p-3 me-3">
//                         <span className="text-primary fs-4">📈</span>
//                       </div>
//                       <h5 className="card-title mb-0 text-primary">Total Sales</h5>
//                     </div>
//                     <h2 className="mb-2">₹{formatIndianCurrency(salesData.totalSales)}</h2>
//                     <p className="text-muted">For selected period</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Total Expense Card */}
//               <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
//                 <div className="card h-100 border-0 shadow-sm">
//                   <div className="card-body">
//                     <div className="d-flex align-items-center mb-3">
//                       <div className="icon-container bg-danger-light rounded-circle p-3 me-3">
//                         <span className="text-danger fs-4">↓</span>
//                       </div>
//                       <h5 className="card-title mb-0 text-danger">Total Expenses</h5>
//                     </div>
//                     <h2 className="mb-2">₹{formatIndianCurrency(expenseData.totalExpense)}</h2>
//                     <p className="text-muted">{expenseData.data.length} expense entries</p>
//                   </div>
//                 </div>
//               </div>

//               {/* Net Profit/Loss Card */}
//               <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
//                 <div className="card h-100 border-0 shadow-sm">
//                   <div className="card-body">
//                     <div className="d-flex align-items-center mb-3">
//                       <div className={`icon-container rounded-circle p-3 me-3 bg-${pnlData.totalProfitOrLoss >= 0 ? 'success' : 'danger'}-light`}>
//                         <span className={`fs-4 ${getProfitLossColor()}`}>{getProfitLossIcon()}</span>
//                       </div>
//                       <h5 className={`card-title mb-0 ${getProfitLossColor()}`}>
//                         {pnlData.totalProfitOrLoss >= 0 ? 'Net Profit' : 'Net Loss'}
//                       </h5>
//                     </div>
//                     <h2 className={`mb-2 ${getProfitLossColor()}`}>₹{formatIndianCurrency(Math.abs(pnlData.totalProfitOrLoss))}</h2>
//                     <p className="text-muted">{calculateProfitMargin()}% profit margin</p>
//                   </div>
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <>
//       <MantineProvider withGlobalStyles withNormalizeCSS>
//         <div className="responsive-container">
//           <CTabs activeItemKey={activeTab1} onChange={handleTabChange}>
//             <CTabList variant="tabs" className="flex-wrap">
//               <CTab itemKey="Year">Year</CTab>
//               <CTab itemKey="Quarter">Quarter</CTab>
//               <CTab itemKey="Month">Month</CTab>
//               <CTab itemKey="Week">Week</CTab>
//               <CTab itemKey="Custom" default>Custom</CTab>
//             </CTabList>
//             <CTabContent>
//               {/* Custom Tab */}
//               <CTabPanel className="p-3" itemKey="Custom">
//                 {/* For larger screens (original layout) */}
//                 <div className="d-none d-md-flex mb-3 justify-content-between">
//                   <div className="d-flex mx-1">
//                     <Custom setStateCustom={setStateCustom} />
//                     <div className="flex-fill mx-2 mt-1 col-sm-3">
//                       <h1></h1>
//                       <br/>
//                       <Dropdown
//                         setSelectedOption={setSelectedOption}
//                         ReportOptions={ReportOptions}
//                         selectedOption={selectedOption}
//                         className="larger-dropdown"
//                       />
//                     </div>
//                   </div>
//                   <div className="flex-fill px-0 mt-1">
//                     <h1></h1>
//                     <br/>
//                     <Button fetchReportData={fetchReportData} />
//                   </div>
//                 </div>

//                 {/* For smaller screens (mobile-friendly layout) */}
//                 <div className="d-md-none mb-3">
//                   <div className="row gy-3">
//                     <div className="col-12">
//                       <Custom setStateCustom={setStateCustom} />
//                     </div>
//                     <div className="col-6">
//                       <Dropdown
//                         setSelectedOption={setSelectedOption}
//                         ReportOptions={ReportOptions}
//                         selectedOption={selectedOption}
//                       />
//                     </div>
//                     <div className="col-6 d-flex justify-content-start">
//                       <Button fetchReportData={fetchReportData} />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Summary Cards Section */}
//                 {(salesData.data.length > 0 || expenseData.data.length > 0) && renderSummaryCards()}

//                 <div className="mt-3">
//                   <All_Tables
//                     selectedOption={selectedOption}
//                     salesData={salesData}
//                     expenseData={expenseData}
//                     pnlData={pnlData}
//                     expenseType={expenseType}
//                   />
//                 </div>
//               </CTabPanel>

//               {/* Week Tab */}
//               <CTabPanel className="p-3" itemKey="Week">
//                 {/* For larger screens (original layout) */}
//                 <div className="d-none d-md-flex mb-3 m">
//                   <Week setStateWeek={setStateWeek}/>
//                   <div className='mx-1'>
//                     <Dropdown
//                       setSelectedOption={setSelectedOption}
//                       ReportOptions={ReportOptions}
//                       selectedOption={selectedOption}
//                     />
//                   </div>
//                   <div className='mx-1'>
//                     <Button fetchReportData={fetchReportData}/>
//                   </div>
//                 </div>

//                 {/* For smaller screens (mobile-friendly layout) */}
//                 <div className="d-md-none mb-3">
//                   <div className="row gy-3">
//                     <div className="col-12">
//                       <Week setStateWeek={setStateWeek} />
//                     </div>
//                     <div className="col-6">
//                       <Dropdown
//                         setSelectedOption={setSelectedOption}
//                         ReportOptions={ReportOptions}
//                         selectedOption={selectedOption}
//                       />
//                     </div>
//                     <div className="col-6 d-flex justify-content-start">
//                       <Button fetchReportData={fetchReportData} />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Summary Cards Section */}
//                 {(salesData.data.length > 0 || expenseData.data.length > 0) && renderSummaryCards()}

//                 <div className="mt-3">
//                   <All_Tables
//                     selectedOption={selectedOption}
//                     salesData={salesData}
//                     expenseData={expenseData}
//                     pnlData={pnlData}
//                     expenseType={expenseType}
//                   />
//                 </div>
//               </CTabPanel>

//               {/* Month Tab */}
//               <CTabPanel className="p-3" itemKey="Month">
//                 {/* For larger screens (original layout) */}
//                 <div className="d-none d-md-flex mb-3 justify-content-between">
//                   <div className="flex-fill mx-1">
//                     <Months setStateMonth={setStateMonth} />
//                   </div>
//                   <div className="flex-fill mx-1">
//                     <Dropdown
//                       setSelectedOption={setSelectedOption}
//                       ReportOptions={ReportOptions}
//                       selectedOption={selectedOption}
//                     />
//                   </div>
//                   <div className="flex-fill mx-1">
//                     <Button fetchReportData={fetchReportData} />
//                   </div>
//                 </div>

//                 {/* For smaller screens (mobile-friendly layout) */}
//                 <div className="d-md-none mb-3">
//                   <div className="row gy-3">
//                     <div className="col-12">
//                       <Months setStateMonth={setStateMonth} />
//                     </div>
//                     <div className="col-6">
//                       <Dropdown
//                         setSelectedOption={setSelectedOption}
//                         ReportOptions={ReportOptions}
//                         selectedOption={selectedOption}
//                       />
//                     </div>
//                     <div className="col-6 d-flex justify-content-start">
//                       <Button fetchReportData={fetchReportData} />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Summary Cards Section */}
//                 {(salesData.data.length > 0 || expenseData.data.length > 0) && renderSummaryCards()}

//                 <div className="mt-3">
//                   <All_Tables
//                     selectedOption={selectedOption}
//                     salesData={salesData}
//                     expenseData={expenseData}
//                     pnlData={pnlData}
//                     expenseType={expenseType}
//                   />
//                 </div>
//               </CTabPanel>

//               {/* Quarter Tab */}
//               <CTabPanel className="p-3" itemKey="Quarter">
//                 {/* For larger screens (original layout) */}
//                 <div className="d-none d-md-flex mb-3 col-md-10">
//                   <Quarter setStateQuarter={setStateQuarter} />
//                   <Dropdown
//                     setSelectedOption={setSelectedOption}
//                     ReportOptions={ReportOptions}
//                     selectedOption={selectedOption}
//                   />
//                   <div className='px-2'>
//                     <Button fetchReportData={fetchReportData}/>
//                   </div>
//                 </div>

//                 {/* For smaller screens (mobile-friendly layout) */}
//                 <div className="d-md-none mb-3">
//                   <div className="row gy-3">
//                     <div className="col-12">
//                       <Quarter setStateQuarter={setStateQuarter} />
//                     </div>
//                     <div className="col-6">
//                       <Dropdown
//                         setSelectedOption={setSelectedOption}
//                         ReportOptions={ReportOptions}
//                         selectedOption={selectedOption}
//                       />
//                     </div>
//                     <div className="col-6 d-flex justify-content-start">
//                       <Button fetchReportData={fetchReportData} />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Summary Cards Section */}
//                 {(salesData.data.length > 0 || expenseData.data.length > 0) && renderSummaryCards()}

//                 <div className="mt-3">
//                   <All_Tables
//                     selectedOption={selectedOption}
//                     salesData={salesData}
//                     expenseData={expenseData}
//                     pnlData={pnlData}
//                     expenseType={expenseType}
//                   />
//                 </div>
//               </CTabPanel>

//               {/* Year Tab */}
//               <CTabPanel className="p-3" itemKey="Year">
//                 {/* For larger screens (original layout) */}
//                 <div className="d-none d-md-flex mb-3 m">
//                   <Year setStateYear={setStateYear} />
//                   <div className='mx-1 mt-2'>
//                     <Dropdown
//                       setSelectedOption={setSelectedOption}
//                       ReportOptions={ReportOptions}
//                       selectedOption={selectedOption}
//                     />
//                   </div>
//                   <div className='mx-1 mt-2'>
//                     <Button fetchReportData={fetchReportData}/>
//                   </div>
//                 </div>

//                 {/* For smaller screens (mobile-friendly layout) */}
//                 <div className="d-md-none mb-3">
//                   <div className="row gy-3">
//                     <div className="col-12">
//                       <Year setStateYear={setStateYear} />
//                     </div>
//                     <div className="col-6">
//                       <Dropdown
//                         setSelectedOption={setSelectedOption}
//                         ReportOptions={ReportOptions}
//                         selectedOption={selectedOption}
//                       />
//                     </div>
//                     <div className="col-6 d-flex justify-content-start">
//                       <Button fetchReportData={fetchReportData} />
//                     </div>
//                   </div>
//                 </div>

//                 {/* Summary Cards Section */}
//                 {(salesData.data.length > 0 || expenseData.data.length > 0) && renderSummaryCards()}

//                 <div className="mt-3">
//                   <All_Tables
//                     selectedOption={selectedOption}
//                     salesData={salesData}
//                     expenseData={expenseData}
//                     pnlData={pnlData}
//                     expenseType={expenseType}
//                   />
//                 </div>
//               </CTabPanel>
//             </CTabContent>
//           </CTabs>
//         </div>
//       </MantineProvider>

//       {/* Add responsive styles */}
//       <style jsx>{`
//         .responsive-container {
//           width: 100%;
//           max-width: 100%;
//           overflow-x: hidden;
//         }

//         @media (max-width: 768px) {
//           .responsive-container {
//             padding: 0 5px;
//           }
//         }

//         /* Larger dropdown styling */
//         :global(.larger-dropdown select) {
//           min-width: 200px !important;
//           font-size: 1.1rem !important;
//           height: auto !important;
//           padding: 8px 12px !important;
//         }

//         /* For the button itself to be larger */
//         :global(.larger-dropdown .dropdown-toggle) {
//           min-width: 200px !important;
//           font-size: 1.1rem !important;
//           padding: 8px 12px !important;
//         }

//         /* For dropdown menu items to be larger */
//         :global(.larger-dropdown .dropdown-menu .dropdown-item) {
//           font-size: 1.1rem !important;
//           padding: 8px 12px !important;
//         }

//         /* Summary Cards Styling */
//         .summary-cards .card {
//           border-radius: 12px;
//           transition: transform 0.3s ease;
//         }

//         .summary-cards .card:hover {
//           transform: translateY(-5px);
//         }

//         .bg-primary-light {
//           background-color: rgba(13, 110, 253, 0.1);
//         }

//         .bg-danger-light {
//           background-color: rgba(220, 53, 69, 0.1);
//         }

//         .bg-success-light {
//           background-color: rgba(25, 135, 84, 0.1);
//         }

//         .bg-warning-light {
//           background-color: rgba(255, 193, 7, 0.1);
//         }

//         .icon-container {
//           width: 24px;
//           height: 24px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//         }
//       `}</style>
//     </>
//   );
// }

// export default All_Reports;
// //-------------------------------------------------------------------------

// // import { CButton, CFormSelect, CTabs, CTabList, CTabPanel, CTabContent, CTab, CFormInput } from '@coreui/react';
// // import React, { useState, useCallback, useEffect } from 'react';
// // import { Year, Custom, Months, Quarter, Week } from './Dates';
// // import { getAPICall } from '../../../util/api';
// // import All_Tables from './AllTables';
// // import { Button, Dropdown } from '/resources/react/views/pages/report/ButtonDropdowns';
// // // Add this line if ButtonDropdowns.js needs to be modified to accept className prop
// // // If modification isn't possible, we'll use the global CSS approach
// // import { MantineProvider } from '@mantine/core';
// // import { useToast } from '../../common/toast/ToastContext';

// // function All_Reports() {
// //   const [selectedOption, setSelectedOption] = useState('3');
// //   const [stateCustom, setStateCustom] = useState({ start_date: '', end_date: '' });
// //   const [stateMonth, setStateMonth] = useState({ start_date: '', end_date: '' });
// //   const [stateQuarter, setStateQuarter] = useState({ start_date: '', end_date: '' });
// //   const [stateYear, setStateYear] = useState({ start_date: '', end_date: '' });
// //   const [activeTab1, setActiveTab] = useState('Year');
// //   const [stateWeek, setStateWeek] = useState({ start_date: '', end_date: '' });
// //   const { showToast } = useToast();

// //   const ReportOptions = [
// //     { label: 'Sales', value: '1' },
// //     { label: 'Expense', value: '2' },
// //     { label: 'Profit & Loss', value: '3' },
// //   ];

// //   //for Sales Report
// //   const [salesData, setSalesData] = useState({
// //     data: [],
// //     totalSales: 0,
// //     totalPaid: 0,
// //     totalRemaining: 0
// //   });

// //   //for Expence Report
// //   const [expenseData, setExpenseData] = useState({
// //     data: [],
// //     totalExpense: 0
// //   });
// //   const [expenseType, setExpenseType] = useState({});

// //   //Profit & Loss
// //   const [pnlData, setPnLData] = useState({
// //     Data: [],
// //     totalSales: 0,
// //     totalExpenses: 0,
// //     totalProfitOrLoss: 0
// //   });

// //   const handleTabChange = (value) => {
// //     setActiveTab(value);
// //   };

// //   const fetchReportData = async() => {
// //     try {
// //       let date = {};
// //       let rawSalesData = [];
// //       let rawExpenseData = [];
// //       switch (activeTab1) {
// //         case 'Custom':
// //           date = stateCustom;
// //           break;
// //         case 'Month':
// //           date = stateMonth;
// //           break;
// //         case 'Quarter':
// //           date = stateQuarter;
// //           break;
// //         case 'Year':
// //           date = stateYear;
// //           break;
// //         case 'Week':
// //           date = stateWeek;
// //           break;
// //         default:
// //           break;
// //       }

// //       if (!date.start_date || !date.end_date) {
// //         alert("Please select dates before fetching data.");
// //         return;
// //       }
// //       if (selectedOption === '1' || selectedOption === '3') {
// //         const resp = await getAPICall(
// //           '/api/reportSales?startDate=' + date.start_date + '&endDate=' + date.end_date,
// //         )
// //         if (resp) {
// //           const groupedSales = resp.reduce((acc, sale) => {
// //             if (!acc[sale.invoiceDate]) {
// //               acc[sale.invoiceDate] = {
// //                 invoiceDate: sale.invoiceDate,
// //                 totalAmount: 0,
// //                 paidAmount: 0,
// //               }
// //             }
// //             acc[sale.invoiceDate].totalAmount += sale.totalAmount
// //             acc[sale.invoiceDate].paidAmount += sale.paidAmount
// //             return acc
// //           }, {})

// //           const salesArray = Object.values(groupedSales).map(sale => ({
// //             ...sale,
// //             totalAmount: Math.round(sale.totalAmount),
// //             paidAmount: Math.round(sale.paidAmount),
// //             remainingAmount: Math.round(sale.totalAmount - sale.paidAmount)
// //           }))

// //           //TODO: Samir to fix this raw sales data mapping
// //           rawSalesData = [...salesArray];
// //           const totalSales = salesArray.reduce((acc, current) => acc + current.totalAmount, 0)
// //           const totalPaid = salesArray.reduce((acc, current) => acc + current.paidAmount, 0)
// //           const totalRemaining = salesArray.reduce((acc, current) => acc + current.remainingAmount, 0)
// //           setSalesData((prev) => {
// //             return {
// //               ...prev,
// //               data: salesArray,
// //               totalSales: Math.round(totalSales),
// //               totalPaid: Math.round(totalPaid),
// //               totalRemaining: Math.round(totalRemaining)
// //             }
// //           })

// //         } else {
// //           showToast('danger', 'Failed to fetch records');
// //         }
// //       }

// //       if (selectedOption === '2' || selectedOption === '3') {
// //         const resp = await getAPICall(
// //           '/api/expense?startDate=' + date.start_date + '&endDate=' + date.end_date,
// //         )

// //         if (resp) {
// //           rawExpenseData = [...resp];
// //           const totalExp = resp.reduce((acc, current) => {
// //             if (current.show) {
// //               return acc + current.total_price
// //             }
// //             return acc
// //           }, 0)
// //           setExpenseData(prev => {
// //             return {
// //               ...prev,
// //               data: resp,
// //               totalExpense: Math.round(totalExp)
// //             }
// //           })

// //           // Grouping expenses by expense_date and summing total_price
// //           const groupedExpenses = resp.reduce((acc, expense) => {
// //             if (!acc[expense.expense_date]) {
// //               acc[expense.expense_date] = {
// //                 expense_date: expense.expense_date,
// //                 totalExpense: 0,
// //               }
// //             }
// //             acc[expense.expense_date].totalExpense += expense.total_price
// //             return acc
// //           }, {})

// //           const expensesArray = Object.values(groupedExpenses)

// //         } else {
// //           showToast('danger', 'Failed to fetch records');
// //         }
// //       }

// //       if (selectedOption === '3') {
// //         calculatePnL(rawExpenseData, rawSalesData);
// //       }
// //     } catch (error) {
// //       showToast('danger', 'Error occured ' + error);
// //     }
// //   };

// //   const calculatePnL = (rawExpenseData, rawSalesData) => {
// //     try {
// //       const combinedData = [...rawExpenseData, ...rawSalesData]
// //       const groupedData = combinedData.reduce((acc, entry) => {
// //         const date = entry.invoiceDate || entry.expense_date
// //         if (!acc[date]) {
// //           acc[date] = {
// //             date,
// //             totalSales: 0,
// //             totalExpenses: 0,
// //           }
// //         }
// //         if (entry.totalAmount) {
// //           acc[date].totalSales += entry.totalAmount
// //         }
// //         if (entry.total_price) {
// //           acc[date].totalExpenses += entry.total_price;
// //         }
// //         return acc
// //       }, {})

// //       // Convert the grouped data into an array and calculate profit or loss
// //       const pnlData = Object.values(groupedData).map(data => ({
// //         ...data,
// //         profitOrLoss: data.totalSales - data.totalExpenses,
// //       }));

// //       // Calculate total sales, expenses, and profit/loss
// //       const totalSales = pnlData.reduce((acc, current) => acc + current.totalSales, 0);
// //       const totalExpenses = pnlData.reduce((acc, current) => acc + current.totalExpenses, 0);
// //       const totalProfitOrLoss = pnlData.reduce((acc, current) => acc + current.profitOrLoss, 0);

// //       // Set the PnL data
// //       setPnLData(prev => ({
// //         ...prev,
// //         Data: pnlData,
// //         totalSales: totalSales,
// //         totalExpenses: totalExpenses,
// //         totalProfitOrLoss: totalProfitOrLoss,
// //       }));
// //     } catch (error) {
// //       showToast('danger', error.message);
// //     }
// //   }

// //   return (
// //     <>
// //       <MantineProvider withGlobalStyles withNormalizeCSS>
// //         <div className="responsive-container">
// //           <CTabs activeItemKey={activeTab1} onChange={handleTabChange}>
// //             <CTabList variant="tabs" className="flex-wrap">
// //               <CTab itemKey="Year">Year</CTab>
// //               <CTab itemKey="Quarter">Quarter</CTab>
// //               <CTab itemKey="Month">Month</CTab>
// //               <CTab itemKey="Week">Week</CTab>
// //               <CTab itemKey="Custom" default>Custom</CTab>
// //             </CTabList>
// //             <CTabContent>
// //               {/* Custom Tab */}
// //               <CTabPanel className="p-3" itemKey="Custom">
// //                 {/* For larger screens (original layout) */}
// //                 <div className="d-none d-md-flex mb-3 justify-content-between">
// //                   <div className="d-flex mx-1">
// //                     <Custom setStateCustom={setStateCustom} />
// //                     <div className="flex-fill mx-2 mt-1 col-sm-3">
// //                       <h1></h1>
// //                       <br/>
// //                       <Dropdown
// //                         setSelectedOption={setSelectedOption}
// //                         ReportOptions={ReportOptions}
// //                         selectedOption={selectedOption}
// //                         className="larger-dropdown"
// //                       />
// //                     </div>
// //                   </div>
// //                   <div className="flex-fill px-0 mt-1">
// //                     <h1></h1>
// //                     <br/>
// //                     <Button fetchReportData={fetchReportData} />
// //                   </div>
// //                 </div>

// //                 {/* For smaller screens (mobile-friendly layout) */}
// //                 <div className="d-md-none mb-3">
// //                   <div className="row gy-3">
// //                     <div className="col-12">
// //                       <Custom setStateCustom={setStateCustom} />
// //                     </div>
// //                     <div className="col-6">
// //                       <Dropdown
// //                         setSelectedOption={setSelectedOption}
// //                         ReportOptions={ReportOptions}
// //                         selectedOption={selectedOption}
// //                       />
// //                     </div>
// //                     <div className="col-6 d-flex justify-content-start">
// //                       <Button fetchReportData={fetchReportData} />
// //                     </div>
// //                   </div>
// //                 </div>

// //                 <div className="mt-3">
// //                   <All_Tables
// //                     selectedOption={selectedOption}
// //                     salesData={salesData}
// //                     expenseData={expenseData}
// //                     pnlData={pnlData}
// //                     expenseType={expenseType}
// //                   />
// //                 </div>
// //               </CTabPanel>

// //               {/* Week Tab */}
// //               <CTabPanel className="p-3" itemKey="Week">
// //                 {/* For larger screens (original layout) */}
// //                 <div className="d-none d-md-flex mb-3 m">
// //                   <Week setStateWeek={setStateWeek}/>
// //                   <div className='mx-1'>
// //                     <Dropdown
// //                       setSelectedOption={setSelectedOption}
// //                       ReportOptions={ReportOptions}
// //                       selectedOption={selectedOption}
// //                     />
// //                   </div>
// //                   <div className='mx-1'>
// //                     <Button fetchReportData={fetchReportData}/>
// //                   </div>
// //                 </div>

// //                 {/* For smaller screens (mobile-friendly layout) */}
// //                 <div className="d-md-none mb-3">
// //                   <div className="row gy-3">
// //                     <div className="col-12">
// //                       <Week setStateWeek={setStateWeek} />
// //                     </div>
// //                     <div className="col-6">
// //                       <Dropdown
// //                         setSelectedOption={setSelectedOption}
// //                         ReportOptions={ReportOptions}
// //                         selectedOption={selectedOption}
// //                       />
// //                     </div>
// //                     <div className="col-6 d-flex justify-content-start">
// //                       <Button fetchReportData={fetchReportData} />
// //                     </div>
// //                   </div>
// //                 </div>

// //                 <div className="mt-3">
// //                   <All_Tables
// //                     selectedOption={selectedOption}
// //                     salesData={salesData}
// //                     expenseData={expenseData}
// //                     pnlData={pnlData}
// //                     expenseType={expenseType}
// //                   />
// //                 </div>
// //               </CTabPanel>

// //               {/* Month Tab */}
// //               <CTabPanel className="p-3" itemKey="Month">
// //                 {/* For larger screens (original layout) */}
// //                 <div className="d-none d-md-flex mb-3 justify-content-between">
// //                   <div className="flex-fill mx-1">
// //                     <Months setStateMonth={setStateMonth} />
// //                   </div>
// //                   <div className="flex-fill mx-1">
// //                     <Dropdown
// //                       setSelectedOption={setSelectedOption}
// //                       ReportOptions={ReportOptions}
// //                       selectedOption={selectedOption}
// //                     />
// //                   </div>
// //                   <div className="flex-fill mx-1">
// //                     <Button fetchReportData={fetchReportData} />
// //                   </div>
// //                 </div>

// //                 {/* For smaller screens (mobile-friendly layout) */}
// //                 <div className="d-md-none mb-3">
// //                   <div className="row gy-3">
// //                     <div className="col-12">
// //                       <Months setStateMonth={setStateMonth} />
// //                     </div>
// //                     <div className="col-6">
// //                       <Dropdown
// //                         setSelectedOption={setSelectedOption}
// //                         ReportOptions={ReportOptions}
// //                         selectedOption={selectedOption}
// //                       />
// //                     </div>
// //                     <div className="col-6 d-flex justify-content-start">
// //                       <Button fetchReportData={fetchReportData} />
// //                     </div>
// //                   </div>
// //                 </div>

// //                 <div className="mt-3">
// //                   <All_Tables
// //                     selectedOption={selectedOption}
// //                     salesData={salesData}
// //                     expenseData={expenseData}
// //                     pnlData={pnlData}
// //                     expenseType={expenseType}
// //                   />
// //                 </div>
// //               </CTabPanel>

// //               {/* Quarter Tab */}
// //               <CTabPanel className="p-3" itemKey="Quarter">
// //                 {/* For larger screens (original layout) */}
// //                 <div className="d-none d-md-flex mb-3 col-md-10">
// //                   <Quarter setStateQuarter={setStateQuarter} />
// //                   <Dropdown
// //                     setSelectedOption={setSelectedOption}
// //                     ReportOptions={ReportOptions}
// //                     selectedOption={selectedOption}
// //                   />
// //                   <div className='px-2'>
// //                     <Button fetchReportData={fetchReportData}/>
// //                   </div>
// //                 </div>

// //                 {/* For smaller screens (mobile-friendly layout) */}
// //                 <div className="d-md-none mb-3">
// //                   <div className="row gy-3">
// //                     <div className="col-12">
// //                       <Quarter setStateQuarter={setStateQuarter} />
// //                     </div>
// //                     <div className="col-6">
// //                       <Dropdown
// //                         setSelectedOption={setSelectedOption}
// //                         ReportOptions={ReportOptions}
// //                         selectedOption={selectedOption}
// //                       />
// //                     </div>
// //                     <div className="col-6 d-flex justify-content-start">
// //                       <Button fetchReportData={fetchReportData} />
// //                     </div>
// //                   </div>
// //                 </div>

// //                 <div className="mt-3">
// //                   <All_Tables
// //                     selectedOption={selectedOption}
// //                     salesData={salesData}
// //                     expenseData={expenseData}
// //                     pnlData={pnlData}
// //                     expenseType={expenseType}
// //                   />
// //                 </div>
// //               </CTabPanel>

// //               {/* Year Tab */}
// //               <CTabPanel className="p-3" itemKey="Year">
// //                 {/* For larger screens (original layout) */}
// //                 <div className="d-none d-md-flex mb-3 m">
// //                   <Year setStateYear={setStateYear} />
// //                   <div className='mx-1 mt-2'>
// //                     <Dropdown
// //                       setSelectedOption={setSelectedOption}
// //                       ReportOptions={ReportOptions}
// //                       selectedOption={selectedOption}
// //                     />
// //                   </div>
// //                   <div className='mx-1 mt-2'>
// //                     <Button fetchReportData={fetchReportData}/>
// //                   </div>
// //                 </div>

// //                 {/* For smaller screens (mobile-friendly layout) */}
// //                 <div className="d-md-none mb-3">
// //                   <div className="row gy-3">
// //                     <div className="col-12">
// //                       <Year setStateYear={setStateYear} />
// //                     </div>
// //                     <div className="col-6">
// //                       <Dropdown
// //                         setSelectedOption={setSelectedOption}
// //                         ReportOptions={ReportOptions}
// //                         selectedOption={selectedOption}
// //                       />
// //                     </div>
// //                     <div className="col-6 d-flex justify-content-start">
// //                       <Button fetchReportData={fetchReportData} />
// //                     </div>
// //                   </div>
// //                 </div>

// //                 <div className="mt-3">
// //                   <All_Tables
// //                     selectedOption={selectedOption}
// //                     salesData={salesData}
// //                     expenseData={expenseData}
// //                     pnlData={pnlData}
// //                     expenseType={expenseType}
// //                   />
// //                 </div>
// //               </CTabPanel>
// //             </CTabContent>
// //           </CTabs>
// //         </div>
// //       </MantineProvider>

// //       {/* Add responsive styles */}
// //       <style jsx>{`
// //         .responsive-container {
// //           width: 100%;
// //           max-width: 100%;
// //           overflow-x: hidden;
// //         }

// //         @media (max-width: 768px) {
// //           .responsive-container {
// //             padding: 0 5px;
// //           }
// //         }

// //         /* Larger dropdown styling */
// //         :global(.larger-dropdown select) {
// //           min-width: 200px !important;
// //           font-size: 1.1rem !important;
// //           height: auto !important;
// //           padding: 8px 12px !important;
// //         }

// //         /* For the button itself to be larger */
// //         :global(.larger-dropdown .dropdown-toggle) {
// //           min-width: 200px !important;
// //           font-size: 1.1rem !important;
// //           padding: 8px 12px !important;
// //         }

// //         /* For dropdown menu items to be larger */
// //         :global(.larger-dropdown .dropdown-menu .dropdown-item) {
// //           font-size: 1.1rem !important;
// //           padding: 8px 12px !important;
// //         }
// //       `}</style>
// //     </>
// //   );
// // }

// // export default All_Reports;

import { CButton, CFormSelect, CTabs, CTabList, CTabPanel, CTabContent, CTab, CFormInput } from '@coreui/react';
import React, { useState, useCallback, useEffect } from 'react';
import { Year, Custom, Months, Quarter, Week } from './Dates';
import { getAPICall } from '../../../util/api';
import All_Tables from './AllTables';
import { Button, Dropdown } from '/resources/react/views/pages/report/ButtonDropdowns';
import { MantineProvider } from '@mantine/core';
import { useToast } from '../../common/toast/ToastContext';

function All_Reports() {
  const [selectedOption, setSelectedOption] = useState('3');
  const [stateCustom, setStateCustom] = useState({ start_date: '', end_date: '' });
  const [stateMonth, setStateMonth] = useState({ start_date: '', end_date: '' });
  const [stateQuarter, setStateQuarter] = useState({ start_date: '', end_date: '' });
  const [stateYear, setStateYear] = useState({ start_date: '', end_date: '' });
  const [activeTab1, setActiveTab] = useState('Year');
  const [stateWeek, setStateWeek] = useState({ start_date: '', end_date: '' });
  const { showToast } = useToast();
const downloadCSV = (data, columns, filename) => {
  const csvHeader = columns.map(col => `"${col.header}"`).join(",");
  const csvRows = data.map(row =>
    columns.map(col => `"${row[col.accessorKey] ?? ''}"`).join(",")
  );
  
  // Add total rows based on report type
  let totalRows = [];
  
  if (selectedOption === '1') { // Sales Report
    totalRows = [
      "", // Empty row for spacing
      columns.map((col, index) => {
        if (index === 0) return `"TOTALS"`;
        if (col.accessorKey === 'totalAmount') return `"${salesData.totalSales}"`;
        if (col.accessorKey === 'paidAmount') return `"${salesData.totalPaid}"`;
        if (col.accessorKey === 'remainingAmount') return `"${salesData.totalRemaining}"`;
        return `""`;
      }).join(",")
    ];
  } else if (selectedOption === '2') { // Expense Report
    totalRows = [
      "", // Empty row for spacing
      columns.map((col, index) => {
        if (index === 0) return `"TOTALS"`;
        if (col.accessorKey === 'total_price') return `"${expenseData.totalExpense}"`;
        return `""`;
      }).join(",")
    ];
  } else if (selectedOption === '3') { // P&L Report
    totalRows = [
      "", // Empty row for spacing
      columns.map((col, index) => {
        if (index === 0) return `"TOTALS"`;
        if (col.accessorKey === 'totalSales') return `"${pnlData.totalSales}"`;
        if (col.accessorKey === 'totalExpenses') return `"${pnlData.totalExpenses}"`;
        if (col.accessorKey === 'profitOrLoss') return `"${pnlData.totalProfitOrLoss}"`;
        return `""`;
      }).join(",")
    ];
  }
  const csvContent = [csvHeader, ...csvRows, ...totalRows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  const ReportOptions = [
    { label: 'Sales', value: '1' },
    { label: 'Expense', value: '2' },
    { label: 'Profit & Loss', value: '3' },
    { label: 'Earning per product', value: '4' },
  ];

  //for Sales Report
  const [salesData, setSalesData] = useState({
    data: [],
    totalSales: 0,
    totalPaid: 0,
    totalRemaining: 0
  });

  const [productWiseData, setProductWiseData] = useState([]);

  //for Expence Report
  const [expenseData, setExpenseData] = useState({
    data: [],
    totalExpense: 0
  });
  const [expenseType, setExpenseType] = useState({});

  //Profit & Loss
  const [pnlData, setPnLData] = useState({
    Data: [],
    totalSales: 0,
    totalExpenses: 0,
    totalProfitOrLoss: 0
  });

  const handleTabChange = (value) => {
    setActiveTab(value);
  };

//   const fetchReportData = async() => {
//     try {
//       let date = {};
//       let rawSalesData = [];
//       let rawExpenseData = [];
//       switch (activeTab1) {
//         case 'Custom':
//           date = stateCustom;
//           break;
//         case 'Month':
//           date = stateMonth;
//           break;
//         case 'Quarter':
//           date = stateQuarter;
//           break;
//         case 'Year':
//           date = stateYear;
//           break;
//         case 'Week':
//           date = stateWeek;
//           break;
//         default:
//           break;
//       }

//       if (!date.start_date || !date.end_date) {
//         alert("Please select dates before fetching data.");
//         return;
//       }
//       if (selectedOption === '1' || selectedOption === '3') {
//         const resp = await getAPICall(
//           '/api/reportSales?startDate=' + date.start_date + '&endDate=' + date.end_date,
//         )
//         if (resp && resp.orders) {
//           // Updated to handle the new response structure
//           const groupedSales = resp.orders.reduce((acc, sale) => {
//             if (!acc[sale.invoiceDate]) {
//               acc[sale.invoiceDate] = {
//                 invoiceDate: sale.invoiceDate,
//                 totalAmount: 0,
//                 paidAmount: 0,
//               }
//             }
//             acc[sale.invoiceDate].totalAmount += sale.totalAmount
//             acc[sale.invoiceDate].paidAmount += sale.paidAmount
//             return acc
//           }, {})

//           const salesArray = Object.values(groupedSales).map(sale => ({
//             ...sale,
//             totalAmount: Math.round(sale.totalAmount),
//             paidAmount: Math.round(sale.paidAmount),
//             remainingAmount: Math.round(sale.totalAmount - sale.paidAmount)
//           }))

//           rawSalesData = [...salesArray];

//           // Use summary data from API if available, otherwise calculate
//           if (resp.summary && resp.summary.sales) {
//             setSalesData((prev) => {
//               return {
//                 ...prev,
//                 data: salesArray,
//                 totalSales: Math.round(resp.summary.sales.totalAmount),
//                 totalPaid: Math.round(resp.summary.sales.totalPaidAmount),
//                 totalRemaining: Math.round(resp.summary.sales.totalRemainingAmount)
//               }
//             })
//           } else {
//             // Fallback to manual calculation
//             const totalSales = salesArray.reduce((acc, current) => acc + current.totalAmount, 0)
//             const totalPaid = salesArray.reduce((acc, current) => acc + current.paidAmount, 0)
//             const totalRemaining = salesArray.reduce((acc, current) => acc + current.remainingAmount, 0)
//             setSalesData((prev) => {
//               return {
//                 ...prev,
//                 data: salesArray,
//                 totalSales: Math.round(totalSales),
//                 totalPaid: Math.round(totalPaid),
//                 totalRemaining: Math.round(totalRemaining)
//               }
//             })
//           }
//         } else {
//           showToast('danger', 'Failed to fetch records');
//         }
//       }

//       if (selectedOption === '2' || selectedOption === '3') {
//         const resp = await getAPICall(
//           '/api/expense?startDate=' + date.start_date + '&endDate=' + date.end_date,
//         )

//         if (resp) {
//           rawExpenseData = [...resp];

//           // Use summary data from API if available, otherwise calculate
//           if (resp.summary && resp.summary.expense) {
//             setExpenseData(prev => {
//               return {
//                 ...prev,
//                 data: resp.data || resp,
//                 totalExpense: Math.round(resp.summary.expense.totalCost)
//               }
//             })
//           } else {
//             const totalExp = resp.reduce((acc, current) => {
//               if (current.show) {
//                 return acc + current.total_price
//               }
//               return acc
//             }, 0)
//             setExpenseData(prev => {
//               return {
//                 ...prev,
//                 data: resp,
//                 totalExpense: Math.round(totalExp)
//               }
//             })
//           }

//           // Grouping expenses by expense_date and summing total_price
//           const groupedExpenses = resp.reduce((acc, expense) => {
//             if (!acc[expense.expense_date]) {
//               acc[expense.expense_date] = {
//                 expense_date: expense.expense_date,
//                 totalExpense: 0,
//               }
//             }
//             acc[expense.expense_date].totalExpense += expense.total_price
//             return acc
//           }, {})

//           const expensesArray = Object.values(groupedExpenses)

//         } else {
//           showToast('danger', 'Failed to fetch records');
//         }
//       }

//       if (selectedOption === '3') {
//         // Check if we have summary data from either of the API calls
//         const salesResp = await getAPICall(
//           '/api/reportSales?startDate=' + date.start_date + '&endDate=' + date.end_date,
//         );

//         if (salesResp && salesResp.summary && salesResp.summary.profitLoss) {
//           // Use summary data from API
//           setPnLData(prev => ({
//             ...prev,
//             Data: calculatePnL(rawExpenseData, rawSalesData),
//             totalSales: Math.round(salesResp.summary.profitLoss.totalSales),
//             totalExpenses: Math.round(salesResp.summary.profitLoss.totalExpenses),
//             totalProfitOrLoss: Math.round(salesResp.summary.profitLoss.totalProfitLoss)
//           }));
//         } else {
//           // Fallback to manual calculation
//           const pnlDataArray = calculatePnL(rawExpenseData, rawSalesData);
//           setPnLData(prev => ({
//             ...prev,
//             Data: pnlDataArray,
//             totalSales: pnlDataArray.reduce((acc, current) => acc + current.totalSales, 0),
//             totalExpenses: pnlDataArray.reduce((acc, current) => acc + current.totalExpenses, 0),
//             totalProfitOrLoss: pnlDataArray.reduce((acc, current) => acc + current.profitOrLoss, 0)
//           }));
//         }
//       }
//     } catch (error) {
//       showToast('danger', 'Error occured ' + error);
//     }

//     if (selectedOption === '4') {
//   const resp = await getAPICall(
//     `/api/reportProductWiseEarnings?startDate=${date.start_date}&endDate=${date.end_date}`
//   );
//   if (Array.isArray(resp)) {
//     setProductWiseData(resp);
//   } else {
//     showToast('danger', 'Failed to fetch product-wise earnings report');
//   }
// }
//   };


const fetchReportData = async () => {
  try {
    let date = {};
    let rawSalesData = [];
    let rawExpenseData = [];

    switch (activeTab1) {
      case 'Custom':
        date = stateCustom;
        break;
      case 'Month':
        date = stateMonth;
        break;
      case 'Quarter':
        date = stateQuarter;
        break;
      case 'Year':
        date = stateYear;
        break;
      case 'Week':
        date = stateWeek;
        break;
      default:
        break;
    }

    if (!date.start_date || !date.end_date) {
      alert('Please select dates before fetching data.');
      return;
    }

    // Sales or Profit & Loss
    if (selectedOption === '1' || selectedOption === '3') {
      const resp = await getAPICall(
        `/api/reportSales?startDate=${date.start_date}&endDate=${date.end_date}`
      );
      if (resp && resp.orders) {
        const groupedSales = resp.orders.reduce((acc, sale) => {
          if (!acc[sale.invoiceDate]) {
            acc[sale.invoiceDate] = {
              invoiceDate: sale.invoiceDate,
              totalAmount: 0,
              paidAmount: 0,
            };
          }
          acc[sale.invoiceDate].totalAmount += sale.totalAmount;
          acc[sale.invoiceDate].paidAmount += sale.paidAmount;
          return acc;
        }, {});

        const salesArray = Object.values(groupedSales).map((sale) => ({
          ...sale,
          totalAmount: Math.round(sale.totalAmount),
          paidAmount: Math.round(sale.paidAmount),
          remainingAmount: Math.round(sale.totalAmount - sale.paidAmount),
        }));

        rawSalesData = [...salesArray];

        if (resp.summary && resp.summary.sales) {
          setSalesData({
            data: salesArray,
            totalSales: Math.round(resp.summary.sales.totalAmount),
            totalPaid: Math.round(resp.summary.sales.totalPaidAmount),
            totalRemaining: Math.round(resp.summary.sales.totalRemainingAmount),
          });
        } else {
          const totalSales = salesArray.reduce((acc, curr) => acc + curr.totalAmount, 0);
          const totalPaid = salesArray.reduce((acc, curr) => acc + curr.paidAmount, 0);
          const totalRemaining = salesArray.reduce((acc, curr) => acc + curr.remainingAmount, 0);
          setSalesData({
            data: salesArray,
            totalSales: Math.round(totalSales),
            totalPaid: Math.round(totalPaid),
            totalRemaining: Math.round(totalRemaining),
          });
        }
      } else {
        showToast('danger', 'Failed to fetch sales records');
      }
    }

    // Expense or Profit & Loss
    if (selectedOption === '2' || selectedOption === '3') {
      const resp = await getAPICall(
        `/api/expense?startDate=${date.start_date}&endDate=${date.end_date}`
      );
      if (resp) {
        rawExpenseData = [...resp];

        if (resp.summary && resp.summary.expense) {
          setExpenseData({
            data: resp.data || resp,
            totalExpense: Math.round(resp.summary.expense.totalCost),
          });
        } else {
          const totalExp = resp.reduce((acc, curr) => acc + (curr.show ? curr.total_price : 0), 0);
          setExpenseData({
            data: resp,
            totalExpense: Math.round(totalExp),
          });
        }
      } else {
        showToast('danger', 'Failed to fetch expense records');
      }
    }

    // Profit & Loss
    if (selectedOption === '3') {
      const salesResp = await getAPICall(
        `/api/reportSales?startDate=${date.start_date}&endDate=${date.end_date}`
      );

      if (salesResp && salesResp.summary && salesResp.summary.profitLoss) {
        setPnLData({
          Data: calculatePnL(rawExpenseData, rawSalesData),
          totalSales: Math.round(salesResp.summary.profitLoss.totalSales),
          totalExpenses: Math.round(salesResp.summary.profitLoss.totalExpenses),
          // totalProfitOrLoss: Math.round(salesResp.summary.profitLoss.totalSales-expenseData.totalExpense),
         totalProfitOrLoss: totalPandL(rawExpenseData, rawSalesData),
        });
      } else {
        const pnlDataArray = calculatePnL(rawExpenseData, rawSalesData);
        setPnLData({
          Data: pnlDataArray,
          totalSales: pnlDataArray.reduce((acc, curr) => acc + curr.totalSales, 0),
          totalExpenses: pnlDataArray.reduce((acc, curr) => acc + curr.totalExpenses, 0),
          totalProfitOrLoss: pnlDataArray.reduce((acc, curr) => acc + curr.profitOrLoss, 0),
        });
      }
    }

    // ✅ Product Wise Earnings
    if (selectedOption === '4') {
      const resp = await getAPICall(
        `/api/reportProductWiseEarnings?startDate=${date.start_date}&endDate=${date.end_date}`
      );
      if (Array.isArray(resp)) {
        setProductWiseData(resp);
        
      } else {
        showToast('danger', 'Failed to fetch product-wise earnings report');
      }
    }
  } catch (error) {
    showToast('danger', 'Error occurred: ' + error.message);
  }
};

  const handleDownloadCSV = () => {
  let data = [];
  let columns = [];
  let filename = 'report.csv';

  if (selectedOption === '1') {
    data = salesData.data;
    columns = [
      { accessorKey: 'invoiceDate', header: 'Invoice Date' },
      { accessorKey: 'totalAmount', header: 'Total Amount' },
      { accessorKey: 'paidAmount', header: 'Paid Amount' },
      { accessorKey: 'remainingAmount', header: 'Remaining Amount' },
    ];
    filename = 'sales-report.csv';
  } else if (selectedOption === '2') {
    data = expenseData.data;
    columns = [
      { accessorKey: 'expense_date', header: 'Date' },
      { accessorKey: 'name', header: 'Details' },
      { accessorKey: 'expense_type.expense_category', header: 'Expense Category' },
      { accessorKey: 'qty', header: 'Quantity' },
      { accessorKey: 'price', header: 'Price Per Unit' },
      { accessorKey: 'total_price', header: 'Total Cost' },
    ];
    filename = 'expense-report.csv';
  } else if (selectedOption === '3') {
    data = pnlData.Data;
    columns = [
      { accessorKey: 'date', header: 'Date' },
      { accessorKey: 'totalSales', header: 'Total Sales' },
      { accessorKey: 'totalExpenses', header: 'Total Expenses' },
      { accessorKey: 'profitOrLoss', header: 'Profit/Loss' },
    ];
    filename = 'pnl-report.csv';
  }
  else if (selectedOption === '4') {
  data = productWiseData;
  columns = [
    { accessorKey: 'product_name', header: 'Product Name' },
    { accessorKey: 'totalQty', header: 'Total Quantity Sold' },
    { accessorKey: 'totalRevenue', header: 'Total Revenue (₹)' },
  ];
  filename = 'product-wise-earnings.csv';
}


  downloadCSV(data, columns, filename);
};


const totalPandL = (rawExpenseData, rawSalesData) => {
  try {
    // Calculate total sales
    const totalSales = rawSalesData.reduce((sum, entry) => {
      return sum + (entry.totalAmount || 0);
    }, 0);
    
    // Calculate total expenses
    const totalExpenses = rawExpenseData.reduce((sum, entry) => {
      return sum + (entry.total_price || 0);
    }, 0);
    
    // Return total P&L (Sales - Expenses)
    return totalSales - totalExpenses;
    
  } catch (error) {
    showToast('danger', error.message);
    return 0;
  }
}

  const calculatePnL = (rawExpenseData, rawSalesData) => {
    try {
      const combinedData = [...rawExpenseData, ...rawSalesData]
      const groupedData = combinedData.reduce((acc, entry) => {
        const date = entry.invoiceDate || entry.expense_date
        if (!acc[date]) {
          acc[date] = {
            date,
            totalSales: 0,
            totalExpenses: 0,
          }
        }
        if (entry.totalAmount) {
          acc[date].totalSales += entry.totalAmount
        }
        if (entry.total_price) {
          acc[date].totalExpenses += entry.total_price;
        }
        return acc
      }, {})

      // Convert the grouped data into an array and calculate profit or loss
      const pnlData = Object.values(groupedData).map(data => ({
        ...data,
        profitOrLoss: data.totalSales - data.totalExpenses,
      }));

      return pnlData;
    } catch (error) {
      showToast('danger', error.message);
      return [];
    }
  }

  // Function to format numbers with commas for Indian currency format (e.g., 1,00,000)
  const formatIndianCurrency = (num) => {
    const numStr = Math.abs(num).toString();
    let formattedNum = '';

    // For numbers less than 1000
    if (numStr.length <= 3) {
      return numStr;
    }

    // Process the last 3 digits
    formattedNum = numStr.slice(-3);
    let remaining = numStr.slice(0, -3);

    // Process the rest in groups of 2
    while (remaining.length > 0) {
      const chunk = remaining.slice(-2);
      formattedNum = (chunk ? chunk + ',' : '') + formattedNum;
      remaining = remaining.slice(0, -2);
    }

    return formattedNum;
  };

  // Determine profit margin percentage for P&L
  const calculateProfitMargin = () => {
    if (!pnlData.totalSales) return 0;
    return Math.round((pnlData.totalProfitOrLoss / pnlData.totalSales) * 100);
  };

  // Determine icon and color based on profit/loss
  const getProfitLossIcon = () => {
    return pnlData.totalProfitOrLoss >= 0
      ? '↑' // Up arrow for profit
      : '↓'; // Down arrow for loss
  };

  const getProfitLossColor = () => {
    return pnlData.totalProfitOrLoss >= 0
      ? 'text-success' // Green for profit
      : 'text-danger';  // Red for loss
  };

  // Get arrow icons based on value trend
  const getArrowIcon = (value) => {
    return value >= 0 ? '↑' : '↓';
  };

  // Get color class based on value trend
  const getColorClass = (value, inverse = false) => {
    if (inverse) {
      return value >= 0 ? 'text-danger' : 'text-success';
    }
    return value >= 0 ? 'text-success' : 'text-danger';
  };

  // Render summary cards based on selected option
  const renderSummaryCards = () => {
    return (
      <div className="summary-cards mb-4">
        <div className="row">
          {/* SALES REPORT - Show all three sales cards */}
          {selectedOption === '1' && (
            <>
              {/* Total Sales Card */}
              <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-container bg-primary-light rounded-circle p-3 me-3">
                        <span className="text-primary fs-4">📈</span>
                      </div>
                      <h5 className="card-title mb-0 text-primary">Total Sales</h5>
                    </div>
                    <h2 className="mb-2">₹{formatIndianCurrency(salesData.totalSales)}</h2>
                    <p className="text-muted">For selected period</p>
                  </div>
                </div>
              </div>

              {/* Total Paid Card */}
              <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-container bg-success-light rounded-circle p-3 me-3">
                        <span className="text-success fs-4">✓</span>
                      </div>
                      <h5 className="card-title mb-0 text-success">Paid Amount</h5>
                    </div>
                    <h2 className="mb-2 text-success">₹{formatIndianCurrency(salesData.totalPaid)}</h2>
                    <p className="text-muted">{Math.round((salesData.totalPaid / salesData.totalSales) * 100) || 0}% of total sales</p>
                  </div>
                </div>
              </div>

              {/* Total Remaining Card */}
              <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-container bg-warning-light rounded-circle p-3 me-3">
                        <span className="text-warning fs-4">⏱</span>
                      </div>
                      <h5 className="card-title mb-0 text-warning">Remaining Amount</h5>
                    </div>
                    <h2 className="mb-2 text-warning">₹{formatIndianCurrency(salesData.totalRemaining)}</h2>
                    <p className="text-muted">{Math.round((salesData.totalRemaining / salesData.totalSales) * 100) || 0}% of total sales</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* EXPENSE REPORT - Show only expense card */}
          {selectedOption === '2' && (
            <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
              <div className="card h-100 border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-3">
                    <div className="icon-container bg-danger-light rounded-circle p-3 me-3">
                      <span className="text-danger fs-4">↓</span>
                    </div>
                    <h5 className="card-title mb-0 text-danger">Total Expenses</h5>
                  </div>
                  <h2 className="mb-2">₹{formatIndianCurrency(expenseData.totalExpense)}</h2>
                  <p className="text-muted">{expenseData.data.length} expense entries</p>
                </div>
              </div>
            </div>
          )}

          {/* PROFIT & LOSS REPORT - Show only total sales, total expenses, and net profit */}
          {selectedOption === '3' && (
            <>
              {/* Total Sales Card */}
              <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-container bg-primary-light rounded-circle p-3 me-3">
                        <span className="text-primary fs-4">📈</span>
                      </div>
                      <h5 className="card-title mb-0 text-primary">Total Sales</h5>
                    </div>
                    <h2 className="mb-2">₹{formatIndianCurrency(salesData.totalSales)}</h2>
                    <p className="text-muted">For selected period</p>
                  </div>
                </div>
              </div>

              {/* Total Expense Card */}
              <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className="icon-container bg-danger-light rounded-circle p-3 me-3">
                        <span className="text-danger fs-4">↓</span>
                      </div>
                      <h5 className="card-title mb-0 text-danger">Total Expenses</h5>
                    </div>
                    <h2 className="mb-2">₹{formatIndianCurrency(expenseData.totalExpense)}</h2>
                    <p className="text-muted">{expenseData.data.length} expense entries</p>
                  </div>
                </div>
              </div>

              {/* Net Profit/Loss Card */}
              <div className="col-lg-4 col-md-6 col-sm-12 mb-3">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex align-items-center mb-3">
                      <div className={`icon-container rounded-circle p-3 me-3 bg-${pnlData.totalProfitOrLoss >= 0 ? 'success' : 'danger'}-light`}>
                        <span className={`fs-4 ${getProfitLossColor()}`}>{getProfitLossIcon()}</span>
                      </div>
                      <h5 className={`card-title mb-0 ${getProfitLossColor()}`}>
                        {pnlData.totalProfitOrLoss >= 0 ? 'Net Profit' : 'Net Loss'}
                      </h5>
                    </div>
                    <h2 className={`mb-2 ${getProfitLossColor()}`}>₹{formatIndianCurrency(Math.abs(pnlData.totalProfitOrLoss))}</h2>
                    <p className="text-muted">{calculateProfitMargin()}% profit margin</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

 return (
  <>
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <div className="responsive-container">
        <CTabs activeItemKey={activeTab1} onChange={handleTabChange}>
          <CTabList variant="tabs" className="flex-wrap">
            <CTab itemKey="Year">Year</CTab>
            <CTab itemKey="Quarter">Quarter</CTab>
            <CTab itemKey="Month">Month</CTab>
            <CTab itemKey="Week">Week</CTab>
            <CTab itemKey="Custom" default>Custom</CTab>
          </CTabList>
          <CTabContent>
            {/* Custom Tab */}
            <CTabPanel className="p-3" itemKey="Custom">
              {/* For larger screens (original layout) */}
              <div className="d-none d-md-flex mb-3 justify-content-between">
                <div className="d-flex mx-1">
                  <Custom setStateCustom={setStateCustom} />
                  <div className="flex-fill mx-2 mt-1 col-sm-3">
                    <h1></h1>
                    <br/>
                    <Dropdown
                      setSelectedOption={setSelectedOption}
                      ReportOptions={ReportOptions}
                      selectedOption={selectedOption}
                      className="larger-dropdown"
                    />
                  </div>
                </div>
                <div className="flex-fill px-0 mt-1">
                  <h1></h1>
                  <br/>
                  <div className="d-flex">
                    <Button fetchReportData={fetchReportData} />
                    <CButton color="info" className="ms-2" onClick={handleDownloadCSV}>
                      Download 
                    </CButton>
                  </div>
                 
                </div>
              </div>
              
              {/* For smaller screens (mobile-friendly layout) */}
              <div className="d-md-none mb-3">
                <div className="row gy-3">
                  <div className="col-12">
                    <Custom setStateCustom={setStateCustom} />
                  </div>
                  <div className="col-12">
                    <Dropdown
                      setSelectedOption={setSelectedOption}
                      ReportOptions={ReportOptions}
                      selectedOption={selectedOption}
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-start">
                    <Button fetchReportData={fetchReportData} />
                    <CButton color="info" className="ms-2" onClick={handleDownloadCSV}>
                    Download 
                    </CButton>
                  </div>
                </div>
              </div>

              {/* Summary Cards Section */}
              {(salesData.data.length > 0 || expenseData.data.length > 0) && renderSummaryCards()}

              <div className="mt-3">
                <All_Tables
                  selectedOption={selectedOption}
                  salesData={salesData}
                  expenseData={expenseData}
                  pnlData={pnlData}
                  expenseType={expenseType}
                  productWiseData={productWiseData} 
                />
              </div>
            </CTabPanel>

            {/* Week Tab */}
            <CTabPanel className="p-3" itemKey="Week">
              {/* For larger screens (original layout) */}
              <div className="d-none d-md-flex mb-3 align-items-end">
                <Week setStateWeek={setStateWeek}/>
                <div className='mx-1'>
                  <Dropdown
                    setSelectedOption={setSelectedOption}
                    ReportOptions={ReportOptions}
                    selectedOption={selectedOption}
                  />
                </div>
                <div className="d-flex mx-1">
                  <Button fetchReportData={fetchReportData} />
                  <CButton color="info" className="ms-2" onClick={handleDownloadCSV}>
                    Download
                  </CButton>
                </div>
              </div>

              {/* For smaller screens (mobile-friendly layout) */}
              <div className="d-md-none mb-3">
                <div className="row gy-3">
                  <div className="col-12">
                    <Week setStateWeek={setStateWeek} />
                  </div>
                  <div className="col-12">
                    <Dropdown
                      setSelectedOption={setSelectedOption}
                      ReportOptions={ReportOptions}
                      selectedOption={selectedOption}
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-start">
                    <Button fetchReportData={fetchReportData} />
                    <CButton color="info" className="ms-2" onClick={handleDownloadCSV}>
                    Download 
                    </CButton>
                  </div>
                </div>
              </div>

              {/* Summary Cards Section */}
              {(salesData.data.length > 0 || expenseData.data.length > 0) && renderSummaryCards()}

              <div className="mt-3">
                <All_Tables
                  selectedOption={selectedOption}
                  salesData={salesData}
                  expenseData={expenseData}
                  pnlData={pnlData}
                  expenseType={expenseType}
                  productWiseData={productWiseData}
                />
              </div>
            </CTabPanel>

            {/* Month Tab */}
            <CTabPanel className="p-3" itemKey="Month">
              {/* For larger screens (original layout) */}
              <div className="d-none d-md-flex mb-3 justify-content-between">
                <div className="flex-fill mx-1">
                  <Months setStateMonth={setStateMonth} />
                </div>
                <div className="flex-fill mx-1">
                  <Dropdown
                    setSelectedOption={setSelectedOption}
                    ReportOptions={ReportOptions}
                    selectedOption={selectedOption}
                  />
                </div>
                <div className="flex-fill mx-1 d-flex">
                  <Button fetchReportData={fetchReportData} />
                  <CButton color="info" className="ms-2" style={{height:'38px'}} onClick={handleDownloadCSV}>
                  Download
                  </CButton>
                </div>
              </div>

              {/* For smaller screens (mobile-friendly layout) */}
              <div className="d-md-none mb-3">
                <div className="row gy-3">
                  <div className="col-12">
                    <Months setStateMonth={setStateMonth} />
                  </div>
                  <div className="col-12">
                    <Dropdown
                      setSelectedOption={setSelectedOption}
                      ReportOptions={ReportOptions}
                      selectedOption={selectedOption}
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-start">
                    <Button fetchReportData={fetchReportData} />
                    <CButton color="info" className="ms-2" onClick={handleDownloadCSV}>
                   Download
                    </CButton>
                  </div>
                </div>
              </div>

              {/* Summary Cards Section */}
              {(salesData.data.length > 0 || expenseData.data.length > 0) && renderSummaryCards()}

              <div className="mt-3">
                <All_Tables
                  selectedOption={selectedOption}
                  salesData={salesData}
                  expenseData={expenseData}
                  pnlData={pnlData}
                  expenseType={expenseType}
                  productWiseData={productWiseData}
                />
              </div>
            </CTabPanel>

            {/* Quarter Tab */}
            <CTabPanel className="p-3" itemKey="Quarter">
              {/* For larger screens (original layout) */}
              <div className="d-none d-md-flex mb-3 col-md-10 align-items-end">
                <Quarter setStateQuarter={setStateQuarter} />
                <Dropdown
                  setSelectedOption={setSelectedOption}
                  ReportOptions={ReportOptions}
                  selectedOption={selectedOption}
                />
                <div className='px-2 d-flex'>
                  <Button fetchReportData={fetchReportData}/>
                  <CButton color="info" className="ms-2" onClick={handleDownloadCSV}>
                    Download
                  </CButton>
                </div>
              </div>

              {/* For smaller screens (mobile-friendly layout) */}
              <div className="d-md-none mb-3">
                <div className="row gy-3">
                  <div className="col-12">
                    <Quarter setStateQuarter={setStateQuarter} />
                  </div>
                  <div className="col-12">
                    <Dropdown
                      setSelectedOption={setSelectedOption}
                      ReportOptions={ReportOptions}
                      selectedOption={selectedOption}
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-start">
                    <Button fetchReportData={fetchReportData} />
                    <CButton color="info" className="ms-2" onClick={handleDownloadCSV}>
                    Download
                    </CButton>
                  </div>
                </div>
              </div>

              {/* Summary Cards Section */}
              {(salesData.data.length > 0 || expenseData.data.length > 0) && renderSummaryCards()}

              <div className="mt-3">
                <All_Tables
                  selectedOption={selectedOption}
                  salesData={salesData}
                  expenseData={expenseData}
                  pnlData={pnlData}
                  expenseType={expenseType}
                  productWiseData={productWiseData}
                />
              </div>
            </CTabPanel>

            {/* Year Tab */}
            <CTabPanel className="p-3" itemKey="Year">
              {/* For larger screens (original layout) */}
              <div className="d-none d-md-flex mb-3 align-items-end">
                <Year setStateYear={setStateYear} />
                <div className='mx-1 mt-2'>
                  <Dropdown
                    setSelectedOption={setSelectedOption}
                    ReportOptions={ReportOptions}
                    selectedOption={selectedOption}
                  />
                </div>
                <div className='mx-1 mt-2 d-flex'>
                  <Button fetchReportData={fetchReportData}/>
                  <CButton color="info" className="ms-2" onClick={handleDownloadCSV}>
                    Download
                  </CButton>
                </div>
              </div>

              {/* For smaller screens (mobile-friendly layout) */}
              <div className="d-md-none mb-3">
                <div className="row gy-3">
                  <div className="col-12">
                    <Year setStateYear={setStateYear} />
                  </div>
                  <div className="col-12">
                    <Dropdown
                      setSelectedOption={setSelectedOption}
                      ReportOptions={ReportOptions}
                      selectedOption={selectedOption}
                    />
                  </div>
                  <div className="col-12 d-flex justify-content-start">
                    <Button fetchReportData={fetchReportData} />
                    <CButton color="info" className="ms-2" onClick={handleDownloadCSV}>
                    Download 
                    </CButton>
                  </div>
                </div>
              </div>

              {/* Summary Cards Section */}
              {(salesData.data.length > 0 || expenseData.data.length > 0) && renderSummaryCards()}

              <div className="mt-3">
                <All_Tables
                  selectedOption={selectedOption}
                  salesData={salesData}
                  expenseData={expenseData}
                  pnlData={pnlData}
                  expenseType={expenseType}
                  productWiseData={productWiseData}
                  
                />
              </div>
            </CTabPanel>
          </CTabContent>
        </CTabs>
      </div>
    </MantineProvider>

    {/* Add responsive styles */}
    <style jsx>{`
      .responsive-container {
        width: 100%;
        max-width: 100%;
        overflow-x: hidden;
      }

      @media (max-width: 768px) {
        .responsive-container {
          padding: 0 5px;
        }
      }

      /* Larger dropdown styling */
      :global(.larger-dropdown select) {
        min-width: 200px !important;
        font-size: 1.1rem !important;
        height: auto !important;
        padding: 8px 12px !important;
      }

      /* For the button itself to be larger */
      :global(.larger-dropdown .dropdown-toggle) {
        min-width: 200px !important;
        font-size: 1.1rem !important;
        padding: 8px 12px !important;
      }

      /* For dropdown menu items to be larger */
      :global(.larger-dropdown .dropdown-menu .dropdown-item) {
        font-size: 1.1rem !important;
        padding: 8px 12px !important;
      }

      /* Summary Cards Styling */
      .summary-cards .card {
        border-radius: 12px;
        transition: transform 0.3s ease;
      }

      .summary-cards .card:hover {
        transform: translateY(-5px);
      }

      .bg-primary-light {
        background-color: rgba(13, 110, 253, 0.1);
      }

      .bg-danger-light {
        background-color: rgba(220, 53, 69, 0.1);
      }

      .bg-success-light {
        background-color: rgba(25, 135, 84, 0.1);
      }

      .bg-warning-light {
        background-color: rgba(255, 193, 7, 0.1);
      }

      .icon-container {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `}</style>
  </>
);

  

}

export default All_Reports;