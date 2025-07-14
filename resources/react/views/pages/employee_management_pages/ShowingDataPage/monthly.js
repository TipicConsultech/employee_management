
// import React, { useState, useEffect } from 'react';
// import {
//   CRow, CCol, CFormInput, CFormSelect, CCard, CCardBody, CButton,
// } from '@coreui/react';

// import Calendar from 'react-calendar';
// import 'react-calendar/dist/Calendar.css';
// import './calendarStyles.css'; // ✅ Add this for green styling

// import { useTranslation } from 'react-i18next';
// import { post } from '../../../../util/api';

// const Monthly = ({ id, employee }) => {
//   const { t } = useTranslation("global");

//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
//   const [workSummary, setWorkSummary] = useState(null);
//   const [attendance, setAttendance] = useState([]);
//   const [showCalendar, setShowCalendar] = useState(false);

//   // Set start and end dates
//   useEffect(() => {
//     const start = new Date(selectedYear, selectedMonth, 1);
//     const end = new Date(selectedYear, selectedMonth + 1, 0);
//     setStartDate(start.toISOString().split('T')[0]);
//     setEndDate(end.toISOString().split('T')[0]);
//   }, [selectedMonth, selectedYear]);

//   // Initialize wage defaults only once
//   useEffect(() => {
//     if (employee && workSummary) {
//       if (
//         workSummary.custom_regular_wage === undefined ||
//         workSummary.custom_overtime_wage === undefined
//       ) {
//         setWorkSummary((prev) => ({
//           ...prev,
//           custom_regular_wage: employee.wage_hour,
//           custom_overtime_wage: employee.wage_overtime,
//         }));
//       }
//     }
//   }, [employee, workSummary]);

//   const handleCalculate = async () => {
//     if (!startDate || !endDate) {
//       alert('Please select both start and end dates.');
//       return;
//     }

//     const requestData = {
//       employee_id: parseInt(id),
//       start_date: startDate,
//       end_date: endDate,
//       working_hours: 8,
//     };

//     try {
//       const response = await post('/api/workSummary', requestData);
//       setWorkSummary(response);
//       setAttendance(response.payload || []);
//       setShowCalendar(true);
//     } catch (error) {
//       console.error('Error fetching work summary:', error);
//     }
//   };

//   // const handleSubmit = () => {
//   //   alert('Submit clicked!');
//   // };

//   const tileClassName = ({ date, view }) => {
//   if (view === 'month') {
//     const dateStr = date.toLocaleDateString('sv-SE');
//     if (attendance.find((entry) => entry.date === dateStr)) {
//       return 'present-day';
//     }
//   }
//   return null;
// };

// const tileContent = ({ date, view }) => {
//   if (view === 'month') {
//     const dateStr = date.toLocaleDateString('sv-SE');
//     const entry = attendance.find((d) => d.date === dateStr);

//     if (entry) {
//       return (
//         <div className="calendar-hours">
//           <div>{entry.worked_hours}h</div>
//           {entry.overtime_hours > 0 && (
//             <div className="calendar-ot">+{entry.overtime_hours} OT</div>
//           )}
//         </div>
//       );
//     }
//   }
//   return null;
// };


// const handleSubmit = async () => {
//   const regularWage = workSummary.custom_regular_wage ?? employee.wage_hour;
//   const overtimeWage = workSummary.custom_overtime_wage ?? employee.wage_overtime;

//   const salary_amount =
//     (workSummary.regular_hours * regularWage) +
//     (workSummary.overtime_hours * overtimeWage);

//   const payload = {
//     start_date: startDate,
//     end_date: endDate,
//     employee_id: parseInt(id),
//     payed_amount: workSummary.payed_amount,
//     salary_amount,
//     payment_type: workSummary.payment_type,
//   };

//   try {
//     const res = await post('/api/payment', payload);
//     const data = await res
//     console.log('Payment Submitted:', data);
//     alert('Payment submitted successfully!');
//       setWorkSummary((prev) => ({
//       ...prev,
//       custom_regular_wage: '',
//       custom_overtime_wage: '',
//       payed_amount: '',
//       pending_payment: 0,
//       payment_type: '',
//     }));
//   } catch (err) {
//     console.error('Payment Error:', err);
//     alert('Something went wrong while submitting payment.');
//   }
// };



