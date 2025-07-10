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

  useEffect(() => {
    getAPICall(`/api/employee/${id}`)
      .then((data) => {
        setEmployee(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading employee:', error);
        setLoading(false);
      });
  }, [id]);

  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
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
      const attendance = response.payload || [];

      // Filter dates within selected range
      const filteredAttendance = attendance.filter((entry) => {
        const date = new Date(entry.date);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });

      // Sum hours
      const regular_hours = filteredAttendance.reduce(
        (sum, item) => sum + (parseFloat(item.worked_hours) || 0),
        0
      );
      const overtime_hours = filteredAttendance.reduce(
        (sum, item) => sum + (parseFloat(item.overtime_hours) || 0),
        0
      );

      setWorkSummary({
        ...response,
        regular_hours,
        overtime_hours,
        custom_regular_wage: response.wage_hour || employee?.wage_hour || 0,
        custom_overtime_wage: response.wage_overtime || employee?.wage_overtime || 0,
        payed_amount: response.payed_amount || 0,
        pending_payment: response.pending_payment || 0,
      });
    } catch (error) {
      console.error('Error fetching work summary:', error);
    }
  };


  const handleSubmit = async () => {
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
      const res = await post('/api/payment', payload);
      const data = await res
      console.log('Payment Submitted:', data);
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
  

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <CRow className="align-items-end mt-4">
        <CCol md={4}>
          <label className="form-label fw-semibold">{t('LABELS.startDate')}</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </CCol>
        <CCol md={4}>
          <label className="form-label fw-semibold">{t('LABELS.endDate')}</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </CCol>
        <CCol md={2}>
          <label className="form-label fw-semibold">{t('LABELS.workingHours')}</label>
          <select className="form-select" disabled>
            <option value={8}>8 Hours</option>
          </select>
        </CCol>
        <CCol md={2}>
          <button className="btn btn-primary w-100" onClick={handleCalculate}>
            {t('LABELS.calculate')}
          </button>
        </CCol>
      </CRow>

      {workSummary && (
        <CCard className="shadow-sm mt-3">
          <CCardBody>
            <CRow className="mb-3">
              <div className="mb-4 fw-semibold">
                {t('LABELS.regularHours')}: {workSummary.regular_hours || 0} &nbsp;|&nbsp;
                {t('LABELS.overtimeHours')}: {workSummary.overtime_hours || 0} &nbsp;|&nbsp;
                {t('LABELS.totalWorkedHours')}:{' '}
                {(workSummary.regular_hours || 0) + (workSummary.overtime_hours || 0)}
              </div>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <label className="form-label">{t('LABELS.regularWagePerHour')}</label>
                <CFormInput
                  type="number"
                  value={Math.max(0, workSummary.custom_regular_wage || 0)}
                  onChange={(e) =>
                    setWorkSummary((prev) => ({
                      ...prev,
                      custom_regular_wage: parseInt(e.target.value || 0),
                    }))
                  }
                />
              </CCol>
              <CCol md={6}>
                <label className="form-label">{t('LABELS.overtimeWagePerHour')}</label>
                <CFormInput
                  type="number"
                  value={Math.max(0, workSummary.custom_overtime_wage || 0)}
                  onChange={(e) =>
                    setWorkSummary((prev) => ({
                      ...prev,
                      custom_overtime_wage: parseInt(e.target.value || 0),
                    }))
                  }
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={4}>
                <label className="form-label">{t('LABELS.regularPayment')}</label>
                <CFormInput
                  type="number"
                  readOnly
                  value={
                    (parseFloat(workSummary.regular_hours) || 0) *
                    (parseFloat(workSummary.custom_regular_wage) || 0)
                  }
                />
              </CCol>
              <CCol md={4}>
                <label className="form-label">{t('LABELS.overtimePayment')}</label>
                <CFormInput
                  type="number"
                  readOnly
                  value={
                    (parseFloat(workSummary.overtime_hours) || 0) *
                    (parseFloat(workSummary.custom_overtime_wage) || 0)
                  }
                />
              </CCol>
              <CCol md={4}>
                <label className="form-label">{t('LABELS.totalCalculatedPayment')}</label>
                <CFormInput
                  type="number"
                  readOnly
                  value={
                    (parseFloat(workSummary.regular_hours || 0) *
                      parseFloat(workSummary.custom_regular_wage || 0)) +
                    (parseFloat(workSummary.overtime_hours || 0) *
                      parseFloat(workSummary.custom_overtime_wage || 0))
                  }
                />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <label className="form-label">{t('LABELS.actualPayment')}</label>
                <CFormInput
                  type="number"
                  value={workSummary.payed_amount || ''}
                  onChange={(e) => {
                    const actual = parseFloat(e.target.value || 0);
                    const total =
                      (parseFloat(workSummary.regular_hours) || 0) *
                        (parseFloat(workSummary.custom_regular_wage) || 0) +
                      (parseFloat(workSummary.overtime_hours) || 0) *
                        (parseFloat(workSummary.custom_overtime_wage) || 0);
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
                <label className="form-label">{t('LABELS.pendingAmount')}</label>
                <CFormInput type="number" readOnly value={workSummary.pending_payment || 0} />
              </CCol>
            </CRow>

            <CRow className="mb-3">
              <CCol md={6}>
                <label className="form-label">{t('LABELS.paymentMethod')}</label>
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

export default Customly;
