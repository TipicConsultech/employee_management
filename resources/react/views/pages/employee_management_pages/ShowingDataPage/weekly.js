import React, { useState, useEffect, useCallback } from 'react';
import {
  CRow, CCol, CFormInput, CCard, CCardBody, CCardHeader,
  CSpinner, CAlert
} from '@coreui/react';
import { useTranslation } from 'react-i18next';
import { post } from '../../../../util/api';
import WorkSummaryPayment from './WorkSummaryPayment ';

function WeeklyView({ id, employee }) {
  const { t } = useTranslation('global');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekDates, setWeekDates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payload, setPayload] = useState([]);
  const [workSummary, setWorkSummary] = useState({});
  const [showWeekGrid, setShowWeekGrid] = useState(false);
  const [loading, setLoading] = useState(false);
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

  // Fetch work summary
  const fetchWorkSummary = useCallback(async (value) => {
    const selectedDate = new Date(value);
    const dayOfWeek = selectedDate.getDay();
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const weekDays = [];
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      weekDays.push(d.toISOString().split('T')[0]);
    }

    setStartDate(monday.toISOString().split('T')[0]);
    setEndDate(sunday.toISOString().split('T')[0]);
    setWeekDates(weekDays);

    const requestData = {
      employee_id: parseInt(id, 10),
      start_date: monday.toISOString().split('T')[0],
      end_date: sunday.toISOString().split('T')[0],
      working_hours: 8,
    };

    try {
      setLoading(true);
      const response = await post('/api/workSummary', requestData);

      setAttendance(response.attendance || []);
      setPayload(response.payload || []);
      setWorkSummary({
        ...response,
        custom_regular_wage: response.wage_hour ?? employee.wage_hour,
        custom_overtime_wage: response.wage_overtime ?? employee.wage_overtime,
        payed_amount: response.payed_amount ?? 0,
        pending_payment: response.pending_payment ?? 0,
      });
      setShowWeekGrid(true);
      showNotification('success', t('MSG.workSummaryFetched'));
    } catch (err) {
      console.error('Work summary fetch error:', err);
      showNotification('warning', `${t('MSG.errorFetchingWorkSummary')}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [id, employee, showNotification, t]);

  // Submit payment
  const handleSubmit = useCallback(async () => {
    const regularWage = workSummary.custom_regular_wage ?? employee.wage_hour;
    const overtimeWage = workSummary.custom_overtime_wage ?? employee.wage_overtime;

    const salary_amount =
      (workSummary.regular_hours || 0) * regularWage +
      (workSummary.overtime_hours || 0) * overtimeWage;

    const payloadData = {
      start_date: startDate,
      end_date: endDate,
      employee_id: parseInt(id, 10),
      payed_amount: workSummary.payed_amount,
      salary_amount,
      payment_type: workSummary.payment_type,
    };

    try {
      setLoading(true);
      await post('/api/payment', payloadData);
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
      showNotification('warning', `${t('MSG.paymentSubmissionError')}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [id, startDate, endDate, workSummary, employee, showNotification, t]);

  // Handle start date change
  const handleStartDateChange = useCallback((value) => {
    fetchWorkSummary(value);
  }, [fetchWorkSummary]);

  // Fetch initial data (optional, if needed on mount)
  useEffect(() => {
    if (startDate) {
      fetchWorkSummary(startDate);
    }
  }, [startDate, fetchWorkSummary]);

  // Render week grid
  const renderWeekGrid = useCallback(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <CCard className="mb-4 shadow-sm">
        <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
          <strong>{t('LABELS.attendanceWeek')}</strong>
        </CCardHeader>
        <CCardBody>
          <div className="week-grid-horizontal">
            {weekDates.map((date, idx) => {
              const entry = attendance.find((d) => d.date === date);
              const worked = entry?.total_hours || '';
              const isPaid = entry?.payment_status === true;
              const type = entry?.type || '';
              const hasWorked = worked && parseFloat(worked) > 0;

              let cellClass = 'week-day-cell';
              if (type === 'P') {
                cellClass += ' present-day';
              } else if (type === 'H') {
                cellClass += ' holiday';
              } else if (type === 'HD') {
                cellClass += ' half-day';
              } else if (['SL', 'PL', 'CL'].includes(type)) {
                cellClass += ' paid-leave';
              } else {
                cellClass += ' no-work';
              }

              return (
                <div key={date} className={cellClass}>
                  <div className="day-number">{new Date(date).getDate()}</div>
                  {type === 'P' && hasWorked && (
                    <div className="hours-worked">{worked}h</div>
                  )}
                  {type && type !== 'P' && (
                    <div className="type-indicator">{type}</div>
                  )}
                  {isPaid && <div className="paid-indicator">✓</div>}
                </div>
              );
            })}
          </div>

          <div className="calendar-legend mt-3">
            <div className="legend-item">
              <div className="legend-color present-day" />
              <span>{t('LABELS.present')} (P)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color holiday" />
              <span>{t('LABELS.holiday')} (H)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color half-day" />
              <span>{t('LABELS.halfDay')} (HD)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color paid-leave" />
              <span>{t('LABELS.paidLeave')} (SL/PL/CL)</span>
            </div>
            <div className="legend-item">
              <div className="legend-symbol">✓</div>
              <span>{t('LABELS.paid')}</span>
            </div>
          </div>
        </CCardBody>
      </CCard>
    );
  }, [weekDates, attendance, t]);

  // Loading state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <div>
      <style jsx>{`
        .week-grid-horizontal {
          display: flex;
          width: 100%;
          border: 1px solid #28a745;
          border-radius: 4px;
          overflow: hidden;
        }

        .week-day-cell {
          flex: 1;
          min-height: 80px;
          border-right: 1px solid #28a745;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 8px 4px;
        }

        .week-day-cell:last-child {
          border-right: none;
        }

        .week-day-cell.present-day {
          background-color: #d4edda;
          color: #155724;
          border-color: #28a745;
        }

        .week-day-cell.holiday {
          background-color: #fff3cd;
          color: #856404;
          border-color: #ffc107;
        }

        .week-day-cell.half-day {
          background-color: #cce7ff;
          color: #004085;
          border-color: #007bff;
        }

        .week-day-cell.paid-leave {
          background-color: #e2d8f0;
          color: #553c9a;
          border-color: #6f42c1;
        }

        .week-day-cell.no-work {
          background-color: #f8f9fa;
          color: #6c757d;
        }

        .week-day-cell .type-indicator {
          font-size: 12px;
          font-weight: 600;
          color: inherit;
          background-color: rgba(255, 255, 255, 0.3);
          padding: 2px 6px;
          border-radius: 12px;
          margin-top: 2px;
        }

        .week-day-cell .day-number {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .week-day-cell .hours-worked {
          font-size: 14px;
          font-weight: 500;
          color: #28a745;
        }

        .week-day-cell .paid-indicator {
          position: absolute;
          top: 4px;
          right: 4px;
          background-color: #28a745;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          .week-day-cell {
            min-height: 60px;
            padding: 4px 2px;
          }

          .week-day-cell .day-number {
            font-size: 16px;
          }

          .week-day-cell .hours-worked {
            font-size: 12px;
          }
        }

        .calendar-legend {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 12px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
        }

        .legend-color.present-day {
          width: 16px;
          height: 16px;
          background-color: #d4edda;
          border: 1px solid #28a745;
          border-radius: 2px;
        }

        .legend-color.holiday {
          width: 16px;
          height: 16px;
          background-color: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 2px;
        }

        .legend-color.half-day {
          width: 16px;
          height: 16px;
          background-color: #cce7ff;
          border: 1px solid #007bff;
          border-radius: 2px;
        }

        .legend-color.paid-leave {
          width: 16px;
          height: 16px;
          background-color: #e2d8f0;
          border: 1px solid #6f42c1;
          border-radius: 2px;
        }

        .legend-symbol {
          width: 16px;
          height: 16px;
          background-color: #28a745;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
        }
      `}</style>

      <CRow>
        <CCol xs={12}>
          {notification.show && (
            <CAlert
              color={notification.type}
              dismissible
              onClose={() => setNotification({ show: false, type: '', message: '' })}
            >
              {notification.message}
            </CAlert>
          )}

          <CCard className="mb-4 shadow-sm">
            <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
              <strong>{t('LABELS.dateRange')}</strong>
            </CCardHeader>
            <CCardBody>
              <CRow className="mb-3">
                <CCol md={4}>
                  <label>{t('LABELS.startDate')}</label>
                  <CFormInput
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                  />
                </CCol>
                <CCol md={4}>
                  <label>{t('LABELS.endDate')}</label>
                  <CFormInput type="date" value={endDate} readOnly />
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>

          {showWeekGrid && weekDates.length > 0 && renderWeekGrid()}

          {showWeekGrid && (
            <WorkSummaryPayment
              workSummary={workSummary}
              setWorkSummary={setWorkSummary}
              employee={employee}
              onSubmit={handleSubmit}
              title={t('LABELS.weeklyWorkSummaryPayment')}
            />
          )}
        </CCol>
      </CRow>
    </div>
  );
}

