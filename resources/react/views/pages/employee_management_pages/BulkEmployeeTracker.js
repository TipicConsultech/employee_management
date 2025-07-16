import React, { useState, useEffect, useCallback } from 'react';
import {
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CRow,
    CButton,
    CSpinner,
    CAlert,
    CBadge,
    CContainer,
    CTable,
    CTableHead,
    CTableRow,
    CTableHeaderCell,
    CTableBody,
    CTableDataCell,
    CFormCheck,
    CButtonGroup,
    CTooltip,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilClock, cilLocationPin, cilCheckCircle, cilXCircle, cilPeople, cilCheck, cilWarning } from '@coreui/icons';
import { getAPICall, post } from '../../../util/api';
import { useTranslation } from 'react-i18next';
import {  useNavigate } from 'react-router-dom';
import ImageViewModal from '../../../views/pages/employee_management_pages/ImageViewModal';


const MobileEmployeeRow = ({ employee, empId, empName, isSelected, handleEmployeeSelection, openImageModal, getImageUrl, hasValidImageUrl, navigate, t, faceAttendanceEnabled }) => (
    <CTableRow
        className="d-md-none"
        style={{
           backgroundColor: isSelected ? '#f8f9fa' : 'transparent',
           borderBottom: '1px solid #a7acb1'
        }}
    >
        {/* Column 1: Checkbox with enhanced visibility */}
        <CTableDataCell className="text-center" style={{ borderRight: '1px solid #a7acb1', width: '60px', padding: '12px 8px' }}>
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '24px' }}>
                <CFormCheck
                    checked={isSelected}
                    onChange={(e) => handleEmployeeSelection(empId, e.target.checked)}
                    id={`employee-mobile-${empId}`}
                    style={{
                        width: '18px',
                        height: '18px',
                        border: '2px solid #007bff',
                        backgroundColor: isSelected ? '#007bff' : 'white',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        position: 'relative',
                        appearance: 'none',
                        outline: 'none'
                    }}
                />
            </div>
        </CTableDataCell>

        {/* Column 2: Employee Info with ID Circle, Name, Status, and Check-in/out */}
        <CTableDataCell style={{ borderRight: '1px solid #a7acb1' }}>
            <div className="mobile-employee-info">
                {/* Employee Basic Info with ID Circle */}
                <div className="d-flex align-items-center gap-3">
                    <div
                        className="d-flex align-items-center justify-content-center"
                        style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            borderRadius: '50%',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            flexShrink: 0
                        }}
                    >
                        {empId || 'N/A'}
                    </div>
                    <div>
                        <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>
                            {empName}
                        </div>
                        <CBadge
                            color={employee.status === 'Present' ? 'success' : 'secondary'}
                            className="px-2 py-1"
                            style={{ fontSize: '0.7rem' }}
                        >
                            {employee.status === 'Present' ? (t('LABELS.present') || 'Present') : (t('LABELS.absent') || 'Absent')}
                        </CBadge>
                    </div>
                </div>

                {/* Attendance Info Row */}
                <div className="mobile-attendance-row">
                    {/* Check In */}
                    <div className="mobile-attendance-item">
                        <span className="mobile-attendance-label">{t('LABELS.checkIn') || 'Check In'}</span>
                        <CIcon
                            icon={employee.checkIn ? cilCheckCircle : cilXCircle}
                            className={employee.checkIn ? 'text-success' : 'text-muted'}
                            size="sm"
                        />
                        {/* CONDITIONAL RENDERING - Only show if face attendance is enabled */}
                        {faceAttendanceEnabled && (
                            <CTooltip
                                content={hasValidImageUrl(employee.trackers, 'checkin')
                                    ? (t('LABELS.clickToViewCheckInImage') || 'Click to view check-in image')
                                    : (t('LABELS.noCheckInImageUploaded') || 'User did not upload the image for check-in')
                                }
                                placement="top"
                            >
                                <span>
                                    <CButton
                                        size="sm"
                                        color={hasValidImageUrl(employee.trackers, 'checkin') ? "primary" : "secondary"}
                                        variant="outline"
                                        style={{
                                            fontSize: '0.6rem',
                                            padding: '1px 4px',
                                            opacity: hasValidImageUrl(employee.trackers, 'checkin') ? 1 : 0.6,
                                            cursor: hasValidImageUrl(employee.trackers, 'checkin') ? 'pointer' : 'not-allowed'
                                        }}
                                        disabled={!hasValidImageUrl(employee.trackers, 'checkin')}
                                        onClick={() => openImageModal(
                                            getImageUrl(employee.trackers, 'checkin'),
                                            empName,
                                            'Check-in'
                                        )}
                                    >
                                        {t('LABELS.view') || 'View'}
                                    </CButton>
                                </span>
                            </CTooltip>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="mobile-divider"></div>

                    {/* Check Out */}
                    <div className="mobile-attendance-item">
                        <span className="mobile-attendance-label">{t('LABELS.checkOut') || 'Check Out'}</span>
                        <CIcon
                            icon={employee.checkOut ? cilCheckCircle : cilXCircle}
                            className={employee.checkOut ? 'text-success' : 'text-muted'}
                            size="sm"
                        />
                        {/* CONDITIONAL RENDERING - Only show if face attendance is enabled */}
                        {faceAttendanceEnabled && (
                            <CTooltip
                                content={hasValidImageUrl(employee.trackers, 'checkout')
                                    ? (t('LABELS.clickToViewCheckOutImage') || 'Click to view check-out image')
                                    : (t('LABELS.noCheckOutImageUploaded') || 'User did not upload the image for check-out')
                                }
                                placement="top"
                            >
                                <span>
                                    <CButton
                                        size="sm"
                                        color={hasValidImageUrl(employee.trackers, 'checkout') ? "primary" : "secondary"}
                                        variant="outline"
                                        style={{
                                            fontSize: '0.6rem',
                                            padding: '1px 4px',
                                            opacity: hasValidImageUrl(employee.trackers, 'checkout') ? 1 : 0.6,
                                            cursor: hasValidImageUrl(employee.trackers, 'checkout') ? 'pointer' : 'not-allowed'
                                        }}
                                        disabled={!hasValidImageUrl(employee.trackers, 'checkout')}
                                        onClick={() => openImageModal(
                                            getImageUrl(employee.trackers, 'checkout'),
                                            empName,
                                            'Check-out'
                                        )}
                                    >
                                        {t('LABELS.view') || 'View'}
                                    </CButton>
                                </span>
                            </CTooltip>
                        )}
                    </div>
                </div>
            </div>
        </CTableDataCell>

        {/* Column 3: Action */}
        <CTableDataCell className="text-center">
            <CButton
                size="sm"
                color="primary"
                variant="outline"
                onClick={() => navigate(`/employees/${empId}`)}
                style={{ fontSize: '0.7rem' }}
            >
                {t('LABELS.details') || 'Details'}
            </CButton>
        </CTableDataCell>
    </CTableRow>
);


const mobileStyles = `
    @media (max-width: 768px) {
        .mobile-hide {
            display: none !important;
        }
        .mobile-show {
            display: block !important;
        }
        .mobile-employee-info {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .mobile-attendance-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 12px;
            background-color: #f8f9fa;
            border-radius: 6px;
            margin-top: 8px;
        }
        .mobile-attendance-item {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        }
        .mobile-attendance-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #6c757d;
            min-width: 60px;
        }
        .mobile-divider {
            width: 1px;
            height: 30px;
            background-color: #a7acb1;
            margin: 0 10px;
        }

        /* Add checkbox visibility fixes */
        .form-check-input {
            width: 18px !important;
            height: 18px !important;
            border: 2px solid #007bff !important;
            background-color: white !important;
            border-radius: 3px !important;
            position: relative !important;
            cursor: pointer !important;
        }

        .form-check-input:checked {
            background-color: #007bff !important;
            border-color: #007bff !important;
        }

        .form-check-input:checked::after {
            content: '✓' !important;
            position: absolute !important;
            color: white !important;
            font-size: 12px !important;
            font-weight: bold !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
        }
    }

    @media (min-width: 769px) {
        .mobile-show {
            display: none !important;
        }

        /* Desktop checkbox styles */
        .form-check-input {
            width: 20px !important;
            height: 20px !important;
            border: 2px solid #007bff !important;
            background-color: white !important;
            border-radius: 3px !important;
            position: relative !important;
            cursor: pointer !important;
        }

        .form-check-input:checked {
            background-color: #007bff !important;
            border-color: #007bff !important;
        }

        .form-check-input:checked::after {
            content: '✓' !important;
            position: absolute !important;
            color: white !important;
            font-size: 14px !important;
            font-weight: bold !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
        }
    }
`;



function BulkEmployeeCheckInOut() {
    // Add translation hook
    const { t } = useTranslation("global");

    const navigate = useNavigate();

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [selectAll, setSelectAll] = useState(false);
    const [imageModal, setImageModal] = useState({isOpen: false,imageUrl: '',title: '',employeeName: '',imageType: ''});
    const [faceAttendanceEnabled, setFaceAttendanceEnabled] = useState(false);


    useEffect(() => {
    // Inject mobile styles
    const styleElement = document.createElement('style');
    styleElement.textContent = mobileStyles;
    document.head.appendChild(styleElement);

    return () => {
        // Cleanup
        document.head.removeChild(styleElement);
    };
}, []);

    const fetchFaceAttendanceStatus = useCallback(async () => {
    try {
        const response = await getAPICall('/api/isface-attendance');
        console.log('Face attendance response:', response); // Debug log

        if (response && typeof response.face_attendance === 'boolean') {
            setFaceAttendanceEnabled(response.face_attendance);
        } else {
            // Default to false if API response is invalid
            setFaceAttendanceEnabled(false);
        }
    } catch (error) {
        console.error('Error fetching face attendance status:', error);
        // Default to false on error
        setFaceAttendanceEnabled(false);
    }
}, []);

    // Memoized helper function for showing notifications
    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        // Auto hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                setNotification({ show: false, type: '', message: '' });
            }, 5000);
        }
    }, []);

    // Helper function to get check-in/check-out status from trackers
    const getAttendanceStatus = useCallback((trackers) => {
        if (!trackers || !Array.isArray(trackers) || trackers.length === 0) {
            return { checkIn: false, checkOut: false, status: 'Absent' };
        }

        // Get the latest tracker entry (assuming the last one is the most recent)
        const latestTracker = trackers[trackers.length - 1];

        const checkIn = latestTracker.check_in || false;
        const checkOut = latestTracker.check_out || false;

        let status = 'Absent';
        if (checkIn && checkOut) {
            status = 'Present'; // Completed attendance
        } else if (checkIn && !checkOut) {
            status = 'Present'; // Checked in but not checked out
        }

        return { checkIn, checkOut, status };
    }, []);

    // Fetch employees function
    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAPICall('/api/employeeDtailsForDashboard');
            console.log('API Response:', response); // Debug log

            if (response && Array.isArray(response)) {
                // Process employees with tracker data
                const employeesWithStatus = response.map(employee => {
                    const attendanceStatus = getAttendanceStatus(employee.trackers);
                    return {
                        ...employee,
                        ...attendanceStatus,
                        selected: false
                    };
                });
                console.log('Processed employees:', employeesWithStatus); // Debug log
                setEmployees(employeesWithStatus);
            } else if (response && response.data && Array.isArray(response.data)) {
                // Handle case where data is nested
                const employeesWithStatus = response.data.map(employee => {
                    const attendanceStatus = getAttendanceStatus(employee.trackers);
                    return {
                        ...employee,
                        ...attendanceStatus,
                        selected: false
                    };
                });
                console.log('Processed employees (nested):', employeesWithStatus); // Debug log
                setEmployees(employeesWithStatus);
            } else {
                console.log('Invalid response format:', response);
                showNotification('warning', t('MSG.failedToFetchEmployees') || 'Failed to fetch employees');
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            showNotification('warning', `${t('MSG.errorConnectingToServer') || 'Error connecting to server'}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [showNotification, t, getAttendanceStatus]);

    // Fetch employees on component mount
    useEffect(() => {
    // Call both functions on component mount
    fetchFaceAttendanceStatus();
    fetchEmployees();
}, [fetchFaceAttendanceStatus, fetchEmployees]);

    // Handle individual employee selection
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

    // Handle select all toggle
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

    // Get selected employees who haven't checked in (for checkout validation)
    const getSelectedEmployeesWithoutCheckIn = useCallback(() => {
        return employees.filter(emp => {
            const empId = emp.id || emp.employee_id || emp.emp_id;
            return selectedEmployees.includes(empId) && !emp.checkIn;
        });
    }, [employees, selectedEmployees]);

    // Get selected employees who have checked in (for checkout)
    const getSelectedEmployeesWithCheckIn = useCallback(() => {
        return employees.filter(emp => {
            const empId = emp.id || emp.employee_id || emp.emp_id;
            return selectedEmployees.includes(empId) && emp.checkIn;
        });
    }, [employees, selectedEmployees]);

    // Handle bulk check-in
    const handleBulkCheckIn = useCallback(async () => {
        if (selectedEmployees.length === 0) {
            showNotification('warning', t('MSG.selectEmployeesFirst') || 'Please select employees first');
            return;
        }

        try {
            setNotification({ show: false, type: '', message: '' });
            setSubmitting(true);

            const payload = {
                employees: selectedEmployees
            };

            const response = await post('/api/bulkCheckIn', payload);

            if (response && (response.message || response.rows_updated)) {
                showNotification('success',
                    `${t('MSG.bulkCheckInSuccess') }`
                );

                // Update local state to reflect check-in
                setEmployees(prev =>
                    prev.map(emp => {
                        const empId = emp.id || emp.employee_id || emp.emp_id;
                        return selectedEmployees.includes(empId)
                            ? { ...emp, checkIn: true, status: 'Present', selected: false }
                            : { ...emp, selected: false };
                    })
                );

                // Clear selections
                setSelectedEmployees([]);
                setSelectAll(false);

                // Optionally refresh the employee list to get updated tracker data
                // await fetchEmployees();
            } else {
                showNotification('warning', t('MSG.failedToProcessRequest') || 'Failed to process request');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('warning', `${t('MSG.error') || 'Error'}: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [selectedEmployees, showNotification, t]);

    // Handle bulk check-out with validation
    const handleBulkCheckOut = useCallback(async () => {
        if (selectedEmployees.length === 0) {
            showNotification('warning', t('MSG.selectEmployeesFirst') || 'Please select employees first');
            return;
        }

        // Validate that all selected employees have checked in
        const employeesWithoutCheckIn = getSelectedEmployeesWithoutCheckIn();

        if (employeesWithoutCheckIn.length > 0) {
            const employeeNames = employeesWithoutCheckIn.map(emp =>
                emp.name || emp.employee_name || emp.first_name || 'Unknown'
            ).join(', ');

            showNotification('warning',
                `${t('MSG.checkInRequiredForCheckOut') || 'Check-in required for check-out'}: ${employeeNames}`
            );
            return;
        }

        try {
            setNotification({ show: false, type: '', message: '' });
            setSubmitting(true);

            // Only process employees who have checked in
            const validEmployees = getSelectedEmployeesWithCheckIn().map(emp => emp.id || emp.employee_id || emp.emp_id);

            const payload = {
                employees: validEmployees
            };

            const response = await post('/api/bulkCheckOut', payload);

            if (response && (response.message || response.rows_updated)) {
                showNotification('success',
                    `${t('MSG.bulkCheckOutSuccess') }`
                );

                // Update local state to reflect check-out
                setEmployees(prev =>
                    prev.map(emp => {
                        const empId = emp.id || emp.employee_id || emp.emp_id;
                        return validEmployees.includes(empId)
                            ? { ...emp, checkOut: true, status: 'Present', selected: false }
                            : { ...emp, selected: false };
                    })
                );

                // Clear selections
                setSelectedEmployees([]);
                setSelectAll(false);

                // Optionally refresh the employee list to get updated tracker data
                // await fetchEmployees();
            } else {
                showNotification('warning', t('MSG.failedToProcessRequest') || 'Failed to process request');
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('warning', `${t('MSG.error') || 'Error'}: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [selectedEmployees, showNotification, t, getSelectedEmployeesWithoutCheckIn, getSelectedEmployeesWithCheckIn]);

    // Check if checkout should be disabled
    const isCheckOutDisabled = useCallback(() => {
        if (selectedEmployees.length === 0 || submitting) return true;

        // Check if any selected employee hasn't checked in
        const employeesWithoutCheckIn = getSelectedEmployeesWithoutCheckIn();
        return employeesWithoutCheckIn.length > 0;
    }, [selectedEmployees.length, submitting, getSelectedEmployeesWithoutCheckIn]);

    // Get tooltip message for checkout button
    const getCheckOutTooltipMessage = useCallback(() => {
        if (selectedEmployees.length === 0) {
            return t('MSG.selectEmployeesFirst') || 'Please select employees first';
        }

        const employeesWithoutCheckIn = getSelectedEmployeesWithoutCheckIn();
        if (employeesWithoutCheckIn.length > 0) {
            return t('MSG.checkInRequiredForCheckOutTooltip') || 'All selected employees must check-in before check-out';
        }

        return t('MSG.clickToCheckOut') || 'Click to check-out selected employees';
    }, [selectedEmployees.length, getSelectedEmployeesWithoutCheckIn, t]);

    const openImageModal = useCallback((imageUrl, employeeName, imageType) => {
    setImageModal({
        isOpen: true,
        imageUrl: imageUrl,
        title: 'Employee Image',
        employeeName: employeeName,
        imageType: imageType});}, []);

    const closeImageModal = useCallback(() => {
    setImageModal({
        isOpen: false,
        imageUrl: '',
        title: '',
        employeeName: '',
        imageType: '' });}, []);

// Helper function to get image URL from trackers
const getImageUrl = useCallback((trackers, imageType) => {
    if (!trackers || !Array.isArray(trackers) || trackers.length === 0) {
        return null;
    }

    // Get the latest tracker entry
    const latestTracker = trackers[trackers.length - 1];

    if (imageType === 'checkin') {
        return latestTracker.checkin_img || null;
    } else if (imageType === 'checkout') {
        return latestTracker.checkout_img || null;
    }

    return null;
}, []);


    // Helper function to check if image URL exists and is valid
const hasValidImageUrl = useCallback((trackers, imageType) => {
    if (!trackers || !Array.isArray(trackers) || trackers.length === 0) {
        return false;
    }

    // Get the latest tracker entry
    const latestTracker = trackers[trackers.length - 1];

    if (imageType === 'checkin') {
        return latestTracker.checkin_img && latestTracker.checkin_img.trim() !== '';
    } else if (imageType === 'checkout') {
        return latestTracker.checkout_img && latestTracker.checkout_img.trim() !== '';
    }

    return false;
}, []);

    // Loading state
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <CSpinner color="primary" size="lg" />
            </div>
        );
    }

    return (
        <div className="min-vh-100 d-flex flex-column w-100" style={{ backgroundColor: '#f8f9fa' }}>
            {/* Full width container with proper padding */}
            <CContainer fluid className="flex-grow-1 p-0 w-100">
                <div className="w-100 px-2 px-sm-3 px-md-4 py-2 py-md-3">
                    {/* Notifications */}
                    {notification.show && (
                        <CAlert
                            color={notification.type}
                            dismissible
                            onClose={() => setNotification({ show: false, type: '', message: '' })}
                            className="mb-3"
                        >
                            {notification.message}
                        </CAlert>
                    )}

                    {/* Main Card - Full Width */}
                    <CCard className="shadow-lg border-0 w-100">
                        {/* Header */}
                        <CCardHeader
                            className="py-3 py-md-4"
                            style={{
                                backgroundColor: "#E6E6FA",
                                borderBottom: '3px solid #6c757d'
                            }}
                        >
                            <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center justify-content-between gap-2 gap-sm-3">
                                <div className="d-flex align-items-center">
                                    <CIcon icon={cilPeople} className="me-2 me-md-3" size="xl" />
                                    <div>
                                        <h4 className="mb-1 fw-bold fs-6 fs-sm-5 fs-md-4">{t('LABELS.bulkEmployeeAttendance') || 'Bulk Employee Attendance'}</h4>
                                        <p className="text-muted mb-0 small d-none d-sm-block">{t('LABELS.manageMultipleEmployees') || 'Manage multiple employees check-in/out'}</p>
                                    </div>
                                </div>

                                {/* Selection Info */}
                                <div className="text-end">
                                    <CBadge color="primary" className="fs-6 px-2 px-md-3 py-1 py-md-2">
                                        {selectedEmployees.length} {t('LABELS.selected') || 'Selected'}
                                    </CBadge>
                                </div>
                            </div>
                        </CCardHeader>

                        <CCardBody className="p-2 p-sm-3 p-md-4">
                            {/* Action Buttons */}
                            <div className="mb-3 mb-md-4">
                                <div className="d-flex flex-column flex-sm-row gap-2">
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

                                    <CTooltip
                                        content={getCheckOutTooltipMessage()}
                                        placement="top"
                                    >
                                        <CButton
                                            color={isCheckOutDisabled() ? "secondary" : "success"}
                                            onClick={handleBulkCheckOut}
                                            disabled={isCheckOutDisabled()}
                                            className="py-2 py-md-3 flex-fill"
                                            style={{
                                                fontSize: '0.9rem',
                                                fontWeight: 'bold',
                                                opacity: isCheckOutDisabled() ? 0.6 : 1,
                                                cursor: isCheckOutDisabled() ? 'not-allowed' : 'pointer'
                                            }}
                                        >
                                            {submitting ? (
                                                <>
                                                    <CSpinner size="sm" className="me-2" />
                                                    <span className="d-none d-sm-inline">{t('LABELS.processing') || 'Processing...'}</span>
                                                    <span className="d-sm-none">{t('LABELS.processing') || 'Processing...'}</span>
                                                </>
                                            ) : (
                                                <>
                                                    <CIcon
                                                        icon={isCheckOutDisabled() ? cilWarning : cilCheck}
                                                        className="me-1 me-md-2"
                                                    />
                                                    <span className="d-none d-sm-inline">{t('LABELS.bulkCheckOut') || 'Bulk Check-Out'}</span>
                                                    <span className="d-sm-none">{t('LABELS.checkOut') || 'Check-Out'}</span>
                                                </>
                                            )}
                                        </CButton>
                                    </CTooltip>
                                </div>

                                {/* Validation Warning */}
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

                            {/* Employee Table - Optimized Structure */}
                            <div className="table-responsive w-100">
                                <CTable
                                    align="middle"
                                    className="mb-0 w-100"
                                    hover
                                    responsive
                                    style={{
                                        border: '2px solid #a7acb1',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        minWidth: '100%'
                                    }}
                                >
                                <CTableHead className="text-nowrap">
                                        <CTableRow style={{ borderBottom: '2px solid #a7acb1' }}>
                                            {/* Column 1: Checkbox */}
                                            <CTableHeaderCell
                                                className="bg-body-tertiary text-center"
                                                style={{
                                                    width: '60px',
                                                    minWidth: '60px',
                                                    borderRight: '1px solid #a7acb1',
                                                    fontWeight: 'bold',
                                                    padding: '12px 8px'
                                                }}
                                            >
                                                <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '24px' }}>
                                                    <CFormCheck
                                                        checked={selectAll}
                                                        onChange={handleSelectAll}
                                                        id="selectAll"
                                                        style={{
                                                            width: '20px',
                                                            height: '20px',
                                                            border: '2px solid #007bff',
                                                            backgroundColor: selectAll ? '#007bff' : 'white',
                                                            borderRadius: '3px',
                                                            cursor: 'pointer',
                                                            position: 'relative',
                                                            appearance: 'none',
                                                            outline: 'none'
                                                        }}
                                                    />
                                                </div>
                                            </CTableHeaderCell>

                                            {/* Column 2: Employee Info - Different text for mobile vs desktop */}
                                            <CTableHeaderCell
                                                className="bg-body-tertiary"
                                                style={{
                                                    borderRight: '1px solid #a7acb1',
                                                    fontWeight: 'bold',
                                                    minWidth: '150px'
                                                }}
                                            >
                                                <span className="d-md-none">{t('LABELS.employee') || 'Employee'}</span>
                                                <span className="d-none d-md-inline">{t('LABELS.employeeId') || 'Employee ID'}</span>
                                            </CTableHeaderCell>

                                            {/* Column 3: Employee Name - Hide on mobile */}
                                            <CTableHeaderCell
                                                className="bg-body-tertiary d-none d-md-table-cell"
                                                style={{
                                                    borderRight: '1px solid #a7acb1',
                                                    fontWeight: 'bold',
                                                    minWidth: '150px'
                                                }}
                                            >
                                                {t('LABELS.employee') || 'Employee'}
                                            </CTableHeaderCell>

                                            {/* Column 4: Check In - Hide on mobile */}
                                            <CTableHeaderCell
                                                className="bg-body-tertiary text-center d-none d-md-table-cell"
                                                style={{
                                                    width: '120px',
                                                    minWidth: '120px',
                                                    borderRight: '1px solid #a7acb1',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {t('LABELS.checkIn') || 'Check In'}
                                            </CTableHeaderCell>

                                            {/* Column 5: Check Out - Hide on mobile */}
                                            <CTableHeaderCell
                                                className="bg-body-tertiary text-center d-none d-md-table-cell"
                                                style={{
                                                    width: '120px',
                                                    minWidth: '120px',
                                                    borderRight: '1px solid #a7acb1',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {t('LABELS.checkOut') || 'Check Out'}
                                            </CTableHeaderCell>

                                            {/* Column 6: Status - Hide on mobile */}
                                            <CTableHeaderCell
                                                className="bg-body-tertiary text-center d-none d-md-table-cell"
                                                style={{
                                                    width: '100px',
                                                    minWidth: '100px',
                                                    borderRight: '1px solid #a7acb1',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {t('LABELS.status') || 'Status'}
                                            </CTableHeaderCell>

                                            {/* Column 7: Action */}
                                            <CTableHeaderCell
                                                className="bg-body-tertiary text-center"
                                                style={{
                                                    width: '100px',
                                                    minWidth: '100px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
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
                                                {/* Mobile View - Only 3 columns */}
                                                <MobileEmployeeRow
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

                                                {/* Desktop View - All 7 columns */}
                                                <CTableRow
                                                    className="d-none d-md-table-row"
                                                    style={{
                                                        borderBottom: index === employees.length - 1 ? 'none' : '1px solid #a7acb1',
                                                        backgroundColor: isSelected ? '#f8f9fa' : 'transparent'
                                                    }}
                                                >
                                                    {/* Column 1: Checkbox */}
                                                    <CTableDataCell
                                                    className="text-center"
                                                    style={{ borderRight: '1px solid #a7acb1', padding: '12px 8px' }}
                                                >
                                                    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '24px' }}>
                                                        <CFormCheck
                                                            checked={isSelected}
                                                            onChange={(e) => handleEmployeeSelection(empId, e.target.checked)}
                                                            id={`employee-${empId}`}
                                                            style={{
                                                                width: '20px',
                                                                height: '20px',
                                                                border: '2px solid #007bff',
                                                                backgroundColor: isSelected ? '#007bff' : 'white',
                                                                borderRadius: '3px',
                                                                cursor: 'pointer',
                                                                position: 'relative',
                                                                appearance: 'none',
                                                                outline: 'none'
                                                            }}
                                                        />
                                                    </div>
                                                </CTableDataCell>

                                                    {/* Column 2: Employee ID in Circle */}
                                                    <CTableDataCell
                                                        className="text-center"
                                                        style={{ borderRight: '1px solid #a7acb1' }}
                                                    >
                                                        <div
                                                            className="d-flex align-items-center justify-content-center mx-auto"
                                                            style={{
                                                                width: '45px',
                                                                height: '45px',
                                                                backgroundColor: '#007bff',
                                                                color: 'white',
                                                                borderRadius: '50%',
                                                                fontSize: '11px',
                                                                fontWeight: 'bold',
                                                                flexShrink: 0,
                                                                lineHeight: '1.2',
                                                                textAlign: 'center',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            {empId || 'N/A'}
                                                        </div>
                                                    </CTableDataCell>

                                                    {/* Column 3: Employee Name Only */}
                                                    <CTableDataCell
                                                        style={{
                                                            borderRight: '1px solid #a7acb1',
                                                            minWidth: '150px'
                                                        }}
                                                    >
                                                        <div className="fw-semibold fs-6" style={{ fontSize: '0.9rem' }}>
                                                            {empName}
                                                        </div>
                                                    </CTableDataCell>

                                                    {/* Column 4: Check In with View Button */}
                                                    <CTableDataCell
                                                        className="text-center"
                                                        style={{ borderRight: '1px solid #a7acb1' }}
                                                    >
                                                        <div className="d-flex align-items-center justify-content-center gap-2">
                                                            <CIcon
                                                                icon={employee.checkIn ? cilCheckCircle : cilXCircle}
                                                                className={employee.checkIn ? 'text-success' : 'text-muted'}
                                                                size="lg"
                                                            />
                                                            {/* CONDITIONAL RENDERING - Only show if face attendance is enabled */}
                                                            {faceAttendanceEnabled && (
                                                                <CTooltip
                                                                    content={hasValidImageUrl(employee.trackers, 'checkin')
                                                                        ? (t('LABELS.clickToViewCheckInImage') || 'Click to view check-in image')
                                                                        : (t('LABELS.noCheckInImageUploaded') || 'User did not upload the image for check-in')
                                                                    }
                                                                    placement="top"
                                                                    trigger="hover"
                                                                >
                                                                    <span>
                                                                        <CButton
                                                                            size="sm"
                                                                            color={hasValidImageUrl(employee.trackers, 'checkin') ? "primary" : "secondary"}
                                                                            variant="outline"
                                                                            style={{
                                                                                fontSize: '0.7rem',
                                                                                padding: '2px 6px',
                                                                                opacity: hasValidImageUrl(employee.trackers, 'checkin') ? 1 : 0.6,
                                                                                cursor: hasValidImageUrl(employee.trackers, 'checkin') ? 'pointer' : 'not-allowed',
                                                                                backgroundColor: hasValidImageUrl(employee.trackers, 'checkin') ? 'transparent' : '#f8f9fa',
                                                                                borderColor: hasValidImageUrl(employee.trackers, 'checkin') ? '' : '#6c757d',
                                                                                color: hasValidImageUrl(employee.trackers, 'checkin') ? '' : '#6c757d'
                                                                            }}
                                                                            disabled={!hasValidImageUrl(employee.trackers, 'checkin')}
                                                                            onClick={() => openImageModal(
                                                                                getImageUrl(employee.trackers, 'checkin'),
                                                                                empName,
                                                                                'Check-in'
                                                                            )}
                                                                        >
                                                                            {t('LABELS.view') || 'View'}
                                                                        </CButton>
                                                                    </span>
                                                                </CTooltip>
                                                            )}
                                                        </div>
                                                    </CTableDataCell>
                                                    {/* Column 5: Check Out with View Button */}
                                                    <CTableDataCell
                                                        className="text-center"
                                                        style={{ borderRight: '1px solid #a7acb1' }}
                                                    >
                                                        <div className="d-flex align-items-center justify-content-center gap-2">
                                                            <CIcon
                                                                icon={employee.checkOut ? cilCheckCircle : cilXCircle}
                                                                className={employee.checkOut ? 'text-success' : 'text-muted'}
                                                                size="lg"
                                                            />
                                                            {/* CONDITIONAL RENDERING - Only show if face attendance is enabled */}
                                                            {faceAttendanceEnabled && (
                                                                <CTooltip
                                                                    content={hasValidImageUrl(employee.trackers, 'checkout')
                                                                        ? (t('LABELS.clickToViewCheckOutImage') || 'Click to view check-out image')
                                                                        : (t('LABELS.noCheckOutImageUploaded') || 'User did not upload the image for check-out')
                                                                    }
                                                                    placement="top"
                                                                    trigger="hover"
                                                                >
                                                                    <span>
                                                                        <CButton
                                                                            size="sm"
                                                                            color={hasValidImageUrl(employee.trackers, 'checkout') ? "primary" : "secondary"}
                                                                            variant="outline"
                                                                            style={{
                                                                                fontSize: '0.7rem',
                                                                                padding: '2px 6px',
                                                                                opacity: hasValidImageUrl(employee.trackers, 'checkout') ? 1 : 0.6,
                                                                                cursor: hasValidImageUrl(employee.trackers, 'checkout') ? 'pointer' : 'not-allowed',
                                                                                backgroundColor: hasValidImageUrl(employee.trackers, 'checkout') ? 'transparent' : '#f8f9fa',
                                                                                borderColor: hasValidImageUrl(employee.trackers, 'checkout') ? '' : '#6c757d',
                                                                                color: hasValidImageUrl(employee.trackers, 'checkout') ? '' : '#6c757d'
                                                                            }}
                                                                            disabled={!hasValidImageUrl(employee.trackers, 'checkout')}
                                                                            onClick={() => openImageModal(
                                                                                getImageUrl(employee.trackers, 'checkout'),
                                                                                empName,
                                                                                'Check-out'
                                                                            )}
                                                                        >
                                                                            {t('LABELS.view') || 'View'}
                                                                        </CButton>
                                                                    </span>
                                                                </CTooltip>
                                                            )}
                                                        </div>
                                                    </CTableDataCell>

                                                    {/* Column 6: Status */}
                                                    <CTableDataCell
                                                        className="text-center"
                                                        style={{ borderRight: '1px solid #a7acb1' }}
                                                    >
                                                        <CBadge
                                                            color={employee.status === 'Present' ? 'success' : 'secondary'}
                                                            className="px-2 px-md-3 py-1 small"
                                                            style={{ fontSize: '0.8rem' }}
                                                        >
                                                            {employee.status === 'Present' ? (t('LABELS.present') || 'Present') : (t('LABELS.absent') || 'Absent')}
                                                        </CBadge>
                                                    </CTableDataCell>

                                                    {/* Column 7: Action */}
                                                    <CTableDataCell className="text-center">
                                                        <CButton
                                                            size="sm"
                                                            color="primary"
                                                            variant="outline"
                                                            onClick={() => navigate(`/employees/${empId}`)}
                                                        >
                                                            {t('LABELS.details') || 'Details'}
                                                        </CButton>
                                                    </CTableDataCell>
                                                </CTableRow>
                                            </React.Fragment>
                                        );
                                    }) : null}
                                </CTableBody>
                                </CTable>
                            </div>

                            {/* Empty State */}
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
            {/* Image View Modal */}
            <ImageViewModal
                isOpen={imageModal.isOpen}
                onClose={closeImageModal}
                imageUrl={imageModal.imageUrl}
                title={imageModal.title}
                employeeName={imageModal.employeeName}
                imageType={imageModal.imageType}
            />
        </div>
    );
}

export default BulkEmployeeCheckInOut;