//   return (
//     <div>
//       <CRow className="align-items-end mb-3">
//         <CCol md={3}>
//           <label className="form-label fw-semibold">Year</label>
//           <CFormSelect
//             value={selectedYear}
//             onChange={(e) => setSelectedYear(parseInt(e.target.value))}
//           >
//             {[2023, 2024, 2025, 2026].map((year) => (
//               <option key={year} value={year}>{year}</option>
//             ))}
//           </CFormSelect>
//         </CCol>

//         <CCol md={3}>
//           <label className="form-label fw-semibold">Month</label>
//           <CFormSelect
//             value={selectedMonth}
//             onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
//           >
//             {[
//               'January', 'February', 'March', 'April', 'May', 'June',
//               'July', 'August', 'September', 'October', 'November', 'December',
//             ].map((month, index) => (
//               <option key={index} value={index}>{month}</option>
//             ))}
//           </CFormSelect>
//         </CCol>

//         <CCol md={3}>
//           <label className="form-label fw-semibold">{t('LABELS.workingHours')}</label>
//           <select className="form-select" value={8} disabled>
//             <option value={8}>8 Hours</option>
//           </select>
//         </CCol>

//         <CCol md={3}>
//           <button className="btn btn-primary w-100" onClick={handleCalculate}>
//             {t('LABELS.calculate')}
//           </button>
//         </CCol>
//       </CRow>

//       {showCalendar && (
       
//      <div className="calendar-wrapper mb-4">
//   <h6 className="mb-3">Attendance Calendar</h6>
//   <Calendar
//     className="compact-calendar border border-2 border-black rounded"
//     tileClassName={tileClassName}
//     tileContent={tileContent}
//     // value={new Date(selectedYear, selectedMonth)}
//      value={null} 
 
//   />
// </div>


//       )}
        

//       {workSummary && (
//         <CCard className="shadow-sm mt-2">
//           <CCardBody>
//             <CRow className="mb-3">
//               <div className="mb-4 fw-semibold">
//                 {t('LABELS.regularHours')}: {workSummary.regular_hours} &nbsp;|&nbsp;
//                 {t('LABELS.overtimeHours')}: {workSummary.overtime_hours} &nbsp;|&nbsp;
//                 {t('LABELS.totalWorkedHours')}:{' '}
//                 {(workSummary.regular_hours || 0) + (workSummary.overtime_hours || 0)}
//               </div>
//             </CRow>

//             {/* Wages and Payments UI Below... */}
//              <CRow className="mb-3">
//                <CCol md={6}>
//                  <label className="form-label">{t('LABELS.regularWagePerHour')}</label>
//                  <CFormInput
//                   type="number"
//                   value={Math.max(0, workSummary.custom_regular_wage ?? 0)}
//                   onChange={(e) => {
//                     const val = parseInt(e.target.value || '0', 10);
//                     setWorkSummary({
//                       ...workSummary,
//                       custom_regular_wage: val >= 0 ? val : 0,
//                     });
//                   }}
//                 />
//               </CCol>
//               <CCol md={6}>
//                 <label className="form-label">{t('LABELS.overtimeWagePerHour')}</label>
//                 <CFormInput
//                   type="number"
//                   value={Math.max(0, workSummary.custom_overtime_wage ?? 0)}
//                   onChange={(e) => {
//                     const val = parseInt(e.target.value || '0', 10);
//                     setWorkSummary({
//                       ...workSummary,
//                       custom_overtime_wage: val >= 0 ? val : 0,
//                     });
//                   }}
//                 />
//               </CCol>
//             </CRow>

//             <CRow className="mb-4">
//               <CCol md={4}>
//                 <label className="form-label">{t('LABELS.regularPayment')}</label>
//                 <CFormInput
//                   readOnly
//                   value={
//                     (parseInt(workSummary.regular_hours) || 0) *
//                     (parseInt(workSummary.custom_regular_wage) || 0)
//                   }
//                 />
//               </CCol>
//               <CCol md={4}>
//                 <label className="form-label">{t('LABELS.overtimePayment')}</label>
//                 <CFormInput
//                   readOnly
//                   value={
//                     (parseInt(workSummary.overtime_hours) || 0) *
//                     (parseInt(workSummary.custom_overtime_wage) || 0)
//                   }
//                 />
//               </CCol>
//               <CCol md={4}>
//                 <label className="form-label">{t('LABELS.totalCalculatedPayment')}</label>
//                 <CFormInput
//                   readOnly
//                   value={
//                     ((parseInt(workSummary.regular_hours) || 0) *
//                       (parseInt(workSummary.custom_regular_wage) || 0)) +
//                     ((parseInt(workSummary.overtime_hours) || 0) *
//                       (parseInt(workSummary.custom_overtime_wage) || 0))
//                   }
//                 />
//               </CCol>
//             </CRow>