export default WeeklyView;


//-----------------------------------------------------------------------------------



// import React, { useState } from 'react';
// import {
//   CRow, CCol, CFormInput,
//   CCard, CCardBody,
// } from '@coreui/react';
// import { useTranslation } from 'react-i18next';
// import { post } from '../../../../util/api';
// import WorkSummaryPayment from './WorkSummaryPayment ';

// function WeeklyView({ id, employee }) {
//   const { t } = useTranslation('global');

//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [weekDates, setWeekDates] = useState([]);
//   const [attendance, setAttendance] = useState([]);
//   const [payload, setPayload] = useState([]);
//   const [workSummary, setWorkSummary] = useState({});
//   const [showWeekGrid, setShowWeekGrid] = useState(false);

//   /* ──────────────────────────────────────────── */
//   /* Pick a day – we auto‑fill Mon‑Sun            */
//   /* ──────────────────────────────────────────── */
//   const handleStartDateChange = async (value) => {
//     const selectedDate = new Date(value);
//     const dayOfWeek = selectedDate.getDay(); // 0 (Sun) → 6 (Sat)

//     // Monday of that week
//     const monday = new Date(selectedDate);
//     monday.setDate(selectedDate.getDate() - ((dayOfWeek + 6) % 7));

//     // Sunday of that week
//     const sunday = new Date(monday);
//     sunday.setDate(monday.getDate() + 6);

