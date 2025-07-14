import React, { useEffect, useState } from 'react';
import {
  CRow,
  CCol,
  CFormInput,
  CButton,
  CFormSelect,
  CCard,
  CCardBody,
  CAlert,
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
  const [errors, setErrors] = useState({});
  const [workSummary, setWorkSummary] = useState({
    working_type: '',
    price: '',
    quantity: '',
    days_worked: 0,
    total_salary: 0,
    payed_amount: '',
    pending_payment: 0,
    payment_type: '',
  });

  useEffect(() => {
    getAPICall(`/api/employee/${id}`)
      .then((data) => {
        setEmployee(data);
        setWorkSummary(prev => ({
          ...prev,
          price: data?.price > 0 ? data.price : ''
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
          const price = parseFloat(workSummary.price) || 0;
          const quantity = parseFloat(workSummary.quantity) || 1;
          const total_salary = daysWorked * price * quantity;

          setWorkSummary(prev => ({
            ...prev,
            days_worked: daysWorked,
            total_salary: total_salary,
            pending_payment: total_salary - (parseFloat(prev.payed_amount) || 0),
          }));
        })
        .catch((error) => {
          console.error('Error fetching contract summary:', error);
        });
    }
  }, [startDate, endDate, employee, id]);

  // Validation functions
  const validateField = (name, value) => {
    let error = '';
    
    switch (name) {
      case 'working_type':
        if (!value.trim()) error = 'Description is required';
        break;
      case 'price':
        if (!value || parseFloat(value) <= 0) error = 'Price must be greater than 0';
        break;
      case 'quantity':
        if (!value || parseFloat(value) <= 0) error = 'Quantity must be greater than 0';
        break;
      case 'payed_amount':
        if (value && parseFloat(value) < 0) error = 'Amount cannot be negative';
        break;
      case 'payment_type':
        if (!value) error = 'Payment method is required';
        break;
      default:
        break;
    }
    
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
    
    return error === '';
  };

  const validateDates = () => {
    let dateErrors = {};
    
    if (!startDate) dateErrors.startDate = 'Start date is required';
    if (!endDate) dateErrors.endDate = 'End date is required';
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      dateErrors.endDate = 'End date must be after start date';
    }
    
    setErrors(prev => ({ ...prev, ...dateErrors }));
    return Object.keys(dateErrors).length === 0;
  };

  const handleNumberInput = (fieldName, value) => {
    // Allow empty string, decimal points, and valid numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWorkSummary(prev => ({
        ...prev,
        [fieldName]: value
      }));
      
      // Only validate if value is not empty
      if (value !== '') {
        validateField(fieldName, value);
      }
      
      // Recalculate totals
      if (fieldName === 'price' || fieldName === 'quantity' || fieldName === 'payed_amount') {
        calculateTotals(fieldName, value);
      }
    }
  };

  const calculateTotals = (changedField, changedValue) => {
    const price = changedField === 'price' ? parseFloat(changedValue) || 0 : parseFloat(workSummary.price) || 0;
    const quantity = changedField === 'quantity' ? parseFloat(changedValue) || 1 : parseFloat(workSummary.quantity) || 1;
    const daysWorked = workSummary.days_worked || 0;
    const payedAmount = changedField === 'payed_amount' ? parseFloat(changedValue) || 0 : parseFloat(workSummary.payed_amount) || 0;
    
    const total_salary = daysWorked * price * quantity;
    const pending_payment = Math.max(0, total_salary - payedAmount);
    
    setWorkSummary(prev => ({
      ...prev,
      total_salary: total_salary,
      pending_payment: pending_payment,
    }));
  };

  const handleSubmit = async () => {
    // Validate all fields
    const isDateValid = validateDates();
    const isWorkingTypeValid = validateField('working_type', workSummary.working_type);
    const isPriceValid = validateField('price', workSummary.price);
    const isQuantityValid = validateField('quantity', workSummary.quantity);
    const isPaymentTypeValid = validateField('payment_type', workSummary.payment_type);
    const isPayedAmountValid = validateField('payed_amount', workSummary.payed_amount);
    
    if (!isDateValid || !isWorkingTypeValid || !isPriceValid || !isQuantityValid || !isPaymentTypeValid || !isPayedAmountValid) {
      return;
    }

    const payload = {
      start_date: startDate,
      end_date: endDate,
      employee_id: parseInt(id),
      payed_amount: parseFloat(workSummary.payed_amount) || 0,
      salary_amount: workSummary.total_salary,
      payment_type: workSummary.payment_type,
      working_type: workSummary.working_type,
    };

    try {
      await post('/api/payment', payload);
      alert('Payment submitted successfully!');
      // Reset form or redirect as needed
    } catch (err) {
      console.error('Payment Error:', err);
      alert('Something went wrong while submitting payment.');
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="container-fluid px-2 px-md-4">
      {/* Date Filter */}
      <CRow className="align-items-end mt-4 g-3">
        <CCol xs={12} md={6}>
          <label className="form-label fw-semibold">{t('LABELS.startDate')}</label>
          <input
            type="date"
            className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              if (errors.startDate) validateDates();
            }}
          />
          {errors.startDate && <div className="invalid-feedback">{errors.startDate}</div>}
        </CCol>
        <CCol xs={12} md={6}>
          <label className="form-label fw-semibold">{t('LABELS.endDate')}</label>
          <input
            type="date"
            className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              if (errors.endDate) validateDates();
            }}
          />
          {errors.endDate && <div className="invalid-feedback">{errors.endDate}</div>}
        </CCol>
      </CRow>

      {/* Result Section */}
      <CCard className="shadow-sm mt-4 border-0">
        <CCardBody className="p-3 p-md-4">
          <h4 className="text-center fw-bold mb-4 text-dark" style={{ borderBottom: '2px solid #cce5ff', paddingBottom: '10px' }}>
            Payment Info
          </h4>

          {/* Working Type, Quantity & Price */}
          <CRow className="mb-4 g-3">
            <CCol xs={12} md={4}>
              <label className="form-label fw-semibold">Description <span className="text-danger">*</span></label>
              <CFormInput
                type="text"
                placeholder="Enter working type"
                value={workSummary.working_type}
                className={errors.working_type ? 'is-invalid' : ''}
                onChange={(e) => {
                  setWorkSummary(prev => ({
                    ...prev,
                    working_type: e.target.value,
                  }));
                  validateField('working_type', e.target.value);
                }}
              />
              {errors.working_type && <div className="invalid-feedback">{errors.working_type}</div>}
            </CCol>

            <CCol xs={12} md={4}>
              <label className="form-label fw-semibold">Quantity <span className="text-danger">*</span></label>
              <CFormInput
                type="text"
                placeholder="Enter quantity (e.g., 0.5, 1, 2.5)"
                value={workSummary.quantity}
                className={errors.quantity ? 'is-invalid' : ''}
                onChange={(e) => handleNumberInput('quantity', e.target.value)}
                onBlur={() => validateField('quantity', workSummary.quantity)}
              />
              {errors.quantity && <div className="invalid-feedback">{errors.quantity}</div>}
            </CCol>

            <CCol xs={12} md={4}>
              <label className="form-label fw-semibold">Price ₹ / Item <span className="text-danger">*</span></label>
              <CFormInput
                type="text"
                placeholder="Enter price (e.g., 0.01, 100, 250.50)"
                value={workSummary.price}
                className={errors.price ? 'is-invalid' : ''}
                onChange={(e) => handleNumberInput('price', e.target.value)}
                onBlur={() => validateField('price', workSummary.price)}
              />
              {errors.price && <div className="invalid-feedback">{errors.price}</div>}
            </CCol>
          </CRow>

          {/* Payment Status */}
          <h6 className="fw-semibold text-primary mb-3">🧾 Payment Status</h6>
          <CRow className="bg-info-subtle p-3 rounded mb-4 g-3">
            {/* <CCol xs={12} md={4}>
              <label className="form-label fw-semibold">Days Worked</label>
              <CFormInput
                type="number"
                value={workSummary.days_worked || 0}
                disabled
                className="bg-light"
              />
            </CCol> */}
            <CCol xs={12} md={4}>
              <label className="form-label fw-semibold">Calculated Amount</label>
              <CFormInput
                type="number"
                value={workSummary.total_salary.toFixed(2)}
                disabled
                className="bg-light"
              />
            </CCol>
            <CCol xs={12} md={4}>
              <label className="form-label fw-semibold">Actual Payment</label>
              <CFormInput
                type="text"
                placeholder="Enter actual payment amount"
                value={workSummary.payed_amount}
                className={errors.payed_amount ? 'is-invalid' : ''}
                onChange={(e) => handleNumberInput('payed_amount', e.target.value)}
                onBlur={() => validateField('payed_amount', workSummary.payed_amount)}
              />
              {errors.payed_amount && <div className="invalid-feedback">{errors.payed_amount}</div>}
            </CCol>
            <CCol xs={12} md={4}>
              <label className="form-label fw-semibold">Pending Amount</label>
              <CFormInput
                type="number"
                readOnly
                className="bg-danger-subtle"
                value={workSummary.pending_payment.toFixed(2)}
              />
            </CCol>
          </CRow>

          {/* Payment Method */}
          <h6 className="fw-semibold text-warning mb-3">💳 Payment Method</h6>
          <CRow className="bg-warning-subtle p-3 rounded mb-4 g-3">
            <CCol xs={12} md={6}>
              <label className="form-label fw-semibold">Payment Method <span className="text-danger">*</span></label>
              <CFormSelect
                value={workSummary.payment_type}
                className={errors.payment_type ? 'is-invalid' : ''}
                onChange={(e) => {
                  setWorkSummary(prev => ({
                    ...prev,
                    payment_type: e.target.value,
                  }));
                  validateField('payment_type', e.target.value);
                }}
              >
                <option value="">-- Select Payment Method --</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </CFormSelect>
              {errors.payment_type && <div className="invalid-feedback">{errors.payment_type}</div>}
            </CCol>
          </CRow>

          {/* Error Summary */}
          {Object.keys(errors).some(key => errors[key]) && (
            <CAlert color="danger" className="mb-4">
              <strong>Please fix the following errors:</strong>
              <ul className="mb-0 mt-2">
                {Object.entries(errors).map(([field, error]) => 
                  error && <li key={field}>{error}</li>
                )}
              </ul>
            </CAlert>
          )}

          {/* Submit Button */}
          <div className="d-flex justify-content-center">
            <CButton 
              color="success" 
              size="lg" 
              onClick={handleSubmit}
              className="px-4 py-2"
            >
              ✅ Submit & Save
            </CButton>
          </div>
        </CCardBody>
      </CCard>
    </div>
  );
}

export default Contract;