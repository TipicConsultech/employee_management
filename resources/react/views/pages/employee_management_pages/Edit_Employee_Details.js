import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CContainer, CRow, CCol, CCard, CCardHeader, CCardBody, CForm, CFormSelect,
  CFormInput, CFormLabel, CButton, CAlert, CSpinner, CFormCheck, CModal,
  CModalHeader, CModalTitle, CModalBody, CModalFooter,
} from '@coreui/react';
import { cilUser, cilCheckCircle, cilArrowLeft } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { put, getAPICall } from '../../../util/api';

// Constants
const NOTIFICATION_TIMEOUT = 3000;
const INITIAL_FORM_DATA = {
  name: '', gender: '', payment_type: '', contract_type: '', work_type: '', overtime_type: '',
  wage_hour: '', wage_overtime: '', credit: '0', debit: '0', half_day_payment: '',
  holiday_payment: '', adhaar_number: '', mobile: '', referral_by: '', referral_by_number: '',
  is_login: false, email: '', attendance_type: ''
};
const INITIAL_NOTIFICATION = { show: false, type: '', message: '' };

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
    { value: 'location', label: t('LABELS.location') }, { value: 'both', label: t('LABELS.both') }
  ], [t]);
  const OVERTIME_TYPE_OPTIONS = useMemo(() => [
    { value: 'hourly', label: t('LABELS.hourly') }, { value: 'fixed', label: t('LABELS.fixed') }
  ], [t]);

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [notification, setNotification] = useState(INITIAL_NOTIFICATION);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [faceAttendanceEnabled, setFaceAttendanceEnabled] = useState(false);
  const [loadingFaceAttendance, setLoadingFaceAttendance] = useState(true);
  const [loadingEmployee, setLoadingEmployee] = useState(true);

  const PAYMENT_TYPE_OPTIONS = useMemo(() => formData.work_type === 'fulltime' ? [
    { value: 'weekly', label: t('LABELS.weekly') }, { value: 'monthly', label: t('LABELS.monthly') }
  ] : [], [formData.work_type, t]);
  const CONTRACT_TYPE_OPTIONS = useMemo(() => formData.work_type === 'contract' ? [
    { value: 'volume_based', label: t('LABELS.volumeBasedContract') },
    { value: 'fixed', label: t('LABELS.fixedContract') }
  ] : [], [formData.work_type, t]);
  const isFullTimeWork = formData.work_type === 'fulltime';

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
    if (!formData.name.trim()) newErrors.name = t('MSG.nameRequired');
    if (!formData.gender) newErrors.gender = t('MSG.genderRequired');
    if (!formData.work_type) newErrors.work_type = t('MSG.workTypeRequired');
    if (formData.work_type === 'fulltime' && !formData.payment_type) newErrors.payment_type = t('MSG.paymentTypeRequired');
    if (formData.work_type === 'fulltime' && !formData.overtime_type) newErrors.overtime_type = t('MSG.overtimeTypeRequired');
    if (formData.work_type === 'contract' && !formData.contract_type) newErrors.contract_type = t('MSG.contractTypeRequired');
    if (isFullTimeWork) {
      if (!formData.wage_hour) newErrors.wage_hour = t('MSG.wageHourRequired');
      if (formData.wage_hour && (isNaN(formData.wage_hour) || parseFloat(formData.wage_hour) < 0)) newErrors.wage_hour = t('MSG.wageHourPositiveNumber');
      if (formData.wage_overtime && (isNaN(formData.wage_overtime) || parseFloat(formData.wage_overtime) < 0)) newErrors.wage_overtime = t('MSG.wageOvertimePositiveNumber');
      if (formData.credit && (isNaN(formData.credit) || parseFloat(formData.credit) < 0)) newErrors.credit = t('MSG.creditPositiveNumber');
      if (formData.debit && (isNaN(formData.debit) || parseFloat(formData.debit) < 0)) newErrors.debit = t('MSG.debitPositiveNumber');
      if (formData.half_day_payment && (isNaN(formData.half_day_payment) || parseFloat(formData.half_day_payment) < 0)) newErrors.half_day_payment = t('MSG.halfDayPaymentPositiveNumber');
      if (formData.holiday_payment && (isNaN(formData.holiday_payment) || parseFloat(formData.holiday_payment) < 0)) newErrors.holiday_payment = t('MSG.holidayPaymentPositiveNumber');
    }
    if (!formData.adhaar_number) newErrors.adhaar_number = t('MSG.adhaarRequired');
    else if (!/^\d{12}$/.test(formData.adhaar_number)) newErrors.adhaar_number = t('MSG.adhaarInvalid');
    if (!formData.mobile) newErrors.mobile = t('MSG.mobileRequired');
    else if (!/^\d{10}$/.test(formData.mobile)) newErrors.mobile = t('MSG.mobileInvalid');
    if (formData.referral_by_number && !/^\d{10}$/.test(formData.referral_by_number)) newErrors.referral_by_number = t('MSG.referralNumberInvalid');
    if (formData.is_login && !formData.attendance_type) newErrors.attendance_type = t('MSG.attendanceTypeRequired');
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) newErrors.email = t('MSG.emailInvalid');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t, isFullTimeWork]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  }, [errors]);
  const handleNumberInput = useCallback((field, value) => (/^\d*\.?\d*$/.test(value) || value === '') && handleInputChange(field, value), [handleInputChange]);
  const handleDigitOnlyInput = useCallback((field, value, maxLength) => (/^\d*$/.test(value) && value.length <= maxLength || value === '') && handleInputChange(field, value), [handleInputChange]);
  const handleWorkTypeChange = useCallback((value) => {
    setFormData(prev => ({
      ...prev, work_type: value, payment_type: value === 'fulltime' ? prev.payment_type : '',
      contract_type: value === 'contract' ? prev.contract_type : '', overtime_type: value === 'fulltime' ? prev.overtime_type : '',
      wage_hour: value === 'contract' ? '' : prev.wage_hour, wage_overtime: value === 'contract' ? '' : prev.wage_overtime,
      credit: value === 'contract' ? '0' : prev.credit, debit: value === 'contract' ? '0' : prev.debit,
      half_day_payment: value === 'contract' ? '' : prev.half_day_payment, holiday_payment: value === 'contract' ? '' : prev.holiday_payment
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.work_type; delete newErrors.payment_type; delete newErrors.contract_type; delete newErrors.overtime_type;
      if (value === 'contract') { 
        delete newErrors.wage_hour; delete newErrors.wage_overtime; delete newErrors.credit; 
        delete newErrors.debit; delete newErrors.half_day_payment; delete newErrors.holiday_payment; 
      }
      return newErrors;
    });
  }, []);
  const handleCheckboxChange = useCallback((checked) => {
    setFormData(prev => ({
      ...prev, is_login: checked, attendance_type: checked ? prev.attendance_type : ''
    }));
    if (!checked) setErrors(prev => { const newErrors = { ...prev }; delete newErrors.attendance_type; return newErrors; });
  }, []);
  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA); setErrors({}); setShowModal(false);
  }, []);

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

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
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
        isActive: formData.is_login
      };
      if (!formData.is_login) delete payload.attendance_type;
      if (!isFullTimeWork) {
        delete payload.wage_hour;
        delete payload.wage_overtime;
        delete payload.credit;
        delete payload.debit;
        delete payload.half_day_rate;
        delete payload.holiday_rate;
      }
      const response = await put(`/api/employees/${id}`, payload);
      if (response && response.data.id) {
        showNotification('success', response.message || t('MSG.employeeUpdatedSuccess'));
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

  const isFormValid = useMemo(() => {
    const base = formData.name.trim() && formData.gender && formData.work_type && formData.adhaar_number && formData.mobile;
    return base && (formData.work_type === 'fulltime' ? formData.payment_type && formData.overtime_type && formData.wage_hour : formData.work_type === 'contract' ? formData.contract_type : true);
  }, [formData]);

  const openModal = useCallback(() => setShowModal(true), []);
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
                          onChange={e => handleInputChange('name', e.target.value)}
                          invalid={!!errors.name}
                          disabled={submitting}
                          className={errors.name ? 'border-danger' : ''}
                        />
                        {errors.name && <div className="text-danger small">{errors.name}</div>}
                      </CCol>
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.gender')}<span className="text-danger">*</span></CFormLabel>
                        <CFormSelect
                          value={formData.gender}
                          onChange={e => handleInputChange('gender', e.target.value)}
                          invalid={!!errors.gender}
                          disabled={submitting}
                          className={errors.gender ? 'border-danger' : ''}
                        >
                          <option value="">{t('LABELS.selectGender')}</option>
                          {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </CFormSelect>
                        {errors.gender && <div className="text-danger small">{errors.gender}</div>}
                      </CCol>
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.adhaarNumber')}<span className="text-danger">*</span></CFormLabel>
                        <CFormInput
                          type="text"
                          placeholder={t('LABELS.adhaarNumberPlaceholder')}
                          value={formData.adhaar_number}
                          onChange={e => handleDigitOnlyInput('adhaar_number', e.target.value, 12)}
                          invalid={!!errors.adhaar_number}
                          disabled={submitting}
                          className={errors.adhaar_number ? 'border-danger' : ''}
                        />
                        {errors.adhaar_number && <div className="text-danger small">{errors.adhaar_number}</div>}
                      </CCol>
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.mobile')}<span className="text-danger">*</span></CFormLabel>
                        <CFormInput
                          type="text"
                          placeholder={t('LABELS.mobileNumberPlaceholder')}
                          value={formData.mobile}
                          onChange={e => handleDigitOnlyInput('mobile', e.target.value, 10)}
                          invalid={!!errors.mobile}
                          disabled={submitting}
                          className={errors.mobile ? 'border-danger' : ''}
                        />
                        {errors.mobile && <div className="text-danger small">{errors.mobile}</div>}
                      </CCol>
                      <CCol xs={12} md={4}>
                        <CFormLabel className="fw-semibold small">{t('LABELS.workType')}<span className="text-danger">*</span></CFormLabel>
                        <CFormSelect
                          value={formData.work_type}
                          onChange={e => handleWorkTypeChange(e.target.value)}
                          invalid={!!errors.work_type}
                          disabled={submitting}
                          className={errors.work_type ? 'border-danger' : ''}
                        >
                          <option value="">{t('LABELS.selectWorkType')}</option>
                          {WORK_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </CFormSelect>
                        {errors.work_type && <div className="text-danger small">{errors.work_type}</div>}
                      </CCol>
                      <CCol xs={12} md={4}>
                        {formData.work_type === 'contract' && (
                          <>
                            <CFormLabel className="fw-semibold small">{t('LABELS.contractType')}<span className="text-danger">*</span></CFormLabel>
                            <CFormSelect
                              value={formData.contract_type}
                              onChange={e => handleInputChange('contract_type', e.target.value)}
                              invalid={!!errors.contract_type}
                              disabled={submitting}
                              className={errors.contract_type ? 'border-danger' : ''}
                            >
                              <option value="">{t('LABELS.selectContractType')}</option>
                              {CONTRACT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </CFormSelect>
                            {errors.contract_type && <div className="text-danger small">{errors.contract_type}</div>}
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
                            onChange={e => handleInputChange('payment_type', e.target.value)}
                            invalid={!!errors.payment_type}
                            disabled={submitting}
                            className={errors.payment_type ? 'border-danger' : ''}
                          >
                            <option value="">{t('LABELS.selectPaymentType')}</option>
                            {PAYMENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </CFormSelect>
                          {errors.payment_type && <div className="text-danger small">{errors.payment_type}</div>}
                        </CCol>
                        <CCol xs={12} md={4}>
                          <CFormLabel className="fw-semibold small">{t('LABELS.overtimeType')}<span className="text-danger">*</span></CFormLabel>
                          <CFormSelect
                            value={formData.overtime_type}
                            onChange={e => handleInputChange('overtime_type', e.target.value)}
                            invalid={!!errors.overtime_type}
                            disabled={submitting}
                            className={errors.overtime_type ? 'border-danger' : ''}
                          >
                            <option value="">{t('LABELS.selectOvertimeType')}</option>
                            {OVERTIME_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </CFormSelect>
                          {errors.overtime_type && <div className="text-danger small">{errors.overtime_type}</div>}
                        </CCol>
                        <CCol xs={12} md={4}>
                          <CFormLabel className="fw-semibold small">{t('LABELS.wageHour')}<span className="text-danger">*</span></CFormLabel>
                          <CFormInput
                            type="text"
                            placeholder={t('LABELS.priceZero')}
                            value={formData.wage_hour}
                            onChange={e => handleNumberInput('wage_hour', e.target.value)}
                            invalid={!!errors.wage_hour}
                            disabled={submitting}
                            className={errors.wage_hour ? 'border-danger' : ''}
                          />
                          {errors.wage_hour && <div className="text-danger small">{errors.wage_hour}</div>}
                        </CCol>
                        <CCol xs={12} md={4}>
                          <CFormLabel className="fw-semibold small">{t('LABELS.wageOvertime')}</CFormLabel>
                          <CFormInput
                            type="text"
                            placeholder={t('LABELS.priceZero')}
                            value={formData.wage_overtime}
                            onChange={e => handleNumberInput('wage_overtime', e.target.value)}
                            invalid={!!errors.wage_overtime}
                            disabled={submitting}
                            className={errors.wage_overtime ? 'border-danger' : ''}
                          />
                          {errors.wage_overtime && <div className="text-danger small">{errors.wage_overtime}</div>}
                        </CCol>
                        
                        <CCol xs={12} md={4}>
                          <CFormLabel className="fw-semibold small">{t('LABELS.halfDayPayment')}</CFormLabel>
                          <CFormInput
                            type="text"
                            placeholder={t('LABELS.priceZero')}
                            value={formData.half_day_payment}
                            onChange={e => handleNumberInput('half_day_payment', e.target.value)}
                            invalid={!!errors.half_day_payment}
                            disabled={submitting}
                            className={errors.half_day_payment ? 'border-danger' : ''}
                          />
                          {errors.half_day_payment && <div className="text-danger small">{errors.half_day_payment}</div>}
                        </CCol>
                        <CCol xs={12} md={4}>
                          <CFormLabel className="fw-semibold small">{t('LABELS.holidayPayment')}</CFormLabel>
                          <CFormInput
                            type="text"
                            placeholder={t('LABELS.priceZero')}
                            value={formData.holiday_payment}
                            onChange={e => handleNumberInput('holiday_payment', e.target.value)}
                            invalid={!!errors.holiday_payment}
                            disabled={submitting}
                            className={errors.holiday_payment ? 'border-danger' : ''}
                          />
                          {errors.holiday_payment && <div className="text-danger small">{errors.holiday_payment}</div>}
                        </CCol>
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
                          onChange={e => handleInputChange('email', e.target.value)}
                          invalid={!!errors.email}
                          disabled={submitting}
                          className={errors.email ? 'border-danger' : ''}
                        />
                        {errors.email && <div className="text-danger small">{errors.email}</div>}
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
                          onChange={e => handleDigitOnlyInput('referral_by_number', e.target.value, 10)}
                          invalid={!!errors.referral_by_number}
                          disabled={submitting}
                          className={errors.referral_by_number ? 'border-danger' : ''}
                        />
                        {errors.referral_by_number && <div className="text-danger small">{errors.referral_by_number}</div>}
                      </CCol>
                      <CCol xs={12} md={4}>
                          <CFormLabel className="fw-semibold small">{t('LABELS.credit')}</CFormLabel>
                          <CFormInput
                            type="text"
                            placeholder="0"
                            value={formData.credit}
                            onChange={e => handleNumberInput('credit', e.target.value)}
                            invalid={!!errors.credit}
                            disabled={submitting}
                            className={errors.credit ? 'border-danger' : ''}
                          />
                          {errors.credit && <div className="text-danger small">{errors.credit}</div>}
                        </CCol>
                        <CCol xs={12} md={4}>
                          <CFormLabel className="fw-semibold small">{t('LABELS.debit')}</CFormLabel>
                          <CFormInput
                            type="text"
                            placeholder="0"
                            value={formData.debit}
                            onChange={e => handleNumberInput('debit', e.target.value)}
                            invalid={!!errors.debit}
                            disabled={submitting}
                            className={errors.debit ? 'border-danger' : ''}
                          />
                          {errors.debit && <div className="text-danger small">{errors.debit}</div>}
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
                                onChange={e => handleInputChange('attendance_type', e.target.value)}
                                invalid={!!errors.attendance_type}
                                disabled={submitting}
                                className={errors.attendance_type ? 'border-danger' : ''}
                              >
                                <option value="">{t('LABELS.selectAttendanceType')}</option>
                                {ATTENDANCE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </CFormSelect>
                              {errors.attendance_type && <div className="text-danger small">{errors.attendance_type}</div>}
                            </>
                          )}
                          {loadingFaceAttendance && (
                            <div className="d-flex align-items-center">
                              <CSpinner size="sm" className="me-2" />
                              <span className="text-muted small">Loading...</span>
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
              <CButton color="secondary" onClick={closeModal} className="px-4 py-2">{t('LABELS.cancel')}</CButton>
              <CButton color="primary" onClick={confirmSubmit} className="px-4 py-2">
                <CIcon icon={cilCheckCircle} className="me-2" />
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