//     // create [Mon … Sun] in YYYY‑MM‑DD
//     const weekDays = [];
//     for (let i = 0; i < 7; i += 1) {
//       const d = new Date(monday);
//       d.setDate(monday.getDate() + i);
//       weekDays.push(d.toISOString().split('T')[0]);
//     }

//     setStartDate(monday.toISOString().split('T')[0]);
//     setEndDate(sunday.toISOString().split('T')[0]);
//     setWeekDates(weekDays);

//     const requestData = {
//       employee_id: parseInt(id, 10),
//       start_date: monday.toISOString().split('T')[0],
//       end_date: sunday.toISOString().split('T')[0],
//       working_hours: 8,
//     };

//     try {
//       const response = await post('/api/workSummary', requestData);

//       setAttendance(response.attendance || []);
//       setPayload(response.payload || []);

//       setWorkSummary({
//         ...response,
//         custom_regular_wage: response.wage_hour ?? employee.wage_hour,
//         custom_overtime_wage: response.wage_overtime ?? employee.wage_overtime,
//         payed_amount: response.payed_amount ?? 0,
//         pending_payment: response.pending_payment ?? 0,
//       });

//       setShowWeekGrid(true);
//     } catch (err) {
//       console.error('Work summary fetch error:', err);
//     }
//   };

//   /* ──────────────────────────────────────────── */
//   /* Submit payment                               */
//   /* ──────────────────────────────────────────── */
//   const handleSubmit = async () => {
//     const regularWage = workSummary.custom_regular_wage ?? employee.wage_hour;
//     const overtimeWage = workSummary.custom_overtime_wage ?? employee.wage_overtime;

