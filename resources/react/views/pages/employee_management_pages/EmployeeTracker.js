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
    CBadge
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilClock, cilLocationPin, cilCheckCircle, cilXCircle } from '@coreui/icons';
import { getAPICall, post, put } from '../../../util/api';
import { useTranslation } from 'react-i18next';

function EmployeeCheckInOut() {
    // Add translation hook
    const { t } = useTranslation("global");

    const [status, setStatus] = useState({ checkIn: false, checkOut: false });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [showCompletedPopup, setShowCompletedPopup] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [trackerId, setTrackerId] = useState(null); // Store tracker ID for PUT request

    let REQUIRED_LAT = null;
    let REQUIRED_LNG = null;
    let LOCATION_TOLERANCE = null;

 
   const fetchCompanyCordinates =async () => {
        try {
            
            const response = await getAPICall('/api/getCordinates');
            if (response) {
            REQUIRED_LAT        = parseFloat(response[0].required_lat);
            REQUIRED_LNG        = parseFloat(response[0].required_lng);
            LOCATION_TOLERANCE  = parseFloat(response[0].location_tolerance);
            }
        }
        catch(e){
            console.log(e);
            
        }
    };

    // Memoized helper function for showing notifications
    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        // Auto hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                setNotification({ show: false, type: '', message: '' });
            }, 3000);
        }
    }, []);

    // Fetch employee status function
    const fetchEmployeeStatus = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAPICall('/api/employee-tracker/status');
            if (response) {
                setStatus(response);

                // Store tracker ID if available
                if (response.id) {
                    setTrackerId(response.id);
                }

                // Show popup if both check-in and check-out are completed
                if (response.checkIn && response.checkOut) {
                    setShowCompletedPopup(true);
                }
            } else {
                showNotification('warning', t('MSG.failedToFetchStatus'));
            }
        } catch (error) {
            console.error('Error fetching employee status:', error);
            showNotification('warning', `${t('MSG.errorConnectingToServer')}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [showNotification, t]);

    // Fetch status on component mount
    useEffect(() => {
        fetchEmployeeStatus();
    }, [fetchEmployeeStatus]);

    useEffect(() => {
        fetchCompanyCordinates();
    }, []);

    // Get current location
    const getCurrentLocation = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error(t('MSG.geolocationNotSupported')));
                return;
            }

            setLocationLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationLoading(false);
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    setLocationLoading(false);
                    reject(new Error(t('MSG.unableToGetLocation')));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }, [t]);

    // Validate location
    const validateLocation = useCallback((userLat, userLng) => {
        const latDiff = Math.abs(userLat - REQUIRED_LAT);
        const lngDiff = Math.abs(userLng - REQUIRED_LNG);

        console.log('Location Debug:', {
            userLat,
            userLng,
            requiredLat: REQUIRED_LAT,
            requiredLng: REQUIRED_LNG,
            latDiff,
            lngDiff,
            tolerance: LOCATION_TOLERANCE,
            isValid: latDiff <= LOCATION_TOLERANCE && lngDiff <= LOCATION_TOLERANCE
        });

        return latDiff <= LOCATION_TOLERANCE && lngDiff <= LOCATION_TOLERANCE;
    }, []);

    // Handle check-in
    const handleCheckIn = useCallback(async () => {
        try {
            setNotification({ show: false, type: '', message: '' });

            // Get current location
            const location = await getCurrentLocation();

            // Validate location
            if (!validateLocation(location.latitude, location.longitude)) {
                showNotification('warning', t('MSG.mustBeAtOfficeLocation'));
                return;
            }

            setSubmitting(true);

            const currentTime = new Date().toISOString();
            const gpsString = `${location.latitude},${location.longitude}`;

            const payload = {
                check_in: true,
                check_out: false,
                payment_status: false,
                check_out_time: null,
                check_in_gps: gpsString,
                check_out_gps: null
            };

            const response = await post('/api/employee-tracker', payload);

            if (response.id && response.id > 0) {
                setTrackerId(response.id); // Store the tracker ID for future use
                showNotification('success', t('MSG.checkInSuccess'));
                // Refresh status
                await fetchEmployeeStatus();
            } else {
                showNotification('warning', t('MSG.failedToProcessRequest'));
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('warning', `${t('MSG.error')}: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [getCurrentLocation, validateLocation, showNotification, t, fetchEmployeeStatus]);

    // Handle check-out
    const handleCheckOut = useCallback(async () => {
        try {
            setNotification({ show: false, type: '', message: '' });

            // Check if we have a tracker ID
            if (!trackerId) {
                showNotification('warning', t('MSG.noTrackerIdFound'));
                return;
            }

            // Get current location
            const location = await getCurrentLocation();

            // Validate location
            if (!validateLocation(location.latitude, location.longitude)) {
                showNotification('warning', t('MSG.mustBeAtOfficeLocation'));
                return;
            }

            setSubmitting(true);

            const gpsString = `${location.latitude},${location.longitude}`;

            const payload = {
                check_out_gps: gpsString,
                tracker_id: trackerId
            };

            const response = await put(`/api/employee-tracker/${trackerId}`, payload);

            if (response && (response.id || response.success)) {
                showNotification('success', t('MSG.checkOutSuccess'));
                // Refresh status
                await fetchEmployeeStatus();
            } else {
                showNotification('warning', t('MSG.failedToProcessRequest'));
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification('warning', `${t('MSG.error')}: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [trackerId, getCurrentLocation, validateLocation, showNotification, t, fetchEmployeeStatus]);

    // Close completed popup
    const closePopup = () => {
        setShowCompletedPopup(false);
    };

    // Loading state
    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <CSpinner color="primary" />
            </div>
        );
    }

    return (
        <>
            <CRow>
                <CCol xs={12} md={8} lg={6} className="mx-auto">
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

                    {/* Main Card */}
                    <CCard className="mb-4 shadow-sm">
                        {/* Header */}
                        <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
                            <div className="d-flex align-items-center">
                                <CIcon icon={cilClock} className="me-2" />
                                <div>
                                    <strong>{t('LABELS.employeeAttendance')}</strong>
                                    <div className="text-muted small">{t('LABELS.checkInOutSecurely')}</div>
                                </div>
                            </div>
                        </CCardHeader>

                        <CCardBody>
                            {/* Current Status Section */}
                            <div className="mb-4">
                                <h6 className="mb-3 text-muted">{t('LABELS.currentStatus')}</h6>
                                <div className="border-start border-primary border-3 ps-3">
                                    <CRow className="mb-3">
                                        <CCol xs={6}>
                                            <div className="d-flex align-items-center">
                                                <CIcon
                                                    icon={status.checkIn ? cilCheckCircle : cilXCircle}
                                                    className={`me-2 ${status.checkIn ? 'text-success' : 'text-muted'}`}
                                                />
                                                <span className="text-muted">{t('LABELS.checkIn')}</span>
                                            </div>
                                        </CCol>
                                        <CCol xs={6}>
                                            <CBadge color={status.checkIn ? 'success' : 'secondary'}>
                                                {status.checkIn ? t('LABELS.completed') : t('LABELS.pending')}
                                            </CBadge>
                                        </CCol>
                                    </CRow>
                                    <CRow>
                                        <CCol xs={6}>
                                            <div className="d-flex align-items-center">
                                                <CIcon
                                                    icon={status.checkOut ? cilCheckCircle : cilXCircle}
                                                    className={`me-2 ${status.checkOut ? 'text-success' : 'text-muted'}`}
                                                />
                                                <span className="text-muted">{t('LABELS.checkOut')}</span>
                                            </div>
                                        </CCol>
                                        <CCol xs={6}>
                                            <CBadge color={status.checkOut ? 'success' : 'secondary'}>
                                                {status.checkOut ? t('LABELS.completed') : t('LABELS.pending')}
                                            </CBadge>
                                        </CCol>
                                    </CRow>
                                </div>
                            </div>

                            {/* Divider */}
                            <hr className="my-4" />

                            {/* Actions Section */}
                            <div>
                                <h6 className="mb-3 text-muted">{t('LABELS.actions')}</h6>

                                {/* Location Status */}
                                <div className="mb-3 p-3 bg-light rounded border-start border-info border-3">
                                    <div className="d-flex align-items-center">
                                        <CIcon icon={cilLocationPin} className="me-2 text-primary" />
                                        <span className="text-muted small">
                                            {locationLoading ? t('MSG.gettingLocation') : t('MSG.locationVerificationRequired')}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <CRow className="g-3 mb-3">
                                    <CCol xs={6}>
                                        <CButton
                                            color="primary"
                                            className="w-100"
                                            onClick={handleCheckIn}
                                            disabled={status.checkIn || submitting || locationLoading}
                                        >
                                            {submitting ? (
                                                <>
                                                    <CSpinner size="sm" className="me-2" />
                                                    {t('LABELS.processing')}
                                                </>
                                            ) : (
                                                t('LABELS.checkIn')
                                            )}
                                        </CButton>
                                    </CCol>
                                    <CCol xs={6}>
                                        <CButton
                                            color="success"
                                            className="w-100"
                                            onClick={handleCheckOut}
                                            disabled={!status.checkIn || status.checkOut || submitting || locationLoading}
                                        >
                                            {submitting ? (
                                                <>
                                                    <CSpinner size="sm" className="me-2" />
                                                    {t('LABELS.processing')}
                                                </>
                                            ) : (
                                                t('LABELS.checkOut')
                                            )}
                                        </CButton>
                                    </CCol>
                                </CRow>

                                {/* Security Notice */}
                                <div className="p-3 bg-light rounded border-start border-success border-3">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-success rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
                                        <span className="text-muted small">
                                            {t('MSG.allTransactionsSecure')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Completed Popup Modal */}
            {showCompletedPopup && (
                <div
                    className="modal fade show d-block"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    tabIndex="-1"
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-body text-center p-4">
                                <CIcon
                                    icon={cilCheckCircle}
                                    className="text-success mb-3"
                                    style={{ fontSize: '3rem' }}
                                />
                                <h5 className="mb-3">{t('LABELS.allSet')}</h5>
                                <p className="text-muted mb-4">
                                    {t('MSG.dailyCheckInOutCompleted')}
                                </p>
                                <CButton
                                    color="primary"
                                    onClick={closePopup}
                                    className="w-100"
                                >
                                    {t('LABELS.ok')}
                                </CButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default EmployeeCheckInOut;
//-------------------------------------------------------------

// import React, { useState, useEffect, useCallback } from 'react';
// import {
//     CCard,
//     CCardBody,
//     CCardHeader,
//     CCol,
//     CRow,
//     CButton,
//     CSpinner,
//     CAlert,
//     CBadge
// } from '@coreui/react';
// import CIcon from '@coreui/icons-react';
// import { cilClock, cilLocationPin, cilCheckCircle, cilXCircle } from '@coreui/icons';
// import { getAPICall, post } from '../../../util/api';
// import { useTranslation } from 'react-i18next';

// function EmployeeCheckInOut() {
//     // Add translation hook
//     const { t } = useTranslation("global");

//     const [status, setStatus] = useState({ checkIn: false, checkOut: false });
//     const [loading, setLoading] = useState(true);
//     const [submitting, setSubmitting] = useState(false);
//     const [locationLoading, setLocationLoading] = useState(false);
//     const [showCompletedPopup, setShowCompletedPopup] = useState(false);
//     const [notification, setNotification] = useState({ show: false, type: '', message: '' });

//     // Required location coordinates
//     const REQUIRED_LAT = 18.534528;
//     const REQUIRED_LNG = 73.945648;
//     const LOCATION_TOLERANCE = 0.01; // ~1km tolerance (increased for testing)

//     // Memoized helper function for showing notifications
//     const showNotification = useCallback((type, message) => {
//         setNotification({ show: true, type, message });
//         // Auto hide success messages after 3 seconds
//         if (type === 'success') {
//             setTimeout(() => {
//                 setNotification({ show: false, type: '', message: '' });
//             }, 3000);
//         }
//     }, []);

//     // Fetch employee status function
//     const fetchEmployeeStatus = useCallback(async () => {
//         try {
//             setLoading(true);
//             const response = await getAPICall('/api/employee-tracker/status');
//             if (response) {
//                 setStatus(response);

//                 // Show popup if both check-in and check-out are completed
//                 if (response.checkIn && response.checkOut) {
//                     setShowCompletedPopup(true);
//                 }
//             } else {
//                 showNotification('warning', t('MSG.failedToFetchStatus'));
//             }
//         } catch (error) {
//             console.error('Error fetching employee status:', error);
//             showNotification('warning', `${t('MSG.errorConnectingToServer')}: ${error.message}`);
//         } finally {
//             setLoading(false);
//         }
//     }, [showNotification, t]);

//     // Fetch status on component mount
//     useEffect(() => {
//         fetchEmployeeStatus();
//     }, [fetchEmployeeStatus]);

//     // Get current location
//     const getCurrentLocation = useCallback(() => {
//         return new Promise((resolve, reject) => {
//             if (!navigator.geolocation) {
//                 reject(new Error(t('MSG.geolocationNotSupported')));
//                 return;
//             }

//             setLocationLoading(true);
//             navigator.geolocation.getCurrentPosition(
//                 (position) => {
//                     setLocationLoading(false);
//                     resolve({
//                         latitude: position.coords.latitude,
//                         longitude: position.coords.longitude
//                     });
//                 },
//                 (error) => {
//                     setLocationLoading(false);
//                     reject(new Error(t('MSG.unableToGetLocation')));
//                 },
//                 {
//                     enableHighAccuracy: true,
//                     timeout: 10000,
//                     maximumAge: 60000
//                 }
//             );
//         });
//     }, [t]);

//     // Validate location
//     const validateLocation = useCallback((userLat, userLng) => {
//         const latDiff = Math.abs(userLat - REQUIRED_LAT);
//         const lngDiff = Math.abs(userLng - REQUIRED_LNG);

//         console.log('Location Debug:', {
//             userLat,
//             userLng,
//             requiredLat: REQUIRED_LAT,
//             requiredLng: REQUIRED_LNG,
//             latDiff,
//             lngDiff,
//             tolerance: LOCATION_TOLERANCE,
//             isValid: latDiff <= LOCATION_TOLERANCE && lngDiff <= LOCATION_TOLERANCE
//         });

//         return latDiff <= LOCATION_TOLERANCE && lngDiff <= LOCATION_TOLERANCE;
//     }, []);

//     // Handle check-in
//     const handleCheckIn = useCallback(async () => {
//         await handleCheckInOut(true, false);
//     }, []);

//     // Handle check-out
//     const handleCheckOut = useCallback(async () => {
//         await handleCheckInOut(false, true);
//     }, []);

//     // Main check-in/out function
//     const handleCheckInOut = async (isCheckIn, isCheckOut) => {
//         try {
//             setNotification({ show: false, type: '', message: '' });

//             // Get current location
//             const location = await getCurrentLocation();

//             // Validate location
//             if (!validateLocation(location.latitude, location.longitude)) {
//                 showNotification('warning', t('MSG.mustBeAtOfficeLocation'));
//                 return;
//             }

//             setSubmitting(true);

//             const currentTime = new Date().toISOString();
//             const gpsString = `${location.latitude},${location.longitude}`;

//             const payload = {
//                 check_in: isCheckIn ? true : status.checkIn,
//                 check_out: isCheckOut ? true : status.checkOut,
//                 payment_status: false,
//                 check_out_time: isCheckOut ? currentTime : null,
//                 check_in_gps: isCheckIn ? gpsString : null,
//                 check_out_gps: isCheckOut ? gpsString : null
//             };

//             const response = await post('/api/employee-tracker', payload);

//             if (response.id && response.id > 0) {
//                 showNotification('success', isCheckIn ? t('MSG.checkInSuccess') : t('MSG.checkOutSuccess'));
//                 // Refresh status
//                 await fetchEmployeeStatus();
//             } else {
//                 showNotification('warning', t('MSG.failedToProcessRequest'));
//             }
//         } catch (error) {
//             console.error('Error:', error);
//             showNotification('warning', `${t('MSG.error')}: ${error.message}`);
//         } finally {
//             setSubmitting(false);
//         }
//     };

//     // Close completed popup
//     const closePopup = () => {
//         setShowCompletedPopup(false);
//     };

//     // Loading state
//     if (loading) {
//         return (
//             <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
//                 <CSpinner color="primary" />
//             </div>
//         );
//     }

//     return (
//         <>
//             <CRow>
//                 <CCol xs={12} md={8} lg={6} className="mx-auto">
//                     {/* Header Card */}
//                     <CCard className="mb-4 shadow-sm">
//                         <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
//                             <div className="d-flex align-items-center">
//                                 <CIcon icon={cilClock} className="me-2" />
//                                 <div>
//                                     <strong>{t('LABELS.employeeAttendance')}</strong>
//                                     <div className="text-muted small">{t('LABELS.checkInOutSecurely')}</div>
//                                 </div>
//                             </div>
//                         </CCardHeader>
//                     </CCard>

//                     {/* Notifications */}
//                     {notification.show && (
//                         <CAlert
//                             color={notification.type}
//                             dismissible
//                             onClose={() => setNotification({ show: false, type: '', message: '' })}
//                             className="mb-3"
//                         >
//                             {notification.message}
//                         </CAlert>
//                     )}

//                     {/* Status Card */}
//                     <CCard className="mb-4 shadow-sm">
//                         <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
//                             <strong>{t('LABELS.currentStatus')}</strong>
//                         </CCardHeader>
//                         <CCardBody>
//                             <CRow className="mb-3">
//                                 <CCol xs={6}>
//                                     <div className="d-flex align-items-center">
//                                         <CIcon
//                                             icon={status.checkIn ? cilCheckCircle : cilXCircle}
//                                             className={`me-2 ${status.checkIn ? 'text-success' : 'text-muted'}`}
//                                         />
//                                         <span className="text-muted">{t('LABELS.checkIn')}</span>
//                                     </div>
//                                 </CCol>
//                                 <CCol xs={6}>
//                                     <CBadge color={status.checkIn ? 'success' : 'secondary'}>
//                                         {status.checkIn ? t('LABELS.completed') : t('LABELS.pending')}
//                                     </CBadge>
//                                 </CCol>
//                             </CRow>
//                             <CRow>
//                                 <CCol xs={6}>
//                                     <div className="d-flex align-items-center">
//                                         <CIcon
//                                             icon={status.checkOut ? cilCheckCircle : cilXCircle}
//                                             className={`me-2 ${status.checkOut ? 'text-success' : 'text-muted'}`}
//                                         />
//                                         <span className="text-muted">{t('LABELS.checkOut')}</span>
//                                     </div>
//                                 </CCol>
//                                 <CCol xs={6}>
//                                     <CBadge color={status.checkOut ? 'success' : 'secondary'}>
//                                         {status.checkOut ? t('LABELS.completed') : t('LABELS.pending')}
//                                     </CBadge>
//                                 </CCol>
//                             </CRow>
//                         </CCardBody>
//                     </CCard>

//                     {/* Action Card */}
//                     <CCard className="mb-4 shadow-sm">
//                         <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
//                             <strong>{t('LABELS.actions')}</strong>
//                         </CCardHeader>
//                         <CCardBody>
//                             {/* Location Status */}
//                             <div className="mb-3 p-3 bg-light rounded">
//                                 <div className="d-flex align-items-center">
//                                     <CIcon icon={cilLocationPin} className="me-2 text-primary" />
//                                     <span className="text-muted small">
//                                         {locationLoading ? t('MSG.gettingLocation') : t('MSG.locationVerificationRequired')}
//                                     </span>
//                                 </div>
//                             </div>

//                             {/* Action Buttons */}
//                             <CRow className="g-3">
//                                 <CCol xs={12}>
//                                     <CButton
//                                         color="primary"
//                                         className="w-100"
//                                         onClick={handleCheckIn}
//                                         disabled={status.checkIn || submitting || locationLoading}
//                                     >
//                                         {submitting ? (
//                                             <>
//                                                 <CSpinner size="sm" className="me-2" />
//                                                 {t('LABELS.processing')}
//                                             </>
//                                         ) : (
//                                             t('LABELS.checkIn')
//                                         )}
//                                     </CButton>
//                                 </CCol>
//                                 <CCol xs={12}>
//                                     <CButton
//                                         color="success"
//                                         className="w-100"
//                                         onClick={handleCheckOut}
//                                         disabled={!status.checkIn || status.checkOut || submitting || locationLoading}
//                                     >
//                                         {submitting ? (
//                                             <>
//                                                 <CSpinner size="sm" className="me-2" />
//                                                 {t('LABELS.processing')}
//                                             </>
//                                         ) : (
//                                             t('LABELS.checkOut')
//                                         )}
//                                     </CButton>
//                                 </CCol>
//                             </CRow>

//                             {/* Security Notice */}
//                             <div className="mt-3 p-3 bg-light rounded">
//                                 <div className="d-flex align-items-center">
//                                     <div className="bg-secondary rounded-circle me-2" style={{ width: '8px', height: '8px' }}></div>
//                                     <span className="text-muted small">
//                                         {t('MSG.allTransactionsSecure')}
//                                     </span>
//                                 </div>
//                             </div>
//                         </CCardBody>
//                     </CCard>
//                 </CCol>
//             </CRow>

//             {/* Completed Popup Modal */}
//             {showCompletedPopup && (
//                 <div
//                     className="modal fade show d-block"
//                     style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
//                     tabIndex="-1"
//                 >
//                     <div className="modal-dialog modal-dialog-centered">
//                         <div className="modal-content">
//                             <div className="modal-body text-center p-4">
//                                 <CIcon
//                                     icon={cilCheckCircle}
//                                     className="text-success mb-3"
//                                     style={{ fontSize: '3rem' }}
//                                 />
//                                 <h5 className="mb-3">{t('LABELS.allSet')}</h5>
//                                 <p className="text-muted mb-4">
//                                     {t('MSG.dailyCheckInOutCompleted')}
//                                 </p>
//                                 <CButton
//                                     color="primary"
//                                     onClick={closePopup}
//                                     className="w-100"
//                                 >
//                                     {t('LABELS.ok')}
//                                 </CButton>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// }

// export default EmployeeCheckInOut;
