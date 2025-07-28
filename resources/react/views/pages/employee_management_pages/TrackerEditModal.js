import React, { useState, useEffect, useRef } from 'react';
import {
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormCheck,
  CRow,
  CCol,
  CSpinner,
  CButtonGroup
} from '@coreui/react';
import { getAPICall, put } from '../../../util/api';

const TrackerEditModal = ({ fetchEmployees, visible, onClose, trackerId, onSuccess }) => {
  const [formData, setFormData] = useState({
    half_day: false,
    check_in_time: '',
    check_out_time: '',
    status: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tracker, setTracker] = useState({});
  const inputRef = useRef(null);

  const handleFocus = () => {
    if (inputRef.current?.showPicker) {
      inputRef.current.showPicker();
    }
  };

  const statusOptions = [
    { value: 'NA', label: 'Present' },
    { value: 'H', label: 'Holiday' },
    { value: 'PL', label: 'Paid Leave' },
    { value: 'SL', label: 'Sick Leave' },
    { value: 'CL', label: 'Casual Leave' },
  ];

  useEffect(() => {
    if (visible && trackerId) {
      getTracker();
    } else {
      resetForm();
    }
  }, [visible, trackerId]);

  async function getTracker() {
    const response = await getAPICall(`/api/employee-tracker/${trackerId}`);
    if (response.id) {
      setTracker(response);
      loadTrackerData(response);
    }
  }

  const resetForm = () => {
    setFormData({
      half_day: false,
      check_in_time: '',
      check_out_time: '',
      status: ''
    });
    setOriginalData({});
    setErrors({});
  };

  const formatTimeForInput = (dateTimeString) => {
    if (!dateTimeString) return '';
    
    let date;
    if (dateTimeString.includes('T')) {
      date = new Date(dateTimeString);
    } else {
      date = new Date(dateTimeString.replace(' ', 'T'));
    }
    
    if (isNaN(date.getTime())) return '';
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };

  const loadTrackerData = (trackerData) => {
    const mappedData = {
      half_day: trackerData.half_day || false,
      check_in_time: trackerData.created_at ? formatTimeForInput(trackerData.created_at) : '',
      check_out_time: trackerData.check_out_time ? formatTimeForInput(trackerData.check_out_time) : '',
      status: trackerData.status || '',
      original_check_in_date: trackerData.created_at ? trackerData.created_at.split('T')[0] : '',
      original_check_out_date: trackerData.check_out_time ? trackerData.check_out_time.split('T')[0] : ''
    };
    
    setFormData(mappedData);
    setOriginalData(mappedData);
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const formatDateTime = (timeString, originalDateTime) => {
    if (!timeString) return null;
    
    // Use current date if no original datetime is provided
    const date = originalDateTime ? new Date(originalDateTime) : new Date();
    
    // If no original datetime, use current date
    const dateString = originalDateTime ? originalDateTime.split('T')[0] : 
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    // Combine with new time
    const [hours, minutes] = timeString.split(':');
    date.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedHours = String(date.getHours()).padStart(2, '0');
    const formattedMinutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${formattedHours}:${formattedMinutes}:${seconds}`;
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.check_in_time && formData.check_out_time && formData.original_check_in_date) {
      const checkIn = new Date(`${formData.original_check_in_date}T${formData.check_in_time}:00`);
      const checkOutDate = formData.original_check_out_date || formData.original_check_in_date;
      const checkOut = new Date(`${checkOutDate}T${formData.check_out_time}:00`);
      
      if (checkOut <= checkIn) {
        newErrors.check_out_time = 'Check-out time must be after check-in time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const hasFormChanged = () => {
    return (
      formData.half_day !== originalData.half_day ||
      formData.check_in_time !== originalData.check_in_time ||
      formData.check_out_time !== originalData.check_out_time ||
      formData.status !== originalData.status
    );
  };

  const buildPayload = () => {
    const payload = {};
    
    if (formData.half_day !== originalData.half_day) {
      payload.half_day = formData.half_day ? '1' : '0';
    }
    
    if (formData.check_in_time !== originalData.check_in_time) {
      payload.check_in_time = formData.check_in_time ? 
        formatDateTime(formData.check_in_time, tracker.created_at) : null;
    }
    
    if (formData.check_out_time !== originalData.check_out_time) {
      payload.check_out_time = formData.check_out_time ? 
        formatDateTime(formData.check_out_time, tracker.check_out_time || tracker.created_at) : null;
    }
    
    if (formData.status !== originalData.status) {
      payload.status = formData.status || null;
    }
    
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = buildPayload();
      
      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      const result = await put(`/api/employeetracker/${trackerId}`, payload);

      if (result.data && result.data.id) {
        onSuccess?.(result.message);
        onClose();
        fetchEmployees();
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (error) {
      console.error('Error updating tracker:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <CModal visible={visible} onClose={handleClose} backdrop="static">
      <CModalHeader>
        <CModalTitle>Edit Tracker</CModalTitle>
      </CModalHeader>
      
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          <CRow className="mb-3">
            <CCol>
              <CFormCheck
                id="half_day"
                label="Half Day"
                checked={formData.half_day}
                onChange={(e) => handleInputChange('half_day', e.target.checked)}
              />
            </CCol>

            <CCol>
              <div className="d-flex gap-2 justify-content-end">
                <CButton color="secondary" onClick={handleClose} disabled={loading}>
                  Cancel
                </CButton>
                <CButton 
                  color="primary" 
                  type="submit" 
                  disabled={loading || !hasFormChanged()}
                >
                  {loading ? (
                    <>
                      <CSpinner size="sm" className="me-2" />
                      Updating...
                    </>
                  ) : (
                    'Update'
                  )}
                </CButton>
              </div>
            </CCol>
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="check_in_time">Check In Time</CFormLabel>
              <CFormInput
                type="time"
                id="check_in_time"
                value={formData.check_in_time}
                onChange={(e) => handleInputChange('check_in_time', e.target.value)}
                onFocus={handleFocus}
                invalid={!!errors.check_in_time}
                innerRef={inputRef}
              />
              {errors.check_in_time && (
                <div className="invalid-feedback d-block">{errors.check_in_time}</div>
              )}
            </CCol>
            
            <CCol md={6}>
              <CFormLabel htmlFor="check_out_time">Check Out Time</CFormLabel>
              <CFormInput
                type="time"
                id="check_out_time"
                value={formData.check_out_time}
                onChange={(e) => handleInputChange('check_out_time', e.target.value)}
                invalid={!!errors.check_out_time}
              />
              {errors.check_out_time && (
                <div className="invalid-feedback d-block">{errors.check_out_time}</div>
              )}
            </CCol>
          </CRow>

          {errors.submit && (
            <div className="alert alert-danger">
              {errors.submit}
            </div>
          )}
        </CModalBody>

        <CModalFooter>
        </CModalFooter>
      </CForm>
    </CModal>
  );
};

export default TrackerEditModal;