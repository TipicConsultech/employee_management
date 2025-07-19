import React, { useState, useEffect } from 'react';
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
  CFormSelect,
  CFormCheck,
  CRow,
  CCol,
  CSpinner
} from '@coreui/react';
import { getAPICall, put } from '../../../util/api';

const TrackerEditModal = ({ fetchEmployees,visible, onClose, trackerId, onSuccess }) => {
  const [formData, setFormData] = useState({
    half_day: false,
    check_in_time: '',
    check_out_time: '',
    status: ''
  });
  const [originalData, setOriginalData] = useState({}); // Store original data
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [tracker, setTracker] = useState({});

  // Status options for dropdown
  const statusOptions = [
    { value: 'NA', label: 'Present' },
    { value: 'H', label: 'Holiday' },
    { value: 'PL', label: 'Paid Leave' },
    { value: 'SL', label: 'Sick Leave' },
    { value: 'CL', label: 'Casual Leave' },
  ];

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible && trackerId) {
      getTracker();
    } else {
      resetForm();
    }
  }, [visible, trackerId]);

  async function getTracker(){
    const response = await getAPICall(`/api/employee-tracker/${trackerId}`);
    if(response.id){
      setTracker(response);
      // Map the API response to form fields
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

  const formatDateTimeForInput = (dateTimeString) => {
    if (!dateTimeString) return '';
    
    // Handle both formats: "2025-07-18T14:09:56.000000Z" and "2025-07-18 17:10:00"
    let date;
    if (dateTimeString.includes('T')) {
      // ISO format with T
      date = new Date(dateTimeString);
    } else {
      // Format: "2025-07-18 17:10:00"
      date = new Date(dateTimeString.replace(' ', 'T'));
    }
    
    if (isNaN(date.getTime())) return '';
    
    // Format to YYYY-MM-DDTHH:MM for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const loadTrackerData = (trackerData) => {
    // Map API response data to form fields correctly
    const mappedData = {
      half_day: trackerData.half_day || false,
      check_in_time: trackerData.created_at ? formatDateTimeForInput(trackerData.created_at) : '',
      check_out_time: trackerData.check_out_time ? formatDateTimeForInput(trackerData.check_out_time) : '',
      status: trackerData.status || ''
    };
    
    setFormData(mappedData);
    setOriginalData(mappedData); // Store original data for comparison
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return null;
    // Convert to the format expected by API: YYYY-MM-DD HH:MM:SS
    const date = new Date(dateTimeString);
    
    // Format as local time, not UTC
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Add validation rules as needed
    if (formData.check_in_time && formData.check_out_time) {
      const checkIn = new Date(formData.check_in_time);
      const checkOut = new Date(formData.check_out_time);
      
      if (checkOut <= checkIn) {
        newErrors.check_out_time = 'Check-out time must be after check-in time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form has been modified
  const hasFormChanged = () => {
    return (
      formData.half_day !== originalData.half_day ||
      formData.check_in_time !== originalData.check_in_time ||
      formData.check_out_time !== originalData.check_out_time ||
      formData.status !== originalData.status
    );
  };

  // Build payload with only changed fields
  const buildPayload = () => {
    const payload = {};
    
    if (formData.half_day !== originalData.half_day) {
      payload.half_day = formData.half_day ? '1' : '0';
    }
    
    if (formData.check_in_time !== originalData.check_in_time) {
      payload.check_in_time = formData.check_in_time ? formatDateTime(formData.check_in_time) : null;
    }
    
    if (formData.check_out_time !== originalData.check_out_time) {
      payload.check_out_time = formData.check_out_time ? formatDateTime(formData.check_out_time) : null;
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
      
      // Only submit if there are changes
      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      const result = await put(`/api/employeetracker/${trackerId}`, payload);

      // Check if response has data with id (successful update)
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
          </CRow>

          <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="check_in_time">Check In Time</CFormLabel>
              <CFormInput
                type="datetime-local"
                id="check_in_time"
                value={formData.check_in_time}
                onChange={(e) => handleInputChange('check_in_time', e.target.value)}
                invalid={!!errors.check_in_time}
              />
              {errors.check_in_time && (
                <div className="invalid-feedback d-block">{errors.check_in_time}</div>
              )}
            </CCol>
            
            <CCol md={6}>
              <CFormLabel htmlFor="check_out_time">Check Out Time</CFormLabel>
              <CFormInput
                type="datetime-local"
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

          {/* <CRow className="mb-3">
            <CCol md={6}>
              <CFormLabel htmlFor="status">Status</CFormLabel>
              <CFormSelect
                id="status"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                invalid={!!errors.status}
              >
                <option value="">Select Status</option>
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </CFormSelect>
              {errors.status && (
                <div className="invalid-feedback d-block">{errors.status}</div>
              )}
            </CCol>
          </CRow> */}

          {errors.submit && (
            <div className="alert alert-danger">
              {errors.submit}
            </div>
          )}
        </CModalBody>

        <CModalFooter>
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
        </CModalFooter>
      </CForm>
    </CModal>
  );
};

export default TrackerEditModal;