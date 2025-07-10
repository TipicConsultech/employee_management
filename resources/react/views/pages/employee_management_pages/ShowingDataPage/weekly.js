// import React, { useState } from 'react';
// import {
//   CRow, CCol, CFormInput, CButton, CFormSelect,
//   CCard, CCardBody
// } from '@coreui/react';
// import { useTranslation } from 'react-i18next';
// import { post } from '../../../../util/api';
// import './calendarStyles.css';

// function WeeklyView({ id, employee }) {
//   const { t } = useTranslation('global');

//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [weekDates, setWeekDates] = useState([]);
//   const [attendance, setAttendance] = useState([]);
//   const [workSummary, setWorkSummary] = useState({});
//   const [showWeekGrid, setShowWeekGrid] = useState(false);

//   const handleStartDateChange = async (value) => {
//   setStartDate(value);
//   const start = new Date(value);
//   const day = start.getDay();
//   const monday = new Date(start);
//   monday.setDate(start.getDate() - ((day + 6) % 7));

//   const weekDays = [];
//   for (let i = 0; i < 7; i++) {
//     const d = new Date(monday);
//     d.setDate(monday.getDate() + i);
//     weekDays.push(d.toISOString().split('T')[0]);
//   }

//   const sunday = new Date(monday);
//   sunday.setDate(monday.getDate() + 6);
//   setEndDate(sunday.toISOString().split('T')[0]);
//   setWeekDates(weekDays);

//   // ✅ Call API immediately
//   const requestData = {
//     employee_id: parseInt(id),
//     start_date: value,
//     end_date: sunday.toISOString().split('T')[0],
//     working_hours: 8,
//   };

//   try {
//     const response = await post('/api/workSummary', requestData);
//     setWorkSummary({
//       ...response,
//       custom_regular_wage: response.wage_hour || employee.wage_hour,
//       custom_overtime_wage: response.wage_overtime || employee.wage_overtime,
//       payed_amount: response.payed_amount || 0,
//       pending_payment: response.pending_payment || 0,
//     });
//     setAttendance(response.payload || []);
//     setShowWeekGrid(true); // ✅ Now enable view immediately
//   } catch (error) {
//     console.error('Work summary fetch error:', error);
//   }
// };


//   const handleCalculate = async () => {
//     const requestData = {
//       employee_id: parseInt(id),
//       start_date: startDate,
//       end_date: endDate,
//       working_hours: 8,
//     };

//     try {
//       const response = await post('/api/workSummary', requestData);
//       setWorkSummary({
//         ...response,
//         custom_regular_wage: response.wage_hour || employee.wage_hour,
//         custom_overtime_wage: response.wage_overtime || employee.wage_overtime,
//         payed_amount: response.payed_amount || 0,
//         pending_payment: response.pending_payment || 0,
//       });
//       setAttendance(response.payload || []);
//       setShowWeekGrid(true);
//     } catch (error) {
//       console.error('Work summary fetch error:', error);
//     }
//   };

//  const handleSubmit = async () => {
//    const regularWage = workSummary.custom_regular_wage ?? employee.wage_hour;
//    const overtimeWage = workSummary.custom_overtime_wage ?? employee.wage_overtime;
 
//    const salary_amount =
//      (workSummary.regular_hours * regularWage) +
//      (workSummary.overtime_hours * overtimeWage);
 
//    const payload = {
//      start_date: startDate,
//      end_date: endDate,
//      employee_id: parseInt(id),
//      payed_amount: workSummary.payed_amount,
//      salary_amount,
//      payment_type: workSummary.payment_type,
//    };
 
//    try {
//      const res = await post('/api/payment', payload);
//      const data = await res
//      console.log('Payment Submitted:', data);
//      alert('Payment submitted successfully!');
//        setWorkSummary((prev) => ({
//        ...prev,
//        custom_regular_wage: '',
//        custom_overtime_wage: '',
//        payed_amount: '',
//        pending_payment: 0,
//        payment_type: '',
//      }));
//    } catch (err) {
//      console.error('Payment Error:', err);
//      alert('Something went wrong while submitting payment.');
//    }
//  };
 