//             <CRow className="mb-4">
//               <CCol md={6}>
//                 <label className="form-label">{t('LABELS.actualPayment')}</label>
//                 <CFormInput
//                   type="number"
//                   value={workSummary.payed_amount || ''}
//                   onChange={(e) => {
//                     const actual = parseInt(e.target.value || 0);
//                     const total =
//                       (workSummary.regular_hours *
//                         (workSummary.custom_regular_wage ?? employee.wage_hour)) +
//                       (workSummary.overtime_hours *
//                         (workSummary.custom_overtime_wage ?? employee.wage_overtime));
//                     const pending = total - actual;
//                     setWorkSummary({
//                       ...workSummary,
//                       payed_amount: actual,
//                       pending_payment: pending >= 0 ? pending : 0,
//                     });
//                   }}
//                 />
//               </CCol>
//               <CCol md={6}>
//                 <label className="form-label">{t('LABELS.pendingAmount')}</label>
//                 <CFormInput readOnly value={workSummary.pending_payment || 0} />
//               </CCol>
//             </CRow>

//             <CRow className="mb-3">
//               <CCol md={6}>
//                 <label className="form-label">{t('LABELS.paymentMethod')}</label>
//                 <CFormSelect
//                   value={workSummary.payment_type || ''}
//                   onChange={(e) =>
//                     setWorkSummary({
//                       ...workSummary,
//                       payment_type: e.target.value,
//                     })
//                   }
//                 >
//                   <option value="">-- Select Payment Method --</option>
//                   <option value="cash">Cash</option>
//                   <option value="upi">UPI</option>
//                   <option value="bank_transfer">Bank Transfer</option>
//                 </CFormSelect>
//               </CCol>
//             </CRow>

//             <div className="d-flex justify-content-end">
//               <CButton color="success" onClick={handleSubmit}>
//                 {t('LABELS.submit')}
//               </CButton>
//             </div>

//           </CCardBody>
//         </CCard>
//       )}
//     </div>
//   );
// };

// export default Monthly;


import React, { useState, useEffect } from 'react'
import {
  CRow, CCol, CFormInput, CFormSelect, CCard, CCardBody, CButton,
} from '@coreui/react'

import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import './calendarStyles.css'

import { useTranslation } from 'react-i18next'
import { post } from '../../../../util/api'

