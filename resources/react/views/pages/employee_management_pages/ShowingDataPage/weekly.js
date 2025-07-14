import React, { useState } from 'react';
import {
  CRow, CCol, CFormInput, CButton, CFormSelect,
  CCard, CCardBody,
} from '@coreui/react';
import { useTranslation } from 'react-i18next';
import { post } from '../../../../util/api';
import './calendarStyles.css';

function WeeklyView({ id, employee }) {
  const { t } = useTranslation('global');

  const [startDate, setStartDate]       = useState('');
  const [endDate, setEndDate]           = useState('');
  const [weekDates, setWeekDates]       = useState([]);
  const [attendance, setAttendance]     = useState([]);
  const [payload, setPayload]           = useState([]);   // still used for the grid
  const [workSummary, setWorkSummary]   = useState({});
  const [showWeekGrid, setShowWeekGrid] = useState(false);

  /* ──────────────────────────────────────────── */
  /* Pick a day – we auto‑fill Mon‑Sun            */
  /* ──────────────────────────────────────────── */
  const handleStartDateChange = async (value) => {
    const selectedDate = new Date(value);
    const dayOfWeek    = selectedDate.getDay();         // 0 (Sun) → 6 (Sat)

    // Monday of that week
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() - ((dayOfWeek + 6) % 7));

    // Sunday of that week
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // create [Mon … Sun] in YYYY‑MM‑DD
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
      employee_id  : parseInt(id, 10),
      start_date   : monday.toISOString().split('T')[0],
      end_date     : sunday.toISOString().split('T')[0],
      working_hours: 8,
    };

    try {
      const response = await post('/api/workSummary', requestData);

      setAttendance(response.attendance || []);
      setPayload(response.payload || []);

      setWorkSummary({
        ...response,
        custom_regular_wage : response.wage_hour     ?? employee.wage_hour,
        custom_overtime_wage: response.wage_overtime ?? employee.wage_overtime,
        payed_amount        : response.payed_amount  ?? 0,
        pending_payment     : response.pending_payment ?? 0,
      });

      setShowWeekGrid(true);
    } catch (err) {
      console.error('Work summary fetch error:', err);
    }
  };

  /* ──────────────────────────────────────────── */
  /* Submit payment                               */
  /* ──────────────────────────────────────────── */
  const handleSubmit = async () => {
    const regularWage  = workSummary.custom_regular_wage  ?? employee.wage_hour;
    const overtimeWage = workSummary.custom_overtime_wage ?? employee.wage_overtime;

    const salary_amount =
      (workSummary.regular_hours  || 0) * regularWage +
      (workSummary.overtime_hours || 0) * overtimeWage;

    const payloadData = {
      start_date  : startDate,
      end_date    : endDate,
      employee_id : parseInt(id, 10),
      payed_amount: workSummary.payed_amount,
      salary_amount,
      payment_type: workSummary.payment_type,
    };

    try {
      await post('/api/payment', payloadData);
      alert('Payment submitted successfully!');
      setWorkSummary((prev) => ({
        ...prev,
        custom_regular_wage : '',
        custom_overtime_wage: '',
        payed_amount        : '',
        pending_payment     : 0,
        payment_type        : '',
      }));
    } catch (err) {
      console.error('Payment Error:', err);
      alert('Something went wrong while submitting payment.');
    }
  };

  /* ──────────────────────────────────────────── */
  /* Attendance week grid (for the calendar card) */
  /* ──────────────────────────────────────────── */
  const renderWeekGrid = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="attendance-card border border-2 rounded rounded-2">
        <h6 className="mb-3 text-center calendar-title mt-2">
          Attendance week
        </h6>

        <div className="week-grid-wrapper">
          {weekDates.map((date, idx) => {
            const entry   = attendance.find((d) => d.date === date);
            const worked  = entry?.total_hours || '';
            const isPaid  = entry?.payment_status === true;

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

        <div className="calendar-legend mt-3">
          <div className="legend-item">
            <div className="legend-color present-day" />
            <span>Present Day</span>
          </div>
          <div className="legend-item">
            <div className="legend-symbol">✓</div>
            <span>Paid</span>
          </div>
        </div>
      </div>
    );
  };

  /* ──────────────────────────────────────────── */
  /* Salary calculations (✅ FIXED)               */
  /* ──────────────────────────────────────────── */
  const regularHours  = workSummary.regular_hours  || 0;           // 8
  const overtimeHours = workSummary.overtime_hours || 0;           // 4

  const regularPay  = regularHours  * (workSummary.custom_regular_wage  || 0);
  const overtimePay = overtimeHours * (workSummary.custom_overtime_wage || 0);
  const totalPay    = regularPay + overtimePay;
  const totalWorked = regularHours + overtimeHours;                // 12

  /* ──────────────────────────────────────────── */
  /* JSX                                          */
  /* ──────────────────────────────────────────── */
  return (
    <div>
      {/* Date range picker */}
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
        <CCard className="shadow-sm mt-3 border-0">
          <CCardBody>
            <h4
              className="text-center fw-bold mb-4"
              style={{ borderBottom: '2px solid #cce5ff', paddingBottom: '10px' }}
            >
              Weekly Work Summary &amp; Payment
            </h4>

            {/* 🕒 Work Hours Overview */}
            <h6 className="text-primary fw-semibold mb-3">
              🕒 Work Hours Overview
            </h6>
            <CRow className="mb-4">
              <CCol md={4}>
                <CCard className="bg-success-subtle text-center">
                  <CCardBody>
                    <div className="text-muted">Regular Hours</div>
                    <div className="fw-bold fs-4 text-success">
                      {regularHours} hrs
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol md={4}>
                <CCard className="bg-warning-subtle text-center">
                  <CCardBody>
                    <div className="text-muted">Overtime Hours</div>
                    <div className="fw-bold fs-4 text-warning">
                      {overtimeHours} hrs
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol md={4}>
                <CCard className="bg-primary-subtle text-center">
                  <CCardBody>
                    <div className="text-muted">Total Worked Hours</div>
                    <div className="fw-bold fs-4 text-primary">
                      {totalWorked} hrs
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>

            {/* ⚙️ Wage Inputs */}
            <h6 className="text-primary fw-semibold mb-3">
              ⚙️ Wage Configuration
            </h6>
            <CRow className="bg-light p-3 rounded mb-4 border border-primary-subtle">
              <CCol md={6} className="mb-3">
                <label className="form-label fw-semibold">
                  {t('LABELS.regularWagePerHour')}
                </label>
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
                <label className="form-label fw-semibold">
                  {t('LABELS.overtimeWagePerHour')}
                </label>
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

            {/* 💰 Payment Breakdown */}
            <h6 className="text-success fw-semibold mb-3">
              💰 Payment Breakdown
            </h6>
            <CRow className="bg-success-subtle p-3 rounded mb-4">
              <CCol md={4} className="mb-3">
                <label className="form-label fw-semibold">
                  {t('LABELS.regularPayment')}
                </label>
                <CFormInput readOnly value={regularPay} />
              </CCol>
              <CCol md={4} className="mb-3">
                <label className="form-label fw-semibold">
                  {t('LABELS.overtimePayment')}
                </label>
                <CFormInput readOnly value={overtimePay} />
              </CCol>
              <CCol md={4}>
                <label className="form-label fw-semibold">
                  {t('LABELS.totalCalculatedPayment')}
                </label>
                <CFormInput readOnly value={totalPay} />
              </CCol>
            </CRow>

            {/* 📥 Payment Status */}
            <h6 className="text-primary fw-semibold mb-3">
              📥 Payment Status
            </h6>
            <CRow className="bg-info-subtle p-3 rounded mb-4">
              <CCol md={6} className="mb-3">
                <label className="form-label fw-semibold">
                  {t('LABELS.actualPayment')}
                </label>
                <CFormInput
                  type="number"
                  value={workSummary.payed_amount}
                  onChange={(e) => {
                    const actual   = parseInt(e.target.value || 0, 10);
                    const pending  = totalPay - actual;
                    setWorkSummary((prev) => ({
                      ...prev,
                      payed_amount   : actual,
                      pending_payment: pending >= 0 ? pending : 0,
                    }));
                  }}
                />
              </CCol>
              <CCol md={6}>
                <label className="form-label fw-semibold">
                  {t('LABELS.pendingAmount')}
                </label>
                <CFormInput
                  readOnly
                  className="bg-danger-subtle"
                  value={workSummary.pending_payment || 0}
                />
              </CCol>
            </CRow>

            {/* 💳 Payment Method */}
            <h6 className="text-warning fw-semibold mb-3">
              💳 Payment Method
            </h6>
            <CRow className="bg-warning-subtle p-3 rounded mb-4">
              <CCol md={6}>
                <label className="form-label fw-semibold">
                  {t('LABELS.paymentMethod')}
                </label>
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

            {/* Submit */}
            <div className="d-flex justify-content-center">
              <CButton color="success" size="lg" onClick={handleSubmit}>
                ✅ {t('LABELS.submit')}
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}
    </div>
  );
}

export default WeeklyView;