//   const renderWeekGrid = () => {
//     const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

//     return (
//       <div className="week-grid">
//         {weekDates.map((date, idx) => {
//           const entry = attendance.find((d) => d.date === date);
//           const worked = entry?.worked_hours || '';
//           const ot = entry?.overtime_hours > 0 ? `+${entry.overtime_hours} OT` : '';
//           return (
//             <div key={date} className="day-cell">
//               <div className="day-header">{days[idx]}</div>
//               <div className="date-number">{new Date(date).getDate()}</div>
//               <div className="hours">
//                 {worked && <div>{worked}h</div>}
//                 {ot && <div className="overtime">{ot}</div>}
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     );
//   };

//   // 💡 Derived weekly data
//   const regularHours = attendance
//     .filter((entry) => weekDates.includes(entry.date))
//     .reduce((sum, entry) => sum + (entry.worked_hours || 0), 0);

//   const overtimeHours = attendance
//     .filter((entry) => weekDates.includes(entry.date))
//     .reduce((sum, entry) => sum + (entry.overtime_hours || 0), 0);

//   const totalWorked = regularHours + overtimeHours;
//   const regularPay = regularHours * (workSummary.custom_regular_wage || 0);
//   const overtimePay = overtimeHours * (workSummary.custom_overtime_wage || 0);
//   const totalPay = regularPay + overtimePay;

//   return (
//     <div>
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
//         <CCol md={4} className="d-flex align-items-end " >
//           <CButton style={{display: "none"}} onClick={handleCalculate}>{t('LABELS.calculate')}</CButton>
//         </CCol>
//       </CRow>

//       {showWeekGrid && weekDates.length > 0 && renderWeekGrid()}

//       {showWeekGrid && (
//         <CCard className="shadow-sm mt-3">
//           <CCardBody>
//             <CRow className="mb-3">
//               <div className="mb-4 fw-semibold">
//                 {t('LABELS.regularHours')}: {regularHours} &nbsp;|&nbsp;
//                 {t('LABELS.overtimeHours')}: {overtimeHours} &nbsp;|&nbsp;
//                 {t('LABELS.totalWorkedHours')}: {totalWorked}
//               </div>
//             </CRow>

//             <CRow className="mb-3">
//               <CCol md={6}>
//                 <label>{t('LABELS.regularWagePerHour')}</label>
//                 <CFormInput
//                   type="number"
//                   value={workSummary.custom_regular_wage}
//                   onChange={(e) =>
//                     setWorkSummary((prev) => ({
//                       ...prev,
//                       custom_regular_wage: parseInt(e.target.value || 0, 10),
//                     }))
//                   }
//                 />
//               </CCol>
//               <CCol md={6}>
//                 <label>{t('LABELS.overtimeWagePerHour')}</label>
//                 <CFormInput
//                   type="number"
//                   value={workSummary.custom_overtime_wage}
//                   onChange={(e) =>
//                     setWorkSummary((prev) => ({
//                       ...prev,
//                       custom_overtime_wage: parseInt(e.target.value || 0, 10),
//                     }))
//                   }
//                 />
//               </CCol>
//             </CRow>

//             <CRow className="mb-3">
//               <CCol md={4}>
//                 <label>{t('LABELS.regularPayment')}</label>
//                 <CFormInput readOnly value={regularPay} />
//               </CCol>
//               <CCol md={4}>
//                 <label>{t('LABELS.overtimePayment')}</label>
//                 <CFormInput readOnly value={overtimePay} />
//               </CCol>
//               <CCol md={4}>
//                 <label>{t('LABELS.totalCalculatedPayment')}</label>
//                 <CFormInput readOnly value={totalPay} />
//               </CCol>
//             </CRow>

