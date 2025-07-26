import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cilLocationPin, cilCheckCircle, cilXCircle, cilPencil, cilInput, cilClock, cilPeople, cilCheck, cilWarning } from '@coreui/icons';
import { CAlert, CButton, CButtonGroup, CCard, CBadge, CCardBody, CTableBody, CCardHeader, CTableDataCell, CTableHeaderCell, CFormCheck, CContainer, CSpinner, CTooltip, CTable, CTableHead, CTableRow } from "@coreui/react";
import CIcon from "@coreui/icons-react";
import MobileEmployeeRow from "./MobileBulkEmployeeTracker";
import TrackerEditModal from "./TrackerEditModal";
import GPSLocationModal from "./GPSLocationModal";
import ImageViewModal from "./ImageViewModal";
import { getAPICall, post } from "../../../util/api";
import { useToast } from '../../common/toast/ToastContext';

function BulkEmployeeCheckInOut() {
    const { t } = useTranslation("global");
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [selectAll, setSelectAll] = useState(false);
    const [imageModal, setImageModal] = useState({ isOpen: false, imageUrl: '', title: '', employeeName: '', imageType: '' });
    const [faceAttendanceEnabled, setFaceAttendanceEnabled] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedTrackerId, setSelectedTrackerId] = useState(null);
    const [mapVisible, setMapVisible] = useState(false);
    const [selectedGps, setSelectedGps] = useState(null);
    const [employeeId, setEmployeeId] = useState(null);
    const [attendanceType, setAttendanceType] = useState(0);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isCurrentDate, setIsCurrentDate] = useState(true);
     const inputRef = useRef(null);

  const handleFocus = () => {
    if (inputRef.current?.showPicker) {
      inputRef.current.showPicker(); // This will open the date picker
    }
  };

    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        if (type === 'success') {
            setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
        }
    }, []);

    const fetchFaceAttendanceStatus = useCallback(async () => {
        try {
            const response = await getAPICall('/api/isface-attendance');
            setFaceAttendanceEnabled(response && typeof response.face_attendance === 'boolean' ? response.face_attendance : false);
        } catch (error) {
            console.error('Error fetching face attendance status:', error);
            setFaceAttendanceEnabled(false);
        }
    }, []);

    const getAttendanceStatus = useCallback((trackers) => {
        if (!trackers || !Array.isArray(trackers) || trackers.length === 0) {
            return { checkIn: false, checkOut: false, status: 'Absent' };
        }
        const latestTracker = trackers[trackers.length - 1];
        const checkIn = !!latestTracker.check_in;
        const checkOut = !!latestTracker.check_out;
        let status = 'Absent';
        if (checkIn && checkOut) status = 'Present';
        else if (checkIn && !checkOut) status = 'Present';
        return { checkIn, checkOut, status };
    }, []);

    const fetchEmployees = useCallback(async (date = null) => {
        try {
            setLoading(true);
            const targetDate = date || selectedDate;
            const payload = { date: targetDate };
            const response = await post('/api/employeeDtailsForDashboard', payload);
            console.log('API Response:', response);
            let employeesWithStatus = [];
            if (response && Array.isArray(response)) {
                employeesWithStatus = response.map(employee => ({
                    ...employee,
                    ...getAttendanceStatus(employee.trackers),
                    selected: false
                }));
            } else if (response && response.data && Array.isArray(response.data)) {
                employeesWithStatus = response.data.map(employee => ({
                    ...employee,
                    ...getAttendanceStatus(employee.trackers),
                    selected: false
                }));
            } else {
                showNotification('warning', t('MSG.failedToFetchEmployees') || 'Failed to fetch employees');
                showToast('warning', t('MSG.failedToFetchEmployees') || 'Failed to fetch employees');
                return;
            }
            setEmployees(employeesWithStatus);
        } catch (error) {
            console.error('Error fetching employees:', error);
            showNotification('warning', `${t('MSG.errorConnectingToServer') || 'Error connecting to server'}: ${error.message}`);
            showToast('warning', `${t('MSG.errorConnectingToServer') || 'Error connecting to server'}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, showNotification, t, getAttendanceStatus, showToast]);

    const handleDateChange = useCallback((event) => {
        const newDate = event.target.value;
        const currentDate = new Date().toISOString().split('T')[0];
        setSelectedDate(newDate);
        setIsCurrentDate(newDate === currentDate);
        fetchEmployees(newDate);
    }, [fetchEmployees]);

    const handleTodayClick = useCallback(() => {
        const currentDate = new Date().toISOString().split('T')[0];
        setSelectedDate(currentDate);
        setIsCurrentDate(true);
        fetchEmployees(currentDate);
    }, [fetchEmployees]);

    const handleEditClick = (trackerId) => {
        setSelectedTrackerId(trackerId);
        setModalVisible(true);
    };

    const handleMapClick = useCallback((gpsCoordinates, type, empId) => {
        if (!gpsCoordinates) {
            showToast('warning', t('MSG.noGpsData') || 'No GPS data available');
            return;
        }
        setSelectedGps(gpsCoordinates);
        setAttendanceType(type === 'check-out' ? 1 : 0);
        setEmployeeId(empId);
        setMapVisible(true);
    }, [showToast, t]);

    const handleDeleteClick = (empId) => {
        console.log(`Delete employee with ID: ${empId}`);
    };

    const handleEmployeeSelection = useCallback((employeeId, isSelected) => {
        setEmployees(prev =>
            prev.map(emp => {
                const empId = emp.id || emp.employee_id || emp.emp_id;
                return empId === employeeId ? { ...emp, selected: isSelected } : emp;
            })
        );
        if (isSelected) {
            setSelectedEmployees(prev => [...prev, employeeId]);
        } else {
            setSelectedEmployees(prev => prev.filter(id => id !== employeeId));
            setSelectAll(false);
        }
    }, []);

    const handleSelectAll = useCallback(() => {
        const newSelectAll = !selectAll;
        setSelectAll(newSelectAll);
        if (newSelectAll) {
            const allIds = employees.map(emp => emp.id || emp.employee_id || emp.emp_id);
            setSelectedEmployees(allIds);
            setEmployees(prev => prev.map(emp => ({ ...emp, selected: true })));
        } else {
            setSelectedEmployees([]);
            setEmployees(prev => prev.map(emp => ({ ...emp, selected: false })));
        }
    }, [selectAll, employees]);

    const getSelectedEmployeesWithoutCheckIn = useCallback(() => {
        return employees.filter(emp => {
            const empId = emp.id || emp.employee_id || emp.emp_id;
            return selectedEmployees.includes(empId) && !emp.checkIn;
        });
    }, [employees, selectedEmployees]);

    const getSelectedEmployeesWithCheckIn = useCallback(() => {
        return employees.filter(emp => {
            const empId = emp.id || emp.employee_id || emp.emp_id;
            return selectedEmployees.includes(empId) && emp.checkIn;
        });
    }, [employees, selectedEmployees]);

    const handleBulkCheckIn = useCallback(async () => {
        if (selectedEmployees.length === 0) {
            showNotification('warning', t('MSG.selectEmployeesFirst') || 'Please select employees first');
            showToast('warning', t('MSG.selectEmployeesFirst') || 'Please select employees first');
            return;
        }
        try {
            setNotification({ show: false, type: '', message: '' });
            setSubmitting(true);
            const today = new Date().toISOString().split('T')[0];
           let payload=null;
             if(selectedDate!=today){
                  payload = { employees: selectedEmployees,date:selectedDate };
            }else{
                  payload = { employees: selectedEmployees };
            }
            const response = await post('/api/bulkCheckIn', payload);
            if (response && (response.message || response.rows_updated)) {
                showToast('success', t('MSG.bulkCheckInSuccess') || 'Bulk check-in successful');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // setEmployees(prev =>
                //     prev.map(emp => {
                //         const empId = emp.id || emp.employee_id || emp.emp_id;
                //         return selectedEmployees.includes(empId)
                //             ? { ...emp, checkIn: true, status: 'Present', selected: false }
                //             : { ...emp, selected: false };
                //     })
                // );
                  fetchEmployees();
                setSelectedEmployees([]);
                setSelectAll(false);
            } else {
                showNotification('warning', t('MSG.failedToProcessRequest') || 'Failed to process request');
                showToast('warning', t('MSG.failedToProcessRequest') || 'Failed to process request');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('warning', `${t('MSG.error') || 'Error'}: ${error.message}`);
            showToast('warning', `${t('MSG.error') || 'Error'}: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [selectedEmployees, showNotification, t, showToast]);

    const handleBulkCheckOut = useCallback(async () => {
        if (selectedEmployees.length === 0) {
            showNotification('warning', t('MSG.selectEmployeesFirst') || 'Please select employees first');
            showToast('warning', t('MSG.selectEmployeesFirst') || 'Please select employees first');
            return;
        }
        // const employeesWithoutCheckIn = getSelectedEmployeesWithoutCheckIn();
        // if (employeesWithoutCheckIn.length > 0) {
        //     const employeeNames = employeesWithoutCheckIn.map(emp =>
        //         emp.name || emp.employee_name || emp.first_name || 'Unknown'
        //     ).join(', ');
        //     showNotification('warning', `${t('MSG.checkInRequiredForCheckOut') || 'Check-in required for check-out'}: ${employeeNames}`);
        //     showToast('warning', `${t('MSG.checkInRequiredForCheckOut') || 'Check-in required for check-out'}: ${employeeNames}`);
        //     return;
        // }
        try {
            setNotification({ show: false, type: '', message: '' });
            setSubmitting(true);
            const today = new Date().toISOString().split('T')[0];
            const validEmployees = getSelectedEmployeesWithCheckIn().map(emp => emp.id || emp.employee_id || emp.emp_id);
           let payload=null;
             if(selectedDate!=today){
                  payload = { employees: validEmployees,date:selectedDate };
            }else{
                  payload = { employees: validEmployees };
            }
            const response = await post('/api/bulkCheckOut', payload);
            if (response && (response.message || response.rows_updated)) {
                showToast('success', t('MSG.bulkCheckOutSuccess') || 'Bulk check-out successful');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // setEmployees(prev =>
                //     prev.map(emp => {
                //         const empId = emp.id || emp.employee_id || emp.emp_id;
                //         return validEmployees.includes(empId)
                //             ? { ...emp, checkOut: true, status: 'Present', selected: false }
                //             : { ...emp, selected: false };
                //     })
                // );
                  fetchEmployees();
                setSelectedEmployees([]);
                setSelectAll(false);
            } else {
                showNotification('warning', t('MSG.failedToProcessRequest') || 'Failed to process request');
                showToast('warning', t('MSG.failedToProcessRequest') || 'Failed to process request');
            }
        } catch (error) {
            console.error('Error:', error);
            // showNotification('warning', `${t('MSG.error') || 'Error'}: ${error.message}`);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            showToast('danger', `${error.message ==="The employees field is required." ? "Check-In required for selected employee":error.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [selectedEmployees, showNotification, t, getSelectedEmployeesWithoutCheckIn, getSelectedEmployeesWithCheckIn, showToast]);


const handlePresenty = useCallback(async () => {
        if (selectedEmployees.length === 0) {
            showNotification('warning', t('MSG.selectEmployeesFirst') || 'Please select employees first');
            showToast('warning', t('MSG.selectEmployeesFirst') || 'Please select employees first');
            return;
        }
        try {
            setNotification({ show: false, type: '', message: '' });
            setSubmitting(true);
            const today = new Date().toISOString().split('T')[0];
           let payload=null;
             if(selectedDate!=today){
                  payload = { employees: selectedEmployees,date:selectedDate };
            }else{
                  payload = { employees: selectedEmployees };
            }
            const response = await post('/api/bulkPresenty', payload);
            if (response && (response.message || response.rows_updated)) {
                showToast('success', t('MSG.bulkCheckInSuccess') || 'Bulk check-in successful');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // setEmployees(prev =>
                //     prev.map(emp => {
                //         const empId = emp.id || emp.employee_id || emp.emp_id;
                //         return selectedEmployees.includes(empId)
                //             ? { ...emp, checkIn: true, status: 'Present', selected: false }
                //             : { ...emp, selected: false };
                //     })
                // );
                fetchEmployees();
                setSelectedEmployees([]);
                setSelectAll(false);
            } else {
                showNotification('warning', t('MSG.failedToProcessRequest') || 'Failed to process request');
                showToast('warning', t('MSG.failedToProcessRequest') || 'Failed to process request');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('warning', `${t('MSG.error') || 'Error'}: ${error.message}`);
            showToast('warning', `${t('MSG.error') || 'Error'}: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [selectedEmployees, showNotification, t, showToast]);

    const isCheckOutDisabled = useCallback(() => {
        if (selectedEmployees.length === 0 || submitting) return true;
        // return getSelectedEmployeesWithoutCheckIn().length > 0;
    }, [selectedEmployees.length, submitting, getSelectedEmployeesWithoutCheckIn]);

    const getCheckOutTooltipMessage = useCallback(() => {
        if (selectedEmployees.length === 0) return t('MSG.selectEmployeesFirst') || 'Please select employees first';
        if (getSelectedEmployeesWithoutCheckIn().length > 0) {
            return t('MSG.checkInRequiredForCheckOutTooltip') || 'All selected employees must check-in before check-out';
        }
        return t('MSG.clickToCheckOut') || 'Click to check-out selected employees';
    }, [selectedEmployees.length, getSelectedEmployeesWithoutCheckIn, t]);

    const hasValidImageUrl = useCallback((trackers, imageType) => {
        if (!trackers || !Array.isArray(trackers) || trackers.length === 0) {
            console.log('Invalid trackers for image:', trackers);
            return false;
        }
        const latestTracker = trackers[trackers.length - 1];
        console.log(`Checking ${imageType} image:`, latestTracker[`${imageType}_img`]);
        return imageType === 'checkin'
            ? !!latestTracker.checkin_img && latestTracker.checkin_img.trim() !== ''
            : !!latestTracker.checkout_img && latestTracker.checkout_img.trim() !== '';
    }, []);

    const hasValidGps = useCallback((trackers, type) => {
        if (!trackers || !Array.isArray(trackers) || trackers.length === 0) {
            console.log('Invalid trackers for GPS:', trackers);
            return false;
        }
        const latestTracker = trackers[trackers.length - 1];
        console.log(`Checking ${type} GPS:`, latestTracker[`${type === 'check-in' ? 'check_in' : 'check_out'}_gps`]);
        return type === 'check-in' ? !!latestTracker.check_in_gps : !!latestTracker.check_out_gps;
    }, []);

    const openImageModal = useCallback((imageUrl, employeeName, imageType) => {
        if (!imageUrl) {
            console.warn('No image URL provided for', imageType, employeeName);
            showToast('warning', t('MSG.noImageData') || 'No image data available');
            return;
        }
        setImageModal({ isOpen: true, imageUrl, title: 'Employee Image', employeeName, imageType });
    }, [showToast, t]);

    const closeImageModal = useCallback(() => {
        setImageModal({ isOpen: false, imageUrl: '', title: '', employeeName: '', imageType: '' });
    }, []);

    const getImageUrl = useCallback((trackers, imageType) => {
        if (!trackers || !Array.isArray(trackers) || trackers.length === 0) return null;
        const latestTracker = trackers[trackers.length - 1];
        return imageType === 'checkin' ? latestTracker.checkin_img || null : latestTracker.checkout_img || null;
    }, []);

    useEffect(() => {
        fetchFaceAttendanceStatus();
        fetchEmployees(selectedDate);
    }, [fetchFaceAttendanceStatus, selectedDate]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <CSpinner color="primary" size="lg" />
            </div>
        );
    }

    const tableStyles = `
  .table-container {
    height: 500px;
    overflow-y: auto;
    overflow-x: auto;
    border: 2px solid #a7acb1;
    border-radius: 8px;
    position: relative;
  }
  
  .table-container::-webkit-scrollbar {
    display: none; /* Hide scrollbar for Chrome, Safari and Opera */
  }
  
  .table-container {
    -ms-overflow-style: none;  /* Hide scrollbar for IE and Edge */
    scrollbar-width: none;  /* Hide scrollbar for Firefox */
  }
  
  .sticky-header {
    position: sticky;
    top: 0;
    z-index: 1020;
    background-color: var(--bs-tertiary-bg) !important;
  }
  
  .table-responsive-custom {
    min-width: 800px; /* Ensure horizontal scroll on mobile */
  }
  
  @media (max-width: 767.98px) {
    .table-responsive-custom {
      min-width: 100%;
    }
    
    .mobile-employee-row {
      display: table-row !important;
    }
    
    .desktop-employee-row {
      display: none !important;
    }
  }
`;

// Add the styles to the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = tableStyles;
  document.head.appendChild(styleSheet);
}

    return (
        <div className="min-vh-100 d-flex flex-column w-100" style={{ backgroundColor: '#f8f9fa' }}>
            <CContainer fluid className="flex-grow-1 p-0 w-100">
                <div className="w-100 px-2 px-sm-3 px-md-4 py-2 py-md-3">
                    {notification.show && (
                        <CAlert color={notification.type} dismissible onClose={() => setNotification({ show: false, type: '', message: '' })} className="mb-3">
                            {notification.message}
                        </CAlert>
                    )}
                    <CCard className="shadow-lg border-0 w-100">
                        <CCardHeader className="py-3 py-md-4" style={{ backgroundColor: "#E6E6FA", borderBottom: '3px solid #6c757d' }}>
                            <div className="d-flex flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
                                <div className="d-flex mt-2 mt-md-0 align-items-center">
                                    <CIcon icon={cilPeople} className="me-2 me-md-3" size="xl" />
                                    <div>
                                        <h4 className="mb-1 fw-bold fs-6 fs-sm-5 fs-md-4 small d-none d-sm-block">
                                            {t('LABELS.bulkEmployeeAttendance') || 'Bulk Employee Attendance'}
                                        </h4>
                                        <p className="text-muted mb-0 small d-none d-sm-block">
                                            {t('LABELS.manageMultipleEmployees') || 'Manage multiple employees check-in/out'}
                                        </p>
                                    </div>
                                </div>
                                <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 gap-sm-3">
                                    <div className="d-flex align-items-center gap-2  p-2 ">
                                        <CIcon icon={cilClock} className="text-primary" />
                                        {/* <span className="text-muted small fw-medium d-none d-sm-inline">
                                            {t('LABELS.selectDate') || 'Select Date'}
                                        </span> */}
                                       <input
      type="date"
      ref={inputRef}
      value={selectedDate}
      onChange={handleDateChange}
      onFocus={handleFocus}
      className="form-control form-control-sm"
      style={{
        width: '150px',
        fontSize: '0.875rem',
        border: '2px',
        backgroundColor: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(10px)'
      }}
    />
                                        {!isCurrentDate && (
                                            <CButton color="primary" size="sm" onClick={handleTodayClick} className="px-3 py-1" style={{ fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '4px' }}>
                                                {t('LABELS.today') || 'Today'}
                                            </CButton>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CCardHeader>
                        <CCardBody className="p-2 p-sm-3 p-md-4">
                            <div className="mb-3 mb-md-4">
                                <div className="d-flex flex-column flex-sm-row gap-2 d-block d-md-none">
                                    <CButtonGroup >
                                    <CButton
                                        color="primary"
                                        onClick={handleBulkCheckIn}
                                        disabled={selectedEmployees.length === 0 || submitting}
                                        className="py-2 py-md-3 flex-fill"
                                        style={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                                    >
                                        {submitting ? (
                                            <>
                                                <CSpinner size="sm" className="me-2" />
                                                <span className="d-none d-sm-inline">{t('LABELS.processing') || 'Processing...'}</span>
                                                <span className="d-sm-none">{t('LABELS.processing') || 'Processing...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <CIcon icon={cilCheck} className="me-1 me-md-2" />
                                                <span className="d-none d-sm-inline">{t('LABELS.bulkCheckIn') || 'Bulk Check-In'}</span>
                                                <span className="d-sm-none">{t('LABELS.checkIn') || 'Check-In'}</span>
                                            </>
                                        )}
                                    </CButton>
                                    <CTooltip content={getCheckOutTooltipMessage()} placement="top">
                                        <CButton
                                            color={isCheckOutDisabled() ? "secondary" : "success"}
                                            onClick={handleBulkCheckOut}
                                            disabled={isCheckOutDisabled()}
                                            className="py-2 py-md-3 flex-fill"
                                            style={{ fontSize: '0.9rem', fontWeight: 'bold', opacity: isCheckOutDisabled() ? 0.6 : 1, cursor: isCheckOutDisabled() ? 'not-allowed' : 'pointer' }}
                                        >
                                            {submitting ? (
                                                <>
                                                    <CSpinner size="sm" className="me-2" />
                                                    <span className="d-none d-sm-inline">{t('LABELS.processing') || 'Processing...'}</span>
                                                    <span className="d-sm-none">{t('LABELS.processing') || 'Processing...'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CIcon icon={isCheckOutDisabled() ? cilWarning : cilCheck} className="me-1 me-md-2" />
                                                    <span className="d-none d-sm-inline">{t('LABELS.bulkCheckOut') || 'Bulk Check-Out'}</span>
                                                    <span className="d-sm-none">{t('LABELS.checkOut') || 'Check-Out'}</span>
                                                </>
                                            )}
                                        </CButton>
                                    </CTooltip>
                              <CButton
                                        color="warning"
                                        onClick={handlePresenty}
                                        disabled={selectedEmployees.length === 0 || submitting}
                                        className="py-2 py-md-3 flex-fill"
                                        style={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                                    >
                                        {submitting ? (
                                            <>
                                                <CSpinner size="sm" className="me-2" />
                                                <span className="d-none d-sm-inline">{t('LABELS.processing') || 'Processing...'}</span>
                                                <span className="d-sm-none">{t('LABELS.processing') || 'Processing...'}</span>
                                            </>
                                        ) : (
                                            <>
                                                <CIcon icon={cilCheck} className="me-1 me-md-2" />
                                                <span className="d-none d-sm-inline">{t('LABELS.bulkPresenty') || 'Bulk Presenty'}</span>
                                                <span className="d-sm-none">{t('LABELS.bulkPresentySM') || 'Presenty'}</span>
                                            </>
                                        )}
                                    </CButton>
                                    </CButtonGroup>
                                </div>

                           <div className="d-flex flex-column flex-sm-row gap-2 d-none d-md-flex w-100">
  <CButton
    color="primary"
    onClick={handleBulkCheckIn}
    disabled={selectedEmployees.length === 0 || submitting}
    className="py-2 py-md-3 w-100"
    style={{ fontSize: '0.9rem', fontWeight: 'bold' }}
  >
    {submitting ? (
      <>
        <CSpinner size="sm" className="me-2" />
        <span className="d-none d-sm-inline">{t('LABELS.processing') || 'Processing...'}</span>
        <span className="d-sm-none">{t('LABELS.processing') || 'Processing...'}</span>
      </>
    ) : (
      <>
        <CIcon icon={cilCheck} className="me-1 me-md-2" />
        <span className="d-none d-sm-inline">{t('LABELS.bulkCheckIn') || 'Bulk Check-In'}</span>
        <span className="d-sm-none">{t('LABELS.checkIn') || 'Check-In'}</span>
      </>
    )}
  </CButton>

  <CTooltip content={getCheckOutTooltipMessage()} placement="top">
    <CButton
      color={isCheckOutDisabled() ? "secondary" : "success"}
      onClick={handleBulkCheckOut}
      disabled={isCheckOutDisabled()}
      className="py-2 py-md-3 w-100"
      style={{ fontSize: '0.9rem', fontWeight: 'bold', opacity: isCheckOutDisabled() ? 0.6 : 1, cursor: isCheckOutDisabled() ? 'not-allowed' : 'pointer' }}
    >
      {submitting ? (
        <>
          <CSpinner size="sm" className="me-2" />
          <span className="d-none d-sm-inline">{t('LABELS.processing') || 'Processing...'}</span>
          <span className="d-sm-none">{t('LABELS.processing') || 'Processing...'}</span>
        </>
      ) : (
        <>
          <CIcon icon={isCheckOutDisabled() ? cilWarning : cilCheck} className="me-1 me-md-2" />
          <span className="d-none d-sm-inline">{t('LABELS.bulkCheckOut') || 'Bulk Check-Out'}</span>
          <span className="d-sm-none">{t('LABELS.checkOut') || 'Check-Out'}</span>
        </>
      )}
    </CButton>
  </CTooltip>

  <CButton
    color="warning"
    onClick={handlePresenty}
    disabled={selectedEmployees.length === 0 || submitting}
    className="py-2 py-md-3 w-100"
    style={{ fontSize: '0.9rem', fontWeight: 'bold' }}
  >
    {submitting ? (
      <>
        <CSpinner size="sm" className="me-2" />
        <span className="d-none d-sm-inline">{t('LABELS.processing') || 'Processing...'}</span>
        <span className="d-sm-none">{t('LABELS.processing') || 'Processing...'}</span>
      </>
    ) : (
      <>
        <CIcon icon={cilCheck} className="me-1 me-md-2" />
        <span className="d-none d-sm-inline">{t('LABELS.bulkPresenty') || 'Bulk Presenty'}</span>
        <span className="d-sm-none">{t('LABELS.bulkPresentySM') || 'Presenty'}</span>
      </>
    )}
  </CButton>
</div>

                                {selectedEmployees.length > 0 && getSelectedEmployeesWithoutCheckIn().length > 0 && (
                                    <div className="mt-2 p-2 rounded bg-warning-subtle border border-warning">
                                        <div className="d-flex align-items-center">
                                            <CIcon icon={cilWarning} className="text-warning me-2" />
                                            <small className="text-warning-emphasis">
                                                {t('MSG.checkInRequiredWarning') || 'Check-out requires check-in first for selected employees'}
                                            </small>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* <div className="table-responsive w-100">
                      
                            </div> */}
<div className="table-container">
    <CTable align="middle" className="mb-0 table-responsive-custom" hover responsive={false} style={{ minWidth: '100%' }}>
        <CTableHead className="text-nowrap sticky-header">
            <CTableRow style={{ borderBottom: '2px solid #a7acb1' }}>
                <CTableHeaderCell className="bg-body-tertiary text-center sticky-header" style={{ width: '60px', minWidth: '60px', borderRight: '1px solid #a7acb1', fontWeight: 'bold', padding: '12px 8px' }}>
                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '24px' }}>
                        <CFormCheck
                            checked={selectAll}
                            onChange={handleSelectAll}
                            id="selectAll"
                            style={{ width: '20px', height: '20px', border: '2px solid #007bff', backgroundColor: selectAll ? '#007bff' : 'white', borderRadius: '3px', cursor: 'pointer', position: 'relative', appearance: 'none', outline: 'none' }}
                        />
                    </div>
                </CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary sticky-header" style={{ width: '80px', minWidth: '80px', borderRight: '1px solid #a7acb1', fontWeight: 'bold' }}>
                    <span className="d-md-none">{t('LABELS.employee') || 'Employee'}</span>
                    <span className="d-none d-md-inline">{t('LABELS.employeeId') || 'Employee ID'}</span>
                </CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary d-none d-md-table-cell sticky-header" style={{ borderRight: '1px solid #a7acb1', fontWeight: 'bold', minWidth: '150px' }}>
                    {t('LABELS.employee') || 'Employee'}
                </CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary text-center d-none d-md-table-cell sticky-header" style={{ width: '120px', minWidth: '120px', borderRight: '1px solid #a7acb1', fontWeight: 'bold' }}>
                    {t('LABELS.checkIn') || 'Check In'}
                </CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary text-center d-none d-md-table-cell sticky-header" style={{ width: '120px', minWidth: '120px', borderRight: '1px solid #a7acb1', fontWeight: 'bold' }}>
                    {t('LABELS.checkOut') || 'Check Out'}
                </CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary text-center d-none d-md-table-cell sticky-header" style={{ width: '100px', minWidth: '100px', borderRight: '1px solid #a7acb1', fontWeight: 'bold' }}>
                    {t('LABELS.status') || 'Status'}
                </CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary text-center d-none d-md-table-cell sticky-header" style={{ width: '100px', minWidth: '100px', fontWeight: 'bold' }}>
                    {t('LABELS.action') || 'Action'}
                </CTableHeaderCell>
            </CTableRow>
        </CTableHead>
        <CTableBody>
            {employees.length > 0 ? employees.map((employee, index) => {
                const empId = employee.id || employee.employee_id || employee.emp_id;
                const empName = employee.name || employee.employee_name || employee.first_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown Employee';
                const isSelected = employee.selected || false;

                return (
                    <React.Fragment key={empId}>
                        <MobileEmployeeRow
                            handleEditClick={handleEditClick}
                            handleMapClick={handleMapClick}
                            handleDeleteClick={handleDeleteClick}
                            employee={employee}
                            empId={empId}
                            empName={empName}
                            isSelected={isSelected}
                            handleEmployeeSelection={handleEmployeeSelection}
                            openImageModal={openImageModal}
                            getImageUrl={getImageUrl}
                            hasValidImageUrl={hasValidImageUrl}
                            navigate={navigate}
                            t={t}
                            faceAttendanceEnabled={faceAttendanceEnabled}
                        />
                        <CTableRow
                            className="d-none d-md-table-row desktop-employee-row"
                            style={{ borderBottom: index === employees.length - 1 ? 'none' : '1px solid #a7acb1', backgroundColor: isSelected ? '#f8f9fa' : 'transparent' }}
                        >
                            <CTableDataCell className="text-center" style={{ borderRight: '1px solid #a7acb1', padding: '12px 8px' }}>
                                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '24px' }}>
                                    <CFormCheck
                                        checked={isSelected}
                                        onChange={(e) => handleEmployeeSelection(empId, e.target.checked)}
                                        id={`employee-${empId}`}
                                        style={{ width: '20px', height: '20px', border: '2px solid #007bff', backgroundColor: isSelected ? '#007bff' : 'white', borderRadius: '3px', cursor: 'pointer', position: 'relative', appearance: 'none', outline: 'none' }}
                                    />
                                </div>
                            </CTableDataCell>
                            <CTableDataCell className="text-center" style={{ width: '80px', minWidth: '80px', borderRight: '1px solid #a7acb1' }}>
                                <div
                                    className="d-flex align-items-center justify-content-center mx-auto"
                                    style={{ width: '45px', height: '45px', backgroundColor: '#007bff', color: 'white', borderRadius: '50%', fontSize: '11px', fontWeight: 'bold', flexShrink: 0, lineHeight: '1.2', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    {empId || 'N/A'}
                                </div>
                            </CTableDataCell>
                            <CTableDataCell style={{ borderRight: '1px solid #a7acb1', minWidth: '150px' }}>
                                <div className="fw-semibold fs-6" style={{ fontSize: '0.9rem' }}>
                                    {empName}
                                </div>
                            </CTableDataCell>
                            <CTableDataCell className="text-center" style={{ borderRight: '1px solid #a7acb1' }}>
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                    <CIcon icon={employee.checkIn ? cilCheckCircle : cilXCircle} className={employee.checkIn ? 'text-success' : 'text-muted'} size="lg" />
                                    {faceAttendanceEnabled && (
                                        
                                            <div>
                                                <CButton
                                                    size="sm"
                                                    color={hasValidImageUrl(employee.trackers, 'checkin') ? "primary" : "secondary"}
                                                    variant="outline"
                                                    style={{ fontSize: '0.7rem', padding: '2px 6px', opacity: hasValidImageUrl(employee.trackers, 'checkin') ? 1 : 0.6, cursor: hasValidImageUrl(employee.trackers, 'checkin') ? 'pointer' : 'not-allowed', backgroundColor: hasValidImageUrl(employee.trackers, 'checkin') ? 'transparent' : '#f8f9fa', borderColor: hasValidImageUrl(employee.trackers, 'checkin') ? '' : '#6c757d', color: hasValidImageUrl(employee.trackers, 'checkin') ? '' : '#6c757d', pointerEvents: hasValidImageUrl(employee.trackers, 'checkin') ? 'auto' : 'none' }}
                                                    disabled={!hasValidImageUrl(employee.trackers, 'checkin')}
                                                    onClick={() => openImageModal(getImageUrl(employee.trackers, 'checkin'), empName, 'Check-in')}
                                                >
                                                    {t('LABELS.view') || 'View'}
                                                </CButton>
                                            </div>
                                    
                                    )}
                                   
                                        <div>
                                            <CButton
                                                size="sm"
                                                color={hasValidGps(employee.trackers, 'check-in') ? "primary" : "secondary"}
                                                variant="outline"
                                                style={{ fontSize: '0.7rem', padding: '2px 6px', marginLeft: '4px', opacity: hasValidGps(employee.trackers, 'check-in') ? 1 : 0.6, cursor: hasValidGps(employee.trackers, 'check-in') ? 'pointer' : 'not-allowed', backgroundColor: hasValidGps(employee.trackers, 'check-in') ? 'transparent' : '#f8f9fa', borderColor: hasValidGps(employee.trackers, 'check-in') ? '' : '#6c757d', color: hasValidGps(employee.trackers, 'check-in') ? '' : '#6c757d', pointerEvents: hasValidGps(employee.trackers, 'check-in') ? 'auto' : 'none' }}
                                                disabled={!hasValidGps(employee.trackers, 'check-in')}
                                                onClick={() => handleMapClick(employee.trackers?.[0]?.check_in_gps, 'check-in', employee.trackers?.[0]?.employee_id)}
                                            >
                                                <CIcon icon={cilLocationPin} size="sm" />
                                            </CButton>
                                        </div>
                                    
                                </div>
                            </CTableDataCell>
                            <CTableDataCell className="text-center" style={{ borderRight: '1px solid #a7acb1' }}>
                                <div className="d-flex align-items-center justify-content-center gap-2">
                                    <CIcon icon={employee.checkOut ? cilCheckCircle : cilXCircle} className={employee.checkOut ? 'text-success' : 'text-muted'} size="lg" />
                                    {faceAttendanceEnabled && (
                                       
                                            <div>
                                                <CButton
                                                    size="sm"
                                                    color={hasValidImageUrl(employee.trackers, 'checkout') ? "primary" : "secondary"}
                                                    variant="outline"
                                                    style={{ fontSize: '0.7rem', padding: '2px 6px', opacity: hasValidImageUrl(employee.trackers, 'checkout') ? 1 : 0.6, cursor: hasValidImageUrl(employee.trackers, 'checkout') ? 'pointer' : 'not-allowed', backgroundColor: hasValidImageUrl(employee.trackers, 'checkout') ? 'transparent' : '#f8f9fa', borderColor: hasValidImageUrl(employee.trackers, 'checkout') ? '' : '#6c757d', color: hasValidImageUrl(employee.trackers, 'checkout') ? '' : '#6c757d', pointerEvents: hasValidImageUrl(employee.trackers, 'checkout') ? 'auto' : 'none' }}
                                                    disabled={!hasValidImageUrl(employee.trackers, 'checkout')}
                                                    onClick={() => openImageModal(getImageUrl(employee.trackers, 'checkout'), empName, 'Check-out')}
                                                >
                                                    {t('LABELS.view') || 'View'}
                                                </CButton>
                                            </div>
                                     
                                    )}
                                    
                                        <div>
                                            <CButton
                                                size="sm"
                                                color={hasValidGps(employee.trackers, 'check-out') ? "primary" : "secondary"}
                                                variant="outline"
                                                style={{ fontSize: '0.7rem', padding: '2px 6px', marginLeft: '4px', opacity: hasValidGps(employee.trackers, 'check-out') ? 1 : 0.6, cursor: hasValidGps(employee.trackers, 'check-out') ? 'pointer' : 'not-allowed', backgroundColor: hasValidGps(employee.trackers, 'check-out') ? 'transparent' : '#f8f9fa', borderColor: hasValidGps(employee.trackers, 'check-out') ? '' : '#6c757d', color: hasValidGps(employee.trackers, 'check-out') ? '' : '#6c757d', pointerEvents: hasValidGps(employee.trackers, 'check-out') ? 'auto' : 'none' }}
                                                disabled={!hasValidGps(employee.trackers, 'check-out')}
                                                onClick={() => handleMapClick(employee.trackers?.[0]?.check_out_gps, 'check-out', employee.trackers?.[0]?.employee_id)}
                                            >
                                                <CIcon icon={cilLocationPin} size="sm" />
                                            </CButton>
                                        </div>
                                    
                                </div>
                            </CTableDataCell>
                            <CTableDataCell className="text-center" style={{ borderRight: '1px solid #a7acb1' }}>
                                <CBadge color={employee.status === 'Present' ? 'success' : 'secondary'} className="px-2 px-md-3 py-1 small" style={{ fontSize: '0.8rem' }}>
                                    {employee.status === 'Present' ? (t('LABELS.present') || 'Present') : (t('LABELS.absent') || 'Absent')}
                                </CBadge>
                            </CTableDataCell>
                            <CTableDataCell className="text-center">
                                <CButtonGroup className="mt-2">
                                    <CButton size="sm" color="primary" variant="outline" onClick={() => navigate(`/employees/${empId}`)}>
                                        <span className="d-flex align-items-center gap-1">
                                            <CIcon icon={cilInput} />
                                            {t('LABELS.details') || 'Details'}
                                        </span>
                                    </CButton>
                                    <CButton
                                        size="sm"
                                        color="warning"
                                        variant="outline"
                                        onClick={() => handleEditClick(employee.trackers?.[0]?.id)}
                                        disabled={!employee.trackers || employee.trackers.length === 0}
                                    >
                                        <span className="d-flex align-items-center gap-1">
                                            <CIcon icon={cilPencil} />
                                            {t('LABELS.smallEditButton') || 'Edit'}
                                        </span>
                                    </CButton>
                                </CButtonGroup>
                            </CTableDataCell>
                        </CTableRow>
                    </React.Fragment>
                );
            }) : null}
        </CTableBody>
    </CTable>
</div>
                            
                            {employees.length === 0 && (
                                <div className="text-center py-4 py-md-5">
                                    <CIcon icon={cilPeople} className="text-muted mb-3" style={{ fontSize: '2.5rem' }} />
                                    <h5 className="text-muted fs-6 fs-md-5">{t('MSG.noEmployeesFound') || 'No employees found'}</h5>
                                    <p className="text-muted small">{t('MSG.checkBackLater') || 'Please check back later'}</p>
                                </div>
                            )}
                        </CCardBody>
                    </CCard>
                </div>
            </CContainer>
            <ImageViewModal
                isOpen={imageModal.isOpen}
                onClose={closeImageModal}
                imageUrl={imageModal.imageUrl}
                title={imageModal.title}
                employeeName={imageModal.employeeName}
                imageType={imageModal.imageType}
            />
            <TrackerEditModal
                fetchEmployee={fetchEmployees}
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                trackerId={selectedTrackerId}
                onSuccess={() => {
                    setModalVisible(false);
                    fetchEmployees(selectedDate);
                }}
            />
            <GPSLocationModal
                isOpen={mapVisible}
                onClose={() => setMapVisible(false)}
                gpsCoordinates={selectedGps}
                attendanceType={attendanceType}
                employeeId={employeeId}
            />
        </div>
    );
}

export default BulkEmployeeCheckInOut;