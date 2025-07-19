import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
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
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
} from '@coreui/react';
import { cilUser, cilCheckCircle, cilX, cilArrowLeft } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { put, getAPICall } from '../../../util/api';

// Constants
const NOTIFICATION_TIMEOUT = 1000;

// Initial form state
const INITIAL_FORM_DATA = {
  name: '',
  gender: '',
  payment_type: '',
  contract_type: '',
  work_type: '',
  overtime_type: '',
  wage_hour: '',
  wage_overtime: '',
  credit: '0',
  debit: '0',
  half_day_payment: '',
  holiday_payment: '',
  adhaar_number: '',
  mobile: '',
  referral_by: '',
  referral_by_number: '',
  is_login: false,
  email: '',
  attendance_type: ''
};

const INITIAL_NOTIFICATION = {
  show: false,
  type: '',
  message: ''
};

const EmployeeEditForm = () => {
  const { t } = useTranslation("global");
  const { id } = useParams();
  const navigate = useNavigate();

  // Dynamic options with translations
  const GENDER_OPTIONS = useMemo(() => [
    { value: 'male', label: t('LABELS.male') },
    { value: 'female', label: t('LABELS.female') },
    { value: 'other', label: t('LABELS.other') }
  ], [t]);

  const WORK_TYPE_OPTIONS = useMemo(() => [
    { value: 'fulltime', label: t('LABELS.fullTime') },
    { value: 'contract', label: t('LABELS.contract') }
  ], [t]);

  const ATTENDANCE_TYPE_OPTIONS = useMemo(() => [
    { value: 'face_attendance', label: t('LABELS.faceAttendance') },
    { value: 'location', label: t('LABELS.location') },
    { value: 'both', label: t('LABELS.both') }
  ], [t]);

  const OVERTIME_TYPE_OPTIONS = useMemo(() => [
    { value: 'hourly', label: t('LABELS.hourly') },
    { value: 'fixed', label: t('LABELS.fixed') }
  ], [t]);

  // State management
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [notification, setNotification] = useState(INITIAL_NOTIFICATION);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [faceAttendanceEnabled, setFaceAttendanceEnabled] = useState(false);
  const [loadingFaceAttendance, setLoadingFaceAttendance] = useState(true);
  const [loadingEmployee, setLoadingEmployee] = useState(true);

  // Dynamic payment type options based on work type
  const PAYMENT_TYPE_OPTIONS = useMemo(() => {
    if (formData.work_type === 'fulltime') {
      return [
        { value: 'weekly', label: t('LABELS.weekly') },
        { value: 'monthly', label: t('LABELS.monthly') }
      ];
    }
    return [];
  }, [formData.work_type, t]);

  const CONTRACT_TYPE_OPTIONS = useMemo(() => {
    if (formData.work_type === 'contract') {
      return [
        { value: 'volume_based', label: t('LABELS.volumeBasedContract') },
        { value: 'fixed', label: t('LABELS.fixedContract') }
      ];
    }
    return [];
  }, [formData.work_type, t]);

  // Check if current work type is fulltime
  const isFullTimeWork = formData.work_type === 'fulltime';

  // Notification helper
  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    if (message === 'Employee updated successfully.') {
      setTimeout(() => {
        setNotification(INITIAL_NOTIFICATION);
        navigate(`/employees/${id}`); // Redirect to EmployeeDetailsPage
      }, NOTIFICATION_TIMEOUT);
    }
  }, [navigate]);

  const closeNotification = useCallback(() => {
    setNotification(INITIAL_NOTIFICATION);
  }, []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Required fields validation
    if (!formData.name.trim()) newErrors.name = t('MSG.nameRequired');
    if (!formData.gender) newErrors.gender = t('MSG.genderRequired');
    if (!formData.work_type) newErrors.work_type = t('MSG.workTypeRequired');

    // Payment type validation for fulltime only
    if (formData.work_type === 'fulltime' && !formData.payment_type) {
      newErrors.payment_type = t('MSG.paymentTypeRequired');
    }

    if (formData.work_type === 'fulltime' && !formData.overtime_type) {
      newErrors.overtime_type = t('MSG.overtimeTypeRequired');
    }

    // Contract type validation for contract only
    if (formData.work_type === 'contract' && !formData.contract_type) {
      newErrors.contract_type = t('MSG.contractTypeRequired');
    }

    // Conditional validations based on work type
    if (isFullTimeWork) {
      // Fulltime specific validations
      if (!formData.wage_hour) newErrors.wage_hour = t('MSG.wageHourRequired');
      if (!formData.wage_overtime) newErrors.wage_overtime = t('MSG.wageOvertimeRequired');

      // Number validations for fulltime
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
    }

    // Half-day payment validation
    if (formData.half_day_payment && (isNaN(formData.half_day_payment) || parseFloat(formData.half_day_payment) < 0)) {
      newErrors.half_day_payment = t('MSG.halfDayPaymentPositiveNumber');
    }

    // Holiday payment validation
    if (formData.holiday_payment && (isNaN(formData.holiday_payment) || parseFloat(formData.holiday_payment) < 0)) {
      newErrors.holiday_payment = t('MSG.holidayPaymentPositiveNumber');
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

    if (formData.referral_by_number && formData.referral_by_number.trim()) {
      if (!/^\d{10}$/.test(formData.referral_by_number)) {
        newErrors.referral_by_number = t('MSG.referralNumberInvalid');
      }
    }

    // Email validation
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        newErrors.email = t('MSG.emailInvalid');
      }
    }

    // Attendance type validation when login is enabled
    if (formData.is_login && !formData.attendance_type) {
      newErrors.attendance_type = t('MSG.attendanceTypeRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t, isFullTimeWork]);

  // Form handlers
  const handleInputChange = useCallback(( field, value ) => {
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
    if (value === '' || (/^\d*$/.test(value) && value.length <= maxLength))
    {
      handleInputChange(field, value);
    }
  }, [handleInputChange]);

  const handleWorkTypeChange = useCallback((value) => {
    setFormData(prev => ({
      ...prev,
      work_type: value,
      payment_type: value === 'fulltime' ? prev.payment_type : '',
      contract_type: value === 'contract' ? prev.contract_type : '',
      overtime_type: value === 'fulltime' ? prev.overtime_type : '',
      wage_hour: value === 'contract' ? '' : prev.wage_hour,
      wage_overtime: value === 'contract' ? '' : prev.wage_overtime,
      credit: value === 'contract' ? '0' : prev.credit,
      debit: value === 'contract' ? '0' : prev.debit,
    }));

    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.work_type;
      delete newErrors.payment_type;
      delete newErrors.contract_type;
      delete newErrors.overtime_type;
      if (value === 'contract') {
        delete newErrors.wage_hour;
        delete newErrors.wage_overtime;
        delete newErrors.credit;
        delete newErrors.debit;
      }
      return newErrors;
    });
  }, []);

  const handleCheckboxChange = useCallback((checked) => {
    setFormData(prev => ({
      ...prev,
      is_login: checked,
      attendance_type: checked ? prev.attendance_type : ''
    }));
    // Clear attendance errors when unchecking
    if (!checked) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.attendance_type;
        return newErrors;
      });
    }
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setShowModal(false);
  }, []);

  // Fetch employee data on component mount
  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoadingEmployee(true);
        const response = await getAPICall(`/api/employees/${id}`);
        if (response) {
          setFormData({
            ...INITIAL_FORM_DATA,
            name: response.name || '',
            gender: response.gender || '',
            payment_type: response.payment_type || '',
            contract_type: response.contract_type || '',
            work_type: response.work_type || '',
            overtime_type: response.overtime_type || '',
            wage_hour: response.wage_hour ? String(response.wage_hour) : '',
            wage_overtime: response.wage_overtime ? String(response.wage_overtime) : '',
            credit: response.credit ? String(response.credit) : '0',
            debit: response.debit ? String(response.debit) : '0',
            half_day_payment: response.half_day_rate ? String(response.half_day_rate) : '',
            holiday_payment: response.holiday_rate ? String(response.holiday_rate) : '',
            adhaar_number: response.adhaar_number || '',
            mobile: response.mobile || '',
            referral_by: response.refferal_by || '',
            referral_by_number: response.refferal_number || '',
            is_login: response.isActive || false,
            email: response.user?.[0]?.email || '',
            attendance_type: response.attendance_type || ''
          });
        } else {
          showNotification('danger', t('MSG.employeeFetchFailed'));
        }
      } catch (error) {
        console.error('Error fetching employee data:', error);
        showNotification('danger', t('MSG.employeeFetchError'));
      } finally {
        setLoadingEmployee(false);
      }
    };

    fetchEmployeeData();
  }, [id, t, showNotification]);

  // Fetch face attendance status on component mount
  useEffect(() => {
    const fetchFaceAttendanceStatus = async () => {
      try {
        setLoadingFaceAttendance(true);
        const response = await getAPICall('/api/isface-attendance');
        setFaceAttendanceEnabled(response.face_attendance);

        // If face attendance is disabled, set default to location
        if (!response.face_attendance) {
          setFormData(prev => ({
            ...prev,
            attendance_type: 'location'
          }));
        }
      } catch (error) {
        console.error('Error fetching face attendance status:', error);
        setFormData(prev => ({
          ...prev,
          attendance_type: 'location'
        }));
      } finally {
        setLoadingFaceAttendance(false);
      }
    };

    fetchFaceAttendanceStatus();
  }, []);

  // Submit handler
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      showNotification('warning', t('MSG.fixErrorsBeforeSubmit'));
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        half_day_rate: formData.half_day_payment,
        holiday_rate: formData.holiday_payment,
        refferal_by: formData.referral_by,
        refferal_number: formData.referral_by_number,
        isActive: formData.is_login
      };

      // Remove fulltime specific fields for contract workers
      if (!isFullTimeWork) {
        delete payload.wage_hour;
        delete payload.wage_overtime;
        delete payload.credit;
        delete payload.debit;
      }

      const response = await put(`/api/employees/${id}`, payload);
      if (response && response.data.id) {
        showNotification('success', response.message || t('MSG.employeeUpdatedSuccess'));
        setShowModal(false);
      } else {
        showNotification('danger', response.message || t('MSG.employeeUpdateFailed'));
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      showNotification('danger', error.message || t('MSG.updateError'));
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm, showNotification, id, t, isFullTimeWork]);

  // Memoized form validation state
  const isFormValid = useMemo(() => {
    const baseRequiredFields = formData.name.trim() &&
           formData.gender &&
           formData.work_type &&
           formData.adhaar_number &&
           formData.mobile;

    let typeSpecificValidation = false;

    if (formData.work_type === 'fulltime') {
      typeSpecificValidation = formData.payment_type &&
                             formData.overtime_type &&
                             formData.wage_hour &&
                             formData.wage_overtime;
    } else if (formData.work_type === 'contract') {
      typeSpecificValidation = formData.contract_type;
    }

    return baseRequiredFields && typeSpecificValidation;
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

  if (loadingEmployee) {
    return (
      <CContainer fluid className="min-h-screen bg-light py-4 d-flex justify-content-center align-items-center">
        <CSpinner color="primary" />
      </CContainer>
    );
  }

  return (
    <CContainer fluid className="min-h-screen bg-light py-0 py-md-2 p-1">
      <CRow className="mb-3 mb-md-4">
        <CCol xs={12}>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => navigate(-1)}
            className="fw-medium"
          >
            <CIcon icon={cilArrowLeft} className="me-1" />
            {t('LABELS.back')}
          </CButton>
        </CCol>
      </CRow>
      <CRow className="justify-content-center">
        <CCol xs={12} className="px-1 px-md-2">
          {/* Notifications */}
          {notification.show && (
            <CRow className="mb-3 mb-md-4">
              <CCol xs={12}>
                <CAlert
                  color={notification.type === 'success' ? 'success' : notification.type}
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
                        {t('LABELS.editEmployeeDetails')}
                      </h1>
                      <p className="text-muted mb-0 small">
                        {t('LABELS.editEmployeeDetailsDownMsg')}
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

                {/* Work Type and Payment/Contract Type */}
                <CRow className="mb-4">
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.workType')}
                      <span className="text-danger ms-1">*</span>
                    </CFormLabel>
                    <CFormSelect
                      value={formData.work_type}
                      onChange={(e) => handleWorkTypeChange(e.target.value)}
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
                  <CCol xs={12} md={6}>
                    {formData.work_type === 'fulltime' && (
                      <>
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
                      </>
                    )}
                    {formData.work_type === 'contract' && (
                      <>
                        <CFormLabel className="fw-semibold text-dark mb-2">
                          {t('LABELS.contractType')}
                          <span className="text-danger ms-1">*</span>
                        </CFormLabel>
                        <CFormSelect
                          value={formData.contract_type}
                          onChange={(e) => handleInputChange('contract_type', e.target.value)}
                          invalid={!!errors.contract_type}
                          disabled={submitting}
                          className="mb-1"
                        >
                          <option value="">{t('LABELS.selectContractType')}</option>
                          {CONTRACT_TYPE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </CFormSelect>
                        {errors.contract_type && <div className="text-danger small">{errors.contract_type}</div>}
                      </>
                    )}
                  </CCol>
                </CRow>

                {/* Overtime Type */}
                {formData.work_type === 'fulltime' && (
                  <CRow className="mb-4">
                    <CCol xs={12} md={6}>
                      <CFormLabel className="fw-semibold text-dark mb-2">
                        {t('LABELS.overtimeType')}
                        <span className="text-danger ms-1">*</span>
                      </CFormLabel>
                      <CFormSelect
                        value={formData.overtime_type}
                        onChange={(e) => handleInputChange('overtime_type', e.target.value)}
                        invalid={!!errors.overtime_type}
                        disabled={submitting}
                        className="mb-1"
                      >
                        <option value="">{t('LABELS.selectOvertimeType')}</option>
                        {OVERTIME_TYPE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </CFormSelect>
                      {errors.overtime_type && <div className="text-danger small">{errors.overtime_type}</div>}
                    </CCol>
                    <CCol xs={12} md={6}>
                      {/* Empty column for spacing */}
                    </CCol>
                  </CRow>
                )}

                {/* Conditional Fields - Show only for Fulltime */}
                {isFullTimeWork && (
                  <>
                    {/* Wage Hour and Wage Overtime */}
                    <CRow className="mb-4">
                      <CCol xs={12} md={6}>
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
                      <CCol xs={12} md={6}>
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
                  </>
                )}

                {/* Half-Day Payment and Holiday Payment */}
                <CRow className="mb-4">
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.halfDayPayment')}
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder={t('LABELS.priceZero')}
                      value={formData.half_day_payment}
                      onChange={(e) => handleNumberInput('half_day_payment', e.target.value)}
                      invalid={!!errors.half_day_payment}
                      disabled={submitting}
                      className="mb-1"
                    />
                    {errors.half_day_payment && <div className="text-danger small">{errors.half_day_payment}</div>}
                  </CCol>
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.holidayPayment')}
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder={t('LABELS.priceZero')}
                      value={formData.holiday_payment}
                      onChange={(e) => handleNumberInput('holiday_payment', e.target.value)}
                      invalid={!!errors.holiday_payment}
                      disabled={submitting}
                      className="mb-1"
                    />
                    {errors.holiday_payment && <div className="text-danger small">{errors.holiday_payment}</div>}
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
                      value={formData.referral_by}
                      onChange={(e) => handleInputChange('referral_by', e.target.value)}
                      disabled={submitting}
                      className="mb-1"
                    />
                  </CCol>
                </CRow>

                <CRow className="mb-4">
                  <CCol xs={12} md={6}>
                    <CFormLabel className="fw-semibold text-dark mb-2">
                      {t('LABELS.referralByNumber')}
                    </CFormLabel>
                    <CFormInput
                      type="text"
                      placeholder={t('LABELS.referralByNumberPlaceholder')}
                      value={formData.referral_by_number}
                      onChange={(e) => handleDigitOnlyInput('referral_by_number', e.target.value, 10)}
                      invalid={!!errors.referral_by_number}
                      disabled={submitting}
                      className="mb-1"
                    />
                    {errors.referral_by_number && <div className="text-danger small">{errors.referral_by_number}</div>}
                  </CCol>
                  <CCol xs={12} md={6}>
                    {/* Empty column for spacing */}
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

                {/* Attendance Type */}
                {formData.is_login && faceAttendanceEnabled && !loadingFaceAttendance && (
                  <CRow className="mb-4">
                    <CCol xs={12} md={6}>
                      <CFormLabel className="fw-semibold text-dark mb-2">
                        {t('LABELS.attendanceType')}
                        <span className="text-danger ms-1">*</span>
                      </CFormLabel>
                      <CFormSelect
                        value={formData.attendance_type}
                        onChange={(e) => handleInputChange('attendance_type', e.target.value)}
                        invalid={!!errors.attendance_type}
                        disabled={submitting}
                        className="mb-1"
                      >
                        <option value="">{t('LABELS.selectAttendanceType')}</option>
                        {ATTENDANCE_TYPE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </CFormSelect>
                      {errors.attendance_type && <div className="text-danger small">{errors.attendance_type}</div>}
                    </CCol>
                  </CRow>
                )}

                {/* Loading state for attendance type */}
                {formData.is_login && loadingFaceAttendance && (
                  <CRow className="mb-4">
                    <CCol xs={12} md={6}>
                      <div className="d-flex align-items-center">
                        <CSpinner size="sm" className="me-2" />
                        <span className="text-muted small">Loading attendance options...</span>
                      </div>
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
                        {t('LABELS.cancel2')}
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
                            {t('LABELS.updating')}
                          </>
                        ) : (
                          <>
                            <CIcon icon={cilCheckCircle} className="me-2" />
                            {t('LABELS.saveUpdatedDetails')}
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
            {t('LABELS.confirmEmployeeUpdate')}
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="p-4">
          <p className="mb-3">{t('MSG.confirmEmployeeUpdateMessage')}</p>
          <div className="bg-light rounded p-3">
            <p className="mb-2"><strong>{t('LABELS.name')}:</strong> {formData.name}</p>
            <p className="mb-2"><strong>{t('LABELS.gender')}:</strong> {formData.gender}</p>
            <p className="mb-2"><strong>{t('LABELS.workType')}:</strong> {formData.work_type}</p>
            {formData.work_type === 'fulltime' && (
              <>
                <p className="mb-2"><strong>{t('LABELS.paymentType')}:</strong> {formData.payment_type}</p>
                <p className="mb-2"><strong>{t('LABELS.overtimeType')}:</strong> {formData.overtime_type}</p>
              </>
            )}
            {formData.work_type === 'contract' && (
              <p className="mb-2"><strong>{t('LABELS.contractType')}:</strong> {formData.contract_type}</p>
            )}
            <p className="mb-2"><strong>{t('LABELS.mobile')}:</strong> {formData.mobile}</p>
            <p className="mb-2"><strong>{t('LABELS.loginAccess')}:</strong> {formData.is_login ? t('LABELS.yes') : t('LABELS.no')}</p>
            {formData.is_login && (
              <p className="mb-0"><strong>{t('LABELS.attendanceType')}:</strong> {formData.attendance_type}</p>
            )}
            {formData.referral_by_number && (
              <p className="mb-2"><strong>{t('LABELS.referralByNumber')}:</strong> {formData.referral_by_number}</p>
            )}
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
            {t('LABELS.saveUpdatedDetails')}
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default EmployeeEditForm;


//----------------------------------------------------------------------------------------------


// import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
//   CModal,
//   CModalHeader,
//   CModalTitle,
//   CModalBody,
//   CModalFooter,
// } from '@coreui/react';
// import { cilUser, cilCheckCircle, cilX } from '@coreui/icons';
// import CIcon from '@coreui/icons-react';
// import { put, getAPICall } from '../../../util/api';
// import { useParams } from 'react-router-dom';

// // Constants
// const NOTIFICATION_TIMEOUT = 3000;

// // Initial form state
// const INITIAL_FORM_DATA = {
//   name: '',
//   gender: '',
//   payment_type: '',
//   contract_type: '',
//   work_type: '',
//   overtime_type: '',
//   wage_hour: '',
//   wage_overtime: '',
//   credit: '0',
//   debit: '0',
//   half_day_payment: '',
//   holiday_payment: '',
//   adhaar_number: '',
//   mobile: '',
//   refferal_by: '',
//   referral_by_number: '',
//   is_login: false,
//   email: '',
//   attendance_type: ''
// };

// const INITIAL_NOTIFICATION = {
//   show: false,
//   type: '',
//   message: ''
// };

// const EmployeeEditForm = () => {
//   const { t } = useTranslation("global");
//   const { id } = useParams();


//   // Dynamic options with translations
//   const GENDER_OPTIONS = useMemo(() => [
//     { value: 'male', label: t('LABELS.male') },
//     { value: 'female', label: t('LABELS.female') },
//     { value: 'other', label: t('LABELS.other') }
//   ], [t]);

//   const WORK_TYPE_OPTIONS = useMemo(() => [
//     { value: 'fulltime', label: t('LABELS.fullTime') },
//     { value: 'contract', label: t('LABELS.contract') }
//   ], [t]);

//   const ATTENDANCE_TYPE_OPTIONS = useMemo(() => [
//     { value: 'face_attendance', label: t('LABELS.faceAttendance') },
//     { value: 'location', label: t('LABELS.location') },
//     { value: 'both', label: t('LABELS.both') }
//   ], [t]);

//   const OVERTIME_TYPE_OPTIONS = useMemo(() => [
//     { value: 'hourly', label: t('LABELS.hourly') },
//     { value: 'fixed', label: t('LABELS.fixed') }
//   ], [t]);

//   // State management
//   const [formData, setFormData] = useState(INITIAL_FORM_DATA);
//   const [notification, setNotification] = useState(INITIAL_NOTIFICATION);
//   const [submitting, setSubmitting] = useState(false);
//   const [showModal, setShowModal] = useState(false);
//   const [errors, setErrors] = useState({});
//   const [faceAttendanceEnabled, setFaceAttendanceEnabled] = useState(false);
//   const [loadingFaceAttendance, setLoadingFaceAttendance] = useState(true);
//   const [loadingEmployee, setLoadingEmployee] = useState(true);

//   // Dynamic payment type options based on work type
//   const PAYMENT_TYPE_OPTIONS = useMemo(() => {
//     if (formData.work_type === 'fulltime') {
//       return [
//         { value: 'weekly', label: t('LABELS.weekly') },
//         { value: 'monthly', label: t('LABELS.monthly') }
//       ];
//     }
//     return [];
//   }, [formData.work_type, t]);

//   const CONTRACT_TYPE_OPTIONS = useMemo(() => {
//     if (formData.work_type === 'contract') {
//       return [
//         { value: 'volume_based', label: t('LABELS.volumeBasedContract') },
//         { value: 'fixed', label: t('LABELS.fixedContract') }
//       ];
//     }
//     return [];
//   }, [formData.work_type, t]);

//   // Check if current work type is fulltime
//   const isFullTimeWork = formData.work_type === 'fulltime';

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

//   const validateForm = useCallback(() => {
//     const newErrors = {};

//     // Required fields validation
//     if (!formData.name.trim()) newErrors.name = t('MSG.nameRequired');
//     if (!formData.gender) newErrors.gender = t('MSG.genderRequired');
//     if (!formData.work_type) newErrors.work_type = t('MSG.workTypeRequired');

//     // Payment type validation for fulltime only
//     if (formData.work_type === 'fulltime' && !formData.payment_type) {
//       newErrors.payment_type = t('MSG.paymentTypeRequired');
//     }

//     if (formData.work_type === 'fulltime' && !formData.overtime_type) {
//       newErrors.overtime_type = t('MSG.overtimeTypeRequired');
//     }

//     // Contract type validation for contract only
//     if (formData.work_type === 'contract' && !formData.contract_type) {
//       newErrors.contract_type = t('MSG.contractTypeRequired');
//     }

//     // Conditional validations based on work type
//     if (isFullTimeWork) {
//       // Fulltime specific validations
//       if (!formData.wage_hour) newErrors.wage_hour = t('MSG.wageHourRequired');
//       if (!formData.wage_overtime) newErrors.wage_overtime = t('MSG.wageOvertimeRequired');

//       // Number validations for fulltime
//       if (formData.wage_hour && (isNaN(formData.wage_hour) || parseFloat(formData.wage_hour) <= 0)) {
//         newErrors.wage_hour = t('MSG.wageHourPositiveNumber');
//       }
//       if (formData.wage_overtime && (isNaN(formData.wage_overtime) || parseFloat(formData.wage_overtime) <= 0)) {
//         newErrors.wage_overtime = t('MSG.wageOvertimePositiveNumber');
//       }
//       if (formData.credit && (isNaN(formData.credit) || parseFloat(formData.credit) < 0)) {
//         newErrors.credit = t('MSG.creditPositiveNumber');
//       }
//       if (formData.debit && (isNaN(formData.debit) || parseFloat(formData.debit) < 0)) {
//         newErrors.debit = t('MSG.debitPositiveNumber');
//       }
//     }

//     // Half-day payment validation
//     if (formData.half_day_payment && (isNaN(formData.half_day_payment) || parseFloat(formData.half_day_payment) < 0)) {
//       newErrors.half_day_payment = t('MSG.halfDayPaymentPositiveNumber');
//     }

//     // Holiday payment validation
//     if (formData.holiday_payment && (isNaN(formData.holiday_payment) || parseFloat(formData.holiday_payment) < 0)) {
//       newErrors.holiday_payment = t('MSG.holidayPaymentPositiveNumber');
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

//     if (formData.referral_by_number && formData.referral_by_number.trim()) {
//       if (!/^\d{10}$/.test(formData.referral_by_number)) {
//         newErrors.referral_by_number = t('MSG.referralNumberInvalid');
//       }
//     }

//     // Email validation
//     if (formData.email && formData.email.trim()) {
//       const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//       if (!emailRegex.test(formData.email.trim())) {
//         newErrors.email = t('MSG.emailInvalid');
//       }
//     }

//     // Attendance type validation when login is enabled
//     if (formData.is_login && !formData.attendance_type) {
//       newErrors.attendance_type = t('MSG.attendanceTypeRequired');
//     }

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   }, [formData, t, isFullTimeWork]);

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

//   const handleWorkTypeChange = useCallback((value) => {
//     setFormData(prev => ({
//       ...prev,
//       work_type: value,
//       payment_type: value === 'fulltime' ? prev.payment_type : '',
//       contract_type: value === 'contract' ? prev.contract_type : '',
//       overtime_type: value === 'fulltime' ? prev.overtime_type : '',
//       wage_hour: value === 'contract' ? '' : prev.wage_hour,
//       wage_overtime: value === 'contract' ? '' : prev.wage_overtime,
//       credit: value === 'contract' ? '0' : prev.credit,
//       debit: value === 'contract' ? '0' : prev.debit,
//     }));

//     // Clear related errors
//     setErrors(prev => {
//       const newErrors = { ...prev };
//       delete newErrors.work_type;
//       delete newErrors.payment_type;
//       delete newErrors.contract_type;
//       delete newErrors.overtime_type;
//       if (value === 'contract') {
//         delete newErrors.wage_hour;
//         delete newErrors.wage_overtime;
//         delete newErrors.credit;
//         delete newErrors.debit;
//       }
//       return newErrors;
//     });
//   }, []);

//   const handleCheckboxChange = useCallback((checked) => {
//     setFormData(prev => ({
//       ...prev,
//       is_login: checked,
//       attendance_type: checked ? prev.attendance_type : ''
//     }));
//     // Clear attendance errors when unchecking
//     if (!checked) {
//       setErrors(prev => {
//         const newErrors = { ...prev };
//         delete newErrors.attendance_type;
//         return newErrors;
//       });
//     }
//   }, []);

//   const resetForm = useCallback(() => {
//     setFormData(INITIAL_FORM_DATA);
//     setErrors({});
//     setShowModal(false);
//   }, []);

//   // Fetch employee data on component mount
//   useEffect(() => {
//     const fetchEmployeeData = async () => {
//       try {
//         setLoadingEmployee(true);
//         const response = await getAPICall(`/api/employee/${id}`);
//         if (response && response.employee) {
//           setFormData({
//             ...INITIAL_FORM_DATA,
//             ...response.employee,
//             credit: response.employee.credit || '0',
//             debit: response.employee.debit || '0',
//           });
//         } else {
//           showNotification('danger', t('MSG.employeeFetchFailed'));
//         }
//       } catch (error) {
//         console.error('Error fetching employee data:', error);
//         showNotification('danger', t('MSG.employeeFetchError'));
//       } finally {
//         setLoadingEmployee(false);
//       }
//     };

//     fetchEmployeeData();
//   }, [id, t, showNotification]);

//   // Fetch face attendance status on component mount
//   useEffect(() => {
//     const fetchFaceAttendanceStatus = async () => {
//       try {
//         setLoadingFaceAttendance(true);
//         const response = await getAPICall('/api/isface-attendance');
//         setFaceAttendanceEnabled(response.face_attendance);

//         // If face attendance is disabled, set default to location
//         if (!response.face_attendance) {
//           setFormData(prev => ({
//             ...prev,
//             attendance_type: 'location'
//           }));
//         }
//       } catch (error) {
//         console.error('Error fetching face attendance status:', error);
//         setFormData(prev => ({
//           ...prev,
//           attendance_type: 'location'
//         }));
//       } finally {
//         setLoadingFaceAttendance(false);
//       }
//     };

//     fetchFaceAttendanceStatus();
//   }, []);

//   // Submit handler
//   const handleSubmit = useCallback(async () => {
//     if (!validateForm()) {
//       showNotification('warning', t('MSG.fixErrorsBeforeSubmit'));
//       return;
//     }

//     setSubmitting(true);

//     try {
//       const payload = { ...formData };

//       // Remove fulltime specific fields for contract workers
//       if (!isFullTimeWork) {
//         delete payload.wage_hour;
//         delete payload.wage_overtime;
//         delete payload.credit;
//         delete payload.debit;
//       }

//       console.log('Updating employee data:', payload);
//       const response = await put(`/api/employees/${id}`, payload);
//       if (response && response.employee) {
//         showNotification('success', response.message || t('MSG.employeeUpdatedSuccess'));
//         setShowModal(false);
//       } else {
//         showNotification('danger', response.message || t('MSG.employeeUpdateFailed'));
//       }
//     } catch (error) {
//       console.error('Error updating employee:', error);
//       showNotification('danger', error.message || t('MSG.updateError'));
//     } finally {
//       setSubmitting(false);
//     }
//   }, [formData, validateForm, showNotification, id, t, isFullTimeWork]);

//   // Memoized form validation state
//   const isFormValid = useMemo(() => {
//     const baseRequiredFields = formData.name.trim() &&
//            formData.gender &&
//            formData.work_type &&
//            formData.adhaar_number &&
//            formData.mobile;

//     let typeSpecificValidation = false;

//     if (formData.work_type === 'fulltime') {
//       typeSpecificValidation = formData.payment_type &&
//                              formData.overtime_type &&
//                              formData.wage_hour &&
//                              formData.wage_overtime;
//     } else if (formData.work_type === 'contract') {
//       typeSpecificValidation = formData.contract_type;
//     }

//     return baseRequiredFields && typeSpecificValidation;
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

//   if (loadingEmployee) {
//     return (
//       <CContainer fluid className="min-h-screen bg-light py-4 d-flex justify-content-center align-items-center">
//         <CSpinner color="primary" />
//       </CContainer>
//     );
//   }

//   return (
//     <CContainer fluid className="min-h-screen bg-light py-0 py-md-2 p-1">
//       <CRow className="justify-content-center">
//         <CCol xs={12} className="px-1 px-md-2">
//           {/* Notifications */}
//           {notification.show && (
//             <CRow className="mb-3 mb-md-4">
//               <CCol xs={12}>
//                 <CAlert
//                   color={notification.type}
//                   dismissible
//                   onClose={closeNotification}
//                   className="border-0 shadow-sm"
//                 >
//                   {notification.message}
//                 </CAlert>
//               </CCol>
//             </CRow>
//           )}

//           {/* Main Form Card */}
//           <CCard className="shadow-sm border-0">
//             <CCardHeader className="bg-white border-bottom">
//               <CRow className="align-items-center">
//                 <CCol xs={12}>
//                   <div className="d-flex align-items-center">
//                     <CIcon icon={cilUser} className="me-2 me-md-3 text-primary" size="lg" />
//                     <div>
//                       <h1 className="h4 h3-md mb-1 text-dark fw-bold">
//                         Edit Employee Details
//                       </h1>
//                       <p className="text-muted mb-0 small">
//                         Update the details below to modify employee information
//                       </p>
//                     </div>
//                   </div>
//                 </CCol>
//               </CRow>
//             </CCardHeader>
//             <CCardBody className="p-3 p-md-4 p-lg-3">
//               <CForm>
//                 {/* Employee Name and Gender */}
//                 <CRow className="mb-4">
//                   <CCol xs={12} md={6}>
//                     <CFormLabel className="fw-semibold text-dark mb-2">
//                       {t('LABELS.employeeName')}
//                       <span className="text-danger ms-1">*</span>
//                     </CFormLabel>
//                     <CFormInput
//                       type="text"
//                       placeholder={t('LABELS.employeeName')}
//                       value={formData.name}
//                       onChange={(e) => handleInputChange('name', e.target.value)}
//                       invalid={!!errors.name}
//                       disabled={submitting}
//                       className="mb-1"
//                     />
//                     {errors.name && <div className="text-danger small">{errors.name}</div>}
//                   </CCol>
//                   <CCol xs={12} md={6}>
//                     <CFormLabel className="fw-semibold text-dark mb-2">
//                       {t('LABELS.gender')}
//                       <span className="text-danger ms-1">*</span>
//                     </CFormLabel>
//                     <CFormSelect
//                       value={formData.gender}
//                       onChange={(e) => handleInputChange('gender', e.target.value)}
//                       invalid={!!errors.gender}
//                       disabled={submitting}
//                       className="mb-1"
//                     >
//                       <option value="">{t('LABELS.selectGender')}</option>
//                       {GENDER_OPTIONS.map(option => (
//                         <option key={option.value} value={option.value}>
//                           {option.label}
//                         </option>
//                       ))}
//                     </CFormSelect>
//                     {errors.gender && <div className="text-danger small">{errors.gender}</div>}
//                   </CCol>
//                 </CRow>

//                 {/* Work Type and Payment/Contract Type */}
//                 <CRow className="mb-4">
//                   <CCol xs={12} md={6}>
//                     <CFormLabel className="fw-semibold text-dark mb-2">
//                       {t('LABELS.workType')}
//                       <span className="text-danger ms-1">*</span>
//                     </CFormLabel>
//                     <CFormSelect
//                       value={formData.work_type}
//                       onChange={(e) => handleWorkTypeChange(e.target.value)}
//                       invalid={!!errors.work_type}
//                       disabled={submitting}
//                       className="mb-1"
//                     >
//                       <option value="">{t('LABELS.selectWorkType')}</option>
//                       {WORK_TYPE_OPTIONS.map(option => (
//                         <option key={option.value} value={option.value}>
//                           {option.label}
//                         </option>
//                       ))}
//                     </CFormSelect>
//                     {errors.work_type && <div className="text-danger small">{errors.work_type}</div>}
//                   </CCol>
//                   <CCol xs={12} md={6}>
//                     {formData.work_type === 'fulltime' && (
//                       <>
//                         <CFormLabel className="fw-semibold text-dark mb-2">
//                           {t('LABELS.paymentType')}
//                           <span className="text-danger ms-1">*</span>
//                         </CFormLabel>
//                         <CFormSelect
//                           value={formData.payment_type}
//                           onChange={(e) => handleInputChange('payment_type', e.target.value)}
//                           invalid={!!errors.payment_type}
//                           disabled={submitting}
//                           className="mb-1"
//                         >
//                           <option value="">{t('LABELS.selectPaymentType')}</option>
//                           {PAYMENT_TYPE_OPTIONS.map(option => (
//                             <option key={option.value} value={option.value}>
//                               {option.label}
//                             </option>
//                           ))}
//                         </CFormSelect>
//                         {errors.payment_type && <div className="text-danger small">{errors.payment_type}</div>}
//                       </>
//                     )}
//                     {formData.work_type === 'contract' && (
//                       <>
//                         <CFormLabel className="fw-semibold text-dark mb-2">
//                           {t('LABELS.contractType')}
//                           <span className="text-danger ms-1">*</span>
//                         </CFormLabel>
//                         <CFormSelect
//                           value={formData.contract_type}
//                           onChange={(e) => handleInputChange('contract_type', e.target.value)}
//                           invalid={!!errors.contract_type}
//                           disabled={submitting}
//                           className="mb-1"
//                         >
//                           <option value="">{t('LABELS.selectContractType')}</option>
//                           {CONTRACT_TYPE_OPTIONS.map(option => (
//                             <option key={option.value} value={option.value}>
//                               {option.label}
//                             </option>
//                           ))}
//                         </CFormSelect>
//                         {errors.contract_type && <div className="text-danger small">{errors.contract_type}</div>}
//                       </>
//                     )}
//                   </CCol>
//                 </CRow>

//                 {/* Overtime Type */}
//                 {formData.work_type === 'fulltime' && (
//                   <CRow className="mb-4">
//                     <CCol xs={12} md={6}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.overtimeType')}
//                         <span className="text-danger ms-1">*</span>
//                       </CFormLabel>
//                       <CFormSelect
//                         value={formData.overtime_type}
//                         onChange={(e) => handleInputChange('overtime_type', e.target.value)}
//                         invalid={!!errors.overtime_type}
//                         disabled={submitting}
//                         className="mb-1"
//                       >
//                         <option value="">{t('LABELS.selectOvertimeType')}</option>
//                         {OVERTIME_TYPE_OPTIONS.map(option => (
//                           <option key={option.value} value={option.value}>
//                             {option.label}
//                           </option>
//                         ))}
//                       </CFormSelect>
//                       {errors.overtime_type && <div className="text-danger small">{errors.overtime_type}</div>}
//                     </CCol>
//                     <CCol xs={12} md={6}>
//                       {/* Empty column for spacing */}
//                     </CCol>
//                   </CRow>
//                 )}

//                 {/* Conditional Fields - Show only for Fulltime */}
//                 {isFullTimeWork && (
//                   <>
//                     {/* Wage Hour and Wage Overtime */}
//                     <CRow className="mb-4">
//                       <CCol xs={12} md={6}>
//                         <CFormLabel className="fw-semibold text-dark mb-2">
//                           {t('LABELS.wageHour')}
//                           <span className="text-danger ms-1">*</span>
//                         </CFormLabel>
//                         <CFormInput
//                           type="text"
//                           placeholder={t('LABELS.priceZero')}
//                           value={formData.wage_hour}
//                           onChange={(e) => handleNumberInput('wage_hour', e.target.value)}
//                           invalid={!!errors.wage_hour}
//                           disabled={submitting}
//                           className="mb-1"
//                         />
//                         {errors.wage_hour && <div className="text-danger small">{errors.wage_hour}</div>}
//                       </CCol>
//                       <CCol xs={12} md={6}>
//                         <CFormLabel className="fw-semibold text-dark mb-2">
//                           {t('LABELS.wageOvertime')}
//                           <span className="text-danger ms-1">*</span>
//                         </CFormLabel>
//                         <CFormInput
//                           type="text"
//                           placeholder={t('LABELS.priceZero')}
//                           value={formData.wage_overtime}
//                           onChange={(e) => handleNumberInput('wage_overtime', e.target.value)}
//                           invalid={!!errors.wage_overtime}
//                           disabled={submitting}
//                           className="mb-1"
//                         />
//                         {errors.wage_overtime && <div className="text-danger small">{errors.wage_overtime}</div>}
//                       </CCol>
//                     </CRow>

//                     {/* Credit and Debit */}
//                     <CRow className="mb-4">
//                       <CCol xs={12} md={6}>
//                         <CFormLabel className="fw-semibold text-dark mb-2">
//                           {t('LABELS.credit')}
//                         </CFormLabel>
//                         <CFormInput
//                           type="text"
//                           placeholder="0"
//                           value={formData.credit}
//                           onChange={(e) => handleNumberInput('credit', e.target.value)}
//                           invalid={!!errors.credit}
//                           disabled={submitting}
//                           className="mb-1"
//                         />
//                         {errors.credit && <div className="text-danger small">{errors.credit}</div>}
//                       </CCol>
//                       <CCol xs={12} md={6}>
//                         <CFormLabel className="fw-semibold text-dark mb-2">
//                           {t('LABELS.debit')}
//                         </CFormLabel>
//                         <CFormInput
//                           type="text"
//                           placeholder="0"
//                           value={formData.debit}
//                           onChange={(e) => handleNumberInput('debit', e.target.value)}
//                           invalid={!!errors.debit}
//                           disabled={submitting}
//                           className="mb-1"
//                         />
//                         {errors.debit && <div className="text-danger small">{errors.debit}</div>}
//                       </CCol>
//                     </CRow>
//                   </>
//                 )}

//                 {/* Half-Day Payment and Holiday Payment */}
//                 <CRow className="mb-4">
//                   <CCol xs={12} md={6}>
//                     <CFormLabel className="fw-semibold text-dark mb-2">
//                       {t('LABELS.halfDayPayment')}
//                     </CFormLabel>
//                     <CFormInput
//                       type="text"
//                       placeholder={t('LABELS.priceZero')}
//                       value={formData.half_day_payment}
//                       onChange={(e) => handleNumberInput('half_day_payment', e.target.value)}
//                       invalid={!!errors.half_day_payment}
//                       disabled={submitting}
//                       className="mb-1"
//                     />
//                     {errors.half_day_payment && <div className="text-danger small">{errors.half_day_payment}</div>}
//                   </CCol>
//                   <CCol xs={12} md={6}>
//                     <CFormLabel className="fw-semibold text-dark mb-2">
//                       {t('LABELS.holidayPayment')}
//                     </CFormLabel>
//                     <CFormInput
//                       type="text"
//                       placeholder={t('LABELS.priceZero')}
//                       value={formData.holiday_payment}
//                       onChange={(e) => handleNumberInput('holiday_payment', e.target.value)}
//                       invalid={!!errors.holiday_payment}
//                       disabled={submitting}
//                       className="mb-1"
//                     />
//                     {errors.holiday_payment && <div className="text-danger small">{errors.holiday_payment}</div>}
//                   </CCol>
//                 </CRow>

//                 {/* Adhaar Number and Mobile */}
//                 <CRow className="mb-4">
//                   <CCol xs={12} md={6}>
//                     <CFormLabel className="fw-semibold text-dark mb-2">
//                       {t('LABELS.adhaarNumber')}
//                       <span className="text-danger ms-1">*</span>
//                     </CFormLabel>
//                     <CFormInput
//                       type="text"
//                       placeholder={t('LABELS.adhaarNumberPlaceholder')}
//                       value={formData.adhaar_number}
//                       onChange={(e) => handleDigitOnlyInput('adhaar_number', e.target.value, 12)}
//                       invalid={!!errors.adhaar_number}
//                       disabled={submitting}
//                       className="mb-1"
//                     />
//                     {errors.adhaar_number && <div className="text-danger small">{errors.adhaar_number}</div>}
//                   </CCol>
//                   <CCol xs={12} md={6}>
//                     <CFormLabel className="fw-semibold text-dark mb-2">
//                       {t('LABELS.mobile')}
//                       <span className="text-danger ms-1">*</span>
//                     </CFormLabel>
//                     <CFormInput
//                       type="text"
//                       placeholder={t('LABELS.mobileNumberPlaceholder')}
//                       value={formData.mobile}
//                       onChange={(e) => handleDigitOnlyInput('mobile', e.target.value, 10)}
//                       invalid={!!errors.mobile}
//                       disabled={submitting}
//                       className="mb-1"
//                     />
//                     {errors.mobile && <div className="text-danger small">{errors.mobile}</div>}
//                   </CCol>
//                 </CRow>

//                 {/* Email and Referral By */}
//                 <CRow className="mb-4">
//                   <CCol xs={12} md={6}>
//                     <CFormLabel className="fw-semibold text-dark mb-2">
//                       {t('LABELS.email')}
//                     </CFormLabel>
//                     <CFormInput
//                       type="email"
//                       placeholder={t('LABELS.email')}
//                       value={formData.email}
//                       onChange={(e) => handleInputChange('email', e.target.value)}
//                       invalid={!!errors.email}
//                       disabled={submitting}
//                       className="mb-1"
//                     />
//                     {errors.email && <div className="text-danger small">{errors.email}</div>}
//                   </CCol>
//                   <CCol xs={12} md={6}>
//                     <CFormLabel className="fw-semibold text-dark mb-2">
//                       {t('LABELS.referralBy')}
//                     </CFormLabel>
//                     <CFormInput
//                       type="text"
//                       placeholder={t('LABELS.referralBy')}
//                       value={formData.refferal_by}
//                       onChange={(e) => handleInputChange('refferal_by部分: refferal_by')}
//                       disabled={submitting}
//                       className="mb-1"
//                     />
//                   </CCol>
//                 </CRow>

//                 <CRow className="mb-4">
//                   <CCol xs={12} md={6}>
//                     <CFormLabel className="fw-semibold text-dark mb-2">
//                       {t('LABELS.referralByNumber')}
//                     </CFormLabel>
//                     <CFormInput
//                       type="text"
//                       placeholder={t('LABELS.referralByNumberPlaceholder')}
//                       value={formData.referral_by_number}
//                       onChange={(e) => handleDigitOnlyInput('referral_by_number', e.target.value, 10)}
//                       invalid={!!errors.referral_by_number}
//                       disabled={submitting}
//                       className="mb-1"
//                     />
//                     {errors.referral_by_number && <div className="text-danger small">{errors.referral_by_number}</div>}
//                   </CCol>
//                   <CCol xs={12} md={6}>
//                     {/* Empty column for spacing */}
//                   </CCol>
//                 </CRow>

//                 {/* Login Checkbox */}
//                 <CRow className="mb-4">
//                   <CCol xs={12}>
//                     <CFormCheck
//                       id="isLogin"
//                       checked={formData.is_login}
//                       onChange={(e) => handleCheckboxChange(e.target.checked)}
//                       disabled={submitting}
//                       label={t('LABELS.isLogin')}
//                       className="fw-medium"
//                     />
//                   </CCol>
//                 </CRow>

//                 {/* Attendance Type */}
//                 {formData.is_login && faceAttendanceEnabled && !loadingFaceAttendance && (
//                   <CRow className="mb-4">
//                     <CCol xs={12} md={6}>
//                       <CFormLabel className="fw-semibold text-dark mb-2">
//                         {t('LABELS.attendanceType')}
//                         <span className="text-danger ms-1">*</span>
//                       </CFormLabel>
//                       <CFormSelect
//                         value={formData.attendance_type}
//                         onChange={(e) => handleInputChange('attendance_type', e.target.value)}
//                         invalid={!!errors.attendance_type}
//                         disabled={submitting}
//                         className="mb-1"
//                       >
//                         <option value="">{t('LABELS.selectAttendanceType')}</option>
//                         {ATTENDANCE_TYPE_OPTIONS.map(option => (
//                           <option key={option.value} value={option.value}>
//                             {option.label}
//                           </option>
//                         ))}
//                       </CFormSelect>
//                       {errors.attendance_type && <div className="text-danger small">{errors.attendance_type}</div>}
//                     </CCol>
//                   </CRow>
//                 )}

//                 {/* Loading state for attendance type */}
//                 {formData.is_login && loadingFaceAttendance && (
//                   <CRow className="mb-4">
//                     <CCol xs={12} md={6}>
//                       <div className="d-flex align-items-center">
//                         <CSpinner size="sm" className="me-2" />
//                         <span className="text-muted small">Loading attendance options...</span>
//                       </div>
//                     </CCol>
//                   </CRow>
//                 )}

//                 {/* Submit Button */}
//                 <CRow>
//                   <CCol xs={12}>
//                     <div className="d-flex flex-column flex-sm-row gap-2 justify-content-sm-end">
//                       <CButton
//                         color="secondary"
//                         variant="outline"
//                         onClick={resetForm}
//                         disabled={submitting}
//                         className="px-4 py-2 fw-medium order-2 order-sm-1"
//                       >
//                         {t('LABELS.cancel')}
//                       </CButton>
//                       <CButton
//                         color="primary"
//                         disabled={submitting || !isFormValid}
//                         onClick={openModal}
//                         className="px-4 py-2 fw-medium order-1 order-sm-2"
//                       >
//                         {submitting ? (
//                           <>
//                             <CSpinner size="sm" className="me-2" />
//                             {t('LABELS.updating')}
//                           </>
//                         ) : (
//                           <>
//                             <CIcon icon={cilCheckCircle} className="me-2" />
//                             {t('LABELS.saveUpdatedDetails')}
//                           </>
//                         )}
//                       </CButton>
//                     </div>
//                   </CCol>
//                 </CRow>
//               </CForm>
//             </CCardBody>
//           </CCard>
//         </CCol>
//       </CRow>

//       {/* Confirmation Modal */}
//       <CModal visible={showModal} onClose={closeModal}>
//         <CModalHeader className="border-bottom">
//           <CModalTitle className="h5 fw-semibold">
//             {t('LABELS.confirmEmployeeUpdate')}
//           </CModalTitle>
//         </CModalHeader>
//         <CModalBody className="p-4">
//           <p className="mb-3">{t('MSG.confirmEmployeeUpdateMessage')}</p>
//           <div className="bg-light rounded p-3">
//             <p className="mb-2"><strong>{t('LABELS.name')}:</strong> {formData.name}</p>
//             <p className="mb-2"><strong>{t('LABELS.gender')}:</strong> {formData.gender}</p>
//             <p className="mb-2"><strong>{t('LABELS.workType')}:</strong> {formData.work_type}</p>
//             {formData.work_type === 'fulltime' && (
//               <>
//                 <p className="mb-2"><strong>{t('LABELS.paymentType')}:</strong> {formData.payment_type}</p>
//                 <p className="mb-2"><strong>{t('LABELS.overtimeType')}:</strong> {formData.overtime_type}</p>
//               </>
//             )}
//             {formData.work_type === 'contract' && (
//               <p className="mb-2"><strong>{t('LABELS.contractType')}:</strong> {formData.contract_type}</p>
//             )}
//             <p className="mb-2"><strong>{t('LABELS.mobile')}:</strong> {formData.mobile}</p>
//             <p className="mb-2"><strong>{t('LABELS.loginAccess')}:</strong> {formData.is_login ? t('LABELS.yes') : t('LABELS.no')}</p>
//             {formData.is_login && (
//               <p className="mb-0"><strong>{t('LABELS.attendanceType')}:</strong> {formData.attendance_type}</p>
//             )}
//             {formData.referral_by_number && (
//               <p className="mb-2"><strong>{t('LABELS.referralByNumber')}:</strong> {formData.referral_by_number}</p>
//             )}
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
//             {t('LABELS.saveUpdatedDetails')}
//           </CButton>
//         </CModalFooter>
//       </CModal>
//     </CContainer>
//   );
// };

// export default EmployeeEditForm;
