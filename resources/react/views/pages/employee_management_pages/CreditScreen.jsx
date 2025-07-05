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
import { useTranslation } from 'react-i18next';
import { getAPICall, post } from '../../../util/api'; // Added post import

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

      if (response && response.success) {
        showNotification('success', t('MSG.salaryCreditedSuccess') || 'Salary credited successfully');
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
          <p>{t('LABELS.loadingEmployees') || 'Loading employees...'}</p>
        </div>
      </CContainer>
    );
  }

  // Error state
  if (error && employees.length === 0) {
    return (
      <CContainer className="p-3">
        <CAlert color="danger">
          <h5>Error Loading Data</h5>
          <p>{error}</p>
          <CButton color="primary" onClick={fetchInitialData}>
            {t('LABELS.retry') || 'Retry'}
          </CButton>
        </CAlert>
      </CContainer>
    );
  }

  // Render component
  return (
    <CContainer fluid className="p-0">
      <CRow className="justify-content-center">
        <CCol xs={12} md={8} lg={6} xl={5}>
          <CCard className="mb-3 shadow-sm">
            <CCardHeader style={{ backgroundColor: "#007bff", color: "white" }}>
              <div className="d-flex justify-content-center align-items-center">
                <h4 className="mb-0 text-center">
                  <i className="fas fa-credit-card me-2"></i>
                  {t('LABELS.creditScreen') || 'Credit Salary'}
                </h4>
              </div>
            </CCardHeader>

            {/* Notifications */}
            {notification.show && (
              <CAlert color={notification.type} dismissible onClose={() => setNotification({ show: false, type: '', message: '' })}>
                {notification.message}
              </CAlert>
            )}

            <CCardBody className="p-4">
              {/* Debug Info (Remove in production) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-3 p-2 bg-light rounded">
                  <small>
                    <strong>Debug:</strong> Found {employees.length} employees
                    {employees.length > 0 && (
                      <ul className="mb-0 mt-1">
                        {employees.slice(0, 3).map(emp => (
                          <li key={emp.id}>{emp.name} (ID: {emp.id})</li>
                        ))}
                        {employees.length > 3 && <li>... and {employees.length - 3} more</li>}
                      </ul>
                    )}
                  </small>
                </div>
              )}

              <CForm>
                {/* Employee Selection */}
                <CRow className="mb-4">
                  <CCol>
                    <CFormLabel className="fw-bold">
                      <i className="fas fa-user me-2"></i>
                      {t('LABELS.selectEmployee') || 'Select Employee'}
                    </CFormLabel>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="fas fa-users"></i>
                      </span>
                      <CFormSelect
                        value={formData.selectedEmployee}
                        onChange={(e) => handleFormChange('selectedEmployee', e.target.value)}
                        disabled={submitting || employees.length === 0}
                        className={formData.selectedEmployee ? 'is-valid' : ''}
                      >
                        <option value="">
                          {employees.length === 0
                            ? (t('LABELS.noEmployeesAvailable') || 'No employees available')
                            : (t('LABELS.chooseEmployee') || 'Choose an employee')
                          }
                        </option>
                        {employees.map(employee => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} {employee.company_id && `(Company: ${employee.company_id})`}
                          </option>
                        ))}
                      </CFormSelect>
                    </div>
                    {employees.length === 0 && (
                      <div className="form-text text-warning">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        {t('MSG.noEmployeesLoadRetry') || 'No employees loaded. Please refresh or contact support.'}
                      </div>
                    )}
                  </CCol>
                </CRow>

                {/* Credit Salary Amount */}
                <CRow className="mb-4">
                  <CCol>
                    <CFormLabel className="fw-bold">
                      <i className="fas fa-dollar-sign me-2"></i>
                      {t('LABELS.creditSalaryAmount') || 'Credit Salary Amount'}
                    </CFormLabel>
                    <div className="input-group">
                      <span className="input-group-text bg-light">₹</span>
                      <CFormInput
                        type="number"
                        placeholder={t('LABELS.enterAmount') || 'Enter amount'}
                        value={formData.creditAmount}
                        onChange={(e) => handleFormChange('creditAmount', e.target.value)}
                        min="0.01"
                        step="0.01"
                        disabled={submitting}
                        className={formData.creditAmount && parseFloat(formData.creditAmount) > 0 ? 'is-valid' : ''}
                        onInput={(e) => {
                          let inputValue = e.target.value;

                          // Ensure the value has only one decimal point and up to two decimal places
                          inputValue = inputValue.replace(/^(\d*\.?\d{0,2}).*$/, '$1');

                          // Update the value only if it's valid (no negative sign or more than two decimals)
                          if (inputValue !== e.target.value) {
                            e.target.value = inputValue;
                          }
                        }}
                      />
                    </div>
                    <div className="form-text">
                      <i className="fas fa-info-circle me-1"></i>
                      {t('MSG.enterAmountGreaterThanZero') || 'Enter amount greater than zero'}
                    </div>
                  </CCol>
                </CRow>

                {/* Payment Type Selection */}
                <CRow className="mb-4">
                  <CCol>
                    <CFormLabel className="fw-bold">
                      <i className="fas fa-credit-card me-2"></i>
                      {t('LABELS.paymentType') || 'Payment Type'}
                    </CFormLabel>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <i className="fas fa-money-bill-wave"></i>
                      </span>
                      <CFormSelect
                        value={formData.paymentType}
                        onChange={(e) => handleFormChange('paymentType', e.target.value)}
                        disabled={submitting}
                        className="is-valid"
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
                    </div>
                    <div className="form-text">
                      <i className="fas fa-info-circle me-1"></i>
                      {t('MSG.selectPaymentMethod') || 'Select the payment method for salary credit'}
                    </div>
                  </CCol>
                </CRow>

                {/* Submit Button */}
                <CRow>
                  <CCol>
                    <div className="d-grid">
                      <CButton
                        color="success"
                        size="lg"
                        disabled={submitting || employees.length === 0}
                        onClick={handleSubmitCreditSalary}
                        className="fw-bold"
                      >
                        {submitting ? (
                          <>
                            <CSpinner size="sm" className="me-2" />
                            {t('LABELS.processing') || 'Processing...'}
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            {t('LABELS.submit') || 'Submit'}
                          </>
                        )}
                      </CButton>
                    </div>
                  </CCol>
                </CRow>
              </CForm>

              {/* No employees state */}
              {employees.length === 0 && !loading && (
                <div className="text-center p-4 mt-3">
                  <div className="text-muted">
                    <i className="fas fa-users fa-3x mb-3"></i>
                    <h5>{t('MSG.noEmployeesAvailable') || 'No Employees Available'}</h5>
                    <p>{t('MSG.contactAdminToAddEmployees') || 'Please contact your administrator to add employees.'}</p>
                    <CButton color="primary" variant="outline" onClick={fetchInitialData}>
                      <i className="fas fa-refresh me-2"></i>
                      {t('LABELS.refresh') || 'Refresh'}
                    </CButton>
                  </div>
                </div>
              )}
            </CCardBody>

            <CCardFooter className="bg-light text-center">
              <small className="text-muted">
                <i className="fas fa-shield-alt me-1"></i>
                {t('MSG.allTransactionsSecure') || 'All transactions are secure'}
              </small>
            </CCardFooter>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default CreditSalaryScreen;