//     const salary_amount =
//       (workSummary.regular_hours || 0) * regularWage +
//       (workSummary.overtime_hours || 0) * overtimeWage;

//     const payloadData = {
//       start_date: startDate,
//       end_date: endDate,
//       employee_id: parseInt(id, 10),
//       payed_amount: workSummary.payed_amount,
//       salary_amount,
//       payment_type: workSummary.payment_type,
//     };

//     try {
//       await post('/api/payment', payloadData);
//       alert('Payment submitted successfully!');
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

//   /* ──────────────────────────────────────────── */
//   /* Attendance week grid (for the calendar card) */
//   /* ──────────────────────────────────────────── */
//   const renderWeekGrid = () => {
//     const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

//     return (
//       <div className="attendance-card border border-2 rounded rounded-2">
//         <h6 className="mb-3 text-center calendar-title mt-2">
//           Attendance week
//         </h6>

//         <div className="week-grid-horizontal">
//           {weekDates.map((date, idx) => {
//             const entry = attendance.find((d) => d.date === date);
//             const worked = entry?.total_hours || '';
//             const isPaid = entry?.payment_status === true;
//             const type = entry?.type || '';
//             const hasWorked = worked && parseFloat(worked) > 0;

//             // Determine cell class based on type
//             let cellClass = 'week-day-cell';
//             if (type === 'P') {
//               cellClass += ' present-day';
//             } else if (type === 'H') {
//               cellClass += ' holiday';
//             } else if (type === 'HD') {
//               cellClass += ' half-day';
//             } else if (['SL', 'PL', 'CL'].includes(type)) {
//               cellClass += ' paid-leave';
//             } else {
//               cellClass += ' no-work';
//             }

//             return (
//               <div
//                 key={date}
//                 className={cellClass}
//               >
//                 <div className="day-number">{new Date(date).getDate()}</div>
//                 {/* Show hours only for Present days and not for half days */}
//                 {type === 'P' && hasWorked && (
//                   <div className="hours-worked">{worked}h</div>
//                 )}
//                 {/* Show type indicator for non-present days */}
//                 {type && type !== 'P' && (
//                   <div className="type-indicator">{type}</div>
//                 )}
//                 {/* Show paid indicator */}
//                 {isPaid && <div className="paid-indicator">✓</div>}
//               </div>
//             );
//           })}
//         </div>

//         <div className="calendar-legend mt-3">
//           <div className="legend-item">
//             <div className="legend-color present-day" />
//             <span>Present (P)</span>
//           </div>
//           <div className="legend-item">
//             <div className="legend-color holiday" />
//             <span>Holiday (H)</span>
//           </div>
//           <div className="legend-item">
//             <div className="legend-color half-day" />
//             <span>Half Day (HD)</span>
//           </div>
//           <div className="legend-item">
//             <div className="legend-color paid-leave" />
//             <span>Paid Leave (SL/PL/CL)</span>
//           </div>
//           <div className="legend-item">
//             <div className="legend-symbol">✓</div>
//             <span>Paid</span>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   /* ──────────────────────────────────────────── */
//   /* JSX                                          */
//   /* ──────────────────────────────────────────── */
//   return (
//     <div>
//       <style jsx>{`
//         /* Horizontal Week Grid Layout */
//         .week-grid-horizontal {
//           display: flex;
//           width: 100%;
//           border: 1px solid #28a745;
//           border-radius: 4px;
//           overflow: hidden;
//         }

//         .week-day-cell {
//           flex: 1;
//           min-height: 80px;
//           border-right: 1px solid #28a745;
//           display: flex;
//           flex-direction: column;
//           align-items: center;
//           justify-content: center;
//           position: relative;
//           padding: 8px 4px;
//         }

//         .week-day-cell:last-child {
//           border-right: none;
//         }

//         .week-day-cell.has-work {
//           background-color: #d4edda;
//           color: #155724;
//         }

//         .week-day-cell.no-work {
//           background-color: #f8f9fa;
//           color: #6c757d;
//         }

//         /* Different status colors */
//         .week-day-cell.present-day {
//           background-color: #d4edda;
//           color: #155724;
//           border-color: #28a745;
//         }

