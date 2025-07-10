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
  // Add translation hook
  const { t, i18n } = useTranslation("global");

  // State management
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    selectedEmployee: '',
    creditAmount: '',
    paymentType: 'cash'
  });

  // Memoized helper functions to prevent recreating on every render
  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    // Auto hide success messages after 3 seconds
    if (type === 'success') {
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      console.log('Fetching employees...');
      const response = await getAPICall('/api/employees');

      // Debug: Log the entire response
      console.log('API Response:', response);

      // Check different possible response structures
      let employeeData = [];

      if (response && response.success && response.data) {
        // Case 1: Response has success flag and data property
        employeeData = Array.isArray(response.data) ? response.data : [];
      } else if (response && Array.isArray(response)) {
        // Case 2: Response is directly an array
        employeeData = response;
      } else if (response && response.employees) {
        // Case 3: Response has employees property
        employeeData = Array.isArray(response.employees) ? response.employees : [];
      } else if (response && response.data && Array.isArray(response.data)) {
        // Case 4: Response has data property that's an array
        employeeData = response.data;
      }

      console.log('Processed employee data:', employeeData);

      // Filter only active employees if isActive field exists
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
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      selectedEmployee: '',
      creditAmount: '',
      paymentType: 'cash'
    });
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.selectedEmployee) {
      showNotification('warning', t('MSG.pleaseSelectEmployee') || 'Please select an employee');
      return false;
    }

    if (!formData.creditAmount) {
      showNotification('warning', t('MSG.pleaseEnterCreditAmount') || 'Please enter credit amount');
      return false;
    }

    const amount = parseFloat(formData.creditAmount);
    if (isNaN(amount)) {
      showNotification('warning', t('MSG.pleaseEnterValidNumber') || 'Please enter a valid number');
      return false;
    }

    if (amount <= 0) {
      showNotification('warning', t('MSG.amountMustBeGreaterThanZero') || 'Amount must be greater than zero');
      return false;
    }

    return true;
  }, [formData, showNotification, t]);

  const handleSubmitCreditSalary = useCallback(async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const selectedEmployee = employees.find(emp => emp.id.toString() === formData.selectedEmployee);

      if (!selectedEmployee) {
        showNotification('warning', t('MSG.selectedEmployeeNotFound') || 'Selected employee not found');
        return;
      }

      // Prepare data for API - only 3 required fields
      const data = {
        employee_id: parseInt(formData.selectedEmployee),
        payment_type: formData.paymentType,
        payed_amount: parseFloat(formData.creditAmount)
      };

      console.log('Submitting credit salary data:', data);

      // Call API endpoint
      const response = await post('/api/employeeCredit', data);

      if (response && response.id) {
        showNotification('success', t('MSG.advanceCreditedSuccess') || 'Advance Payment credited successfully');
        resetForm();
      } else {
        showNotification('warning', response?.message || t('MSG.failedToCreditSalary') || 'Failed to credit salary');
      }
    } catch (err) {
      console.error('Error crediting salary:', err);
      // Check if this is a 422 error (validation error)
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
    <div className="p-1">
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

      <CCard className="shadow" style={{border: '1px solid rgba(0,0,0,0.125)'}}>
        <CCardHeader className="bg-white border-bottom">
          <div className="d-flex align-items-center mb-2">
            <CIcon icon={cilCreditCard} className="me-2 text-primary" size="lg" />
            <h3 className="mb-0 text-dark fw-semibold">
              {t('LABELS.creditScreen') || 'Credit Salary'}
            </h3>
          </div>
          <p className="text-muted mb-0">
            {t('LABELS.creditSalaryDescription') || 'Credit salary payments to your employees securely'}
          </p>
        </CCardHeader>
        <CCardBody className="p-1">
          <CForm>
            {/* Employee Selection */}
            <div className="mb-4">
              <CFormLabel className="fw-semibold text-dark mb-3">
                {t('LABELS.selectEmployee') || 'Select Employee'} <span className="text-danger">*</span>
              </CFormLabel>
              <div className="position-relative">
                <CFormSelect
                  value={formData.selectedEmployee}
                  onChange={(e) => handleFormChange('selectedEmployee', e.target.value)}
                  disabled={submitting || employees.length === 0}
                  className="form-select-lg border-0 bg-light"
                  style={{ paddingLeft: '50px' }}
                >
                  <option value="">
                    {employees.length === 0
                      ? (t('LABELS.noEmployeesAvailable') || 'No employees available')
                      : (t('LABELS.chooseEmployee') || 'Choose an employee')
                    }
                  </option>
                  {employees.map(employee => (
                    <option key={employee.id} value={employee.id}>
                  {employee.name}
                  {employee.mobile && ` — ${employee.mobile}`}
                  </option>
                  ))}
                </CFormSelect>
                <CIcon
                  icon={cilUser}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                />
              </div>
              {employees.length === 0 && (
                <small className="text-warning d-flex align-items-center mt-2">
                  <CIcon icon={cilWarning} className="me-1" size="sm" />
                  {t('MSG.noEmployeesLoadRetry') || 'No employees loaded. Please refresh or contact support.'}
                </small>
              )}
            </div>

            {/* Credit Salary Amount */}
            <div className="mb-4">
              <CFormLabel className="fw-semibold text-dark mb-3">
                {t('LABELS.creditSalaryAmount') || 'Credit Salary Amount'} <span className="text-danger">*</span>
              </CFormLabel>
              <div className="position-relative">
                <CFormInput
                  type="number"
                  placeholder={t('LABELS.enterAmount') || 'Enter amount'}
                  value={formData.creditAmount}
                  onChange={(e) => handleFormChange('creditAmount', e.target.value)}
                  min="0.01"
                  step="0.01"
                  disabled={submitting}
                  className="form-control-lg border-0 bg-light"
                  style={{ paddingLeft: '50px' }}
                  onInput={(e) => {
                    let inputValue = e.target.value;
                    // Ensure the value has only one decimal point and up to two decimal places
                    inputValue = inputValue.replace(/^(\d*\.?\d{0,2}).*$/, '$1');
                    // Update the value only if it's valid
                    if (inputValue !== e.target.value) {
                      e.target.value = inputValue;
                    }
                  }}
                />
                <span className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted fw-bold">
                  ₹
                </span>
              </div>
              <small className="text-muted d-flex align-items-center mt-2">
                <CIcon icon={cilInfo} className="me-1" size="sm" />
                {t('MSG.enterAmountGreaterThanZero') || 'Enter amount greater than zero'}
              </small>
            </div>

            {/* Payment Type Selection */}
            <div className="mb-4">
              <CFormLabel className="fw-semibold text-dark mb-3">
                {t('LABELS.paymentType') || 'Payment Type'}
              </CFormLabel>
              <div className="position-relative">
                <CFormSelect
                  value={formData.paymentType}
                  onChange={(e) => handleFormChange('paymentType', e.target.value)}
                  disabled={submitting}
                  className="form-select-lg border-0 bg-light"
                  style={{ paddingLeft: '50px' }}
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
                <CIcon
                  icon={cilMoney}
                  className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                />
              </div>
              <small className="text-muted d-flex align-items-center mt-2">
                <CIcon icon={cilInfo} className="me-1" size="sm" />
                {t('MSG.selectPaymentMethod') || 'Select the payment method for salary credit'}
              </small>
            </div>

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
          <CCardFooter className="bg-transparent border-top-0 p-2">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center text-muted">
                <CIcon icon={cilShieldAlt} className="me-2" />
                <small>{t('MSG.allTransactionsSecure') || 'All transactions are secure'}</small>
              </div>
              <div className="d-flex gap-2">
                <CButton
                  color="light"
                  disabled={submitting}
                  onClick={resetForm}
                  className="px-4"
                >
                  Cancel
                </CButton>
                <CButton
                  color="primary"
                  disabled={submitting || employees.length === 0}
                  onClick={handleSubmitCreditSalary}
                  className="px-4"
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
            </div>
          </CCardFooter>
        )}
      </CCard>
    </div>
  );
};

export default CreditSalaryScreen;