//             <CRow className="mb-3">
//               <CCol md={6}>
//                 <label>{t('LABELS.actualPayment')}</label>
//                 <CFormInput
//                   type="number"
//                   value={workSummary.payed_amount}
//                   onChange={(e) => {
//                     const actual = parseInt(e.target.value || 0, 10);
//                     const pending = totalPay - actual;
//                     setWorkSummary((prev) => ({
//                       ...prev,
//                       payed_amount: actual,
//                       pending_payment: pending >= 0 ? pending : 0,
//                     }));
//                   }}
//                 />
//               </CCol>
//               <CCol md={6}>
//                 <label>{t('LABELS.pendingAmount')}</label>
//                 <CFormInput readOnly value={workSummary.pending_payment || 0} />
//               </CCol>
//             </CRow>

//             <CRow className="mb-3">
//               <CCol md={6}>
//                 <label>{t('LABELS.paymentMethod')}</label>
//                 <CFormSelect
//                   value={workSummary.payment_type || ''}
//                   onChange={(e) =>
//                     setWorkSummary((prev) => ({
//                       ...prev,
//                       payment_type: e.target.value,
//                     }))
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
// }

// export default WeeklyView;


import React, { useState } from 'react';
import {
  CRow, CCol, CFormInput, CButton, CFormSelect,
  CCard, CCardBody
} from '@coreui/react';
import { useTranslation } from 'react-i18next';
import { post } from '../../../../util/api';
import './calendarStyles.css';

