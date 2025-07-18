import React, { useState, useEffect, useCallback } from 'react';
import {
  CRow, CCol, CFormInput, CFormSelect, CCard, CCardBody, CButton, CAlert
} from '@coreui/react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendarStyles.css';
import { useTranslation } from 'react-i18next';
import { post } from '../../../../util/api';
import WorkSummaryPayment from './WorkSummaryPayment ';

const Monthly = ({ id, employee }) => {
  const { t } = useTranslation('global');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [workSummary, setWorkSummary] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  // Memoized helper function for showing notifications
  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    if (type === 'success') {
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
    }
  }, []);

  // Set monthly range
  useEffect(() => {
    const start = new Date(selectedYear, selectedMonth, 1);
    const end = new Date(selectedYear, selectedMonth + 1, 0);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, [selectedMonth, selectedYear]);

  // Default wages when response received
  useEffect(() => {
    if (employee && workSummary) {
      setWorkSummary((prev) => ({
        ...prev,
        custom_regular_wage: prev.custom_regular_wage ?? employee.wage_hour,
        custom_overtime_wage: prev.custom_overtime_wage ?? employee.wage_overtime,
      }));
    }
  }, [employee, workSummary]);

  const handleCalculate = useCallback(async () => {
    if (!startDate || !endDate) {
      showNotification('warning', t('MSG.pleaseSelectDates'));
      return;
    }

    const requestData = {
      employee_id: parseInt(id),
      start_date: startDate,
      end_date: endDate,
      working_hours: 8,
    };

    try {
      const response = await post('/api/workSummary', requestData);
      setAttendance(response.attendance || []);
      setWorkSummary(response);
      setShowCalendar(true);
      showNotification('success', t('MSG.workSummaryFetched'));
    } catch (error) {
      console.error('Error fetching work summary:', error);
      showNotification('warning', `${t('MSG.error')}: ${error.message}`);
    }
  }, [startDate, endDate, id, t]);

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('sv-SE');
      const entry = attendance.find((att) => att.date === dateStr);

      if (entry) {
        const type = entry.type || '';
        if (type === 'P') {
          return 'present-day';
        } else if (type === 'H') {
          return 'holiday';
        } else if (type === 'HD') {
          return 'half-day';
        } else if (['SL', 'PL', 'CL'].includes(type)) {
          return 'paid-leave';
        } else {
          return 'present-day';
        }
      }
    }
    return null;
  };

  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('sv-SE');
      const entry = attendance.find((d) => d.date === dateStr);

      if (entry) {
        const type = entry.type || '';
        const hasWorked = entry.total_hours && parseFloat(entry.total_hours) > 0;

        return (
          <div className="calendar-tile-content">
            {type === 'P' && hasWorked && (
              <div className="hours-display">
                {entry.total_hours}h
              </div>
            )}
            {type && type !== 'P' && (
              <div className="type-indicator">
                {type}
              </div>
            )}
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

  const handleSubmit = useCallback(async () => {
    const regularWage = workSummary.custom_regular_wage ?? employee.wage_hour;
    const overtimeWage = workSummary.custom_overtime_wage ?? employee.wage_overtime;

    const salary_amount =
      (workSummary.regular_hours * regularWage) +
      (workSummary.overtime_hours * overtimeWage);

    const payload = {
      start_date: startDate,
      end_date: endDate,
      employee_id: parseInt(id),
      payed_amount: workSummary.payed_amount,
      salary_amount,
      payment_type: workSummary.payment_type,
    };

    try {
      await post('/api/payment', payload);
      showNotification('success', t('MSG.paymentSubmittedSuccess'));
      setWorkSummary((prev) => ({
        ...prev,
        custom_regular_wage: '',
        custom_overtime_wage: '',
        payed_amount: '',
        pending_payment: 0,
        payment_type: '',
      }));
    } catch (err) {
      console.error('Payment Error:', err);
      showNotification('warning', `${t('MSG.error')}: ${err.message}`);
    }
  }, [workSummary, employee, startDate, endDate, id, t]);

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4 shadow-sm">
          <CCardBody>
            {notification.show && (
              <CAlert
                color={notification.type}
                dismissible
                onClose={() => setNotification({ show: false, type: '', message: '' })}
              >
                {notification.message}
              </CAlert>
            )}

            <CRow className="align-items-end mb-3">
              <CCol xs={12} sm={6} md={3} className="mb-2">
                <label className="form-label fw-semibold">{t('LABELS.year')}</label>
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
                <label className="form-label fw-semibold">{t('LABELS.month')}</label>
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
                <CButton color="primary" className="w-100" onClick={handleCalculate}>
                  {t('LABELS.calculate')}
                </CButton>
              </CCol>
            </CRow>

            {showCalendar && (
              <div className="calendar-wrapper mb-4">
                <h6 className="mb-3 text-center calendar-title">{t('LABELS.attendanceCalendar')}</h6>
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

                <div className="calendar-legend mt-3">
                  <div className="legend-item">
                    <div className="legend-color present-day"></div>
                    <span>{t('LABELS.present')} (P)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color holiday"></div>
                    <span>{t('LABELS.holiday')} (H)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color half-day"></div>
                    <span>{t('LABELS.halfDay')} (HD)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color paid-leave"></div>
                    <span>{t('LABELS.paidLeave')} (SL/PL/CL)</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-symbol">✓</div>
                    <span>{t('LABELS.paid')}</span>
                  </div>
                </div>
              </div>
            )}

            <WorkSummaryPayment
              workSummary={workSummary}
              setWorkSummary={setWorkSummary}
              employee={employee}
              onSubmit={handleSubmit}
              title={t('LABELS.workSummaryPayment')}
            />
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );
};

