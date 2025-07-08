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
    CTooltip
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilClock, cilLocationPin, cilCheckCircle, cilXCircle, cilPeople, cilCheck, cilWarning } from '@coreui/icons';
import { getAPICall, post } from '../../../util/api';
import { useTranslation } from 'react-i18next';

function BulkEmployeeCheckInOut() {
    // Add translation hook
    const { t } = useTranslation("global");

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [selectedEmployees, setSelectedEmployees] = useState([]);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [selectAll, setSelectAll] = useState(false);

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
        fetchEmployees();
    }, [fetchEmployees]);

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
                    `${t('MSG.checkInSuccess') || 'Check-in successful'}: ${response.rows_updated} ${t('MSG.employeesUpdated') || 'employees updated'}`
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
                    `${t('MSG.checkOutSuccess') || 'Check-out successful'}: ${response.rows_updated} ${t('MSG.employeesUpdated') || 'employees updated'}`
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

                            {/* Employee Table - Full Width and Responsive */}
                            <div className="table-responsive w-100">
                                <CTable
                                    align="middle"
                                    className="mb-0 w-100"
                                    hover
                                    responsive
                                    style={{
                                        border: '2px solid #dee2e6',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        minWidth: '100%'
                                    }}
                                >
                                    <CTableHead className="text-nowrap">
                                        <CTableRow style={{ borderBottom: '2px solid #dee2e6' }}>
                                            <CTableHeaderCell
                                                className="bg-body-tertiary text-center"
                                                style={{
                                                    width: '50px',
                                                    minWidth: '50px',
                                                    borderRight: '1px solid #dee2e6',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                <CFormCheck
                                                    checked={selectAll}
                                                    onChange={handleSelectAll}
                                                    id="selectAll"
                                                />
                                            </CTableHeaderCell>
                                            <CTableHeaderCell
                                                className="bg-body-tertiary d-none d-sm-table-cell"
                                                style={{
                                                    width: '70px',
                                                    minWidth: '70px',
                                                    borderRight: '1px solid #dee2e6',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                <CIcon icon={cilPeople} />
                                            </CTableHeaderCell>
                                            <CTableHeaderCell
                                                className="bg-body-tertiary"
                                                style={{
                                                    borderRight: '1px solid #dee2e6',
                                                    fontWeight: 'bold',
                                                    minWidth: '200px'
                                                }}
                                            >
                                                {t('LABELS.employee') || 'Employee'}
                                            </CTableHeaderCell>
                                            <CTableHeaderCell
                                                className="bg-body-tertiary text-center d-none d-md-table-cell"
                                                style={{
                                                    width: '100px',
                                                    minWidth: '100px',
                                                    borderRight: '1px solid #dee2e6',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {t('LABELS.checkIn') || 'Check In'}
                                            </CTableHeaderCell>
                                            <CTableHeaderCell
                                                className="bg-body-tertiary text-center d-none d-md-table-cell"
                                                style={{
                                                    width: '100px',
                                                    minWidth: '100px',
                                                    borderRight: '1px solid #dee2e6',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {t('LABELS.checkOut') || 'Check Out'}
                                            </CTableHeaderCell>
                                            <CTableHeaderCell
                                                className="bg-body-tertiary text-center"
                                                style={{
                                                    width: '100px',
                                                    minWidth: '100px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {t('LABELS.status') || 'Status'}
                                            </CTableHeaderCell>
                                        </CTableRow>
                                    </CTableHead>
                                    <CTableBody>
                                        {employees.length > 0 ? employees.map((employee, index) => {
                                            const empId = employee.id || employee.employee_id || employee.emp_id;
                                            const empName = employee.name || employee.employee_name || employee.first_name || `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unknown Employee';
                                            const isSelected = employee.selected || false;
                                            const canCheckOut = employee.checkIn; // Can only check out if checked in

                                            return (
                                                <CTableRow
                                                    key={empId}
                                                    style={{
                                                        borderBottom: index === employees.length - 1 ? 'none' : '1px solid #dee2e6',
                                                        backgroundColor: isSelected ? '#f8f9fa' : 'transparent'
                                                    }}
                                                >
                                                    <CTableDataCell
                                                        className="text-center"
                                                        style={{ borderRight: '1px solid #dee2e6' }}
                                                    >
                                                        <CFormCheck
                                                            checked={isSelected}
                                                            onChange={(e) => handleEmployeeSelection(empId, e.target.checked)}
                                                            id={`employee-${empId}`}
                                                        />
                                                    </CTableDataCell>
                                                    <CTableDataCell
                                                        className="d-none d-sm-table-cell"
                                                        style={{ borderRight: '1px solid #dee2e6' }}
                                                    >
                                                        <div
                                                            className="d-flex align-items-center justify-content-center"
                                                            style={{
                                                                width: '45px',
                                                                height: '45px',
                                                                backgroundColor: '#007bff',
                                                                color: 'white',
                                                                borderRadius: '50%',
                                                                fontSize: '16px',
                                                                fontWeight: 'bold',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            {empName.charAt(0).toUpperCase()}
                                                        </div>
                                                    </CTableDataCell>
                                                    <CTableDataCell
                                                        style={{
                                                            borderRight: '1px solid #dee2e6',
                                                            minWidth: '200px'
                                                        }}
                                                    >
                                                        <div className="d-flex align-items-center w-100">
                                                            {/* Mobile avatar */}
                                                            <div
                                                                className="d-sm-none me-3"
                                                                style={{
                                                                    width: '35px',
                                                                    height: '35px',
                                                                    backgroundColor: '#007bff',
                                                                    color: 'white',
                                                                    borderRadius: '50%',
                                                                    fontSize: '14px',
                                                                    fontWeight: 'bold',
                                                                    flexShrink: 0,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                            >
                                                                {empName.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="flex-grow-1 min-width-0">
                                                                <div className="fw-semibold fs-6 text-truncate" style={{ fontSize: '0.9rem' }}>
                                                                    {empName}
                                                                </div>
                                                                <div className="small text-muted" style={{ fontSize: '0.8rem' }}>
                                                                    {t('LABELS.id') || 'ID'}: {empId || 'N/A'}
                                                                </div>
                                                                {/* Mobile status indicators */}
                                                                <div className="d-md-none mt-1">
                                                                    <small className="text-muted me-3" style={{ fontSize: '0.75rem' }}>
                                                                        {t('LABELS.checkIn') || 'In'}:
                                                                        <CIcon
                                                                            icon={employee.checkIn ? cilCheckCircle : cilXCircle}
                                                                            className={employee.checkIn ? 'text-success ms-1' : 'text-muted ms-1'}
                                                                            size="sm"
                                                                        />
                                                                    </small>
                                                                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                                                        {t('LABELS.checkOut') || 'Out'}:
                                                                        <CIcon
                                                                            icon={employee.checkOut ? cilCheckCircle : cilXCircle}
                                                                            className={employee.checkOut ? 'text-success ms-1' : (canCheckOut ? 'text-muted ms-1' : 'text-secondary ms-1')}
                                                                            size="sm"
                                                                        />
                                                                    </small>
                                                                    {/* Mobile validation indicator */}
                                                                    {isSelected && !canCheckOut && (
                                                                        <div className="mt-1">
                                                                            <small className="text-warning" style={{ fontSize: '0.7rem' }}>
                                                                                <CIcon icon={cilWarning} size="sm" className="me-1" />
                                                                                {t('MSG.checkInRequiredShort') || 'Check-in required'}
                                                                            </small>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </CTableDataCell>
                                                    <CTableDataCell
                                                        className="text-center d-none d-md-table-cell"
                                                        style={{ borderRight: '1px solid #dee2e6' }}
                                                    >
                                                        <CIcon
                                                            icon={employee.checkIn ? cilCheckCircle : cilXCircle}
                                                            className={employee.checkIn ? 'text-success' : 'text-muted'}
                                                            size="lg"
                                                        />
                                                    </CTableDataCell>
                                                    <CTableDataCell
                                                        className="text-center d-none d-md-table-cell"
                                                        style={{ borderRight: '1px solid #dee2e6' }}
                                                    >
                                                        <div className="d-flex align-items-center justify-content-center">
                                                            <CIcon
                                                                icon={employee.checkOut ? cilCheckCircle : cilXCircle}
                                                                className={employee.checkOut ? 'text-success' : (canCheckOut ? 'text-muted' : 'text-secondary')}
                                                                size="lg"
                                                                style={{ opacity: canCheckOut ? 1 : 0.4 }}
                                                            />
                                                            {isSelected && !canCheckOut && (
                                                                <CIcon
                                                                    icon={cilWarning}
                                                                    className="text-warning ms-2"
                                                                    size="sm"
                                                                />
                                                            )}
                                                        </div>
                                                    </CTableDataCell>
                                                    <CTableDataCell className="text-center">
                                                        <CBadge
                                                            color={employee.status === 'Present' ? 'success' : 'secondary'}
                                                            className="px-2 px-md-3 py-1 small"
                                                            style={{ fontSize: '0.8rem' }}
                                                        >
                                                            {employee.status === 'Present' ? (t('LABELS.present') || 'Present') : (t('LABELS.absent') || 'Absent')}
                                                        </CBadge>
                                                    </CTableDataCell>
                                                </CTableRow>
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
        </div>
    );
}

export default BulkEmployeeCheckInOut;
