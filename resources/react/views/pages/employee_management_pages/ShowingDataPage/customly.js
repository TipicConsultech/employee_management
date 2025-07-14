import React, { useEffect, useState } from 'react';
import {
  CRow,
  CCol,
  CFormInput,
  CButton,
  CFormSelect,
  CCard,
  CCardBody,
} from '@coreui/react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { post, getAPICall } from '../../../../util/api';

function Customly() {
  const { t } = useTranslation('global');
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workSummary, setWorkSummary] = useState(null);

  /* ──────────────────────────────────────────────────────────── */
  /* Load employee once                                          */
  /* ──────────────────────────────────────────────────────────── */
  useEffect(() => {
    getAPICall(`/api/employee/${id}`)
      .then((data) => {
        setEmployee(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading employee:', err);
        setLoading(false);
      });
  }, [id]);

  /* ──────────────────────────────────────────────────────────── */
  /* Calculate work summary                                      */
  /* ──────────────────────────────────────────────────────────── */
  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    const requestData = {
      employee_id: parseInt(id, 10),
      start_date: startDate,
      end_date: endDate,
      working_hours: 8,
    };

    try {
      const res = await post('/api/workSummary', requestData); // util already unwraps .data
      const data = res || {};

      /* 👉  Use what the API already gives us  */
      setWorkSummary({
        ...data,
        custom_regular_wage: data.wage_hour ?? employee?.wage_hour ?? 0,
        custom_overtime_wage: data.wage_overtime ?? employee?.wage_overtime ?? 0,
        payed_amount: data.payed_amount ?? 0,
        pending_payment: data.pending_payment ?? 0,
      });
    } catch (err) {
      console.error('Error fetching work summary:', err);
    }
  };

  /* ──────────────────────────────────────────────────────────── */
  /* Submit payment                                              */
  /* ──────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!workSummary) return;

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
      alert('Payment submitted successfully!');

      /* reset only the editable bits */
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

  /* ──────────────────────────────────────────────────────────── */

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {/* ─── Filters ──────────────────────────────────────────── */}
      <CRow className="align-items-end mt-4">
        <CCol md={4}>
          <label className="form-label fw-semibold">
            {t('LABELS.startDate')}
          </label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </CCol>
        <CCol md={4}>
          <label className="form-label fw-semibold">
            {t('LABELS.endDate')}
          </label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </CCol>
        <CCol md={2}>
          <label className="form-label fw-semibold">
            {t('LABELS.workingHours')}
          </label>
          <select className="form-select" disabled>
            <option value={8}>8 Hours</option>
          </select>
        </CCol>
        <CCol md={2}>
          <button
            className="btn btn-primary w-100"
            onClick={handleCalculate}
          >
            {t('LABELS.calculate')}
          </button>
        </CCol>
      </CRow>

      {/* ─── Results ────────────────────────────────────────── */}
      {workSummary && (
        <CCard className="shadow-sm mt-3 border-0">
          <CCardBody>
            <h4
              className="text-center fw-bold mb-4 text-dark"
              style={{ borderBottom: '2px solid #cce5ff', paddingBottom: '10px' }}
            >
              Work Summary &amp; Payment
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
                      {workSummary.regular_hours ?? 0} hrs
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol md={4}>
                <CCard className="bg-warning-subtle text-center">
                  <CCardBody>
                    <div className="text-muted">Overtime Hours</div>
                    <div className="fw-bold fs-4 text-warning">
                      {workSummary.overtime_hours ?? 0} hrs
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
              <CCol md={4}>
                <CCard className="bg-primary-subtle text-center">
                  <CCardBody>
                    <div className="text-muted">Total Worked Hours</div>
                    <div className="fw-bold fs-4 text-primary">
                      {(workSummary.total_worked_hours ??
                        (workSummary.regular_hours || 0) +
                          (workSummary.overtime_hours || 0))}{' '}
                      hrs
                    </div>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>

            {/* ⚙️ Wage Inputs */}
            <h6 className="fw-semibold text-primary mb-2">
              ⚙️ Wage Configuration
            </h6>
            <CRow className="bg-light-subtle p-3 rounded border mb-4">
              <CCol md={6} className="mb-3">
                <label className="form-label fw-semibold">
                  Regular Wage / Hour
                </label>
                <CFormInput
                  type="number"
                  value={Math.max(0, workSummary.custom_regular_wage || 0)}
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
                  Overtime Wage / Hour
                </label>
                <CFormInput
                  type="number"
                  value={Math.max(0, workSummary.custom_overtime_wage || 0)}
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
            <h6 className="fw-semibold text-success mb-2">
              💰 Payment Breakdown
            </h6>
            <CRow className="bg-success-subtle p-3 rounded mb-4">
              <CCol md={4} className="mb-3">
                <label className="form-label fw-semibold">
                  Regular Payment
                </label>
                <CFormInput
                  type="number"
                  readOnly
                  value={
                    (workSummary.regular_hours || 0) *
                    (workSummary.custom_regular_wage || 0)
                  }
                />
              </CCol>
              <CCol md={4} className="mb-3">
                <label className="form-label fw-semibold">
                  Overtime Payment
                </label>
                <CFormInput
                  type="number"
                  readOnly
                  value={
                    (workSummary.overtime_hours || 0) *
                    (workSummary.custom_overtime_wage || 0)
                  }
                />
              </CCol>
              <CCol md={4}>
                <label className="form-label fw-semibold">
                  Total Calculated Payment
                </label>
                <CFormInput
                  type="number"
                  readOnly
                  value={
                    (workSummary.regular_hours || 0) *
                      (workSummary.custom_regular_wage || 0) +
                    (workSummary.overtime_hours || 0) *
                      (workSummary.custom_overtime_wage || 0)
                  }
                />
              </CCol>
            </CRow>

            {/* 🧾 Payment Status */}
            <h6 className="fw-semibold text-primary mb-2">
              🧾 Payment Status
            </h6>
            <CRow className="bg-info-subtle p-3 rounded mb-4">
              <CCol md={6} className="mb-3">
                <label className="form-label fw-semibold">Actual Payment</label>
                <CFormInput
                  type="number"
                  value={workSummary.payed_amount || ''}
                  onChange={(e) => {
                    const actual = parseFloat(e.target.value || 0);
                    const total =
                      (workSummary.regular_hours || 0) *
                        (workSummary.custom_regular_wage || 0) +
                      (workSummary.overtime_hours || 0) *
                        (workSummary.custom_overtime_wage || 0);
                    const pending = total - actual;
                    setWorkSummary((prev) => ({
                      ...prev,
                      payed_amount: actual,
                      pending_payment: pending >= 0 ? pending : 0,
                    }));
                  }}
                />
              </CCol>
              <CCol md={6}>
                <label className="form-label fw-semibold">
                  Pending Amount
                </label>
                <CFormInput
                  type="number"
                  readOnly
                  className="bg-danger-subtle"
                  value={workSummary.pending_payment || 0}
                />
              </CCol>
            </CRow>

            {/* 💳 Payment Method */}
            <h6 className="fw-semibold text-warning mb-2">
              💳 Payment Method
            </h6>
            <CRow className="bg-warning-subtle p-3 rounded mb-4">
              <CCol md={6}>
                <label className="form-label fw-semibold">
                  Payment Method
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
                ✅ Submit &amp; Save
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}
    </div>
  );
}

export default Customly;
