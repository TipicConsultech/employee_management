import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormSelect,
  CFormInput,
  CFormLabel,
  CButton,
  CAlert,
  CSpinner,
  CFormCheck,
  CInputGroup,
  CInputGroupText,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react';
import { cilUser, cilPlus, cilCheckCircle, cilX } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { post } from '../../../util/api';

// Constants
const NOTIFICATION_TIMEOUT = 3000;

// Initial form state
const INITIAL_FORM_DATA = {
  name: '',
  gender: '',
  payment_type: '',
  work_type: '',
  price: '',
  wage_hour: '',
  wage_overtime: '',
  credit: '0',
  debit: '0',
  adhaar_number: '',
  mobile: '',
  refferal_by: '',
  is_login: false,
  password: '',
  re_enter_password: '',
  email:''
};

const INITIAL_NOTIFICATION = {
  show: false,
  type: '',
  message: ''
};

const EmployeeRegistrationForm = () => {
  const { t } = useTranslation("global");

  // Dynamic options with translations
  const GENDER_OPTIONS = useMemo(() => [
    { value: 'male', label: t('LABELS.male') },
    { value: 'female', label: t('LABELS.female') },
    { value: 'other', label: t('LABELS.other') }
  ], [t]);

  const PAYMENT_TYPE_OPTIONS = useMemo(() => [
    { value: 'weekly', label: t('LABELS.weekly') },
    { value: 'monthly', label: t('LABELS.monthly') }
  ], [t]);

  const WORK_TYPE_OPTIONS = useMemo(() => [
    { value: 'fulltime', label: t('LABELS.fullTime') },
    { value: 'contract', label: t('LABELS.contract') }
  ], [t]);

  // State management
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [notification, setNotification] = useState(INITIAL_NOTIFICATION);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});

  // Notification helper
  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    if (type === 'success') {
      setTimeout(() => {
        setNotification(INITIAL_NOTIFICATION);
      }, NOTIFICATION_TIMEOUT);
    }
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(INITIAL_NOTIFICATION);
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = t('MSG.nameRequired');
    if (!formData.gender) newErrors.gender = t('MSG.genderRequired');
    if (!formData.payment_type) newErrors.payment_type = t('MSG.paymentTypeRequired');
    if (!formData.work_type) newErrors.work_type = t('MSG.workTypeRequired');
    if (!formData.price) newErrors.price = t('MSG.priceRequired');
    if (!formData.wage_hour) newErrors.wage_hour = t('MSG.wageHourRequired');
    if (!formData.wage_overtime) newErrors.wage_overtime = t('MSG.wageOvertimeRequired');

    // Number validations
    if (formData.price && (isNaN(formData.price) || parseFloat(formData.price) <= 0)) {
      newErrors.price = t('MSG.pricePositiveNumber');
    }
    if (formData.wage_hour && (isNaN(formData.wage_hour) || parseFloat(formData.wage_hour) <= 0)) {
      newErrors.wage_hour = t('MSG.wageHourPositiveNumber');
    }
    if (formData.wage_overtime && (isNaN(formData.wage_overtime) || parseFloat(formData.wage_overtime) <= 0)) {
      newErrors.wage_overtime = t('MSG.wageOvertimePositiveNumber');
    }
    if (formData.credit && (isNaN(formData.credit) || parseFloat(formData.credit) < 0)) {
      newErrors.credit = t('MSG.creditPositiveNumber');
    }
    if (formData.debit && (isNaN(formData.debit) || parseFloat(formData.debit) < 0)) {
      newErrors.debit = t('MSG.debitPositiveNumber');
    }

    // Adhaar number validation (12 digits)
    if (!formData.adhaar_number) {
      newErrors.adhaar_number = t('MSG.adhaarRequired');
    } else if (!/^\d{12}$/.test(formData.adhaar_number)) {
      newErrors.adhaar_number = t('MSG.adhaarInvalid');
    }

    // Mobile number validation (10 digits)
    if (!formData.mobile) {
      newErrors.mobile = t('MSG.mobileRequired');
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = t('MSG.mobileInvalid');
    }

    // Password validation when login is enabled
    if (formData.is_login) {
      if (!formData.password) {
        newErrors.password = t('MSG.passwordRequired');
      } else if (formData.password.length < 6) {
        newErrors.password = t('MSG.passwordMinLength');
      }

      if (!formData.re_enter_password) {
        newErrors.re_enter_password = t('MSG.reEnterPasswordRequired');
      } else if (formData.password !== formData.re_enter_password) {
        newErrors.re_enter_password = t('MSG.passwordMismatch');
      }

      // Email validation
      if (formData.email && formData.email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
          newErrors.email = t('MSG.emailInvalid');
      }
    }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  // Form handlers
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleNumberInput = useCallback((field, value) => {
    // Allow only positive numbers
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      handleInputChange(field, value);
    }
  }, [handleInputChange]);

  const handleDigitOnlyInput = useCallback((field, value, maxLength) => {
    // Allow only digits up to maxLength
    if (value === '' || (/^\d*$/.test(value) && value.length <= maxLength)) {
      handleInputChange(field, value);
    }
  }, [handleInputChange]);

  const handleCheckboxChange = useCallback((checked) => {
    setFormData(prev => ({
      ...prev,
      is_login: checked,
      password: checked ? prev.password : '',
      re_enter_password: checked ? prev.re_enter_password : ''
    }));
    // Clear password errors when unchecking
    if (!checked) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.password;
        delete newErrors.re_enter_password;
        return newErrors;
      });
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setShowModal(false);
  }, []);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      showNotification('warning', t('MSG.fixErrorsBeforeSubmit'));
      return;
    }

    setSubmitting(true);

    try {
      // Prepare payload - exclude password fields if login is not enabled
      const payload = { ...formData };

      if (!formData.is_login) {
        delete payload.password;
        delete payload.re_enter_password;
      }

      // Remove re_enter_password from payload as it's only for validation
      delete payload.re_enter_password;

      console.log('Submitting employee data:', payload);

      const response = await post('/api/employees', payload);

      if (response && (response.success || response.status === 200 || response.status === 201)) {
        showNotification('success', response.message || t('MSG.employeeRegisteredSuccess'));
        resetForm();
      } else {
        showNotification('danger', response.message || t('MSG.employeeRegistrationFailed'));
      }
    } catch (error) {
      console.error('Error registering employee:', error);
      showNotification('danger', error.message || t('MSG.registrationError'));
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm, showNotification, resetForm, t]);

  // Memoized form validation state
  const isFormValid = useMemo(() => {
    return formData.name.trim() &&
           formData.gender &&
           formData.payment_type &&
           formData.work_type &&
           formData.price &&
           formData.wage_hour &&
           formData.wage_overtime &&
           formData.adhaar_number &&
           formData.mobile;
  }, [formData]);

  const openModal = useCallback(() => {
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const confirmSubmit = useCallback(() => {
    closeModal();
    handleSubmit();
  }, [closeModal, handleSubmit]);

  return (
    <CContainer fluid className="min-h-screen bg-light py-0 py-md-2 p-1">
      <CRow className="justify-content-center">
        <CCol xs={12} className="px-1 px-md-2">
          {/* Notifications */}
          {notification.show && (
            <CRow className="mb-3 mb-md-4">
              <CCol xs={12}>
                <CAlert
                  color={notification.type}
                  dismissible
                  onClose={closeNotification}
                  className="border-0 shadow-sm"
                >
                  {notification.message}
                </CAlert>
              </CCol>
            </CRow>
          )}

          {/* Main Form Card */}
          <CCard className="shadow-sm border-0">
            <CCardHeader className="bg-white border-bottom">
              <CRow className="align-items-center">
                <CCol xs={12}>
                  <div className="d-flex align-items-center">
                    <CIcon icon={cilUser} className="me-2 me-md-3 text-primary" size="lg" />
                    <div>
                      <h1 className="h4 h3-md mb-1 text-dark fw-bold">
                        Create New Employee
                      </h1>
                      <p className="text-muted mb-0 small">
                        Fill in the details below to register a new employee
                      </p>
                    </div>
                  </div>
                </CCol>
              </CRow>
            </CCardHeader>
            <CCardBody className="p-3 p-md-4 p-lg-3">
              <CForm>
                {/* Employee Name and Gender */}
                <CRow className="mb-4">
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.employeeName')}
                      <span className="text-danger ms-1">*</span>
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder={t('LABELS.employeeName')}
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      invalid={!!errors.name}
                      disabled={submitting}
                      className="mb-1"
                    />
                    {errors.name && <div className="text-danger small">{errors.name}</div>}
                  </CCol>
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.gender')}
                      <span className="text-danger ms-1">*</span>
                    </CFormLabel>
                    <CFormSelect
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      invalid={!!errors.gender}
                      disabled={submitting}
                      className="mb-1"
                    >
                      <option value="">{t('LABELS.selectGender')}</option>
                      {GENDER_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </CFormSelect>
                    {errors.gender && <div className="text-danger small">{errors.gender}</div>}
                  </CCol>
                </CRow>

                {/* Payment Type and Work Type */}
                <CRow className="mb-4">
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.paymentType')}
                      <span className="text-danger ms-1">*</span>
                    </CFormLabel>
                    <CFormSelect
                      value={formData.payment_type}
                      onChange={(e) => handleInputChange('payment_type', e.target.value)}
                      invalid={!!errors.payment_type}
                      disabled={submitting}
                      className="mb-1"
                    >
                      <option value="">{t('LABELS.selectPaymentType')}</option>
                      {PAYMENT_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </CFormSelect>
                    {errors.payment_type && <div className="text-danger small">{errors.payment_type}</div>}
                  </CCol>
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.workType')}
                      <span className="text-danger ms-1">*</span>
                    </CFormLabel>
                    <CFormSelect
                      value={formData.work_type}
                      onChange={(e) => handleInputChange('work_type', e.target.value)}
                      invalid={!!errors.work_type}
                      disabled={submitting}
                      className="mb-1"
                    >
                      <option value="">{t('LABELS.selectWorkType')}</option>
                      {WORK_TYPE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </CFormSelect>
                    {errors.work_type && <div className="text-danger small">{errors.work_type}</div>}
                  </CCol>
                </CRow>

                {/* Price, Wage Hour, and Wage Overtime */}
                <CRow className="mb-4">
                  <CCol xs={12} md={4}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.price')}
                      <span className="text-danger ms-1">*</span>
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder={t('LABELS.priceZero')}
                      value={formData.price}
                      onChange={(e) => handleNumberInput('price', e.target.value)}
                      invalid={!!errors.price}
                      disabled={submitting}
                      className="mb-1"
                    />
                    {errors.price && <div className="text-danger small">{errors.price}</div>}
                  </CCol>
                  <CCol xs={12} md={4}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.wageHour')}
                      <span className="text-danger ms-1">*</span>
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder={t('LABELS.priceZero')}
                      value={formData.wage_hour}
                      onChange={(e) => handleNumberInput('wage_hour', e.target.value)}
                      invalid={!!errors.wage_hour}
                      disabled={submitting}
                      className="mb-1"
                    />
                    {errors.wage_hour && <div className="text-danger small">{errors.wage_hour}</div>}
                  </CCol>
                  <CCol xs={12} md={4}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.wageOvertime')}
                      <span className="text-danger ms-1">*</span>
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder={t('LABELS.priceZero')}
                      value={formData.wage_overtime}
                      onChange={(e) => handleNumberInput('wage_overtime', e.target.value)}
                      invalid={!!errors.wage_overtime}
                      disabled={submitting}
                      className="mb-1"
                    />
                    {errors.wage_overtime && <div className="text-danger small">{errors.wage_overtime}</div>}
                  </CCol>
                </CRow>

                {/* Credit and Debit */}
                <CRow className="mb-4">
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.credit')}
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder="0"
                      value={formData.credit}
                      onChange={(e) => handleNumberInput('credit', e.target.value)}
                      invalid={!!errors.credit}
                      disabled={submitting}
                      className="mb-1"
                    />
                    {errors.credit && <div className="text-danger small">{errors.credit}</div>}
                  </CCol>
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.debit')}
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder="0"
                      value={formData.debit}
                      onChange={(e) => handleNumberInput('debit', e.target.value)}
                      invalid={!!errors.debit}
                      disabled={submitting}
                      className="mb-1"
                    />
                    {errors.debit && <div className="text-danger small">{errors.debit}</div>}
                  </CCol>
                </CRow>

                {/* Adhaar Number and Mobile */}
                <CRow className="mb-4">
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.adhaarNumber')}
                      <span className="text-danger ms-1">*</span>
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder={t('LABELS.adhaarNumberPlaceholder')}
                      value={formData.adhaar_number}
                      onChange={(e) => handleDigitOnlyInput('adhaar_number', e.target.value, 12)}
                      invalid={!!errors.adhaar_number}
                      disabled={submitting}
                      className="mb-1"
                    />
                    {errors.adhaar_number && <div className="text-danger small">{errors.adhaar_number}</div>}
                  </CCol>
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.mobile')}
                      <span className="text-danger ms-1">*</span>
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder={t('LABELS.mobileNumberPlaceholder')}
                      value={formData.mobile}
                      onChange={(e) => handleDigitOnlyInput('mobile', e.target.value, 10)}
                      invalid={!!errors.mobile}
                      disabled={submitting}
                      className="mb-1"
                    />
                    {errors.mobile && <div className="text-danger small">{errors.mobile}</div>}
                  </CCol>
                </CRow>

                {/* Email and Referral By */}
                <CRow className="mb-4">
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.email')}
                    </CFormLabel>
                    <CFormInput
                      type="email"
                      placeholder={t('LABELS.email')}
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      invalid={!!errors.email}
                      disabled={submitting}
                      className="mb-1"
                    />
                    {errors.email && <div className="text-danger small">{errors.email}</div>}
                  </CCol>
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.referralBy')}
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder={t('LABELS.referralBy')}
                      value={formData.refferal_by}
                      onChange={(e) => handleInputChange('refferal_by', e.target.value)}
                      disabled={submitting}
                      className="mb-1"
                    />
                  </CCol>
                </CRow>

                {/* Login Checkbox */}
                <CRow className="mb-4">
                  <CCol xs={12}>
                    <CFormCheck
                      id="isLogin"
                      checked={formData.is_login}
                      onChange={(e) => handleCheckboxChange(e.target.checked)}
                      disabled={submitting}
                      label={t('LABELS.isLogin')}
                      className="fw-medium"
                    />
                  </CCol>
                </CRow>

                {/* Password Fields - Show only when Is Login is checked */}
                {formData.is_login && (
                  <CRow className="mb-4">
                    <CCol xs={12} md={6}>
                      <CFormLabel className="fw-semibold text-dark mb-2">
                        {t('LABELS.password')}
                        <span className="text-danger ms-1">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="password"
                        placeholder={t('LABELS.password')}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        invalid={!!errors.password}
                        disabled={submitting}
                        className="mb-1"
                      />
                      {errors.password && <div className="text-danger small">{errors.password}</div>}
                    </CCol>
                    <CCol xs={12} md={6}>
                      <CFormLabel className="fw-semibold text-dark mb-2">
                        {t('LABELS.reEnterPassword')}
                        <span className="text-danger ms-1">*</span>
                      </CFormLabel>
                      <CFormInput
                        type="password"
                        placeholder={t('LABELS.reEnterPassword')}
                        value={formData.re_enter_password}
                        onChange={(e) => handleInputChange('re_enter_password', e.target.value)}
                        invalid={!!errors.re_enter_password}
                        disabled={submitting}
                        className="mb-1"
                      />
                      {errors.re_enter_password && <div className="text-danger small">{errors.re_enter_password}</div>}
                    </CCol>
                  </CRow>
                )}

                {/* Submit Button */}
                <CRow>
                  <CCol xs={12}>
                    <div className="d-flex flex-column flex-sm-row gap-2 justify-content-sm-end">
                      <CButton
                        color="secondary"
                        variant="outline"
                        onClick={resetForm}
                        disabled={submitting}
                        className="px-4 py-2 fw-medium order-2 order-sm-1"
                      >
                        {t('LABELS.cancel')}
                      </CButton>
                      <CButton
                        color="primary"
                        disabled={submitting || !isFormValid}
                        onClick={openModal}
                        className="px-4 py-2 fw-medium order-1 order-sm-2"
                      >
                        {submitting ? (
                          <>
                            <CSpinner size="sm" className="me-2" />
                            {t('LABELS.creating')}
                          </>
                        ) : (
                          <>
                            <CIcon icon={cilCheckCircle} className="me-2" />
                            {t('LABELS.createEmployee')}
                          </>
                        )}
                      </CButton>
                    </div>
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Confirmation Modal */}
      <CModal visible={showModal} onClose={closeModal}>
        <CModalHeader className="border-bottom">
          <CModalTitle className="h5 fw-semibold">
            {t('LABELS.confirmEmployeeCreation')}
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          <p className="mb-3">{t('MSG.confirmEmployeeCreationMessage')}</p>
          <div className="bg-light rounded p-3">
            <p className="mb-2"><strong>{t('LABELS.name')}:</strong> {formData.name}</p>
            <p className="mb-2"><strong>{t('LABELS.gender')}:</strong> {formData.gender}</p>
            <p className="mb-2"><strong>{t('LABELS.paymentType')}:</strong> {formData.payment_type}</p>
            <p className="mb-2"><strong>{t('LABELS.workType')}:</strong> {formData.work_type}</p>
            <p className="mb-2"><strong>{t('LABELS.mobile')}:</strong> {formData.mobile}</p>
            <p className="mb-0"><strong>{t('LABELS.loginAccess')}:</strong> {formData.is_login ? t('LABELS.yes') : t('LABELS.no')}</p>
          </div>
        </CModalBody>
        <CModalFooter className="border-top">
          <CButton
            color="secondary"
            onClick={closeModal}
            className="px-4 py-2"
          >
            {t('LABELS.cancel')}
          </CButton>
          <CButton
            color="primary"
            onClick={confirmSubmit}
            className="px-4 py-2"
          >
            <CIcon icon={cilCheckCircle} className="me-2" />
            {t('LABELS.createEmployee')}
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default EmployeeRegistrationForm;
//------------------------------------------------------------------

// import React, { useState, useCallback, useMemo } from 'react';
// import { useTranslation } from 'react-i18next';
// import {
//   CContainer,
//   CRow,
//   CCol,
//   CCard,
//   CCardBody,
//   CCardHeader,
//   CForm,
//   CFormSelect,
//   CFormInput,
//   CFormLabel,
//   CButton,
//   CAlert,
//   CSpinner,
//   CFormCheck,
//   CInputGroup,
//   CInputGroupText,
//   CModal,
//   CModalHeader,
//   CModalTitle,
//   CModalBody,
//   CModalFooter,
// } from '@coreui/react';
// import { cilUser, cilPlus, cilCheckCircle, cilX } from '@coreui/icons';
// import CIcon from '@coreui/icons-react';
// import { post } from '../../../util/api';

// // Constants
// const NOTIFICATION_TIMEOUT = 3000;

// // Initial form state
// const INITIAL_FORM_DATA = {
//   name: '',
//   gender: '',
//   payment_type: '',
//   work_type: '',
//   price: '',
//   wage_hour: '',
//   wage_overtime: '',
//   credit: '0',
//   debit: '0',
//   adhaar_number: '',
//   mobile: '',
//   refferal_by: '',
//   is_login: false,
//   password: '',
//   re_enter_password: '',
//   email:''
// };

// const INITIAL_NOTIFICATION = {
//   show: false,
//   type: '',
//   message: ''
// };

// const EmployeeRegistrationForm = () => {
//   const { t } = useTranslation("global");

//   // Dynamic options with translations
//   const GENDER_OPTIONS = useMemo(() => [
//     { value: 'male', label: t('LABELS.male') },
//     { value: 'female', label: t('LABELS.female') },
//     { value: 'other', label: t('LABELS.other') }
//   ], [t]);

//   const PAYMENT_TYPE_OPTIONS = useMemo(() => [
//     { value: 'weekly', label: t('LABELS.weekly') },
//     { value: 'monthly', label: t('LABELS.monthly') }
//   ], [t]);

//   const WORK_TYPE_OPTIONS = useMemo(() => [
//     { value: 'fulltime', label: t('LABELS.fullTime') },
//     { value: 'contract', label: t('LABELS.contract') }
//   ], [t]);

//   // State management
//   const [formData, setFormData] = useState(INITIAL_FORM_DATA);
//   const [notification, setNotification] = useState(INITIAL_NOTIFICATION);
//   const [submitting, setSubmitting] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [errors, setErrors] = useState({});

//   // Notification helper
//   const showNotification = useCallback((type, message) => {
//     setNotification({ show: true, type, message });
//     if (type === 'success') {
//       setTimeout(() => {
//         setNotification(INITIAL_NOTIFICATION);
//       }, NOTIFICATION_TIMEOUT);
//     }
//   }, []);

//   const closeNotification = useCallback(() => {
//     setNotification(INITIAL_NOTIFICATION);
//   }, []);

//   // Form validation
//   const validateForm = useCallback(() => {
//     const newErrors = {};

//     // Required fields validation
//     if (!formData.name.trim()) newErrors.name = t('MSG.nameRequired');
//     if (!formData.gender) newErrors.gender = t('MSG.genderRequired');
//     if (!formData.payment_type) newErrors.payment_type = t('MSG.paymentTypeRequired');
//     if (!formData.work_type) newErrors.work_type = t('MSG.workTypeRequired');
//     if (!formData.price) newErrors.price = t('MSG.priceRequired');
//     if (!formData.wage_hour) newErrors.wage_hour = t('MSG.wageHourRequired');
//     if (!formData.wage_overtime) newErrors.wage_overtime = t('MSG.wageOvertimeRequired');

//     // Number validations
//     if (formData.price && (isNaN(formData.price) || parseFloat(formData.price) <= 0)) {
//       newErrors.price = t('MSG.pricePositiveNumber');
//     }
//     if (formData.wage_hour && (isNaN(formData.wage_hour) || parseFloat(formData.wage_hour) <= 0)) {
//       newErrors.wage_hour = t('MSG.wageHourPositiveNumber');
//     }
//     if (formData.wage_overtime && (isNaN(formData.wage_overtime) || parseFloat(formData.wage_overtime) <= 0)) {
//       newErrors.wage_overtime = t('MSG.wageOvertimePositiveNumber');
//     }
//     if (formData.credit && (isNaN(formData.credit) || parseFloat(formData.credit) < 0)) {
//       newErrors.credit = t('MSG.creditPositiveNumber');
//     }
//     if (formData.debit && (isNaN(formData.debit) || parseFloat(formData.debit) < 0)) {
//       newErrors.debit = t('MSG.debitPositiveNumber');
//     }

//     // Adhaar number validation (12 digits)
//     if (!formData.adhaar_number) {
//       newErrors.adhaar_number = t('MSG.adhaarRequired');
//     } else if (!/^\d{12}$/.test(formData.adhaar_number)) {
//       newErrors.adhaar_number = t('MSG.adhaarInvalid');
//     }

//     // Mobile number validation (10 digits)
//     if (!formData.mobile) {
//       newErrors.mobile = t('MSG.mobileRequired');
//     } else if (!/^\d{10}$/.test(formData.mobile)) {
//       newErrors.mobile = t('MSG.mobileInvalid');
//     }

//     // Password validation when login is enabled
//     if (formData.is_login) {
//       if (!formData.password) {
//         newErrors.password = t('MSG.passwordRequired');
//       } else if (formData.password.length < 6) {
//         newErrors.password = t('MSG.passwordMinLength');
//       }

//       if (!formData.re_enter_password) {
//         newErrors.re_enter_password = t('MSG.reEnterPasswordRequired');
//       } else if (formData.password !== formData.re_enter_password) {
//         newErrors.re_enter_password = t('MSG.passwordMismatch');
//       }
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   }, [formData, t]);

//   // Form handlers
//   const handleInputChange = useCallback((field, value) => {
//     setFormData(prev => ({ ...prev, [field]: value }));
//     // Clear error when user starts typing
//     if (errors[field]) {
//       setErrors(prev => ({ ...prev, [field]: '' }));
//     }
//   }, [errors]);

//   const handleNumberInput = useCallback((field, value) => {
//     // Allow only positive numbers
//     if (value === '' || /^\d*\.?\d*$/.test(value)) {
//       handleInputChange(field, value);
//     }
//   }, [handleInputChange]);

//   const handleDigitOnlyInput = useCallback((field, value, maxLength) => {
//     // Allow only digits up to maxLength
//     if (value === '' || (/^\d*$/.test(value) && value.length <= maxLength)) {
//       handleInputChange(field, value);
//     }
//   }, [handleInputChange]);

//   const handleCheckboxChange = useCallback((checked) => {
//     setFormData(prev => ({
//       ...prev,
//       is_login: checked,
//       password: checked ? prev.password : '',
//       re_enter_password: checked ? prev.re_enter_password : ''
//     }));
//     // Clear password errors when unchecking
//     if (!checked) {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors.password;
//         delete newErrors.re_enter_password;
//         return newErrors;
//       });
//     }
//   }, []);

//   const resetForm = useCallback(() => {
//     setFormData(INITIAL_FORM_DATA);
//     setErrors({});
//     setShowModal(false);
//   }, []);

//   // Submit handler
//   const handleSubmit = useCallback(async () => {
//     if (!validateForm()) {
//       showNotification('warning', t('MSG.fixErrorsBeforeSubmit'));
//       return;
//     }

//     setSubmitting(true);

//     try {
//       // Prepare payload - exclude password fields if login is not enabled
//       const payload = { ...formData };

//       if (!formData.is_login) {
//         delete payload.password;
//         delete payload.re_enter_password;
//       }

//       // Remove re_enter_password from payload as it's only for validation
//       delete payload.re_enter_password;

//       console.log('Submitting employee data:', payload);

//       const response = await post('/api/employees', payload);

//       if (response && (response.success || response.status === 200 || response.status === 201)) {
//         showNotification('success', response.message || t('MSG.employeeRegisteredSuccess'));
//         resetForm();
//       } else {
//         showNotification('danger', response.message || t('MSG.employeeRegistrationFailed'));
//       }
//     } catch (error) {
//       console.error('Error registering employee:', error);
//       showNotification('danger', error.message || t('MSG.registrationError'));
//     } finally {
//       setSubmitting(false);
//     }
//   }, [formData, validateForm, showNotification, resetForm, t]);

//   // Memoized form validation state
//   const isFormValid = useMemo(() => {
//     return formData.name.trim() &&
//            formData.gender &&
//            formData.payment_type &&
//            formData.work_type &&
//            formData.price &&
//            formData.wage_hour &&
//            formData.wage_overtime &&
//            formData.adhaar_number &&
//            formData.mobile;
//   }, [formData]);

//   const openModal = useCallback(() => {
//     setShowModal(true);
//   }, []);

//   const closeModal = useCallback(() => {
//     setShowModal(false);
//   }, []);

//   const confirmSubmit = useCallback(() => {
//     closeModal();
//     handleSubmit();
//   }, [closeModal, handleSubmit]);

//   return (
//     <CContainer fluid className="min-h-screen bg-light py-3 py-md-4">
//       <CRow className="justify-content-center">
//         <CCol xs={12} className="px-2 px-md-3">
//           <div style={{ maxWidth: '800px', margin: '0 auto' }}>
//             {/* Header */}
//             <CCard className="mb-3 mb-md-4 shadow-sm border-0">
//               <CCardHeader className="bg-white border-bottom">
//                 <CRow className="align-items-center">
//                   <CCol xs={12}>
//                     <div className="d-flex align-items-center justify-content-between">
//                       <div className="d-flex align-items-center">
//                         <CIcon icon={cilUser} className="me-2 me-md-3 text-primary" size="lg" />
//                         <div>
//                           <h1 className="h4 h3-md mb-1 text-dark fw-bold">
//                             {t('LABELS.createNewEmployee')}
//                           </h1>
//                           <p className="text-muted mb-0 small">
//                             {t('LABELS.addNewEmployeeDescription')}
//                           </p>
//                         </div>
//                       </div>
//                       {/* <CButton
//                         color="secondary"
//                         variant="ghost"
//                         size="sm"
//                         onClick={resetForm}
//                         className="p-2"
//                       >
//                         <CIcon icon={cilX} />
//                       </CButton> */}
//                     </div>
//                   </CCol>
//                 </CRow>
//               </CCardHeader>
//             </CCard>

//             {/* Notifications */}
//             {notification.show && (
//               <CRow className="mb-3 mb-md-4">
//                 <CCol xs={12}>
//                   <CAlert
//                     color={notification.type}
//                     dismissible
//                     onClose={closeNotification}
//                     className="border-0 shadow-sm"
//                   >
//                     {notification.message}
//                   </CAlert>
//                 </CCol>
//               </CRow>
//             )}

//             {/* Main Form */}
//             <CCard className="shadow-sm border-0">
//               <CCardBody className="p-3 p-md-4 p-lg-5">
//                 <CForm>
//                   {/* Employee Name and Gender */}
//                   <CRow className="mb-4">
//                     <CCol xs={12} md={6}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.employeeName')}
//                         <span className="text-danger ms-1">*</span>
//                       </CFormLabel>
//                       <CFormInput
//                         type="text"
//                         placeholder={t('LABELS.employeeName')}
//                         value={formData.name}
//                         onChange={(e) => handleInputChange('name', e.target.value)}
//                         invalid={!!errors.name}
//                         disabled={submitting}
//                         className="mb-1"
//                       />
//                       {errors.name && <div className="text-danger small">{errors.name}</div>}
//                     </CCol>
//                     <CCol xs={12} md={6}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.gender')}
//                         <span className="text-danger ms-1">*</span>
//                       </CFormLabel>
//                       <CFormSelect
//                         value={formData.gender}
//                         onChange={(e) => handleInputChange('gender', e.target.value)}
//                         invalid={!!errors.gender}
//                         disabled={submitting}
//                         className="mb-1"
//                       >
//                         <option value="">{t('LABELS.selectGender')}</option>
//                         {GENDER_OPTIONS.map(option => (
//                           <option key={option.value} value={option.value}>
//                             {option.label}
//                           </option>
//                         ))}
//                       </CFormSelect>
//                       {errors.gender && <div className="text-danger small">{errors.gender}</div>}
//                     </CCol>
//                   </CRow>

//                   {/* Payment Type and Work Type */}
//                   <CRow className="mb-4">
//                     <CCol xs={12} md={6}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.paymentType')}
//                         <span className="text-danger ms-1">*</span>
//                       </CFormLabel>
//                       <CFormSelect
//                         value={formData.payment_type}
//                         onChange={(e) => handleInputChange('payment_type', e.target.value)}
//                         invalid={!!errors.payment_type}
//                         disabled={submitting}
//                         className="mb-1"
//                       >
//                         <option value="">{t('LABELS.selectPaymentType')}</option>
//                         {PAYMENT_TYPE_OPTIONS.map(option => (
//                           <option key={option.value} value={option.value}>
//                             {option.label}
//                           </option>
//                         ))}
//                       </CFormSelect>
//                       {errors.payment_type && <div className="text-danger small">{errors.payment_type}</div>}
//                     </CCol>
//                     <CCol xs={12} md={6}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.workType')}
//                         <span className="text-danger ms-1">*</span>
//                       </CFormLabel>
//                       <CFormSelect
//                         value={formData.work_type}
//                         onChange={(e) => handleInputChange('work_type', e.target.value)}
//                         invalid={!!errors.work_type}
//                         disabled={submitting}
//                         className="mb-1"
//                       >
//                         <option value="">{t('LABELS.selectWorkType')}</option>
//                         {WORK_TYPE_OPTIONS.map(option => (
//                           <option key={option.value} value={option.value}>
//                             {option.label}
//                           </option>
//                         ))}
//                       </CFormSelect>
//                       {errors.work_type && <div className="text-danger small">{errors.work_type}</div>}
//                     </CCol>
//                   </CRow>

//                   {/* Price, Wage Hour, and Wage Overtime */}
//                   <CRow className="mb-4">
//                     <CCol xs={12} md={4}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.price')}
//                         <span className="text-danger ms-1">*</span>
//                       </CFormLabel>
//                       <CFormInput
//                         type="text"
//                         placeholder={t('LABELS.priceZero')}
//                         value={formData.price}
//                         onChange={(e) => handleNumberInput('price', e.target.value)}
//                         invalid={!!errors.price}
//                         disabled={submitting}
//                         className="mb-1"
//                       />
//                       {errors.price && <div className="text-danger small">{errors.price}</div>}
//                     </CCol>
//                     <CCol xs={12} md={4}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.wageHour')}
//                         <span className="text-danger ms-1">*</span>
//                       </CFormLabel>
//                       <CFormInput
//                         type="text"
//                         placeholder={t('LABELS.priceZero')}
//                         value={formData.wage_hour}
//                         onChange={(e) => handleNumberInput('wage_hour', e.target.value)}
//                         invalid={!!errors.wage_hour}
//                         disabled={submitting}
//                         className="mb-1"
//                       />
//                       {errors.wage_hour && <div className="text-danger small">{errors.wage_hour}</div>}
//                     </CCol>
//                     <CCol xs={12} md={4}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.wageOvertime')}
//                         <span className="text-danger ms-1">*</span>
//                       </CFormLabel>
//                       <CFormInput
//                         type="text"
//                         placeholder={t('LABELS.priceZero')}
//                         value={formData.wage_overtime}
//                         onChange={(e) => handleNumberInput('wage_overtime', e.target.value)}
//                         invalid={!!errors.wage_overtime}
//                         disabled={submitting}
//                         className="mb-1"
//                       />
//                       {errors.wage_overtime && <div className="text-danger small">{errors.wage_overtime}</div>}
//                     </CCol>
//                   </CRow>

//                   {/* Credit and Debit */}
//                   <CRow className="mb-4">
//                     <CCol xs={12} md={6}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.credit')}
//                       </CFormLabel>
//                       <CFormInput
//                         type="text"
//                         placeholder="0"
//                         value={formData.credit}
//                         onChange={(e) => handleNumberInput('credit', e.target.value)}
//                         invalid={!!errors.credit}
//                         disabled={submitting}
//                         className="mb-1"
//                       />
//                       {errors.credit && <div className="text-danger small">{errors.credit}</div>}
//                     </CCol>
//                     <CCol xs={12} md={6}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.debit')}
//                       </CFormLabel>
//                       <CFormInput
//                         type="text"
//                         placeholder="0"
//                         value={formData.debit}
//                         onChange={(e) => handleNumberInput('debit', e.target.value)}
//                         invalid={!!errors.debit}
//                         disabled={submitting}
//                         className="mb-1"
//                       />
//                       {errors.debit && <div className="text-danger small">{errors.debit}</div>}
//                     </CCol>
//                   </CRow>

//                   {/* Adhaar Number and Mobile */}
//                   <CRow className="mb-4">
//                     <CCol xs={12} md={6}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.adhaarNumber')}
//                         <span className="text-danger ms-1">*</span>
//                       </CFormLabel>
//                       <CFormInput
//                         type="text"
//                         placeholder={t('LABELS.adhaarNumberPlaceholder')}
//                         value={formData.adhaar_number}
//                         onChange={(e) => handleDigitOnlyInput('adhaar_number', e.target.value, 12)}
//                         invalid={!!errors.adhaar_number}
//                         disabled={submitting}
//                         className="mb-1"
//                       />
//                       {errors.adhaar_number && <div className="text-danger small">{errors.adhaar_number}</div>}
//                     </CCol>
//                     <CCol xs={12} md={6}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.mobile')}
//                         <span className="text-danger ms-1">*</span>
//                       </CFormLabel>
//                       <CFormInput
//                         type="text"
//                         placeholder={t('LABELS.mobileNumberPlaceholder')}
//                         value={formData.mobile}
//                         onChange={(e) => handleDigitOnlyInput('mobile', e.target.value, 10)}
//                         invalid={!!errors.mobile}
//                         disabled={submitting}
//                         className="mb-1"
//                       />
//                       {errors.mobile && <div className="text-danger small">{errors.mobile}</div>}
//                     </CCol>
//                   </CRow>

//                   {/* Referral By */}
//                   <CRow className="mb-4">
//                     <CCol xs={6}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.email')}
//                       </CFormLabel>
//                       <CFormInput
//                         type="text"
//                         placeholder={t('LABELS.email')}
//                         value={formData.email}
//                         onChange={(e) => handleInputChange('email', e.target.value)}
//                         disabled={submitting}
//                         className="mb-1"
//                       />
//                     </CCol>

//                        <CCol xs={6}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.referralBy')}
//                       </CFormLabel>
//                       <CFormInput
//                         type="text"
//                         placeholder={t('LABELS.referralBy')}
//                         value={formData.refferal_by}
//                         onChange={(e) => handleInputChange('refferal_by', e.target.value)}
//                         disabled={submitting}
//                         className="mb-1"
//                       />
//                     </CCol>
//                   </CRow>


//                   {/* Login Checkbox */}
//                   <CRow className="mb-4">
//                     <CCol xs={12}>
//                       <CFormCheck
//                         id="isLogin"
//                         checked={formData.is_login}
//                         onChange={(e) => handleCheckboxChange(e.target.checked)}
//                         disabled={submitting}
//                         label={t('LABELS.isLogin')}
//                         className="fw-medium"
//                       />
//                     </CCol>
//                   </CRow>

//                   {/* Password Fields - Show only when Is Login is checked */}
//                   {formData.is_login && (
//                     <CRow className="mb-4">
//                       <CCol xs={12} md={6}>
//                         <CFormLabel className="fw-semibold text-dark mb-2">
//                           {t('LABELS.password')}
//                           <span className="text-danger ms-1">*</span>
//                         </CFormLabel>
//                         <CFormInput
//                           type="password"
//                           placeholder={t('LABELS.password')}
//                           value={formData.password}
//                           onChange={(e) => handleInputChange('password', e.target.value)}
//                           invalid={!!errors.password}
//                           disabled={submitting}
//                           className="mb-1"
//                         />
//                         {errors.password && <div className="text-danger small">{errors.password}</div>}
//                       </CCol>
//                       <CCol xs={12} md={6}>
//                         <CFormLabel className="fw-semibold text-dark mb-2">
//                           {t('LABELS.reEnterPassword')}
//                           <span className="text-danger ms-1">*</span>
//                         </CFormLabel>
//                         <CFormInput
//                           type="password"
//                           placeholder={t('LABELS.reEnterPassword')}
//                           value={formData.re_enter_password}
//                           onChange={(e) => handleInputChange('re_enter_password', e.target.value)}
//                           invalid={!!errors.re_enter_password}
//                           disabled={submitting}
//                           className="mb-1"
//                         />
//                         {errors.re_enter_password && <div className="text-danger small">{errors.re_enter_password}</div>}
//                       </CCol>
//                     </CRow>
//                   )}

//                   {/* Submit Button */}
//                   <CRow>
//                     <CCol xs={12}>
//                       <div className="d-flex flex-column flex-sm-row gap-2 justify-content-sm-end">
//                         <CButton
//                           color="secondary"
//                           variant="outline"
//                           onClick={resetForm}
//                           disabled={submitting}
//                           className="px-4 py-2 fw-medium order-2 order-sm-1"
//                         >
//                           {t('LABELS.cancel')}
//                         </CButton>
//                         <CButton
//                           color="primary"
//                           disabled={submitting || !isFormValid}
//                           onClick={openModal}
//                           className="px-4 py-2 fw-medium order-1 order-sm-2"
//                         >
//                           {submitting ? (
//                             <>
//                               <CSpinner size="sm" className="me-2" />
//                               {t('LABELS.creating')}
//                             </>
//                           ) : (
//                             <>
//                               <CIcon icon={cilCheckCircle} className="me-2" />
//                               {t('LABELS.createEmployee')}
//                             </>
//                           )}
//                         </CButton>
//                       </div>
//                     </CCol>
//                   </CRow>
//                 </CForm>
//               </CCardBody>
//             </CCard>
//           </div>
//         </CCol>
//       </CRow>

//       {/* Confirmation Modal */}
//       <CModal visible={showModal} onClose={closeModal}>
//         <CModalHeader className="border-bottom">
//           <CModalTitle className="h5 fw-semibold">
//             {t('LABELS.confirmEmployeeCreation')}
//           </CModalTitle>
//         </CModalHeader>
//         <CModalBody className="p-4">
//           <p className="mb-3">{t('MSG.confirmEmployeeCreationMessage')}</p>
//           <div className="bg-light rounded p-3">
//             <p className="mb-2"><strong>{t('LABELS.name')}:</strong> {formData.name}</p>
//             <p className="mb-2"><strong>{t('LABELS.gender')}:</strong> {formData.gender}</p>
//             <p className="mb-2"><strong>{t('LABELS.paymentType')}:</strong> {formData.payment_type}</p>
//             <p className="mb-2"><strong>{t('LABELS.workType')}:</strong> {formData.work_type}</p>
//             <p className="mb-2"><strong>{t('LABELS.mobile')}:</strong> {formData.mobile}</p>
//             <p className="mb-0"><strong>{t('LABELS.loginAccess')}:</strong> {formData.is_login ? t('LABELS.yes') : t('LABELS.no')}</p>
//           </div>
//         </CModalBody>
//         <CModalFooter className="border-top">
//           <CButton
//             color="secondary"
//             onClick={closeModal}
//             className="px-4 py-2"
//           >
//             {t('LABELS.cancel')}
//           </CButton>
//           <CButton
//             color="primary"
//             onClick={confirmSubmit}
//             className="px-4 py-2"
//           >
//             <CIcon icon={cilCheckCircle} className="me-2" />
//             {t('LABELS.createEmployee')}
//           </CButton>
//         </CModalFooter>
//       </CModal>
//     </CContainer>
//   );
// };

// export default EmployeeRegistrationForm;