//         .week-day-cell.holiday {
//           background-color: #fff3cd;
//           color: #856404;
//           border-color: #ffc107;
//         }

//         .week-day-cell.half-day {
//           background-color: #cce7ff;
//           color: #004085;
//           border-color: #007bff;
//         }

//         .week-day-cell.paid-leave {
//           background-color: #e2d8f0;
//           color: #553c9a;
//           border-color: #6f42c1;
//         }

//         .week-day-cell .type-indicator {
//           font-size: 12px;
//           font-weight: 600;
//           color: inherit;
//           background-color: rgba(255, 255, 255, 0.3);
//           padding: 2px 6px;
//           border-radius: 12px;
//           margin-top: 2px;
//         }

//         .week-day-cell .day-number {
//           font-size: 18px;
//           font-weight: bold;
//           margin-bottom: 4px;
//         }

//         .week-day-cell .hours-worked {
//           font-size: 14px;
//           font-weight: 500;
//           color: #28a745;
//         }

//         .week-day-cell .paid-indicator {
//           position: absolute;
//           top: 4px;
//           right: 4px;
//           background-color: #28a745;
//           color: white;
//           border-radius: 50%;
//           width: 16px;
//           height: 16px;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 10px;
//           font-weight: bold;
//         }

//         /* Responsive adjustments */
//         @media (max-width: 768px) {
//           .week-day-cell {
//             min-height: 60px;
//             padding: 4px 2px;
//           }

//           .week-day-cell .day-number {
//             font-size: 16px;
//           }

//           .week-day-cell .hours-worked {
//             font-size: 12px;
//           }
//         }

//         /* Legend styles */
//         .calendar-legend {
//           display: flex;
//           justify-content: center;
//           gap: 20px;
//           margin-top: 12px;
//         }

//         .legend-item {
//           display: flex;
//           align-items: center;
//           gap: 6px;
//           font-size: 12px;
//         }

//         .legend-color.present-day {
//           width: 16px;
//           height: 16px;
//           background-color: #d4edda;
//           border: 1px solid #28a745;
//           border-radius: 2px;
//         }

//         .legend-color.holiday {
//           width: 16px;
//           height: 16px;
//           background-color: #fff3cd;
//           border: 1px solid #ffc107;
//           border-radius: 2px;
//         }

//         .legend-color.half-day {
//           width: 16px;
//           height: 16px;
//           background-color: #cce7ff;
//           border: 1px solid #007bff;
//           border-radius: 2px;
//         }

//         .legend-color.paid-leave {
//           width: 16px;
//           height: 16px;
//           background-color: #e2d8f0;
//           border: 1px solid #6f42c1;
//           border-radius: 2px;
//         }

//         .legend-symbol {
//           width: 16px;
//           height: 16px;
//           background-color: #28a745;
//           color: white;
//           border-radius: 50%;
//           display: flex;
//           align-items: center;
//           justify-content: center;
//           font-size: 10px;
//           font-weight: bold;
//         }

//         .attendance-card {
//           background: white;
//           padding: 16px;
//           margin-bottom: 16px;
//         }

//         .calendar-title {
//           font-weight: 600;
//           color: #333;
//         }
//       `}</style>

//       {/* Date range picker */}
//       <CRow className="mb-3">
//         <CCol md={4}>
//           <label>{t('LABELS.startDate')}</label>
//           <CFormInput
//             type="date"
//             value={startDate}
//             onChange={(e) => handleStartDateChange(e.target.value)}
//           />
//         </CCol>
//         <CCol md={4}>
//           <label>{t('LABELS.endDate')}</label>
//           <CFormInput type="date" value={endDate} readOnly />
//         </CCol>
//       </CRow>

//       {showWeekGrid && weekDates.length > 0 && renderWeekGrid()}

//       {showWeekGrid && (
//         <WorkSummaryPayment
//           workSummary={workSummary}
//           setWorkSummary={setWorkSummary}
//           employee={employee}
//           onSubmit={handleSubmit}
//           title="Weekly Work Summary & Payment"
//         />
//       )}
//     </div>
//   );
// }

// export default WeeklyView;
