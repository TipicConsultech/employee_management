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
    CContainer
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilClock, cilLocationPin, cilCheckCircle, cilXCircle } from '@coreui/icons';
import { getAPICall, post, postFormData, put } from '../../../util/api';
import { useTranslation } from 'react-i18next';

function EmployeeCheckInOut() {
    const { t } = useTranslation("global");

    const [status, setStatus] = useState({ checkIn: false, checkOut: false });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [showCompletedPopup, setShowCompletedPopup] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [trackerId, setTrackerId] = useState(null);

    // Store coordinates in state to ensure they're available
    const [coordinates, setCoordinates] = useState({
        requiredLat: null,
        requiredLng: null,
        locationTolerance: null
    });
    const [coordinatesLoaded, setCoordinatesLoaded] = useState(false);

    const fetchCompanyCoordinates = useCallback(async () => {
        try {
            console.log('Fetching company coordinates...');
            const response = await getAPICall('/api/getCordinates');
            if (response && response.length > 0) {
                const coords = {
                    requiredLat: parseFloat(response[0].required_lat),
                    requiredLng: parseFloat(response[0].required_lng),
                    locationTolerance: parseFloat(response[0].location_tolerance)
                };
                setCoordinates(coords);
                setCoordinatesLoaded(true);
                console.log('Company coordinates loaded:', coords);
            } else {
                console.error('No coordinates found in response');
                showNotification('warning', 'Failed to load office coordinates');
            }
        } catch (e) {
            console.error('Error fetching company coordinates:', e);
            showNotification('warning', 'Failed to load office location settings');
        }
    }, []);

    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        if (type === 'success') {
            setTimeout(() => {
                setNotification({ show: false, type: '', message: '' });
            }, 3000);
        }
    }, []);

    const fetchEmployeeStatus = useCallback(async () => {
        try {
            setLoading(true);
            console.log('Fetching employee status...');
            const response = await getAPICall('/api/employee-tracker/status');

            if (response) {
                console.log('Employee status response:', response);
                setStatus(response);

                // Try multiple possible ID fields
                const id = response.id || response.tracker_id || response.trackerId;
                if (id) {
                    setTrackerId(id);
                    console.log('Tracker ID set to:', id);
                } else {
                    console.warn('No tracker ID found in response:', response);
                }

                if (response.checkIn && response.checkOut) {
                    setShowCompletedPopup(true);
                }
            } else {
                console.error('No response from status API');
                showNotification('warning', t('MSG.failedToFetchStatus'));
            }
        } catch (error) {
            console.error('Error fetching employee status:', error);
            showNotification('warning', `${t('MSG.errorConnectingToServer')}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [showNotification, t]);

    // Load data on component mount
    useEffect(() => {
        const loadData = async () => {
            await fetchCompanyCoordinates();
            await fetchEmployeeStatus();
        };
        loadData();
    }, [fetchCompanyCoordinates, fetchEmployeeStatus]);

    const getCurrentLocation = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error(t('MSG.geolocationNotSupported')));
                return;
            }

            setLocationLoading(true);
            console.log('Getting current location...');

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationLoading(false);
                    const location = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    console.log('Current location:', location);
                    resolve(location);
                },
                (error) => {
                    setLocationLoading(false);
                    console.error('Geolocation error:', error);
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

    const validateLocation = useCallback((userLat, userLng) => {
        if (!coordinatesLoaded) {
            console.error('Coordinates not loaded yet');
            return false;
        }

        const { requiredLat, requiredLng, locationTolerance } = coordinates;

        if (requiredLat === null || requiredLng === null || locationTolerance === null) {
            console.error('Invalid coordinates configuration');
            return false;
        }

        const latDiff = Math.abs(userLat - requiredLat);
        const lngDiff = Math.abs(userLng - requiredLng);

        console.log('Location validation:', {
            userLat,
            userLng,
            requiredLat,
            requiredLng,
            latDiff,
            lngDiff,
            tolerance: locationTolerance,
            isValid: latDiff <= locationTolerance && lngDiff <= locationTolerance
        });

        return latDiff <= locationTolerance && lngDiff <= locationTolerance;
    }, [coordinates, coordinatesLoaded]);

    const handleCheckIn = useCallback(async () => {
        try {
            setNotification({ show: false, type: '', message: '' });

            if (!coordinatesLoaded) {
                showNotification('warning', 'Office location not loaded. Please refresh the page.');
                return;
            }

            const location = await getCurrentLocation();

            if (!validateLocation(location.latitude, location.longitude)) {
                showNotification('warning', t('MSG.mustBeAtOfficeLocation'));
                return;
            }

            setSubmitting(true);
            const gpsString = `${location.latitude},${location.longitude}`;
          const formData = new FormData();
          formData.append("check_in_gps",gpsString);

            const response = await postFormData('/api/employee-tracker', formData);
            console.log('Check-in response:', response);

            if (response && (response.tracker.id || response.tracker)) {
                const id = response.tracker.id ;
                setTrackerId(id);
                console.log('Check-in successful, tracker ID:', id);
                showNotification('success', t('MSG.checkInSuccess'));
                await fetchEmployeeStatus();
            } else {
                console.error('Check-in failed - no valid response:', response);
                showNotification('warning', t('MSG.failedToProcessRequest'));
            }
        } catch (error) {
            console.error('Check-in error:', error);
            showNotification('warning', `${t('MSG.error')}: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [coordinatesLoaded, getCurrentLocation, validateLocation, showNotification, t, fetchEmployeeStatus]);

    const handleCheckOut = useCallback(async () => {
        try {
            setNotification({ show: false, type: '', message: '' });

            if (!coordinatesLoaded) {
                showNotification('warning', 'Office location not loaded. Please refresh the page.');
                return;
            }
            // Enhanced tracker ID validation
            if (!trackerId) {
                console.error('No tracker ID available for check-out');
                showNotification('warning', t('MSG.noTrackerIdFound'));

                // Try to refresh status to get tracker ID
                console.log('Attempting to refresh status to get tracker ID...');
                await fetchEmployeeStatus();

                // Check again after refresh
                if (!trackerId) {
                    showNotification('warning', 'Unable to find check-in record. Please refresh the page.');
                    return;
                }
            }

            const location = await getCurrentLocation();

            if (!validateLocation(location.latitude, location.longitude)) {
                showNotification('warning', t('MSG.mustBeAtOfficeLocation'));
                return;
            }

            setSubmitting(true);

            const gpsString = `${location.latitude},${location.longitude}`;
            const payload = {
                check_out_gps: gpsString,
                tracker_id: trackerId,
                check_out: true // Add this field
            };

            console.log('Check-out payload:', payload);
            console.log('Check-out URL:', `/api/employee-tracker/${trackerId}`);

            const response = await put(`/api/employee-tracker/${trackerId}`, payload);
            console.log('Check-out response:', response);

            // More flexible response validation
            if (response && (response.id || response.tracker_id || response.trackerId || response.success || response.message === 'success')) {
                console.log('Check-out successful');
                showNotification('success', t('MSG.checkOutSuccess'));
                await fetchEmployeeStatus();
            } else {
                console.error('Check-out failed - invalid response:', response);
                showNotification('warning', t('MSG.failedToProcessRequest'));
            }
        } catch (error) {
            console.error('Check-out error:', error);
            showNotification('warning', `${t('MSG.error')}: ${error.message}`);
        } finally {
            setSubmitting(false);
        }
    }, [coordinatesLoaded, trackerId, getCurrentLocation, validateLocation, showNotification, t, fetchEmployeeStatus]);

    const closePopup = () => {
        setShowCompletedPopup(false);
    };

    // Component for Action Buttons (to avoid duplication)
    const ActionButtons = () => (
        <div className="row g-2 g-sm-3 g-md-4 mb-3 mb-sm-4">
            <div className="col-12 col-sm-6">
                <CButton
                    color="primary"
                    className="w-100 py-3 py-sm-3"
                    onClick={handleCheckIn}
                    disabled={status.checkIn || submitting || locationLoading || !coordinatesLoaded}
                    style={{ fontSize: '1rem', fontWeight: 'bold' }}
                >
                    {submitting ? (
                        <>
                            <CSpinner size="sm" className="me-2" />
                            <span className="d-none d-sm-inline">{t('LABELS.processing')}</span>
                            <span className="d-inline d-sm-none">...</span>
                        </>
                    ) : (
                        t('LABELS.checkIn')
                    )}
                </CButton>
            </div>
            <div className="col-12 col-sm-6">
                <CButton
                    color="success"
                    className="w-100 py-3 py-sm-3"
                    onClick={handleCheckOut}
                    disabled={!status.checkIn || status.checkOut || submitting || locationLoading || !coordinatesLoaded}
                    style={{ fontSize: '1rem', fontWeight: 'bold' }}
                >
                    {submitting ? (
                        <>
                            <CSpinner size="sm" className="me-2" />
                            <span className="d-none d-sm-inline">{t('LABELS.processing')}</span>
                            <span className="d-inline d-sm-none">...</span>
                        </>
                    ) : (
                        t('LABELS.checkOut')
                    )}
                </CButton>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <CSpinner color="primary" size="lg" />
            </div>
        );
    }

    return (
        <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: '#f8f9fa' }}>
            <CContainer fluid className="flex-grow-1 d-flex align-items-center justify-content-center py-2 py-sm-3 py-md-4">
                <CRow className="w-100 h-100">
                    <CCol xs={12} sm={11} md={10} lg={8} xl={6} xxl={5} className="mx-auto d-flex align-items-center">
                        <div className="w-100">

                            {/* Notifications */}
                            {notification.show && (
                                <CAlert
                                    color={notification.type}
                                    dismissible
                                    onClose={() => setNotification({ show: false, type: '', message: '' })}
                                    className="mb-2 mb-sm-3"
                                >
                                    <div className="d-flex align-items-center">
                                        <div className="flex-grow-1" style={{ fontSize: '0.9rem' }}>
                                            {notification.message}
                                        </div>
                                    </div>
                                </CAlert>
                            )}

                            {/* Main Card */}
                            <CCard className="shadow-lg border-0" style={{ minHeight: 'auto' }}>
                                <CCardHeader
                                    className="py-3 py-sm-4"
                                    style={{
                                        backgroundColor: "#E6E6FA",
                                        borderBottom: '3px solid #6c757d'
                                    }}
                                >
                                    <div className="d-flex align-items-center">
                                        <CIcon icon={cilClock} className="me-2 me-sm-3" size="lg" />
                                        <div>
                                            <h4 className="mb-1 fw-bold fs-5 fs-sm-4">{t('LABELS.employeeAttendance')}</h4>
                                            <p className="text-muted mb-0 d-none d-sm-block small">{t('LABELS.checkInOutSecurely')}</p>
                                        </div>
                                    </div>
                                </CCardHeader>

                                <CCardBody className="p-3 p-sm-4">
                                    {/* Layout for Large Screens (md and up) */}
                                    <div className="d-none d-md-block">
                                        {/* 1. Current Status Section - First */}
                                        <div className="mb-4 mb-sm-5">
                                            <h5 className="mb-3 mb-sm-4 text-muted fw-bold fs-6">{t('LABELS.currentStatus')}</h5>
                                            <div className="border-start border-primary border-4 ps-3 ps-sm-4 py-3" style={{ backgroundColor: '#f8f9fa' }}>
                                                <div className="d-flex align-items-center justify-content-between mb-3 mb-sm-4">
                                                    <div className="d-flex align-items-center flex-grow-1">
                                                        <CIcon
                                                            icon={status.checkIn ? cilCheckCircle : cilXCircle}
                                                            className={`me-2 me-sm-3 ${status.checkIn ? 'text-success' : 'text-muted'}`}
                                                            size="lg"
                                                        />
                                                        <h6 className="mb-0 fs-6">{t('LABELS.checkIn')}</h6>
                                                    </div>
                                                    <CBadge
                                                        color={status.checkIn ? 'success' : 'secondary'}
                                                        className="px-2 px-sm-3 py-1 py-sm-2"
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        {status.checkIn ? t('LABELS.completed') : t('LABELS.pending')}
                                                    </CBadge>
                                                </div>

                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center flex-grow-1">
                                                        <CIcon
                                                            icon={status.checkOut ? cilCheckCircle : cilXCircle}
                                                            className={`me-2 me-sm-3 ${status.checkOut ? 'text-success' : 'text-muted'}`}
                                                            size="lg"
                                                        />
                                                        <h6 className="mb-0 fs-6">{t('LABELS.checkOut')}</h6>
                                                    </div>
                                                    <CBadge
                                                        color={status.checkOut ? 'success' : 'secondary'}
                                                        className="px-2 px-sm-3 py-1 py-sm-2"
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        {status.checkOut ? t('LABELS.completed') : t('LABELS.pending')}
                                                    </CBadge>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Action Buttons - Second */}
                                        <div className="mb-4 mb-sm-5">
                                            <h5 className="mb-3 mb-sm-4 text-muted fw-bold fs-6">{t('LABELS.quickActions')}</h5>
                                            <ActionButtons />
                                        </div>

                                        {/* 3. Actions Section - Third */}
                                        <div className="mb-4 mb-sm-5">
                                            <h5 className="mb-3 mb-sm-4 text-muted fw-bold fs-6">{t('LABELS.actions')}</h5>

                                            {/* Location Status */}
                                            <div className="mb-3 mb-sm-4 p-3 p-sm-4 rounded-3 border-start border-info border-4" style={{ backgroundColor: '#e7f3ff' }}>
                                                <div className="d-flex align-items-center">
                                                    <CIcon icon={cilLocationPin} className="me-2 me-sm-3 text-primary" size="lg" />
                                                    <div className="flex-grow-1">
                                                        <h6 className="mb-1 fs-6">
                                                            {locationLoading ? t('MSG.gettingLocation') : t('MSG.locationVerificationRequired')}
                                                        </h6>
                                                        {locationLoading && (
                                                            <div className="d-flex align-items-center">
                                                                <CSpinner size="sm" className="text-primary me-2" />
                                                                <small className="text-muted">Please wait...</small>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Security Notice */}
                                            {/* <div className="p-3 p-sm-4 rounded-3 border-start border-success border-4" style={{ backgroundColor: '#e8f5e8' }}>
                                                <div className="d-flex align-items-center">
                                                    <div className="bg-success rounded-circle me-2 me-sm-3 flex-shrink-0" style={{ width: '12px', height: '12px' }}></div>
                                                    <h6 className="mb-0 text-success fs-6">
                                                        {t('MSG.allTransactionsSecure')}
                                                    </h6>
                                                </div>
                                            </div> */}
                                        </div>
                                    </div>

                                    {/* Layout for Mobile and Small Screens (sm and below) */}
                                    <div className="d-block d-md-none">
                                        {/* Current Status Section */}
                                        <div className="mb-4 mb-sm-5">
                                            <h5 className="mb-3 mb-sm-4 text-muted fw-bold fs-6">{t('LABELS.currentStatus')}</h5>
                                            <div className="border-start border-primary border-4 ps-3 ps-sm-4 py-3" style={{ backgroundColor: '#f8f9fa' }}>
                                                <div className="d-flex align-items-center justify-content-between mb-3 mb-sm-4">
                                                    <div className="d-flex align-items-center flex-grow-1">
                                                        <CIcon
                                                            icon={status.checkIn ? cilCheckCircle : cilXCircle}
                                                            className={`me-2 me-sm-3 ${status.checkIn ? 'text-success' : 'text-muted'}`}
                                                            size="lg"
                                                        />
                                                        <h6 className="mb-0 fs-6">{t('LABELS.checkIn')}</h6>
                                                    </div>
                                                    <CBadge
                                                        color={status.checkIn ? 'success' : 'secondary'}
                                                        className="px-2 px-sm-3 py-1 py-sm-2"
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        {status.checkIn ? t('LABELS.completed') : t('LABELS.pending')}
                                                    </CBadge>
                                                </div>

                                                <div className="d-flex align-items-center justify-content-between">
                                                    <div className="d-flex align-items-center flex-grow-1">
                                                        <CIcon
                                                            icon={status.checkOut ? cilCheckCircle : cilXCircle}
                                                            className={`me-2 me-sm-3 ${status.checkOut ? 'text-success' : 'text-muted'}`}
                                                            size="lg"
                                                        />
                                                        <h6 className="mb-0 fs-6">{t('LABELS.checkOut')}</h6>
                                                    </div>
                                                    <CBadge
                                                        color={status.checkOut ? 'success' : 'secondary'}
                                                        className="px-2 px-sm-3 py-1 py-sm-2"
                                                        style={{ fontSize: '0.75rem' }}
                                                    >
                                                        {status.checkOut ? t('LABELS.completed') : t('LABELS.pending')}
                                                    </CBadge>
                                                </div>
                                            </div>
                                        </div>

                                        <hr className="my-3 my-sm-4" style={{ borderTop: '2px solid #dee2e6' }} />

                                        <h5 className="mb-3 mb-sm-4 text-muted fw-bold fs-6">{t('LABELS.actions')}</h5>

                                        {/* Location Status */}
                                        <div className="mb-3 mb-sm-4 p-3 p-sm-4 rounded-3 border-start border-info border-4" style={{ backgroundColor: '#e7f3ff' }}>
                                            <div className="d-flex align-items-center">
                                                <CIcon icon={cilLocationPin} className="me-2 me-sm-3 text-primary" size="lg" />
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-1 fs-6">
                                                        {locationLoading ? t('MSG.gettingLocation') : t('MSG.locationVerificationRequired')}
                                                    </h6>
                                                    {locationLoading && (
                                                        <div className="d-flex align-items-center">
                                                            <CSpinner size="sm" className="text-primary me-2" />
                                                            <small className="text-muted">Please wait...</small>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons for Mobile */}
                                        <ActionButtons />

                                        {/* Security Notice */}
                                        {/* <div className="p-3 p-sm-4 rounded-3 border-start border-success border-4" style={{ backgroundColor: '#e8f5e8' }}>
                                            <div className="d-flex align-items-center">
                                                <div className="bg-success rounded-circle me-2 me-sm-3 flex-shrink-0" style={{ width: '12px', height: '12px' }}></div>
                                                <h6 className="mb-0 text-success fs-6">
                                                    {t('MSG.allTransactionsSecure')}
                                                </h6>
                                            </div>
                                        </div> */}
                                    </div>
                                </CCardBody>
                            </CCard>
                        </div>
                    </CCol>
                </CRow>
            </CContainer>

            {/* Completed Popup Modal */}
            {showCompletedPopup && (
                <div
                    className="modal fade show d-block"
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    tabIndex="-1"
                >
                    <div className="modal-dialog modal-dialog-centered mx-3 mx-sm-auto">
                        <div className="modal-content">
                            <div className="modal-body text-center p-4 p-sm-5">
                                <CIcon
                                    icon={cilCheckCircle}
                                    className="text-success mb-3 mb-sm-4"
                                    style={{ fontSize: '3rem' }}
                                />
                                <h4 className="mb-2 mb-sm-3 fw-bold fs-5 fs-sm-4">{t('LABELS.allSet')}</h4>
                                <p className="text-muted mb-3 mb-sm-4 fs-6">
                                    {t('MSG.dailyCheckInOutCompleted')}
                                </p>
                                <CButton
                                    color="primary"
                                    onClick={closePopup}
                                    className="w-100 py-3"
                                    style={{ fontSize: '1rem', fontWeight: 'bold' }}
                                >
                                    {t('LABELS.ok')}
                                </CButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EmployeeCheckInOut;
