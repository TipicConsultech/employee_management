import React, { useEffect, useState, useCallback } from 'react';
import {
  CRow,
  CCol,
  CButton,
  CCard,
  CCardHeader,
  CCardBody,
  CSpinner,
  CAlert,
  CFormLabel,
  CFormInput,
  CFormSelect,
} from '@coreui/react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { post, getAPICall } from '../../../../util/api';
import WorkSummaryPayment from './WorkSummaryPayment ';

import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendarStyles.css';

function Customly() {
  const { t } = useTranslation('global');
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  /* ──────────────────────────────────────────────────────────── */
  /* Load employee once                                          */
  /* ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const data = await getAPICall(`/api/employee/${id}`);
        setEmployee(data);
      } catch (err) {
        console.error('Error loading employee:', err);
        showNotification('warning', `${t('MSG.errorConnectingToServer')}: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id, showNotification, t]);

  /* ──────────────────────────────────────────────────────────── */
  /* Calculate work summary                                      */
  /* ──────────────────────────────────────────────────────────── */
  const handleCalculate = useCallback(async () => {
    if (!startDate || !endDate) {
      showNotification('warning', t('MSG.pleaseSelectDates'));
      return;
    }

    const requestData = {
      employee_id: parseInt(id, 10),
      start_date: startDate,
      end_date: endDate,
    //   working_hours: 8,
    };

    try {
      const res = await post('/api/workSummary', requestData);
      const data = res || {};

      // Set attendance data for calendar
      setAttendance(data.attendance || []);

      /* 👉  Use what the API already gives us  */
      setWorkSummary({
        ...data,
        custom_regular_wage: data.wage_hour ?? employee?.wage_hour ?? 0,
        custom_overtime_wage: data.wage_overtime ?? employee?.wage_overtime ?? 0,
        payed_amount: data.payed_amount ?? 0,
        pending_payment: data.pending_payment ?? 0,
      });

      setShowCalendar(true);
    } catch (err) {
      console.error('Error fetching work summary:', err);
      showNotification('warning', `${t('MSG.error')}: ${err.message}`);
    }
  }, [startDate, endDate, id, employee, showNotification, t]);

  /* ──────────────────────────────────────────────────────────── */
  /* Calendar Helper Functions                                   */
  /* ──────────────────────────────────────────────────────────── */
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

  const getCalendarDateRange = () => {
    if (!startDate || !endDate) return { start: new Date(), end: new Date() };
    const start = new Date(startDate);
    const end = new Date(endDate);
    return { start, end };
  };

  const getNavigationLabel = ({ date, view }) => {
    if (view === 'month') {
      const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    }
    return '';
  };

  /* ──────────────────────────────────────────────────────────── */
  /* Submit payment                                              */
  /* ──────────────────────────────────────────────────────────── */
  const handleSubmit = useCallback(async () => {
    if (!workSummary) {
      showNotification('warning', t('MSG.noWorkSummary'));
      return;
    }

    const regularWage =
      workSummary.custom_regular_wage ?? employee?.wage_hour ?? 0;
    const overtimeWage =
      workSummary.custom_overtime_wage ?? employee?.wage_overtime ?? 0;

    const salary_amount =
      (workSummary.regular_hours || 0) * regularWage +
      (workSummary.overtime_hours || 0) * overtimeWage;

    const payload = {
      start_date: startDate,
      end_date: endDate,
      employee_id: parseInt(id, 10),
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
  }, [workSummary, employee, startDate, endDate, id, showNotification, t]);

  /* ──────────────────────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  const { start: calendarStart, end: calendarEnd } = getCalendarDateRange();

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4 shadow-sm">
          <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
            <div className="d-flex justify-content-between align-items-center flex-wrap">
              <strong>{t('LABELS.workSummary')}</strong>
            </div>
          </CCardHeader>

          <CCardBody>
            {/* Notifications */}
            {notification.show && (
              <CAlert
                color={notification.type}
                dismissible
                onClose={() => setNotification({ show: false, type: '', message: '' })}
              >
                {notification.message}
              </CAlert>
            )}

            {/* ─── Filters ──────────────────────────────────────────── */}
            <CRow className="align-items-end mb-4">
              <CCol md={4}>
                <CFormLabel className="fw-semibold">{t('LABELS.startDate')}</CFormLabel>
                <CFormInput
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </CCol>
              <CCol md={4}>
                <CFormLabel className="fw-semibold">{t('LABELS.endDate')}</CFormLabel>
                <CFormInput
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </CCol>
              {/* <CCol md={2}>
                <CFormLabel className="fw-semibold">{t('LABELS.workingHours')}</CFormLabel>
                <CFormSelect disabled value="8">
                  <option value="8">8 Hours</option>
                </CFormSelect>
              </CCol> */}
              &nbsp;<CCol md={2}>
                <CButton
                  color="primary"
                  className="w-100"
                  onClick={handleCalculate}
                >
                  {t('LABELS.calculate')}
                </CButton>
              </CCol>
            </CRow>

            {/* ─── Multi-Month Calendar ──────────────────────────────── */}
            {showCalendar && (
              <div className="calendar-wrapper mb-4">
                <h6 className="mb-3 text-center calendar-title">
                  {t('LABELS.attendanceCalendar')} ({startDate} to {endDate})
                </h6>

                <div className="text-center mb-3">
                  <small className="text-muted">
                    {t('MSG.showingAttendanceData')}
                  </small>
                </div>

                <div className="calendar-container">
                  <Calendar
                    className="responsive-calendar"
                    tileClassName={tileClassName}
                    tileContent={tileContent}
                    value={null}
                    showNeighboringMonth={false}
                    minDetail="month"
                    maxDetail="month"
                    defaultActiveStartDate={calendarStart}
                    minDate={calendarStart}
                    maxDate={calendarEnd}
                    navigationLabel={getNavigationLabel}
                    onActiveStartDateChange={({ activeStartDate }) => {
                      console.log('Active month changed to:', activeStartDate);
                    }}
                  />
                </div>

                {/* Enhanced Calendar Legend */}
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

                {/* Date Range Summary */}
                <div className="mt-3 p-3 bg-light rounded">
                  <div className="row text-center">
                    <div className="col-md-3">
                      <strong>{t('LABELS.totalDays')}</strong><br />
                      <span className="text-primary">
                        {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1}
                      </span>
                    </div>
                    <div className="col-md-3">
                      <strong>{t('LABELS.presentDays')}</strong><br />
                      <span className="text-success">
                        {attendance.filter(att => att.type === 'P').length}
                      </span>
                    </div>
                    <div className="col-md-3">
                      <strong>{t('LABELS.holidays')}</strong><br />
                      <span className="text-warning">
                        {attendance.filter(att => att.type === 'H').length}
                      </span>
                    </div>
                    <div className="col-md-3">
                      <strong>{t('LABELS.leaves')}</strong><br />
                      <span className="text-info">
                        {attendance.filter(att => ['SL', 'PL', 'CL', 'HD'].includes(att.type)).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── Work Summary & Payment Component ────────────────────── */}
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
}

export default Customly;

//---------------------------------------------------------------------



// import React, { useEffect, useState } from 'react';
// import {
//   CRow,
//   CCol,
//   CFormInput,
//   CButton,
//   CFormSelect,
//   CCard,
//   CCardBody,
// } from '@coreui/react';
// import { useTranslation } from 'react-i18next';
// import { useParams } from 'react-router-dom';
// import { post, getAPICall } from '../../../../util/api';
// import WorkSummaryPayment from './WorkSummaryPayment ';

// import Calendar from 'react-calendar';
// import 'react-calendar/dist/Calendar.css';
// import './calendarStyles.css';

// function Customly() {
//   const { t } = useTranslation('global');
//   const { id } = useParams();

//   const [employee, setEmployee] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [workSummary, setWorkSummary] = useState(null);
//   const [attendance, setAttendance] = useState([]);
//   const [showCalendar, setShowCalendar] = useState(false);

//   /* ──────────────────────────────────────────────────────────── */
//   /* Load employee once                                          */
//   /* ──────────────────────────────────────────────────────────── */
//   useEffect(() => {
//     getAPICall(`/api/employee/${id}`)
//       .then((data) => {
//         setEmployee(data);
//         setLoading(false);
//       })
//       .catch((err) => {
//         console.error('Error loading employee:', err);
//         setLoading(false);
//       });
//   }, [id]);

//   /* ──────────────────────────────────────────────────────────── */
//   /* Calculate work summary                                      */
//   /* ──────────────────────────────────────────────────────────── */
//   const handleCalculate = async () => {
//     if (!startDate || !endDate) {
//       alert('Please select both start and end dates.');
//       return;
//     }

//     const requestData = {
//       employee_id: parseInt(id, 10),
//       start_date: startDate,
//       end_date: endDate,
//       working_hours: 8,
//     };

//     try {
//       const res = await post('/api/workSummary', requestData);
//       const data = res || {};

//       // Set attendance data for calendar
//       setAttendance(data.attendance || []);

//       /* 👉  Use what the API already gives us  */
//       setWorkSummary({
//         ...data,
//         custom_regular_wage: data.wage_hour ?? employee?.wage_hour ?? 0,
//         custom_overtime_wage: data.wage_overtime ?? employee?.wage_overtime ?? 0,
//         payed_amount: data.payed_amount ?? 0,
//         pending_payment: data.pending_payment ?? 0,
//       });

//       setShowCalendar(true);
//     } catch (err) {
//       console.error('Error fetching work summary:', err);
//     }
//   };

//   /* ──────────────────────────────────────────────────────────── */
//   /* Calendar Helper Functions                                   */
//   /* ──────────────────────────────────────────────────────────── */

//   // Enhanced tile styling with different status types
//   const tileClassName = ({ date, view }) => {
//     if (view === 'month') {
//       const dateStr = date.toLocaleDateString('sv-SE');
//       const entry = attendance.find((att) => att.date === dateStr);

//       if (entry) {
//         const type = entry.type || '';

//         // Return different classes based on attendance type
//         if (type === 'P') {
//           return 'present-day';
//         } else if (type === 'H') {
//           return 'holiday';
//         } else if (type === 'HD') {
//           return 'half-day';
//         } else if (['SL', 'PL', 'CL'].includes(type)) {
//           return 'paid-leave';
//         } else {
//           return 'present-day'; // Default for entries with hours but no type
//         }
//       }
//     }
//     return null;
//   };

//   // Enhanced tile content with better status indicators
//   const tileContent = ({ date, view }) => {
//     if (view === 'month') {
//       const dateStr = date.toLocaleDateString('sv-SE');
//       const entry = attendance.find((d) => d.date === dateStr);

//       if (entry) {
//         const type = entry.type || '';
//         const hasWorked = entry.total_hours && parseFloat(entry.total_hours) > 0;

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
//         );
//       }
//     }
//     return null;
//   };

//   // Get the date range for calendar navigation
//   const getCalendarDateRange = () => {
//     if (!startDate || !endDate) return { start: new Date(), end: new Date() };

//     const start = new Date(startDate);
//     const end = new Date(endDate);

//     return { start, end };
//   };

//   // Custom navigation for multi-month view
//   const getNavigationLabel = ({ date, view }) => {
//     if (view === 'month') {
//       const monthNames = [
//         'January', 'February', 'March', 'April', 'May', 'June',
//         'July', 'August', 'September', 'October', 'November', 'December'
//       ];
//       return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
//     }
//     return '';
//   };

//   /* ──────────────────────────────────────────────────────────── */
//   /* Submit payment                                              */
//   /* ──────────────────────────────────────────────────────────── */
//   const handleSubmit = async () => {
//     if (!workSummary) return;

//     const regularWage =
//       workSummary.custom_regular_wage ?? employee?.wage_hour ?? 0;
//     const overtimeWage =
//       workSummary.custom_overtime_wage ?? employee?.wage_overtime ?? 0;

//     const salary_amount =
//       (workSummary.regular_hours || 0) * regularWage +
//       (workSummary.overtime_hours || 0) * overtimeWage;

//     const payload = {
//       start_date: startDate,
//       end_date: endDate,
//       employee_id: parseInt(id, 10),
//       payed_amount: workSummary.payed_amount,
//       salary_amount,
//       payment_type: workSummary.payment_type,
//     };

//     try {
//       await post('/api/payment', payload);
//       alert('Payment submitted successfully!');

//       /* reset only the editable bits */
//       setWorkSummary((prev) => ({
//         ...prev,
//         custom_regular_wage: '',
//         custom_overtime_wage: '',
//         payed_amount: '',
//         pending_payment: 0,
//         payment_type: '',
//       }));
//     } catch (err) {
//       console.error('Payment Error:', err);
//       alert('Something went wrong while submitting payment.');
//     }
//   };

//   /* ──────────────────────────────────────────────────────────── */

//   if (loading) return <p>Loading...</p>;

//   const { start: calendarStart, end: calendarEnd } = getCalendarDateRange();

//   return (
//     <div>
//       {/* ─── Filters ──────────────────────────────────────────── */}
//       <CRow className="align-items-end mt-4">
//         <CCol md={4}>
//           <label className="form-label fw-semibold">
//             {t('LABELS.startDate')}
//           </label>
//           <input
//             type="date"
//             className="form-control"
//             value={startDate}
//             onChange={(e) => setStartDate(e.target.value)}
//           />
//         </CCol>
//         <CCol md={4}>
//           <label className="form-label fw-semibold">
//             {t('LABELS.endDate')}
//           </label>
//           <input
//             type="date"
//             className="form-control"
//             value={endDate}
//             onChange={(e) => setEndDate(e.target.value)}
//           />
//         </CCol>
//         <CCol md={2}>
//           <label className="form-label fw-semibold">
//             {t('LABELS.workingHours')}
//           </label>
//           <select className="form-select" disabled>
//             <option value={8}>8 Hours</option>
//           </select>
//         </CCol>
//         <CCol md={2}>
//           <button
//             className="btn btn-primary w-100"
//             onClick={handleCalculate}
//           >
//             {t('LABELS.calculate')}
//           </button>
//         </CCol>
//       </CRow>

//       {/* ─── Multi-Month Calendar ──────────────────────────────── */}
//       {showCalendar && (
//         <div className="calendar-wrapper mb-4 mt-4">
//           <h6 className="mb-3 text-center calendar-title">
//             Attendance Calendar ({startDate} to {endDate})
//           </h6>

//           {/* Info about date range */}
//           <div className="text-center mb-3">
//             <small className="text-muted">
//               Showing attendance data for the selected date range.
//               Navigate between months to view all data.
//             </small>
//           </div>

//           <div className="calendar-container">
//             <Calendar
//               className="responsive-calendar"
//               tileClassName={tileClassName}
//               tileContent={tileContent}
//               value={null}
//               showNeighboringMonth={false}
//               minDetail="month"
//               maxDetail="month"
//               defaultActiveStartDate={calendarStart}
//               minDate={calendarStart}
//               maxDate={calendarEnd}
//               navigationLabel={getNavigationLabel}
//               // Allow navigation between months in the date range
//               onActiveStartDateChange={({ activeStartDate }) => {
//                 // Optional: You can add logic here to handle month navigation
//                 console.log('Active month changed to:', activeStartDate);
//               }}
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

//           {/* Date Range Summary */}
//           <div className="mt-3 p-3 bg-light rounded">
//             <div className="row text-center">
//               <div className="col-md-3">
//                 <strong>Total Days:</strong><br />
//                 <span className="text-primary">
//                   {Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1}
//                 </span>
//               </div>
//               <div className="col-md-3">
//                 <strong>Present Days:</strong><br />
//                 <span className="text-success">
//                   {attendance.filter(att => att.type === 'P').length}
//                 </span>
//               </div>
//               <div className="col-md-3">
//                 <strong>Holidays:</strong><br />
//                 <span className="text-warning">
//                   {attendance.filter(att => att.type === 'H').length}
//                 </span>
//               </div>
//               <div className="col-md-3">
//                 <strong>Leaves:</strong><br />
//                 <span className="text-info">
//                   {attendance.filter(att => ['SL', 'PL', 'CL', 'HD'].includes(att.type)).length}
//                 </span>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* ─── Work Summary & Payment Component ────────────────────── */}
//       <WorkSummaryPayment
//         workSummary={workSummary}
//         setWorkSummary={setWorkSummary}
//         employee={employee}
//         onSubmit={handleSubmit}
//         title="Work Summary & Payment"
//       />
//     </div>
//   );
// }

// export default Customly;