const Monthly = ({ id, employee }) => {
  const { t } = useTranslation('global')

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [workSummary, setWorkSummary] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [showCalendar, setShowCalendar] = useState(false)

  // Set monthly range
  useEffect(() => {
    const start = new Date(selectedYear, selectedMonth, 1)
    const end = new Date(selectedYear, selectedMonth + 1, 0)
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
  }, [selectedMonth, selectedYear])

  // Default wages when response received
  useEffect(() => {
    if (employee && workSummary) {
      setWorkSummary((prev) => ({
        ...prev,
        custom_regular_wage: prev.custom_regular_wage ?? employee.wage_hour,
        custom_overtime_wage: prev.custom_overtime_wage ?? employee.wage_overtime,
      }))
    }
  }, [employee, workSummary])

  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.')
      return
    }

    const requestData = {
      employee_id: parseInt(id),
      start_date: startDate,
      end_date: endDate,
      working_hours: 8,
    }

    try {
      const response = await post('/api/workSummary', requestData)

      // ✅ Only set data from `attendance` field, ignore `payload`
      setAttendance(response.attendance || [])
      setWorkSummary(response)
      setShowCalendar(true)
    } catch (error) {
      console.error('Error fetching work summary:', error)
    }
  }

  // ✅ Highlight days with attendance
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('sv-SE')
      const found = attendance.find((entry) => entry.date === dateStr)
      return found ? 'present-day' : null
    }
    return null
  }

  // ✅ Enhanced tile content for mobile responsiveness
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('sv-SE');
      const entry = attendance.find((d) => d.date === dateStr);

      if (entry) {
        return (
          <div className="calendar-tile-content">
            <div className="hours-display">
              {entry.total_hours}h
            </div>
            {entry.payment_status && (
              <div className="paid-indicator">
                ✓
              </div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const regularWage = workSummary.custom_regular_wage ?? employee.wage_hour
    const overtimeWage = workSummary.custom_overtime_wage ?? employee.wage_overtime

    const salary_amount =
      (workSummary.regular_hours * regularWage) +
      (workSummary.overtime_hours * overtimeWage)

    const payload = {
      start_date: startDate,
      end_date: endDate,
      employee_id: parseInt(id),
      payed_amount: workSummary.payed_amount,
      salary_amount,
      payment_type: workSummary.payment_type,
    }

    try {
      await post('/api/payment', payload)
      alert('Payment submitted successfully!')
      setWorkSummary((prev) => ({
        ...prev,
        custom_regular_wage: '',
        custom_overtime_wage: '',
        payed_amount: '',
        pending_payment: 0,
        payment_type: '',
      }))
    } catch (err) {
      console.error('Payment Error:', err)
      alert('Something went wrong while submitting payment.')
    }
  }

  return (
    <div className="monthly-container">
      {/* Month Filters */}
      <CRow className="align-items-end mb-3">
        <CCol xs={12} sm={6} md={3} className="mb-2">
          <label className="form-label fw-semibold">Year</label>
          <CFormSelect
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          >
            {[2023, 2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </CFormSelect>
        </CCol>

        <CCol xs={12} sm={6} md={3} className="mb-2">
          <label className="form-label fw-semibold">Month</label>
          <CFormSelect
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          >
            {[
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December',
            ].map((month, index) => (
              <option key={index} value={index}>{month}</option>
            ))}
          </CFormSelect>
        </CCol>

        <CCol xs={12} sm={6} md={3} className="mb-2">
          <label className="form-label fw-semibold">{t('LABELS.workingHours')}</label>
          <select className="form-select" value={8} disabled>
            <option value={8}>8 Hours</option>
          </select>
        </CCol>

        <CCol xs={12} sm={6} md={3} className="mb-2">
          <button className="btn btn-primary w-100" onClick={handleCalculate}>
            {t('LABELS.calculate')}
          </button>
        </CCol>
      </CRow>

      {/* Calendar */}
      {showCalendar && (
        <div className="calendar-wrapper mb-4">
          <h6 className="mb-3 text-center calendar-title">Attendance Calendar</h6>
          <div className="calendar-container">
            <Calendar
              className="responsive-calendar"
              tileClassName={tileClassName}
              tileContent={tileContent}
              value={null}
              showNeighboringMonth={false}
              minDetail="month"
              maxDetail="month"
            />
          </div>
          
          {/* Calendar Legend */}
          <div className="calendar-legend mt-3">
            <div className="legend-item">
              <div className="legend-color present-day"></div>
              <span>Present Day</span>
            </div>
            <div className="legend-item">
              <div className="legend-symbol">✓</div>
              <span>Paid</span>
            </div>
          </div>
        </div>
      )}

      {/* Work Summary Card */}
    {workSummary && (
  <CCard className="shadow-sm mt-3 border-0">
    <CCardBody>
      <h4 className="text-center fw-bold mb-4" style={{ borderBottom: '2px solid #cce5ff', paddingBottom: '10px' }}>
        Work Summary & Payment
      </h4>

      {/* Section 1: Work Hours Overview */}
      <h6 className="text-primary fw-semibold mb-3">🕒 Work Hours Overview</h6>
      <CRow className="mb-4">
        <CCol md={4}>
          <CCard className="bg-success-subtle text-center">
            <CCardBody>
              <div className="text-muted">Regular Hours</div>
              <div className="fw-bold fs-4 text-success">{workSummary.regular_hours ?? 0} hrs</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="bg-warning-subtle text-center">
            <CCardBody>
              <div className="text-muted">Overtime Hours</div>
              <div className="fw-bold fs-4 text-warning">{workSummary.overtime_hours ?? 0} hrs</div>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol md={4}>
          <CCard className="bg-primary-subtle text-center">
            <CCardBody>
              <div className="text-muted">Total Worked Hours</div>
              <div className="fw-bold fs-4 text-primary">
                {(workSummary.regular_hours || 0) + (workSummary.overtime_hours || 0)} hrs
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Section 2: Wage Configuration */}
      <h6 className="text-primary fw-semibold mb-3">⚙️ Wage Configuration</h6>
      <CRow className="bg-light p-3 rounded mb-4 border border-primary-subtle">
        <CCol md={6} className="mb-3">
          <label className="form-label fw-semibold">Regular Wage / Hour</label>
          <CFormInput
            type="number"
            value={Math.max(0, workSummary.custom_regular_wage ?? 0)}
            onChange={(e) =>
              setWorkSummary({
                ...workSummary,
                custom_regular_wage: parseInt(e.target.value || '0', 10),
              })
            }
          />
        </CCol>
        <CCol md={6}>
          <label className="form-label fw-semibold">Overtime Wage / Hour</label>
          <CFormInput
            type="number"
            value={Math.max(0, workSummary.custom_overtime_wage ?? 0)}
            onChange={(e) =>
              setWorkSummary({
                ...workSummary,
                custom_overtime_wage: parseInt(e.target.value || '0', 10),
              })
            }
          />
        </CCol>
      </CRow>

      {/* Section 3: Payment Breakdown */}
      <h6 className="text-success fw-semibold mb-3">💰 Payment Breakdown</h6>
      <CRow className="bg-success-subtle p-3 rounded mb-4">
        <CCol md={4} className="mb-3">
          <label className="form-label fw-semibold">Regular Payment</label>
          <CFormInput
            readOnly
            value={(workSummary.regular_hours || 0) * (workSummary.custom_regular_wage || 0)}
          />
        </CCol>
        <CCol md={4} className="mb-3">
          <label className="form-label fw-semibold">Overtime Payment</label>
          <CFormInput
            readOnly
            value={(workSummary.overtime_hours || 0) * (workSummary.custom_overtime_wage || 0)}
          />
        </CCol>
        <CCol md={4}>
          <label className="form-label fw-semibold">Total Calculated Payment</label>
          <CFormInput
            readOnly
            value={
              ((workSummary.regular_hours || 0) * (workSummary.custom_regular_wage || 0)) +
              ((workSummary.overtime_hours || 0) * (workSummary.custom_overtime_wage || 0))
            }
          />
        </CCol>
      </CRow>

      {/* Section 4: Payment Status */}
      <h6 className="text-primary fw-semibold mb-3">📥 Payment Status</h6>
      <CRow className="bg-info-subtle p-3 rounded mb-4">
        <CCol md={6} className="mb-3">
          <label className="form-label fw-semibold">Actual Payment</label>
          <CFormInput
            type="number"
            value={workSummary.payed_amount || ''}
            onChange={(e) => {
              const actual = parseInt(e.target.value || 0);
              const total =
                (workSummary.regular_hours * (workSummary.custom_regular_wage ?? employee.wage_hour)) +
                (workSummary.overtime_hours * (workSummary.custom_overtime_wage ?? employee.wage_overtime));
              const pending = total - actual;
              setWorkSummary({
                ...workSummary,
                payed_amount: actual,
                pending_payment: pending >= 0 ? pending : 0,
              });
            }}
          />
        </CCol>
        <CCol md={6}>
          <label className="form-label fw-semibold">Pending Amount</label>
          <CFormInput readOnly className="bg-danger-subtle" value={workSummary.pending_payment || 0} />
        </CCol>
      </CRow>

      {/* Section 5: Payment Method */}
      <h6 className="text-warning fw-semibold mb-3">💳 Payment Method</h6>
      <CRow className="bg-warning-subtle p-3 rounded mb-4">
        <CCol md={6}>
          <label className="form-label fw-semibold">Payment Method</label>
          <CFormSelect
            value={workSummary.payment_type || ''}
            onChange={(e) =>
              setWorkSummary({
                ...workSummary,
                payment_type: e.target.value,
              })
            }
          >
            <option value="">-- Select --</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank_transfer">Bank Transfer</option>
          </CFormSelect>
        </CCol>
      </CRow>

      {/* Submit Button */}
      <div className="d-flex justify-content-center">
        <CButton color="success" size="lg" onClick={handleSubmit}>
          ✅ Submit & Save
        </CButton>
      </div>
    </CCardBody>
  </CCard>
)}

    </div>
  )
}

export default Monthly



//  {workSummary && (
//         <CCard className="shadow-sm mt-2">
//           <CCardBody>
//             <div className="summary-header mb-3">
//               <div className="summary-item">
//                 <span className="label">{t('LABELS.regularHours')}:</span>
//                 <span className="value">{workSummary.regular_hours}</span>
//               </div>
//               <div className="summary-item">
//                 <span className="label">{t('LABELS.overtimeHours')}:</span>
//                 <span className="value">{workSummary.overtime_hours}</span>
//               </div>
//               <div className="summary-item">
//                 <span className="label">{t('LABELS.totalWorkedHours')}:</span>
//                 <span className="value">{(workSummary.regular_hours || 0) + (workSummary.overtime_hours || 0)}</span>
//               </div>
//             </div>

//             {/* Wage Inputs */}
//             <CRow className="mb-3">
//               <CCol xs={12} md={6} className="mb-2">
//                 <label className="form-label">{t('LABELS.regularWagePerHour')}</label>
//                 <CFormInput
//                   type="number"
//                   value={Math.max(0, workSummary.custom_regular_wage ?? 0)}
//                   onChange={(e) => {
//                     const val = parseInt(e.target.value || '0', 10)
//                     setWorkSummary({
//                       ...workSummary,
//                       custom_regular_wage: val >= 0 ? val : 0,
//                     })
//                   }}
//                 />
//               </CCol>
//               <CCol xs={12} md={6} className="mb-2">
//                 <label className="form-label">{t('LABELS.overtimeWagePerHour')}</label>
//                 <CFormInput
//                   type="number"
//                   value={Math.max(0, workSummary.custom_overtime_wage ?? 0)}
//                   onChange={(e) => {
//                     const val = parseInt(e.target.value || '0', 10)
//                     setWorkSummary({
//                       ...workSummary,
//                       custom_overtime_wage: val >= 0 ? val : 0,
//                     })
//                   }}
//                 />
//               </CCol>
//             </CRow>

//             {/* Calculated Payments */}
//             <CRow className="mb-4">
//               <CCol xs={12} md={4} className="mb-2">
//                 <label className="form-label">{t('LABELS.regularPayment')}</label>
//                 <CFormInput
//                   readOnly
//                   value={(workSummary.regular_hours || 0) * (workSummary.custom_regular_wage || 0)}
//                 />
//               </CCol>
//               <CCol xs={12} md={4} className="mb-2">
//                 <label className="form-label">{t('LABELS.overtimePayment')}</label>
//                 <CFormInput
//                   readOnly
//                   value={(workSummary.overtime_hours || 0) * (workSummary.custom_overtime_wage || 0)}
//                 />
//               </CCol>
//               <CCol xs={12} md={4} className="mb-2">
//                 <label className="form-label">{t('LABELS.totalCalculatedPayment')}</label>
//                 <CFormInput
//                   readOnly
//                   value={
//                     ((workSummary.regular_hours || 0) * (workSummary.custom_regular_wage || 0)) +
//                     ((workSummary.overtime_hours || 0) * (workSummary.custom_overtime_wage || 0))
//                   }
//                 />
//               </CCol>
//             </CRow>

//             {/* Actual Payment */}
//             <CRow className="mb-4">
//               <CCol xs={12} md={6} className="mb-2">
//                 <label className="form-label">{t('LABELS.actualPayment')}</label>
//                 <CFormInput
//                   type="number"
//                   value={workSummary.payed_amount || ''}
//                   onChange={(e) => {
//                     const actual = parseInt(e.target.value || 0)
//                     const total =
//                       (workSummary.regular_hours * (workSummary.custom_regular_wage ?? employee.wage_hour)) +
//                       (workSummary.overtime_hours * (workSummary.custom_overtime_wage ?? employee.wage_overtime))
//                     const pending = total - actual
//                     setWorkSummary({
//                       ...workSummary,
//                       payed_amount: actual,
//                       pending_payment: pending >= 0 ? pending : 0,
//                     })
//                   }}
//                 />
//               </CCol>
//               <CCol xs={12} md={6} className="mb-2">
//                 <label className="form-label">{t('LABELS.pendingAmount')}</label>
//                 <CFormInput readOnly value={workSummary.pending_payment || 0} />
//               </CCol>
//             </CRow>

//             {/* Payment Method */}
//             <CRow className="mb-3">
//               <CCol xs={12} md={6}>
//                 <label className="form-label">{t('LABELS.paymentMethod')}</label>
//                 <CFormSelect
//                   value={workSummary.payment_type || ''}
//                   onChange={(e) =>
//                     setWorkSummary({
//                       ...workSummary,
//                       payment_type: e.target.value,
//                     })
//                   }
//                 >
//                   <option value="">-- Select Payment Method --</option>
//                   <option value="cash">Cash</option>
//                   <option value="upi">UPI</option>
//                   <option value="bank_transfer">Bank Transfer</option>
//                 </CFormSelect>
//               </CCol>
//             </CRow>

//             <div className="d-flex justify-content-end">
//               <CButton color="success" onClick={handleSubmit}>
//                 {t('LABELS.submit')}
//               </CButton>
//             </div>
//           </CCardBody>
//         </CCard>
//       )}