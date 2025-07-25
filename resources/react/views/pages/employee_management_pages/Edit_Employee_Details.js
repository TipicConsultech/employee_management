import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CContainer, CRow, CCol, CCard, CCardHeader, CCardBody, CForm, CFormSelect,
  CFormInput, CFormLabel, CButton, CAlert, CSpinner, CFormCheck, CModal,
  CModalHeader, CModalTitle, CModalBody, CModalFooter, CInputGroup, CInputGroupText
} from '@coreui/react';
import { cilUser, cilCheckCircle, cilArrowLeft } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { put, getAPICall } from '../../../util/api';

// Constants
const NOTIFICATION_TIMEOUT = 3000;
const INITIAL_FORM_DATA = {
  name: '', gender: '', payment_type: '', contract_type: '', work_type: '', overtime_type: '',
  wage_hour: '', wage_overtime: '', credit: '', debit: '', half_day_payment: '',
  holiday_payment: '', adhaar_number: '', mobile: '', referral_by: '', referral_by_number: '',
  is_login: false, email: '', attendance_type: '', tolerance: '', working_hours: ''
};
const INITIAL_NOTIFICATION = { show: false, type: '', message: '' };
const INITIAL_TOUCHED = {
    name: false, gender: false, payment_type: false, contract_type: false, work_type: false,
    wage_hour: false, wage_overtime: false, credit: false, debit: false, half_day_payment: false, holiday_payment: false,
    adhaar_number: false, mobile: false, referral_by_number: false, email: false, attendance_type: false, tolerance: false,
    working_hours: false
};

