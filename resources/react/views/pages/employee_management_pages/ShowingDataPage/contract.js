
// _____________________________________________________________________________________ 
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

function Contract() {
  const { t } = useTranslation('global');
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workSummary, setWorkSummary] = useState({
    working_type: 'contract',
    price: 0,
    quantity: 1,
    days_worked: 0,
    total_salary: 0,
    payed_amount: 0,
    pending_payment: 0,
    payment_type: '',
  });

  useEffect(() => {
    getAPICall(`/api/employee/${id}`)
      .then((data) => {
        setEmployee(data);
        setWorkSummary(prev => ({
          ...prev,
          price: data?.price || 0
        }));
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error loading employee:', error);
        setLoading(false);
      });
  }, [id]);

  // Auto-fetch data when both dates are selected
  useEffect(() => {
    if (startDate && endDate && employee) {
      const requestData = {
        employee_id: parseInt(id),
        start_date: startDate,
        end_date: endDate,
      };

      post('/api/contractSummary', requestData)
        .then((response) => {
          const daysWorked = response?.days_worked || 0;
          const price = employee?.price || 0;
          const quantity = workSummary.quantity || 1;
          const total_salary = daysWorked * price * quantity;

          setWorkSummary(prev => ({
            ...prev,
            days_worked: daysWorked,
            price: price,
            total_salary: total_salary,
            pending_payment: total_salary - (prev.payed_amount || 0),
          }));
        })
        .catch((error) => {
          console.error('Error fetching contract summary:', error);
        });
    }
  }, [startDate, endDate, employee, id]);

  const handleSubmit = async () => {
    if (!workSummary.payment_type) {
      alert('Please select payment method.');
      return;
    }

    const payload = {
      start_date: startDate,
      end_date: endDate,
      employee_id: parseInt(id),
      payed_amount: workSummary.payed_amount,
      salary_amount: workSummary.total_salary,
      payment_type: workSummary.payment_type,
      working_type: workSummary.working_type || '',
    };

    try {
      await post('/api/payment', payload);
      alert('Payment submitted successfully!');
    } catch (err) {
      console.error('Payment Error:', err);
      alert('Something went wrong while submitting payment.');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      {/* Date Filter */}
      <CRow className="align-items-end mt-4">
        <CCol md={6}>
          <label className="form-label fw-semibold">{t('LABELS.startDate')}</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </CCol>
        <CCol md={6}>
          <label className="form-label fw-semibold">{t('LABELS.endDate')}</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </CCol>
      </CRow>

      {/* Result Section - Shows by default */}
      {(
        <CCard className="shadow-sm mt-4 border-0">
          <CCardBody>
            <h4 className="text-center fw-bold mb-4 text-dark" style={{ borderBottom: '2px solid #cce5ff', paddingBottom: '10px' }}>
              Payment Info
            </h4>

            {/* 🛠 Working Type, Quantity & Price */}
            <CRow className="mb-4">
              <CCol md={4}>
                <label className="form-label fw-semibold">Working Type</label>
                <CFormInput
                  type="text"
                  placeholder="Enter working type"
                  value={workSummary.working_type || ''}
                  onChange={(e) =>
                    setWorkSummary((prev) => ({
                      ...prev,
                      working_type: e.target.value,
                    }))
                  }
                />
              </CCol>
              <CCol md={4}>
                <label className="form-label fw-semibold">Quantity</label>
                <CFormInput
                  type="number"
                  min="1"
                  placeholder="Enter quantity"
                  value={workSummary.quantity}
                  readOnly={false}
                  disabled={false}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    const quantity = inputValue === '' ? 0 : parseInt(inputValue) || 1;
                    const price = workSummary.price || 0;
                    const daysWorked = workSummary.days_worked || 0;
                    const total_salary = daysWorked * price * quantity;
                    const pending = total_salary - (workSummary.payed_amount || 0);

                    setWorkSummary((prev) => ({
                      ...prev,
                      quantity: quantity,
                      total_salary: total_salary,
                      pending_payment: pending >= 0 ? pending : 0,
                    }));
                  }}
                />
              </CCol>
              <CCol md={4}>
                <label className="form-label fw-semibold">Price per Day</label>
                <CFormInput
                  type="number"
                  value={workSummary.price || ''}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value || 0);
                    const quantity = workSummary.quantity || 1;
                    const daysWorked = workSummary.days_worked || 0;
                    const total_salary = daysWorked * price * quantity;
                    const pending = total_salary - (workSummary.payed_amount || 0);

                    setWorkSummary((prev) => ({
                      ...prev,
                      price: price,
                      total_salary: total_salary,
                      pending_payment: pending >= 0 ? pending : 0,
                    }));
                  }}
                />
              </CCol>
            </CRow>

            {/* 🧾 Payment Status */}
            <h6 className="fw-semibold text-primary mb-2">🧾 Payment Status</h6>
            <CRow className="bg-info-subtle p-3 rounded mb-4">
              <CCol md={6} className="mb-3">
                <label className="form-label fw-semibold">Actual Payment</label>
                <CFormInput
                  type="number"
                  value={workSummary.payed_amount || ''}
                  onChange={(e) => {
                    const actual = parseFloat(e.target.value || 0);
                    const pending = (workSummary.total_salary || 0) - actual;
                    setWorkSummary((prev) => ({
                      ...prev,
                      payed_amount: actual,
                      pending_payment: pending >= 0 ? pending : 0,
                    }));
                  }}
                />
              </CCol>
              <CCol md={6}>
                <label className="form-label fw-semibold">Pending Amount</label>
                <CFormInput
                  type="number"
                  readOnly
                  className="bg-danger-subtle"
                  value={workSummary.pending_payment || 0}
                />
              </CCol>
            </CRow>

            {/* 💳 Payment Method */}
            <h6 className="fw-semibold text-warning mb-2">💳 Payment Method</h6>
            <CRow className="bg-warning-subtle p-3 rounded mb-4">
              <CCol md={6}>
                <label className="form-label fw-semibold">Payment Method</label>
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

            {/* ✅ Submit */}
            <div className="d-flex justify-content-center">
              <CButton color="success" size="lg" onClick={handleSubmit}>
                ✅ Submit & Save
              </CButton>
            </div>
          </CCardBody>
        </CCard>
      )}
    </div>
  );
}

export default Contract;