import React, { useState, useEffect, useCallback } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CButton,
  CContainer,
  CSpinner,
  CAlert,
  CCardFooter
} from '@coreui/react';
import {
  cilCreditCard,
  cilUser,
  cilPeople,
  cilDollar,
  cilMoney,
  cilInfo,
  cilPaperPlane,
  cilShieldAlt,
  cilReload,
  cilWarning,
  cilCloudUpload
} from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { useTranslation } from 'react-i18next';
import { getAPICall, post } from '../../../util/api';

const CreditSalaryScreen = () => {
  const { t } = useTranslation("global");

  // State management
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [formData, setFormData] = useState({
    selectedEmployee: '',
    creditAmount: '',
    paymentType: 'cash'
  });

  // Memoized helper functions to prevent recreating on every render
  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    if (type === 'success') {
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
    }
  }, []);

  const validateForm = useCallback(() => {
    const errors = {};
    let isValid = true;

    if (!formData.selectedEmployee) {
      errors.selectedEmployee = true;
      isValid = false;
    }

    if (!formData.creditAmount) {
      errors.creditAmount = true;
      isValid = false;
    } else {
      const amount = parseFloat(formData.creditAmount);
      if (isNaN(amount) || amount <= 0) {
        errors.creditAmount = true;
        isValid = false;
      }
    }

    setValidationErrors(errors);

    if (!isValid) {
      if (!formData.selectedEmployee) {
        showNotification('warning', t('MSG.pleaseSelectEmployee') || 'Please select an employee');
      } else if (!formData.creditAmount) {
        showNotification('warning', t('MSG.pleaseEnterCreditAmount') || 'Please enter credit amount');
      } else {
        const amount = parseFloat(formData.creditAmount);
        if (isNaN(amount)) {
          showNotification('warning', t('MSG.pleaseEnterValidNumber') || 'Please enter a valid number');
        } else if (amount <= 0) {
          showNotification('warning', t('MSG.amountMustBeGreaterThanZero') || 'Amount must be greater than zero');
        }
      }
    }

    return isValid;
  }, [formData, showNotification, t]);

  const fetchEmployees = useCallback(async () => {
    try {
      console.log('Fetching employees...');
      const response = await getAPICall('/api/employees');
      console.log('API Response:', response);

      let employeeData = [];
      if (response && response.success && response.data) {
        employeeData = Array.isArray(response.data) ? response.data : [];
      } else if (response && Array.isArray(response)) {
        employeeData = response;
      } else if (response && response.employees) {
        employeeData = Array.isArray(response.employees) ? response.employees : [];
      } else if (response && response.data && Array.isArray(response.data)) {
        employeeData = response.data;
      }

      console.log('Processed employee data:', employeeData);

      const activeEmployees = employeeData.filter(emp =>
        emp && (emp.isActive === undefined || emp.isActive === 1 || emp.isActive === true)
      );

      console.log('Active employees:', activeEmployees);

      if (activeEmployees.length > 0) {
        setEmployees(activeEmployees);
        setError(null);
      } else {
        setEmployees([]);
        if (employeeData.length === 0) {
          showNotification('info', t('MSG.noEmployeesFound') || 'No employees found');
        } else {
          showNotification('info', t('MSG.noActiveEmployeesFound') || 'No active employees found');
        }
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
      setError(err.message);
      showNotification('danger', `${t('MSG.errorConnectingToServer') || 'Error connecting to server'}: ${err.message}`);
    }
  }, [showNotification, t]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await fetchEmployees();
    } catch (err) {
      console.error('Error during initialization:', err);
      setError(err.message);
      showNotification('danger', `${t('MSG.errorInitializingData') || 'Error initializing data'}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees, showNotification, t]);

  // Fetch data on component mount
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Trigger validation on input change
    validateForm();
  }, [validateForm]);

  const resetForm = useCallback(() => {
    setFormData({
      selectedEmployee: '',
      creditAmount: '',
      paymentType: 'cash'
    });
    setValidationErrors({});
  }, []);

  const handleSubmitCreditSalary = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const selectedEmployee = employees.find(emp => emp.id.toString() === formData.selectedEmployee);

      if (!selectedEmployee) {
        showNotification('warning', t('MSG.selectedEmployeeNotFound') || 'Selected employee not found');
        return;
      }

      const data = {
        employee_id: parseInt(formData.selectedEmployee),
        payment_type: formData.paymentType,
        payed_amount: parseFloat(formData.creditAmount)
      };

      console.log('Submitting credit salary data:', data);

      const response = await post('/api/employeeCredit', data);

      if (response && response.id) {
        showNotification('success', t('MSG.advanceCreditedSuccess') || 'Advance Payment credited successfully');
        resetForm();
      } else {
        showNotification('warning', response?.message || t('MSG.failedToCreditSalary') || 'Failed to credit salary');
      }
    } catch (err) {
      console.error('Error crediting salary:', err);
      if (err.message && err.message.includes('422')) {
        showNotification('warning', t('MSG.invalidInputData') || 'Invalid input data');
      } else {
        showNotification('warning', `${t('MSG.error') || 'Error'}: ${err.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData, employees, validateForm, showNotification, resetForm, t]);

  // Loading state
  if (loading) {
    return (
      <CContainer className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="text-center">
          <CSpinner color="primary" className="mb-3" />
          <p className="text-muted">{t('LABELS.loadingEmployees') || 'Loading employees...'}</p>
        </div>
      </CContainer>
    );
  }

  // Error state
  if (error && employees.length === 0) {
    return (
      <CContainer className="p-4">
        <CAlert color="danger" className="border-0 shadow-sm">
          <div className="d-flex align-items-center mb-3">
            <CIcon icon={cilWarning} className="me-2" size="lg" />
            <h5 className="mb-0">Error Loading Data</h5>
          </div>
          <p className="mb-3">{error}</p>
          <CButton color="primary" onClick={fetchInitialData} className="px-4">
            <CIcon icon={cilReload} className="me-2" />
            {t('LABELS.retry') || 'Retry'}
          </CButton>
        </CAlert>
      </CContainer>
    );
  }

  // Render component
  return (
    <div className="p-1" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Notifications */}
      {notification.show && (
        <CAlert
          color={notification.type}
          dismissible
          onClose={() => setNotification({ show: false, type: '', message: '' })}
          className="border-0 shadow-sm mb-4"
        >
          {notification.message}
        </CAlert>
      )}

      <CContainer fluid className="px-0">
        <CCard className="shadow-sm border-0" style={{ borderRadius: '12px' }}>
          <CCardHeader className="bg-white border-0 pb-0" style={{ borderRadius: '12px 12px 0 0' }}>
            <div className="d-flex align-items-center mb-2">
              <div className="d-flex align-items-center justify-content-center me-3"
                   style={{
                     width: '40px',
                     height: '40px',
                     backgroundColor: '#e3f2fd',
                     borderRadius: '8px'
                   }}>
                <CIcon icon={cilUser} className="text-primary" size="lg" />
              </div>
              <div>
                <h4 className="mb-0 text-dark fw-bold">
                  {t('LABELS.creditScreen') || 'Credit Salary'}
                </h4>
                <p className="text-muted mb-0 small">
                  {t('LABELS.creditSalaryDescription') || 'Fill in the details below to credit salary to employee'}
                </p>
              </div>
            </div>
          </CCardHeader>

          <CCardBody className="p-4">
            <CForm>
              <CRow>
                {/* Employee Selection */}
                <CCol md={6} className="mb-4">
                  <CFormLabel className="fw-semibold text-dark mb-2">
                    {t('LABELS.selectEmployee') || 'Employee Name'}
                    <span className="text-danger ms-1">*</span>
                  </CFormLabel>
                  <CFormSelect
                    value={formData.selectedEmployee}
                    onChange={(e) => handleFormChange('selectedEmployee', e.target.value)}
                    disabled={submitting || employees.length === 0}
                    invalid={!!validationErrors.selectedEmployee}
                    className={`form-select ${validationErrors.selectedEmployee ? 'border-danger' : ''}`}
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff',
                      border: validationErrors.selectedEmployee ? '2px solid #dc3545' : '1px solid #d1d5db',
                      boxShadow: 'none'
                    }}
                  >
                    <option value="">
                      {employees.length === 0
                        ? (t('LABELS.noEmployeesAvailable') || 'No employees available')
                        : (t('LABELS.chooseEmployee') || 'Select Employee')
                      }
                    </option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                        {employee.mobile && ` — ${employee.mobile}`}
                      </option>
                    ))}
                  </CFormSelect>
                  {validationErrors.selectedEmployee && (
                    <small className="text-danger d-flex align-items-center mt-2">
                      {t('MSG.pleaseSelectEmployee') || 'Please select an employee'}
                    </small>
                  )}
                </CCol>

                {/* Payment Type Selection */}
                <CCol md={6} className="mb-4">
                  <CFormLabel className="fw-semibold text-dark mb-2">
                    {t('LABELS.paymentType') || 'Payment Type'}
                  </CFormLabel>
                  <CFormSelect
                    value={formData.paymentType}
                    onChange={(e) => handleFormChange('paymentType', e.target.value)}
                    disabled={submitting}
                    className="form-select"
                    style={{
                      padding: '8px 16px',
                      fontSize: '14px',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #d1d5db',
                      boxShadow: 'none'
                    }}
                  >
                    <option value="cash">
                      {t('LABELS.cash') || 'Cash'}
                    </option>
                    <option value="upi">
                      {t('LABELS.upi') || 'UPI'}
                    </option>
                    <option value="bank_transfer">
                      {t('LABELS.bankTransfer') || 'Bank Transfer'}
                    </option>
                  </CFormSelect>
                </CCol>
              </CRow>

              <CRow>
                {/* Credit Salary Amount */}
                <CCol md={6} className="mb-4">
                  <CFormLabel className="fw-semibold text-dark mb-2">
                    {t('LABELS.creditSalaryAmount') || 'Credit Salary Amount'}
                    <span className="text-danger ms-1">*</span>
                  </CFormLabel>
                  <div className="position-relative">
                    <CFormInput
                      type="number"
                      placeholder={t('LABELS.enterAmount') || '0.00'}
                      value={formData.creditAmount}
                      onChange={(e) => handleFormChange('creditAmount', e.target.value)}
                      min="0.01"
                      step="0.01"
                      disabled={submitting}
                      invalid={!!validationErrors.creditAmount}
                      className={`form-control ${validationErrors.creditAmount ? 'border-danger' : ''}`}
                      style={{
                        padding: '8px 16px 8px 40px',
                        fontSize: '14px',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        border: validationErrors.creditAmount ? '2px solid #dc3545' : '1px solid #d1d5db',
                        boxShadow: 'none'
                      }}
                      onInput={(e) => {
                        let inputValue = e.target.value;
                        inputValue = inputValue.replace(/^(\d*\.?\d{0,2}).*$/, '$1');
                        if (inputValue !== e.target.value) {
                          e.target.value = inputValue;
                        }
                      }}
                    />
                    <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fw-bold" style={{ fontSize: '14px' }}>
                      ₹
                    </span>
                  </div>
                  {validationErrors.creditAmount && (
                    <small className="text-danger d-flex align-items-center mt-2">
                      {formData.creditAmount === ''
                        ? (t('MSG.pleaseEnterCreditAmount') || 'Please enter credit amount')
                        : (t('MSG.amountMustBeGreaterThanZero') || 'Amount must be greater than zero')}
                    </small>
                  )}
                </CCol>

                {/* Empty column for spacing */}
                <CCol md={6} className="mb-4">
                  {/* This column can be used for additional fields in the future */}
                </CCol>
              </CRow>

              {/* No employees state */}
              {employees.length === 0 && !loading && (
                <div className="text-center py-5">
                  <div className="mb-4">
                    <CIcon icon={cilPeople} size="3xl" className="text-muted mb-3" />
                    <h5 className="text-dark">{t('MSG.noEmployeesAvailable') || 'No Employees Available'}</h5>
                    <p className="text-muted">{t('MSG.contactAdminToAddEmployees') || 'Please contact your administrator to add employees.'}</p>
                  </div>
                  <CButton color="primary" variant="outline" onClick={fetchInitialData} className="px-4">
                    <CIcon icon={cilReload} className="me-2" />
                    {t('LABELS.refresh') || 'Refresh'}
                  </CButton>
                </div>
              )}
            </CForm>
          </CCardBody>

          {employees.length > 0 && (
            <CCardFooter className="bg-white border-0 p-4" style={{ borderRadius: '0 0 12px 12px' }}>
              <div className="d-flex justify-content-end align-items-center gap-3">
                <CButton
                  color="light"
                  disabled={submitting}
                  onClick={resetForm}
                  className="px-4 py-2"
                  style={{
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    fontWeight: '500'
                  }}
                >
                  {t('LABELS.cancel')}
                </CButton>
                <CButton
                  color="primary"
                  disabled={submitting || employees.length === 0 || validationErrors.selectedEmployee || validationErrors.creditAmount}
                  onClick={handleSubmitCreditSalary}
                  className="px-4 py-2"
                  style={{
                    borderRadius: '8px',
                    fontWeight: '500',
                    backgroundColor: '#007bff',
                    borderColor: '#007bff'
                  }}
                >
                  {submitting ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      {t('LABELS.processing') || 'Processing...'}
                    </>
                  ) : (
                    <>
                      <CIcon icon={cilCloudUpload} className="me-2" />
                      {t('LABELS.submit') || 'Credit Salary'}
                    </>
                  )}
                </CButton>
              </div>
            </CCardFooter>
          )}
        </CCard>
      </CContainer>
    </div>
  );
};

export default CreditSalaryScreen;