function WeeklyView({ id, employee }) {
  const { t } = useTranslation('global');

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [weekDates, setWeekDates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payload, setPayload] = useState([]); // For calculations
  const [workSummary, setWorkSummary] = useState({});
  const [showWeekGrid, setShowWeekGrid] = useState(false);

  const handleStartDateChange = async (value) => {
  const selectedDate = new Date(value);
  const dayOfWeek = selectedDate.getDay(); // 0 (Sun) to 6 (Sat)
  
  // Get Monday of that week
  const monday = new Date(selectedDate);
  monday.setDate(selectedDate.getDate() - ((dayOfWeek + 6) % 7)); // (0 -> 6), (1 -> 0), ..., (6 -> 5)

  // Get Sunday of that week
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  // Format all 7 days
  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDays.push(d.toISOString().split('T')[0]);
  }

  setStartDate(monday.toISOString().split('T')[0]);
  setEndDate(sunday.toISOString().split('T')[0]);
  setWeekDates(weekDays);

  const requestData = {
    employee_id: parseInt(id),
    start_date: monday.toISOString().split('T')[0],
    end_date: sunday.toISOString().split('T')[0],
    standard_day_hours: 8,
  };

  try {
    const response = await post('/api/workSummary', requestData);
    setAttendance(response.attendance || []);
    setPayload(response.payload || []);
    setWorkSummary({
      ...response,
      custom_regular_wage: response.wage_hour || employee.wage_hour,
      custom_overtime_wage: response.wage_overtime || employee.wage_overtime,
      payed_amount: response.payed_amount || 0,
      pending_payment: response.pending_payment || 0,
    });

    setShowWeekGrid(true);
  } catch (error) {
    console.error('Work summary fetch error:', error);
  }
};


  const handleSubmit = async () => {
    const regularWage = workSummary.custom_regular_wage ?? employee.wage_hour;
    const overtimeWage = workSummary.custom_overtime_wage ?? employee.wage_overtime;

    const salary_amount =
      (workSummary.regular_hours * regularWage) +
      (workSummary.overtime_hours * overtimeWage);

    const payloadData = {
      start_date: startDate,
      end_date: endDate,
      employee_id: parseInt(id),
      payed_amount: workSummary.payed_amount,
      salary_amount,
      payment_type: workSummary.payment_type,
    };

    try {
      await post('/api/payment', payloadData);
      alert('Payment submitted successfully!');
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
      alert('Something went wrong while submitting payment.');
    }
  };

  const renderWeekGrid = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="week-grid-wrapper">
      {weekDates.map((date, idx) => {
        const entry = attendance.find((d) => d.date === date);
        const worked = entry?.total_hours || '';
        const isPaid = entry?.payment_status === true;

        return (
          <div key={date} className="week-day-box">
            <div className="day-name">{days[idx]}</div>
            <div className="day-number">{new Date(date).getDate()}</div>
            <div className="day-details">
              {worked && <div className="hours">{worked}h</div>}
              {isPaid && <div className="paid-label">Paid</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
};


  // ⬇️ Salary calculations from payload (not attendance)
  const regularHours = payload
    .filter((entry) => weekDates.includes(entry.date))
    .reduce((sum, entry) => sum + (entry.worked_hours || 0), 0);

  const overtimeHours = payload
    .filter((entry) => weekDates.includes(entry.date))
    .reduce((sum, entry) => sum + (entry.overtime_hours || 0), 0);

  const totalWorked = regularHours + overtimeHours;
  const regularPay = regularHours * (workSummary.custom_regular_wage || 0);
  const overtimePay = overtimeHours * (workSummary.custom_overtime_wage || 0);
  const totalPay = regularPay + overtimePay;

  return (
    <div>
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

      {showWeekGrid && weekDates.length > 0 && renderWeekGrid()}

      {showWeekGrid && (
        <CCard className="shadow-sm mt-3">
          <CCardBody>
            <CRow className="mb-3">
              <div className="mb-4 fw-semibold">
                {t('LABELS.regularHours')}: {regularHours} &nbsp;|&nbsp;
                {t('LABELS.overtimeHours')}: {overtimeHours} &nbsp;|&nbsp;
                {t('LABELS.totalWorkedHours')}: {totalWorked}
              </div>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <label>{t('LABELS.regularWagePerHour')}</label>
                <CFormInput
                  type="number"
                  value={workSummary.custom_regular_wage}
                  onChange={(e) =>
                    setWorkSummary((prev) => ({
                      ...prev,
                      custom_regular_wage: parseInt(e.target.value || 0, 10),
                    }))
                  }
                />
              </CCol>
              <CCol md={6}>
                <label>{t('LABELS.overtimeWagePerHour')}</label>
                <CFormInput
                  type="number"
                  value={workSummary.custom_overtime_wage}
                  onChange={(e) =>
                    setWorkSummary((prev) => ({
                      ...prev,
                      custom_overtime_wage: parseInt(e.target.value || 0, 10),
                    }))
                  }
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={4}>
                <label>{t('LABELS.regularPayment')}</label>
                <CFormInput readOnly value={regularPay} />
              </CCol>
              <CCol md={4}>
                <label>{t('LABELS.overtimePayment')}</label>
                <CFormInput readOnly value={overtimePay} />
              </CCol>
              <CCol md={4}>
                <label>{t('LABELS.totalCalculatedPayment')}</label>
                <CFormInput readOnly value={totalPay} />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <label>{t('LABELS.actualPayment')}</label>
                <CFormInput
                  type="number"
                  value={workSummary.payed_amount}
                  onChange={(e) => {
                    const actual = parseInt(e.target.value || 0, 10);
                    const pending = totalPay - actual;
                    setWorkSummary((prev) => ({
                      ...prev,
                      payed_amount: actual,
                      pending_payment: pending >= 0 ? pending : 0,
                    }));
                  }}
                />
              </CCol>
              <CCol md={6}>
                <label>{t('LABELS.pendingAmount')}</label>
                <CFormInput readOnly value={workSummary.pending_payment || 0} />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <label>{t('LABELS.paymentMethod')}</label>
                <CFormSelect
                  value={workSummary.payment_type || ''}
                  onChange={(e) =>
                    setWorkSummary((prev) => ({
                      ...prev,
                      payment_type: e.target.value,
                    }))
                  }
                >
                  <option value="">-- Select Payment Method --</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </CFormSelect>
              </CCol>
            </CRow>

            <div className="d-flex justify-content-end">
              <CButton color="success" onClick={handleSubmit}>
                {t('LABELS.submit')}
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}
    </div>
  );
}

export default WeeklyView;