const EmployeeEditForm = () => {
  const { t } = useTranslation('global');
  const { id } = useParams();
  const navigate = useNavigate();

  const GENDER_OPTIONS = useMemo(() => [
    { value: 'male', label: t('LABELS.male') }, { value: 'female', label: t('LABELS.female') },
    { value: 'other', label: t('LABELS.other') }
  ], [t]);
  const WORK_TYPE_OPTIONS = useMemo(() => [
    { value: 'fulltime', label: t('LABELS.fullTime') }, { value: 'contract', label: t('LABELS.contract') }
  ], [t]);
  const ATTENDANCE_TYPE_OPTIONS = useMemo(() => [
    { value: 'face_attendance', label: t('LABELS.faceAttendance') },
    { value: 'location', label: t('LABELS.location') }
  ], [t]);
  const OVERTIME_TYPE_OPTIONS = useMemo(() => [
    { value: 'not_available', label: t('LABELS.notAvailable') },
    { value: 'hourly', label: t('LABELS.hourly') },
    { value: 'fixed', label: t('LABELS.fixed') }
  ], [t]);
  const toleranceOptions = [
    { value: '', label: t('LABELS.selectTolerance') || 'Select Tolerance' },
    { value: '25', label: '25 meters' },
    { value: '50', label: '50 meters' },
    { value: '100', label: '100 meters' },
    { value: 'custom', label: t('LABELS.customTolerance') || 'Custom Tolerance' },
    { value: '111208680', label: t('LABELS.noLimit') || 'No Limit' }
  ];
  const workingHoursOptions = [
    { value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' },
    { value: 4, label: '4' }, { value: 5, label: '5' }, { value: 6, label: '6' },
    { value: 7, label: '7' }, { value: 8, label: '8' },{ value: 9, label: '9' }, { value: 10, label: '10' },
    { value: 11, label: '11' }, { value: 12, label: '12' }
  ];

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [notification, setNotification] = useState(INITIAL_NOTIFICATION);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(INITIAL_TOUCHED);
  const [faceAttendanceEnabled, setFaceAttendanceEnabled] = useState(false);
  const [loadingFaceAttendance, setLoadingFaceAttendance] = useState(true);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [toleranceType, setToleranceType] = useState('');
  const [customTolerance, setCustomTolerance] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const metersToDecimalDegrees = (meters) => {
    const metersPerDegreeLat = 111320;
    return (meters / metersPerDegreeLat).toFixed(6);
  };

  const convertedDegree = () => {
    const meters = parseFloat(customTolerance);
    if (isNaN(meters) || meters <= 0) return null;
    return metersToDecimalDegrees(meters);
  };

  const PAYMENT_TYPE_OPTIONS = useMemo(() => formData.work_type === 'fulltime' ? [
    { value: 'weekly', label: t('LABELS.weekly') }, { value: 'monthly', label: t('LABELS.monthly') }
  ] : [], [formData.work_type, t]);
  const CONTRACT_TYPE_OPTIONS = useMemo(() => formData.work_type === 'contract' ? [
    { value: 'volume_based', label: t('LABELS.volumeBasedContract') },
    { value: 'fixed', label: t('LABELS.fixedContract') }
  ] : [], [formData.work_type, t]);
  const isFullTimeWork = formData.work_type === 'fulltime';

  const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), []);

  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    if (type === 'success') {
      setTimeout(() => {
        setNotification(INITIAL_NOTIFICATION);
        navigate(`/employees/${id}`);
      }, NOTIFICATION_TIMEOUT);
    }
  }, [navigate, id]);

  const closeNotification = useCallback(() => setNotification(INITIAL_NOTIFICATION), []);

  const validateForm = useCallback(() => {
    const newErrors = {};

    // Basic Information validations
    if (!formData.name.trim()) newErrors.name = t('MSG.nameRequired');
    if (!formData.gender) newErrors.gender = t('MSG.genderRequired');
    if (!formData.work_type) newErrors.work_type = t('MSG.workTypeRequired');
    if (formData.work_type === 'fulltime' && !formData.working_hours) newErrors.working_hours = t('MSG.workHoursRequired');
    if (formData.work_type === 'fulltime' && !formData.payment_type) newErrors.payment_type = t('MSG.paymentTypeRequired');
    if (formData.work_type === 'fulltime' && !formData.overtime_type) newErrors.overtime_type = t('MSG.overtimeTypeRequired');
    if (formData.work_type === 'contract' && !formData.contract_type) newErrors.contract_type = t('MSG.contractTypeRequired');

    // Wage-related validations (only for fulltime)
    if (formData.work_type === 'fulltime') {
      if (!formData.wage_hour) newErrors.wage_hour = t('MSG.wageHourRequired');
      if (formData.wage_hour && (isNaN(formData.wage_hour) || parseFloat(formData.wage_hour) < 0)) newErrors.wage_hour = t('MSG.wageHourPositiveNumber');
      if (formData.wage_overtime && (isNaN(formData.wage_overtime) || parseFloat(formData.wage_overtime) < 0)) newErrors.wage_overtime = t('MSG.wageOvertimePositiveNumber');
      if (formData.credit && (isNaN(formData.credit) || parseFloat(formData.credit) < 0)) newErrors.credit = t('MSG.creditPositiveNumber');
      if (formData.debit && (isNaN(formData.debit) || parseFloat(formData.debit) < 0)) newErrors.debit = t('MSG.debitPositiveNumber');
      if (formData.half_day_payment && (isNaN(formData.half_day_payment) || parseFloat(formData.half_day_payment) < 0)) newErrors.half_day_payment = t('MSG.halfDayPaymentPositiveNumber');
      if (formData.holiday_payment && (isNaN(formData.holiday_payment) || parseFloat(formData.holiday_payment) < 0)) newErrors.holiday_payment = t('MSG.holidayPaymentPositiveNumber');
    }

    // Contact Information validations
    if (!formData.adhaar_number) newErrors.adhaar_number = t('MSG.adhaarRequired');
    else if (!/^\d{12}$/.test(formData.adhaar_number)) newErrors.adhaar_number = t('MSG.adhaarInvalid');
    if (!formData.mobile) newErrors.mobile = t('MSG.mobileRequired');
    else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = t('MSG.mobileInvalid');
    if (formData.referral_by_number && !/^\d{10}$/.test(formData.referral_by_number)) newErrors.referral_by_number = t('MSG.referralNumberInvalid');
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = t('MSG.emailInvalid');

    // Login-related validations (only if is_login is true)
    if (formData.is_login) {
      if (!formData.attendance_type) newErrors.attendance_type = t('MSG.attendanceTypeRequired');
      if (!formData.tolerance && toleranceType !== 'no_limit') newErrors.tolerance = t('MSG.toleranceRequired');
      else if (toleranceType === 'custom' && (!customTolerance || isNaN(customTolerance) || parseFloat(customTolerance) <= 0)) {
        newErrors.tolerance = t('MSG.customToleranceInvalid');
      }
    }

    return newErrors;
  }, [formData, t, isFullTimeWork, toleranceType, customTolerance]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  const handleNumberInput = useCallback((field, value) => {
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setFormData(prev => ({ ...prev, [field]: value }));
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  }, []);

  const handleDigitOnlyInput = useCallback((field, value, maxLength) => {
    if (/^\d*$/.test(value) && value.length <= maxLength || value === '') {
      setFormData(prev => ({ ...prev, [field]: value }));
      setTouched(prev => ({ ...prev, [field]: true }));
    }
  }, []);

  const handleWorkTypeChange = useCallback((value) => {
    setFormData(prev => ({
      ...prev, work_type: value, payment_type: value === 'fulltime' ? prev.payment_type : '',
      contract_type: value === 'contract' ? prev.contract_type : '', overtime_type: value === 'fulltime' ? prev.overtime_type : '',
      wage_hour: value === 'contract' ? '' : prev.wage_hour, wage_overtime: value === 'contract' ? '' : prev.wage_overtime,
      credit: value === 'contract' ? '' : prev.credit, debit: value === 'contract' ? '' : prev.debit,
      half_day_payment: value === 'contract' ? '' : prev.half_day_payment, holiday_payment: value === 'contract' ? '' : prev.holiday_payment,
      working_hours: value === 'contract' ? '' : prev.working_hours
    }));
    setTouched(prev => ({ ...prev, work_type: true }));
  }, []);

  const handleCheckboxChange = useCallback((checked) => {
    setFormData(prev => ({
      ...prev, is_login: checked, attendance_type: checked ? prev.attendance_type : '', tolerance: checked ? prev.tolerance : ''
    }));
    setTouched(prev => ({ ...prev, is_login: true, attendance_type: false, tolerance: false }));
    if (!checked) {
      setToleranceType('');
      setCustomTolerance('');
      setTouched(prev => ({ ...prev, tolerance: false }));
    }
  }, []);

  const handleToleranceChange = useCallback((type, customValue) => {
    let toleranceValue = '';
    if (type === 'custom') {
      const meters = parseFloat(customValue);
      toleranceValue = isNaN(meters) || meters <= 0 ? '' : metersToDecimalDegrees(meters);
    } else {
      const meters = parseFloat(type);
      toleranceValue = isNaN(meters) ? '' : metersToDecimalDegrees(meters);
    }
    setFormData(prev => ({ ...prev, tolerance: toleranceValue }));
    setTouched(prev => ({ ...prev, tolerance: true }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    setTouched(INITIAL_TOUCHED);
    setShowModal(false);
    setToleranceType('');
    setCustomTolerance('');
    setFormSubmitted(false);
  }, []);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setLoadingEmployee(true);
        const response = await getAPICall(`/api/employees/${id}`);
        if (response) {
          const tolerance = response.tolerance || '';
          let toleranceType = '';
          let customTolerance = '';
          if (tolerance === 'no_limit') {
            toleranceType = 'no_limit';
          } else if (tolerance) {
            const meters = (parseFloat(tolerance) * 111320).toFixed(0);
            if (['25', '50', '100', '111208680'].includes(meters)) {
              toleranceType = meters;
            } else {
              toleranceType = 'custom';
              customTolerance = meters;
            }
          }
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
            working_hours: response.working_hours ? String(response.working_hours) : '',
            credit: response.credit ? String(response.credit) : '',
            debit: response.debit ? String(response.debit) : '',
            half_day_payment: response.half_day_rate ? String(response.half_day_rate) : '',
            holiday_payment: response.holiday_rate ? String(response.holiday_rate) : '',
            adhaar_number: response.adhaar_number || '',
            mobile: response.mobile || '',
            referral_by: response.refferal_by || '',
            referral_by_number: response.refferal_number || '',
            is_login: response.isActive || false,
            email: response.user?.[0]?.email || '',
            attendance_type: response.attendance_type || '',
            tolerance: tolerance,
          });
          setToleranceType(toleranceType);
          setCustomTolerance(customTolerance);
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

  useEffect(() => {
    const fetchFaceAttendanceStatus = async () => {
      try {
        setLoadingFaceAttendance(true);
        const response = await getAPICall('/api/isface-attendance');
        setFaceAttendanceEnabled(response.face_attendance);
        if (!response.face_attendance) setFormData(prev => ({ ...prev, attendance_type: 'location' }));
      } catch (error) {
        console.error('Error fetching face attendance status:', error);
        setFormData(prev => ({ ...prev, attendance_type: 'location' }));
      } finally {
        setLoadingFaceAttendance(false);
      }
    };
    fetchFaceAttendanceStatus();
  }, []);

  useEffect(() => {
    if (formSubmitted || Object.values(touched).some(v => v)) {
      setErrors(validateForm());
    }
  }, [formData, toleranceType, customTolerance, formSubmitted, touched, validateForm]);

  const handleSubmit = useCallback(async () => {
    setFormSubmitted(true);
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = Object.keys(newErrors)[0];
      const firstErrorElement = document.querySelector(`[name="${firstErrorField}"]`) || 
        document.querySelector(`#${firstErrorField}`) || 
        document.querySelector(`input[placeholder*="${t(`LABELS.${firstErrorField}`)}"]`);
      
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorElement.focus();
      }
      showNotification('warning', t('MSG.fixErrorsBeforeSubmit'));
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        half_day_rate: formData.half_day_payment || '0',
        holiday_rate: formData.holiday_payment || '0',
        wage_overtime: formData.wage_overtime || '0',
        refferal_by: formData.referral_by,
        refferal_number: formData.referral_by_number,
        isActive: formData.is_login,
        tolerance: formData.is_login && !formData.tolerance ? 'no_limit' : formData.tolerance
      };

      if (!formData.is_login) {
        delete payload.attendance_type;
        delete payload.tolerance;
      }

      if (!isFullTimeWork) {
        delete payload.wage_hour;
        delete payload.wage_overtime;
        delete payload.credit;
        delete payload.debit;
        delete payload.half_day_rate;
        delete payload.holiday_rate;
        delete payload.working_hours;
      } else {
        // Handle credit and debit calculation
        const creditValue = parseFloat(payload.credit) || 0;
        const debitValue = parseFloat(payload.debit) || 0;

        if (creditValue > 0 && debitValue > 0) {
          if (creditValue > debitValue) {
            payload.credit = (creditValue - debitValue).toString();
            payload.debit = '0';
          } else if (debitValue > creditValue) {
            payload.debit = (debitValue - creditValue).toString();
            payload.credit = '0';
          } else {
            payload.credit = '0';
            payload.debit = '0';
          }
        } else {
          payload.credit = creditValue.toString() || '0';
          payload.debit = debitValue.toString() || '0';
        }
      }

      const response = await put(`/api/employees/${id}`, payload);
      if (response && response.data.id) {
        showNotification('success', response.message || t('MSG.employeeUpdatedSuccess'));
        scrollToTop();
      } else {
        showNotification('danger', response.message || t('MSG.employeeUpdateFailed'));
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      showNotification('danger', error.message || t('MSG.updateError'));
    } finally {
      setSubmitting(false);
    }
  }, [formData, validateForm, showNotification, id, t, isFullTimeWork, scrollToTop]);

  const isFormValid = useMemo(() => {
    const base = formData.name.trim() && formData.gender && formData.work_type && formData.adhaar_number && formData.mobile;
    const loginValid = !formData.is_login || (formData.attendance_type && (formData.tolerance || toleranceType === 'no_limit'));
    return base && loginValid && (formData.work_type === 'fulltime' ? formData.payment_type && formData.overtime_type && formData.wage_hour && formData.working_hours : formData.work_type === 'contract' ? formData.contract_type : true);
  }, [formData, toleranceType]);

  const openModal = useCallback(() => {
    setFormSubmitted(true);
    setErrors(validateForm());
    setShowModal(true);
  }, [validateForm]);

  const closeModal = useCallback(() => setShowModal(false), []);

  const confirmSubmit = useCallback(() => { closeModal(); handleSubmit(); }, [closeModal, handleSubmit]);

  if (loadingEmployee) {
    return (
      <CContainer fluid className="min-h-screen bg-light py-4 d-flex justify-content-center align-items-center">
        <CSpinner color="primary" />
      </CContainer>
    );
  }

  return (
    <CContainer fluid className="min-h-screen bg-light py-0 p-1">
      <CRow className="mb-3">
        <CCol xs={12}>
          <CButton color="secondary" variant="outline" onClick={() => navigate(-1)} className="px-4 py-2 fw-medium">
            <CIcon icon={cilArrowLeft} className="me-2" />
            {t('LABELS.back')}
          </CButton>
        </CCol>
      </CRow>
      <CRow className="justify-content-center">
        <CCol xs={12} className="px-1">
          {notification.show && (
            <CAlert color={notification.type} dismissible onClose={closeNotification} className="mb-3 border-0 shadow-sm">
              {notification.message}
            </CAlert>
          )}
          <CCard className="shadow-sm border-0 mb-0">
            <CCardHeader className="bg-white border-bottom">
              <div className="d-flex align-items-center">
                <CIcon icon={cilUser} className="me-2 text-primary" size="lg" />
                <div>
                  <h5 className="mb-0 fw-bold">{t('LABELS.editEmployeeDetails')}</h5>
                  <p className="text-muted mb-0 small">{t('LABELS.editEmployeeDetailsDownMsg')}</p>
                </div>
              </div>
            </CCardHeader>
            <CCardBody className="p-3">
              <CForm>
                {/* Basic Information */}
                <CCard className="mb-2 border">
                  <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
                    <h6 className="mb-0 fw-semibold">{t('LABELS.basicInformation')}</h6>
                  </CCardHeader>
                  <CCardBody>
                    <CRow className="g-2">
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.employeeName')}<span className="text-danger">*</span></CFormLabel>
                        <CFormInput
                          placeholder={t('LABELS.employeeName')}
                          value={formData.name}
                          name="name"
                          onChange={e => handleInputChange('name', e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                          disabled={submitting}
                        />
                        {(touched.name || formSubmitted) && errors.name && (
                          <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.name}</div>
                        )}
                      </CCol>
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.gender')}<span className="text-danger">*</span></CFormLabel>
                        <CFormSelect
                          value={formData.gender}
                          name="gender"
                          onChange={e => handleInputChange('gender', e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, gender: true }))}
                          disabled={submitting}
                        >
                          <option value="">{t('LABELS.selectGender')}</option>
                          {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </CFormSelect>
                        {(touched.gender || formSubmitted) && errors.gender && (
                          <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.gender}</div>
                        )}
                      </CCol>
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.adhaarNumber')}<span className="text-danger">*</span></CFormLabel>
                        <CFormInput
                          type="text"
                          placeholder={t('LABELS.adhaarNumberPlaceholder')}
                          value={formData.adhaar_number}
                          name="adhaar_number"
                          onChange={e => handleDigitOnlyInput('adhaar_number', e.target.value, 12)}
                          onBlur={() => setTouched(prev => ({ ...prev, adhaar_number: true }))}
                          disabled={submitting}
                        />
                        {(touched.adhaar_number || formSubmitted) && errors.adhaar_number && (
                          <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.adhaar_number}</div>
                        )}
                      </CCol>
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.mobile')}<span className="text-danger">*</span></CFormLabel>
                        <CFormInput
                          type="text"
                          placeholder={t('LABELS.mobileNumberPlaceholder')}
                          value={formData.mobile}
                          name="mobile"
                          onChange={e => handleDigitOnlyInput('mobile', e.target.value, 10)}
                          onBlur={() => setTouched(prev => ({ ...prev, mobile: true }))}
                          disabled={submitting}
                        />
                        {(touched.mobile || formSubmitted) && errors.mobile && (
                          <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.mobile}</div>
                        )}
                      </CCol>
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.workType')}<span className="text-danger">*</span></CFormLabel>
                        <CFormSelect
                          value={formData.work_type}
                          name="work_type"
                          onChange={e => handleWorkTypeChange(e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, work_type: true }))}
                          disabled={submitting}
                        >
                          <option value="">{t('LABELS.selectWorkType')}</option>
                          {WORK_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </CFormSelect>
                        {(touched.work_type || formSubmitted) && errors.work_type && (
                          <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.work_type}</div>
                        )}
                      </CCol>
                      <CCol xs={12} md={4}>
                        {formData.work_type === 'fulltime' && (
                          <>
                            <CFormLabel className="fw-semibold small">{t('LABELS.workHours')}<span className="text-danger">*</span></CFormLabel>
                            <CFormSelect
                              value={formData.working_hours}
                              name="working_hours"
                              onChange={e => handleInputChange('working_hours', e.target.value)}
                              onBlur={() => setTouched(prev => ({ ...prev, working_hours: true }))}
                              disabled={submitting}
                              style={{ maxHeight: '50px', overflowY: 'auto' }}
                            >
                              {workingHoursOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </CFormSelect>
                            {(touched.working_hours || formSubmitted) && errors.working_hours && (
                              <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.working_hours}</div>
                            )}
                          </>
                        )}
                        {formData.work_type === 'contract' && (
                          <>
                            <CFormLabel className="fw-semibold small">{t('LABELS.contractType')}<span className="text-danger">*</span></CFormLabel>
                            <CFormSelect
                              value={formData.contract_type}
                              name="contract_type"
                              onChange={e => handleInputChange('contract_type', e.target.value)}
                              onBlur={() => setTouched(prev => ({ ...prev, contract_type: true }))}
                              disabled={submitting}
                            >
                              <option value="">{t('LABELS.selectContractType')}</option>
                              {CONTRACT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </CFormSelect>
                            {(touched.contract_type || formSubmitted) && errors.contract_type && (
                              <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.contract_type}</div>
                            )}
                          </>
                        )}
                      </CCol>
                    </CRow>
                  </CCardBody>
                </CCard>

                {/* Wage Configuration */}
                {isFullTimeWork && (
                  <CCard className="mb-2 border">
                    <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
                      <h6 className="mb-0 fw-semibold">{t('LABELS.wageConfiguration')}</h6>
                    </CCardHeader>
                    <CCardBody>
                      <CRow className="g-2">
                        <CCol xs={12} md={4}>
                          <CFormLabel className="fw-semibold small">{t('LABELS.paymentType')}<span className="text-danger">*</span></CFormLabel>
                          <CFormSelect
                            value={formData.payment_type}
                            name="payment_type"
                            onChange={e => handleInputChange('payment_type', e.target.value)}
                            onBlur={() => setTouched(prev => ({ ...prev, payment_type: true }))}
                            disabled={submitting}
                          >
                            <option value="">{t('LABELS.selectPaymentType')}</option>
                            {PAYMENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </CFormSelect>
                          {(touched.payment_type || formSubmitted) && errors.payment_type && (
                            <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.payment_type}</div>
                          )}
                        </CCol>
                        <CCol xs={12} md={4}>
                          <CFormLabel className="fw-semibold small">{t('LABELS.overtimeType')}<span className="text-danger">*</span></CFormLabel>
                          <CFormSelect
                            value={formData.overtime_type}
                            name="overtime_type"
                            onChange={e => handleInputChange('overtime_type', e.target.value)}
                            onBlur={() => setTouched(prev => ({ ...prev, overtime_type: true }))}
                            disabled={submitting}
                          >
                            <option value="">{t('LABELS.selectOvertimeType')}</option>
                            {OVERTIME_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </CFormSelect>
                          {(touched.overtime_type || formSubmitted) && errors.overtime_type && (
                            <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.overtime_type}</div>
                          )}
                        </CCol>
                        <CCol xs={12} md={4}>
                          <CFormLabel className="fw-semibold small">{t('LABELS.wageHour')}<span className="text-danger">*</span></CFormLabel>
                          <CFormInput
                            type="text"
                            placeholder={t('LABELS.priceZero')}
                            value={formData.wage_hour}
                            name="wage_hour"
                            onChange={e => handleNumberInput('wage_hour', e.target.value)}
                            onBlur={() => setTouched(prev => ({ ...prev, wage_hour: true }))}
                            disabled={submitting}
                          />
                          {(touched.wage_hour || formSubmitted) && errors.wage_hour && (
                            <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.wage_hour}</div>
                          )}
                        </CCol>
                        {formData.overtime_type === 'not_available' || formData.overtime_type === '' ? (
                          <>
                            <CCol xs={12} md={4}>
                              <CFormLabel className="fw-semibold small">{t('LABELS.halfDayPayment')}</CFormLabel>
                              <CFormInput
                                type="text"
                                placeholder={t('LABELS.priceZero')}
                                value={formData.half_day_payment}
                                name="half_day_payment"
                                onChange={e => handleNumberInput('half_day_payment', e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, half_day_payment: true }))}
                                disabled={submitting}
                              />
                              {(touched.half_day_payment || formSubmitted) && errors.half_day_payment && (
                                <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.half_day_payment}</div>
                              )}
                            </CCol>
                            <CCol xs={12} md={4}>
                              <CFormLabel className="fw-semibold small">{t('LABELS.holidayPayment')}</CFormLabel>
                              <CFormInput
                                type="text"
                                placeholder={t('LABELS.priceZero')}
                                value={formData.holiday_payment}
                                name="holiday_payment"
                                onChange={e => handleNumberInput('holiday_payment', e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, holiday_payment: true }))}
                                disabled={submitting}
                              />
                              {(touched.holiday_payment || formSubmitted) && errors.holiday_payment && (
                                <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.holiday_payment}</div>
                              )}
                            </CCol>
                          </>
                        ) : (
                          <>
                            <CCol xs={12} md={4}>
                              <CFormLabel className="fw-semibold small">{t('LABELS.wageOvertime')}</CFormLabel>
                              <CFormInput
                                type="text"
                                placeholder={t('LABELS.priceZero')}
                                value={formData.wage_overtime}
                                name="wage_overtime"
                                onChange={e => handleNumberInput('wage_overtime', e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, wage_overtime: true }))}
                                disabled={submitting}
                              />
                              {(touched.wage_overtime || formSubmitted) && errors.wage_overtime && (
                                <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.wage_overtime}</div>
                              )}
                            </CCol>
                            <CCol xs={12} md={4}>
                              <CFormLabel className="fw-semibold small">{t('LABELS.halfDayPayment')}</CFormLabel>
                              <CFormInput
                                type="text"
                                placeholder={t('LABELS.priceZero')}
                                value={formData.half_day_payment}
                                name="half_day_payment"
                                onChange={e => handleNumberInput('half_day_payment', e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, half_day_payment: true }))}
                                disabled={submitting}
                              />
                              {(touched.half_day_payment || formSubmitted) && errors.half_day_payment && (
                                <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.half_day_payment}</div>
                              )}
                            </CCol>
                            <CCol xs={12} md={4}>
                              <CFormLabel className="fw-semibold small">{t('LABELS.holidayPayment')}</CFormLabel>
                              <CFormInput
                                type="text"
                                placeholder={t('LABELS.priceZero')}
                                value={formData.holiday_payment}
                                name="holiday_payment"
                                onChange={e => handleNumberInput('holiday_payment', e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, holiday_payment: true }))}
                                disabled={submitting}
                              />
                              {(touched.holiday_payment || formSubmitted) && errors.holiday_payment && (
                                <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.holiday_payment}</div>
                              )}
                            </CCol>
                          </>
                        )}
                      </CRow>
                    </CCardBody>
                  </CCard>
                )}

                {/* Additional Info */}
                <CCard className="mb-2 border">
                  <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
                    <h6 className="mb-0 fw-semibold">{t('LABELS.additionalInfo')}</h6>
                  </CCardHeader>
                  <CCardBody>
                    <CRow className="g-2">
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.email')}</CFormLabel>
                        <CFormInput
                          type="email"
                          placeholder={t('LABELS.email')}
                          value={formData.email}
                          name="email"
                          onChange={e => handleInputChange('email', e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                          disabled={submitting}
                        />
                        {(touched.email || formSubmitted) && errors.email && (
                          <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.email}</div>
                        )}
                      </CCol>
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.referralBy')}</CFormLabel>
                        <CFormInput
                          type="text"
                          placeholder={t('LABELS.referralBy')}
                          value={formData.referral_by}
                          onChange={e => handleInputChange('referral_by', e.target.value)}
                          disabled={submitting}
                        />
                      </CCol>
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.referralByNumber')}</CFormLabel>
                        <CFormInput
                          type="text"
                          placeholder={t('LABELS.referralByNumberPlaceholder')}
                          value={formData.referral_by_number}
                          name="referral_by_number"
                          onChange={e => handleDigitOnlyInput('referral_by_number', e.target.value, 10)}
                          onBlur={() => setTouched(prev => ({ ...prev, referral_by_number: true }))}
                          disabled={submitting}
                        />
                        {(touched.referral_by_number || formSubmitted) && errors.referral_by_number && (
                          <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.referral_by_number}</div>
                        )}
                      </CCol>
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.credit')}</CFormLabel>
                        <CFormInput
                          type="text"
                          placeholder={t('LABELS.priceZero')}
                          value={formData.credit}
                          name="credit"
                          onChange={e => handleNumberInput('credit', e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, credit: true }))}
                          disabled={submitting}
                        />
                        {(touched.credit || formSubmitted) && errors.credit && (
                          <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.credit}</div>
                        )}
                      </CCol>
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.debit')}</CFormLabel>
                        <CFormInput
                          type="text"
                          placeholder={t('LABELS.priceZero')}
                          value={formData.debit}
                          name="debit"
                          onChange={e => handleNumberInput('debit', e.target.value)}
                          onBlur={() => setTouched(prev => ({ ...prev, debit: true }))}
                          disabled={submitting}
                        />
                        {(touched.debit || formSubmitted) && errors.debit && (
                          <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.debit}</div>
                        )}
                      </CCol>
                    </CRow>
                  </CCardBody>
                </CCard>

                {/* Login Checkbox */}
                <CRow className="mb-4">
                  <CCol xs={12}>
                    <CFormCheck
                      id="isLogin"
                      checked={formData.is_login}
                      onChange={e => handleCheckboxChange(e.target.checked)}
                      disabled={submitting}
                      label={t('LABELS.isLogin')}
                      className="fw-medium"
                    />
                  </CCol>
                </CRow>

                {/* Employee Configuration */}
                {formData.is_login && (
                  <CCard className="mb-2 border">
                    <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
                      <h6 className="mb-0 fw-semibold">{t('LABELS.employeeConfiguration')}</h6>
                    </CCardHeader>
                    <CCardBody>
                      <CRow className="g-2">
                        <CCol xs={12} md={4}>
                          {faceAttendanceEnabled && !loadingFaceAttendance && (
                            <>
                              <CFormLabel className="fw-semibold small">{t('LABELS.attendanceType')}<span className="text-danger">*</span></CFormLabel>
                              <CFormSelect
                                value={formData.attendance_type}
                                name="attendance_type"
                                onChange={e => handleInputChange('attendance_type', e.target.value)}
                                onBlur={() => setTouched(prev => ({ ...prev, attendance_type: true }))}
                                disabled={submitting}
                              >
                                <option value="">{t('LABELS.selectAttendanceType')}</option>
                                {ATTENDANCE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </CFormSelect>
                              {(touched.attendance_type || formSubmitted) && errors.attendance_type && (
                                <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.attendance_type}</div>
                              )}
                            </>
                          )}
                          {loadingFaceAttendance && (
                            <div className="d-flex align-items-center">
                              <CSpinner size="sm" className="me-2" />
                              <span className="text-muted small">Loading...</span>
                            </div>
                          )}
                        </CCol>
                        <CCol xs={12} md={4}>
                          <CFormLabel htmlFor="toleranceType" className="fw-semibold small">
                            {t('LABELS.tolerance') || 'Tolerance'} <span className="text-danger">*</span>
                          </CFormLabel>
                          <CFormSelect
                            id="toleranceType"
                            value={toleranceType}
                            name="tolerance"
                            onChange={e => {
                              setToleranceType(e.target.value);
                              handleToleranceChange(e.target.value, customTolerance);
                            }}
                            onBlur={() => setTouched(prev => ({ ...prev, tolerance: true }))}
                            disabled={submitting}
                          >
                            {toleranceOptions.map((option, index) => (
                              <option key={index} value={option.value}>{option.label}</option>
                            ))}
                          </CFormSelect>
                          {(touched.tolerance || formSubmitted) && errors.tolerance && (
                            <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.tolerance}</div>
                          )}
                        </CCol>
                        <CCol xs={12} md={4}>
                          {toleranceType === 'custom' && (
                            <>
                              <CFormLabel htmlFor="customTolerance" className="mt-0 fw-semibold small">
                                {t('LABELS.customToleranceValue') || 'Custom Tolerance (meters)'} <span className="text-danger">*</span>
                              </CFormLabel>
                              <CInputGroup>
                                <CFormInput
                                  type="number"
                                  id="customTolerance"
                                  placeholder="Enter meters"
                                  value={customTolerance}
                                  name="customTolerance"
                                  onChange={e => {
                                    setCustomTolerance(e.target.value);
                                    handleToleranceChange('custom', e.target.value);
                                  }}
                                  onBlur={() => setTouched(prev => ({ ...prev, tolerance: true }))}
                                  disabled={submitting}
                                  min="1"
                                  max="100000"
                                />
                                <CInputGroupText>m</CInputGroupText>
                              </CInputGroup>
                              {(touched.tolerance || formSubmitted) && errors.tolerance && (
                                <div className="text-danger small mt-1 animate__animated animate__fadeIn">{errors.tolerance}</div>
                              )}
                            </>
                          )}
                        </CCol>
                      </CRow>
                      <CRow className="g-2">
                        <CCol xs={12} md={4}>
                          {(convertedDegree() && toleranceType === 'custom') && (
                            <div className="mt-2 p-2 bg-light rounded">
                              <strong>{t('LABELS.tolerancePreview') || 'Tolerance Preview'}:</strong>{' '}
                              ≈ {customTolerance} meters ≈ <code>{convertedDegree()}°</code> latitude degrees
                            </div>
                          )}
                        </CCol>
                      </CRow>
                    </CCardBody>
                  </CCard>
                )}

                {/* Submit Buttons */}
                <CRow>
                  <CCol xs={12} className="d-flex gap-2 justify-content-end">
                    <CButton
                      color="secondary"
                      variant="outline"
                      onClick={resetForm}
                      disabled={submitting}
                      className="px-4 py-2 fw-medium"
                    >
                      {t('LABELS.cancel')}
                    </CButton>
                    <CButton
                      color="primary"
                      disabled={submitting || !isFormValid}
                      onClick={openModal}
                      className="px-4 py-2 fw-medium"
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
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>

          {/* Confirmation Modal */}
          <CModal visible={showModal} backdrop="static" keyboard={false}>
            <CModalHeader className="border-bottom">
              <CModalTitle className="h5 fw-semibold">{t('LABELS.confirmEmployeeUpdate')}</CModalTitle>
            </CModalHeader>
            <CModalBody className="p-4">
              <p className="mb-3">{t('MSG.confirmEmployeeUpdateMessage')}</p>
              <div className="bg-light rounded p-3">
                <p className="mb-2"><strong>{t('LABELS.name')}:</strong> {formData.name}</p>
                <p className="mb-2"><strong>{t('LABELS.gender')}:</strong> {GENDER_OPTIONS.find(o => o.value === formData.gender)?.label || formData.gender}</p>
                <p className="mb-2"><strong>{t('LABELS.workType')}:</strong> {WORK_TYPE_OPTIONS.find(o => o.value === formData.work_type)?.label || formData.work_type}</p>
                {formData.work_type === 'fulltime' && (
                  <>
                    <p className="mb-2"><strong>{t('LABELS.paymentType')}:</strong> {PAYMENT_TYPE_OPTIONS.find(o => o.value === formData.payment_type)?.label || formData.payment_type}</p>
                    <p className="mb-2"><strong>{t('LABELS.overtimeType')}:</strong> {OVERTIME_TYPE_OPTIONS.find(o => o.value === formData.overtime_type)?.label || formData.overtime_type}</p>
                    <p className="mb-2"><strong>{t('LABELS.workHours')}:</strong> {workingHoursOptions.find(o => o.value === parseInt(formData.working_hours))?.label || formData.working_hours}</p>
                  </>
                )}
                {formData.work_type === 'contract' && (
                  <p className="mb-2"><strong>{t('LABELS.contractType')}:</strong> {CONTRACT_TYPE_OPTIONS.find(o => o.value === formData.contract_type)?.label || formData.contract_type}</p>
                )}
                <p className="mb-2"><strong>{t('LABELS.mobile')}:</strong> {formData.mobile}</p>
                <p className="mb-2"><strong>{t('LABELS.loginAccess')}:</strong> {formData.is_login ? t('LABELS.yes') : t('LABELS.no')}</p>
                {formData.is_login && (
                  <>
                    <p className="mb-2"><strong>{t('LABELS.attendanceType')}:</strong> {ATTENDANCE_TYPE_OPTIONS.find(o => o.value === formData.attendance_type)?.label || formData.attendance_type}</p>
                    {/* <p className="mb-2"><strong>{t('LABELS.tolerance')}:</strong> {toleranceOptions.find(o => o.value === (formData.tolerance === 'no_limit' ? '111208680' : formData.tolerance))?.label || formData.tolerance}</p> */}
                  </>
                )}
                {formData.referral_by_number && (
                  <p className="mb-2"><strong>{t('LABELS.referralByNumber')}:</strong> {formData.referral_by_number}</p>
                )}
              </div>
            </CModalBody>
            <CModalFooter className="border-top">
              <CButton color="secondary" onClick={closeModal} className="px-4 py-2">{t('LABELS.cancel')}</CButton>
              <CButton color="primary" onClick={confirmSubmit} className="px-4 py-2">
                <CIcon icon={cilCheckCircle} className="ms-2 me-2"/>
                {t('LABELS.saveUpdatedDetails')}
              </CButton>
            </CModalFooter>
          </CModal>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default EmployeeEditForm;