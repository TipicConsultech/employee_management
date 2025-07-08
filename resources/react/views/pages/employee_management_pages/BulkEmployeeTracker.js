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
    CButtonGroup
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilClock, cilLocationPin, cilCheckCircle, cilXCircle, cilPeople, cilCheck } from '@coreui/icons';
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

    // Fetch employees function
    const fetchEmployees = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAPICall('/api/employees');
            console.log('API Response:', response); // Debug log
            if (response && Array.isArray(response)) {
                // Add status and selection state to each employee
                const employeesWithStatus = response.map(employee => ({
                    ...employee,
                    checkIn: false, // Default status, you can fetch from tracker API if needed
                    checkOut: false,
                    status: 'Absent',
                    selected: false
                }));
                console.log('Processed employees:', employeesWithStatus); // Debug log
                setEmployees(employeesWithStatus);
            } else if (response && response.data && Array.isArray(response.data)) {
                // Handle case where data is nested
                const employeesWithStatus = response.data.map(employee => ({
                    ...employee,
                    checkIn: false,
                    checkOut: false,
                    status: 'Absent',
                    selected: false
                }));
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
    }, [showNotification, t]);

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
                    prev.map(emp =>
                        selectedEmployees.includes(emp.id || emp.employee_id || emp.emp_id)
                            ? { ...emp, checkIn: true, status: 'Present', selected: false }
                            : { ...emp, selected: false }
                    )
                );

                // Clear selections
                setSelectedEmployees([]);
                setSelectAll(false);

                // Optionally refresh the employee list
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

    // Handle bulk check-out
    const handleBulkCheckOut = useCallback(async () => {
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

            const response = await post('/api/bulkCheckOut', payload);

            if (response && (response.message || response.rows_updated)) {
                showNotification('success',
                    `${t('MSG.checkOutSuccess') || 'Check-out successful'}: ${response.rows_updated} ${t('MSG.employeesUpdated') || 'employees updated'}`
                );

                // Update local state to reflect check-out
                setEmployees(prev =>
                    prev.map(emp =>
                        selectedEmployees.includes(emp.id || emp.employee_id || emp.emp_id)
                            ? { ...emp, checkOut: true, status: 'Present', selected: false }
                            : { ...emp, selected: false }
                    )
                );

                // Clear selections
                setSelectedEmployees([]);
                setSelectAll(false);

                // Optionally refresh the employee list
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
                                    <CButton
                                        color="success"
                                        onClick={handleBulkCheckOut}
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
                                                <span className="d-none d-sm-inline">{t('LABELS.bulkCheckOut') || 'Bulk Check-Out'}</span>
                                                <span className="d-sm-none">{t('LABELS.checkOut') || 'Check-Out'}</span>
                                            </>
                                        )}
                                    </CButton>
                                </div>
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

                                            return (
                                                <CTableRow
                                                    key={empId}
                                                    style={{
                                                        borderBottom: index === employees.length - 1 ? 'none' : '1px solid #dee2e6',
                                                        backgroundColor: employee.selected ? '#f8f9fa' : 'transparent'
                                                    }}
                                                >
                                                    <CTableDataCell
                                                        className="text-center"
                                                        style={{ borderRight: '1px solid #dee2e6' }}
                                                    >
                                                        <CFormCheck
                                                            checked={employee.selected || false}
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
                                                                            className={employee.checkOut ? 'text-success ms-1' : 'text-muted ms-1'}
                                                                            size="sm"
                                                                        />
                                                                    </small>
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
                                                        <CIcon
                                                            icon={employee.checkOut ? cilCheckCircle : cilXCircle}
                                                            className={employee.checkOut ? 'text-success' : 'text-muted'}
                                                            size="lg"
                                                        />
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

                            {/* Security Notice */}
                            {/* <div className="mt-3 mt-md-4 p-3 p-md-4 rounded-3 border-start border-success border-4 w-100" style={{ backgroundColor: '#e8f5e8' }}>
                                <div className="d-flex align-items-center">
                                    <div className="bg-success rounded-circle me-2 me-md-3" style={{ width: '12px', height: '12px' }}></div>
                                    <h6 className="mb-0 text-success fs-6 fs-md-5">
                                        {t('MSG.allTransactionsSecure') || 'All transactions are secure'}
                                    </h6>
                                </div>
                            </div> */}
                        </CCardBody>
                    </CCard>
                </div>
            </CContainer>
        </div>
    );
}

export default BulkEmployeeCheckInOut;
