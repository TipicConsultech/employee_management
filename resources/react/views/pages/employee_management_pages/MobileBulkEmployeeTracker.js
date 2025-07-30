import React from 'react';
import { cilLocationPin, cilCheckCircle, cilXCircle, cilPencil, cilInput, cilTrash } from '@coreui/icons';
import { CAlert, CButton,CButtonGroup,CCard,CBadge, CCardBody,CTableBody, CCardHeader,CTableDataCell,CTableHeaderCell,CFormCheck, CContainer, CSpinner,CTooltip,CTable,CTableHead,CTableRow} from "@coreui/react";

import { useTranslation } from 'react-i18next';
import CIcon from '@coreui/icons-react';

const MobileEmployeeRow = ({ handleEditClick, handleMapClick, employee, empId, empName, isSelected, handleEmployeeSelection, openImageModal, getImageUrl, hasValidImageUrl, navigate, t, faceAttendanceEnabled }) => {
    
    // Truncate name if it's too long
    const truncateName = (name, maxLength = 12) => {
        if (name && name.length > maxLength) {
            return name.substring(0, maxLength) + '...';
        }
        return name;
    };

    console.log(employee);
    

    return (
        <>
            <CTableRow
                className="d-md-none"
                style={{
                    backgroundColor: isSelected ? '#f8f9fa' : 'transparent',
                    borderBottom: '1px solid #dee2e6'
                }}
            >
                {/* Checkbox Column */}
                <CTableDataCell className="text-center" style={{ borderRight: '1px solid #dee2e6', width: '50px', padding: '12px 8px' }}>
                    <CFormCheck
                        checked={isSelected}
                        onChange={(e) => handleEmployeeSelection(empId, e.target.checked)}
                        id={`employee-mobile-${empId}`}
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
                </CTableDataCell>

                {/* Employee Column - Contains everything else */}
                <CTableDataCell style={{ padding: '12px' }}>
                    <div className="d-flex justify-content-between align-items-start">
                        {/* Left side: Employee info and buttons */}
                        <div style={{ flex: 1 }}>
                            <div className="d-flex align-items-center gap-2 mb-2">
                                {/* Employee ID Circle */}
                                <div
                                    className="d-flex align-items-center justify-content-center"
                                    style={{
                                        width: '35px',
                                        height: '35px',
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        borderRadius: '50%',
                                        fontSize: '12px',
                                        fontWeight: 'bold',
                                        flexShrink: 0
                                    }}
                                >
                                    {empId || 'N/A'}
                                </div>
                                
                                {/* Employee Name and Status - Now inline */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="fw-semibold" style={{ 
                                            fontSize: '0.9rem',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100px'
                                        }}>
                                            {/* <CTooltip content={empName} placement="top"> */}
                                                <span>{truncateName(empName)}</span>
                                            {/* </CTooltip> */}
                                        </span>
                                       
                                    </div>
                                </div>
                            </div>

                            {/* Details and Edit Buttons - Below the name */}
                            
                            <CButtonGroup className="mt-0">
                                                         
                              
                              <CButton
                                    size="sm"
                                    color="warning"
                                     onClick={() => handleEditClick(employee.trackers[0]?.id)}
                                 disabled={!employee.trackers || employee.trackers.length === 0}
                               >
                                  <span className="d-flex align-items-center gap-1">
                                    <CIcon icon={cilPencil} />
                                    {/* {t('LABELS.smallEditButton') || 'Edit'} */}
                                  </span>
                                </CButton>

                                <CButton
                                 size="sm"
                                  color="primary"
                                 variant="outline"
                                 onClick={() => navigate(`/employees/${empId}`)}
                              >  
                                <span className="d-flex align-items-center gap-1">
                                  <CIcon icon={cilInput} />
                                 {t('LABELS.details') || 'Details'}
                                  </span>
                             </CButton>
                             
                              </CButtonGroup>
                            
                        </div>

                        {/* Right side: Check in/out actions with vertical separator */}
                        <div style={{ 
                            minWidth: '120px', 
                            paddingLeft: '3px',
                            borderLeft: '1px solid #dee2e6',
                            marginLeft: '0px'
                        }}>
                            {/* Check In Row */}
                            <div className="d-flex align-items-center justify-content-between mb-2">
                                <div className="d-flex align-items-center gap-2" style={{ minWidth: '65px' }}>
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        fontWeight: '600', 
                                        color: '#6c757d',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {t('LABELS.checkInMobile') || 'Check In'}
                                    </span>
                                    <CIcon
                                        icon={employee.checkIn ? cilCheckCircle : cilXCircle}
                                        className={employee.checkIn ? 'text-success' : 'text-muted'}
                                        size="sm"
                                    />
                                </div>
                                
                                <div className="d-flex gap-1">
                                    {faceAttendanceEnabled && (
                                            <span>
                                                <CButton
                                                    size="sm"
                                                    color={hasValidImageUrl(employee.trackers, 'checkin') ? "primary" : "secondary"}
                                                    variant="outline"
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        padding: '2px 4px',
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
                                                    {t('LABELS.view') || 'view'}
                                                </CButton>
                                            </span>
                                        
                                    )}
                                 
                                        <span>
                                            <CButton
                                                size="sm"
                                                color={employee.trackers?.[0]?.check_in_gps ? "primary" : "secondary"}
                                                variant="outline"
                                                style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 4px',
                                                    opacity: employee.trackers?.[0]?.check_in_gps ? 1 : 0.6,
                                                    cursor: employee.trackers?.[0]?.check_in_gps ? 'pointer' : 'not-allowed'
                                                }}
                                                disabled={!employee.trackers?.[0]?.check_in_gps}
                                                onClick={() => handleMapClick(employee.trackers?.[0]?.check_in_gps, 'check-in',employee.trackers?.[0]?.employee_id)}
                                            >
                                                <CIcon icon={cilLocationPin} size="sm" />
                                            </CButton>
                                        </span>
                           
                                </div>
                            </div>

                            {/* Horizontal separator between check-in and check-out */}
                            <div style={{ 
                                height: '1px', 
                                backgroundColor: '#dee2e6', 
                                margin: '4px 0' 
                            }}></div>

                            {/* Check Out Row */}
                            <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-2" style={{ minWidth: '65px' }}>
                                    <span style={{ 
                                        fontSize: '0.75rem', 
                                        fontWeight: '600', 
                                        color: '#6c757d',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {t('LABELS.checkOutMobile') || 'Check Out'}
                                    </span>
                                    <CIcon
                                        icon={employee.checkOut ? cilCheckCircle : cilXCircle}
                                        className={employee.checkOut ? 'text-success' : 'text-muted'}
                                        size="sm"
                                    />
                                </div>
                                
                                <div className="d-flex gap-1">
                                    {faceAttendanceEnabled && (
                                      
                                            <span>
                                                <CButton
                                                    size="sm"
                                                    color={hasValidImageUrl(employee.trackers, 'checkout') ? "primary" : "secondary"}
                                                    variant="outline"
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        padding: '2px 4px',
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
                                                    {t('LABELS.view') || 'view'}
                                                </CButton>
                                            </span>
                               
                                    )}
                              
                                        <span>
                                            <CButton
                                                size="sm"
                                                color={employee.trackers?.[0]?.check_out_gps ? "primary" : "secondary"}
                                                variant="outline"
                                                style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 4px',
                                                    opacity: employee.trackers?.[0]?.check_out_gps ? 1 : 0.6,
                                                    cursor: employee.trackers?.[0]?.check_out_gps ? 'pointer' : 'not-allowed'
                                                }}
                                                disabled={!employee.trackers?.[0]?.check_out_gps}
                                                onClick={() => handleMapClick(employee.trackers?.[0]?.check_out_gps, 'check-out',employee.trackers?.[0]?.employee_id)}
                                            >
                                                <CIcon icon={cilLocationPin} size="sm" />
                                            </CButton>
                                        </span>
                                 
                                </div>
                            </div>
                        </div>
                    </div>
                </CTableDataCell>
            </CTableRow>
        </>
    );
};

export default MobileEmployeeRow;

const mobileStyles = `
    @media (max-width: 768px) {
        .mobile-hide {
            display: none !important;
        }
        .mobile-show {
            display: block !important;
        }

        /* Hide action column on mobile */
        .table thead th:last-child,
        .table tbody td:last-child {
            display: none !important;
        }

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