export default Monthly;
//------------------------------------------------------------------------


// import React, { useState, useEffect } from 'react'
// import {
//   CRow, CCol, CFormInput, CFormSelect, CCard, CCardBody, CButton,
// } from '@coreui/react'

// import Calendar from 'react-calendar'
// import 'react-calendar/dist/Calendar.css'
// import './calendarStyles.css'

// import { useTranslation } from 'react-i18next'
// import { post } from '../../../../util/api'
// import WorkSummaryPayment from './WorkSummaryPayment '

// const Monthly = ({ id, employee }) => {
//   const { t } = useTranslation('global')

//   const [startDate, setStartDate] = useState('')
//   const [endDate, setEndDate] = useState('')
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
//   const [workSummary, setWorkSummary] = useState(null)
//   const [attendance, setAttendance] = useState([])
//   const [showCalendar, setShowCalendar] = useState(false)

//   // Set monthly range
//   useEffect(() => {
//     const start = new Date(selectedYear, selectedMonth, 1)
//     const end = new Date(selectedYear, selectedMonth + 1, 0)
//     setStartDate(start.toISOString().split('T')[0])
//     setEndDate(end.toISOString().split('T')[0])
//   }, [selectedMonth, selectedYear])

//   // Default wages when response received
//   useEffect(() => {
//     if (employee && workSummary) {
//       setWorkSummary((prev) => ({
//         ...prev,
//         custom_regular_wage: prev.custom_regular_wage ?? employee.wage_hour,
//         custom_overtime_wage: prev.custom_overtime_wage ?? employee.wage_overtime,
//       }))
//     }
//   }, [employee, workSummary])

//   const handleCalculate = async () => {
//     if (!startDate || !endDate) {
//       alert('Please select both start and end dates.')
//       return
//     }

//     const requestData = {
//       employee_id: parseInt(id),
//       start_date: startDate,
//       end_date: endDate,
//       working_hours: 8,
//     }

//     try {
//       const response = await post('/api/workSummary', requestData)

//       // ✅ Only set data from `attendance` field, ignore `payload`
//       setAttendance(response.attendance || [])
//       setWorkSummary(response)
//       setShowCalendar(true)
//     } catch (error) {
//       console.error('Error fetching work summary:', error)
//     }
//   }

//   // ✅ Enhanced tile styling with different status types
//   const tileClassName = ({ date, view }) => {
//     if (view === 'month') {
//       const dateStr = date.toLocaleDateString('sv-SE')
//       const entry = attendance.find((att) => att.date === dateStr)

//       if (entry) {
//         const type = entry.type || ''

//         // Return different classes based on attendance type
//         if (type === 'P') {
//           return 'present-day'
//         } else if (type === 'H') {
//           return 'holiday'
//         } else if (type === 'HD') {
//           return 'half-day'
//         } else if (['SL', 'PL', 'CL'].includes(type)) {
//           return 'paid-leave'
//         } else {
//           return 'present-day' // Default for entries with hours but no type
//         }
//       }
//     }
//     return null
//   }

//   // ✅ Enhanced tile content with better status indicators
//   const tileContent = ({ date, view }) => {
//     if (view === 'month') {
//       const dateStr = date.toLocaleDateString('sv-SE')
//       const entry = attendance.find((d) => d.date === dateStr)

//       if (entry) {
//         const type = entry.type || ''
//         const hasWorked = entry.total_hours && parseFloat(entry.total_hours) > 0

//         return (
//           <div className="calendar-tile-content">
//             {/* Show hours only for Present days and not for half days */}
//             {type === 'P' && hasWorked && (
//               <div className="hours-display">
//                 {entry.total_hours}h
//               </div>
//             )}

//             {/* Show type indicator for non-present days */}
//             {type && type !== 'P' && (
//               <div className="type-indicator">
//                 {type}
//               </div>
//             )}

//             {/* Show paid indicator */}
//             {entry.payment_status && (
//               <div className="paid-indicator">
//                 ✓
//               </div>
//             )}
//           </div>
//         )
//       }
//     }
//     return null
//   }

//   const handleSubmit = async () => {
//     const regularWage = workSummary.custom_regular_wage ?? employee.wage_hour
//     const overtimeWage = workSummary.custom_overtime_wage ?? employee.wage_overtime

//     const salary_amount =
//       (workSummary.regular_hours * regularWage) +
//       (workSummary.overtime_hours * overtimeWage)

//     const payload = {
//       start_date: startDate,
//       end_date: endDate,
//       employee_id: parseInt(id),
//       payed_amount: workSummary.payed_amount,
//       salary_amount,
//       payment_type: workSummary.payment_type,
//     }

//     try {
//       await post('/api/payment', payload)
//       alert('Payment submitted successfully!')
//       setWorkSummary((prev) => ({
//         ...prev,
//         custom_regular_wage: '',
//         custom_overtime_wage: '',
//         payed_amount: '',
//         pending_payment: 0,
//         payment_type: '',
//       }))
//     } catch (err) {
//       console.error('Payment Error:', err)
//       alert('Something went wrong while submitting payment.')
//     }
//   }

//   return (
//     <div className="monthly-container">
//       {/* Month Filters */}
//       <CRow className="align-items-end mb-3">
//         <CCol xs={12} sm={6} md={3} className="mb-2">
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

//         <CCol xs={12} sm={6} md={3} className="mb-2">
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

//         <CCol xs={12} sm={6} md={3} className="mb-2">
//           <label className="form-label fw-semibold">{t('LABELS.workingHours')}</label>
//           <select className="form-select" value={8} disabled>
//             <option value={8}>8 Hours</option>
//           </select>
//         </CCol>

//         <CCol xs={12} sm={6} md={3} className="mb-2">
//           <button className="btn btn-primary w-100" onClick={handleCalculate}>
//             {t('LABELS.calculate')}
//           </button>
//         </CCol>
//       </CRow>

//       {/* Enhanced Calendar */}
//       {showCalendar && (
//         <div className="calendar-wrapper mb-4">
//           <h6 className="mb-3 text-center calendar-title">Attendance Calendar</h6>
//           <div className="calendar-container">
//             <Calendar
//               className="responsive-calendar"
//               tileClassName={tileClassName}
//               tileContent={tileContent}
//               value={null}
//               showNeighboringMonth={false}
//               minDetail="month"
//               maxDetail="month"
//             />
//           </div>

//           {/* Enhanced Calendar Legend */}
//           <div className="calendar-legend mt-3">
//             <div className="legend-item">
//               <div className="legend-color present-day"></div>
//               <span>Present (P)</span>
//             </div>
//             <div className="legend-item">
//               <div className="legend-color holiday"></div>
//               <span>Holiday (H)</span>
//             </div>
//             <div className="legend-item">
//               <div className="legend-color half-day"></div>
//               <span>Half Day (HD)</span>
//             </div>
//             <div className="legend-item">
//               <div className="legend-color paid-leave"></div>
//               <span>Paid Leave (SL/PL/CL)</span>
//             </div>
//             <div className="legend-item">
//               <div className="legend-symbol">✓</div>
//               <span>Paid</span>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Work Summary & Payment Component */}
//       <WorkSummaryPayment
//         workSummary={workSummary}
//         setWorkSummary={setWorkSummary}
//         employee={employee}
//         onSubmit={handleSubmit}
//         title="Work Summary & Payment"
//       />
//     </div>
//   )
// }

// export default Monthly
