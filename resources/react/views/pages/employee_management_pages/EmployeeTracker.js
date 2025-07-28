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
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilClock, cilLocationPin, cilCheckCircle, cilXCircle } from '@coreui/icons';
import { getAPICall, postFormData, put } from '../../../util/api';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../common/toast/ToastContext';

function EmployeeCheckInOut() {
    const { showToast } = useToast();
    const { t } = useTranslation("global");

    const [status, setStatus] = useState({ checkIn: false, checkOut: false, company_gps: '', tolerance: '', under_30min: false });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [showCompletedPopup, setShowCompletedPopup] = useState(false);
    const [showUnder30MinPopup, setShowUnder30MinPopup] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [trackerId, setTrackerId] = useState(null);
    const [coordinatesLoaded, setCoordinatesLoaded] = useState(false);

    // Notification helper
    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        if (type === 'success') {
            setTimeout(() => {
                setNotification({ show: false, type: '', message: '' });
            }, 3000);
        }
    }, []);

    // Fetch employee status and company coordinates
    const fetchEmployeeStatus = useCallback(async () => {
        console.log('Fetching employee status...');
        try {
            setLoading(true);
            const response = await getAPICall('/api/employee-tracker/status');
            if (response) {
                console.log('Employee status response:', response);

                // Only update state if data has changed to prevent re-renders
                setStatus(prevStatus => {
                    const newStatus = {
                        checkIn: response.checkIn ?? prevStatus.checkIn,
                        checkOut: response.checkOut ?? prevStatus.checkOut,
                        company_gps: response.company_gps ?? prevStatus.company_gps,
                        tolerance: response.tolerance ?? prevStatus.tolerance,
                        under_30min: response.under_30min ?? prevStatus.under_30min
                    };
                    if (
                        newStatus.checkIn !== prevStatus.checkIn ||
                        newStatus.checkOut !== prevStatus.checkOut ||
                        newStatus.company_gps !== prevStatus.company_gps ||
                        newStatus.tolerance !== prevStatus.tolerance ||
                        newStatus.under_30min !== prevStatus.under_30min
                    ) {
                        return newStatus;
                    }
                    return prevStatus;
                });

                const id = response.id || response.tracker_id || response.trackerId;
                if (id && id !== trackerId) {
                    setTrackerId(id);
                    console.log('Tracker ID set to:', id);
                }

                if (response.checkIn && response.checkOut) {
                    setShowCompletedPopup(true);
                }

                if (response.company_gps && response.tolerance) {
                    setCoordinatesLoaded(true);
                } else {
                    console.error('No company GPS or tolerance found in response');
                    showToast('warning', t('MSG.failedToFetchStatus') || 'Failed to load office location settings');
                }
            } else {
                console.error('No response from status API');
                showToast('warning', t('MSG.failedToFetchStatus') || 'Failed to fetch status');
            }
        } catch (error) {
            console.error('Error fetching employee status:', error);
            showToast('warning', `${t('MSG.errorConnectingToServer')}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [showToast, t, trackerId]);

    // Get fresh GPS coordinates
    const getCurrentLocationFresh = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error(t('MSG.geolocationNotSupported') || 'Geolocation is not supported by this browser'));
                return;
            }

            console.log('🔄 Fetching fresh GPS location...');
            setLocationLoading(true);

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationLoading(false);
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        timestamp: Date.now()
                    };
                    console.log('📍 Fresh location obtained:', coords);
                    resolve(coords);
                },
                (error) => {
                    setLocationLoading(false);
                    console.error('❌ GPS Error:', error);
                    let errorMessage = t('MSG.locationError') || 'Could not verify your location. ';
                    if (error.code === 1) {
                        errorMessage += 'Location access denied. Please allow location access and try again.';
                    } else if (error.code === 2) {
                        errorMessage += 'Location unavailable. Please check your GPS settings.';
                    } else if (error.code === 3) {
                        errorMessage += 'Location request timeout. Please try again.';
                    } else {
                        errorMessage += error.message || 'Please try again.';
                    }
                    showToast('warning', errorMessage);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        });
    }, [t, showToast]);

    // Calculate distance using Haversine formula
    const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance;
    }, []);

    // Handle check-in or check-out submission
    const handleCheckoutSubmit = useCallback(async (coords) => {
        setSubmitting(true);
        try {
            const gpsString = `${coords.latitude},${coords.longitude}`;
            let response;

            if (!trackerId) {
                console.error('No tracker ID available for check-out');
                showToast('warning', t('MSG.noTrackerIdFound') || 'No check-in record found. Please refresh the page.');
                await fetchEmployeeStatus();
                if (!trackerId) {
                    showToast('warning', t('MSG.noTrackerIdFound') || 'Unable to find check-in record.');
                    return;
                }
            }
            const payload = {
                check_out_gps: gpsString,
                tracker_id: trackerId,
                check_out: true
            };
            response = await put(`/api/employee-tracker/${trackerId}`, payload);

            console.log('Checkout response:', response);

            if (response && (response.tracker || response.id || response.tracker_id || response.trackerId || response.success || response.message === 'success')) {
                showToast('success', t('MSG.checkOutSuccess') || 'Check-out successful');
                if (response.tracker && response.tracker.id) {
                    setTrackerId(response.tracker.id);
                }
                await fetchEmployeeStatus();
            } else {
                const errorMessage = response?.message || response?.error || t('MSG.operationFailed') || 'Operation failed';
                showToast('warning', errorMessage);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            let errorMessage = t('MSG.error') || 'Error';
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || error.response.data.error || `${errorMessage}: ${error.message}`;
            } else if (error.message) {
                errorMessage = `${errorMessage}: ${error.message}`;
            }
            showToast('warning', errorMessage);
        } finally {
            setSubmitting(false);
            setLocationLoading(false);
            setShowUnder30MinPopup(false);
        }
    }, [trackerId, showToast, t, fetchEmployeeStatus]);

    // Handle check-in/check-out
    const handleAction = useCallback(async (type) => {
        const { checkIn, checkOut, company_gps, tolerance, under_30min } = status;

        console.log('🚀 Action triggered:', type);
        console.log('📊 Status data:', { checkIn, checkOut, company_gps, tolerance, under_30min });

        // Validate check-in/check-out conditions
        if (type === 'checkin' && checkIn) {
            showToast('warning', t('MSG.alreadyCheckedIn') || 'Already checked in for today');
            return;
        }

        if (type === 'checkout' && !checkIn) {
            showToast('warning', t('MSG.checkInFirst') || 'Please check in first');
            return;
        }

        if (type === 'checkout' && checkOut) {
            showToast('warning', t('MSG.alreadyCheckedOut') || 'Already checked out for today');
            return;
        }

        // Validate company GPS and tolerance
        if (!company_gps || !tolerance) {
            showToast('danger', t('MSG.companyLocationNotConfigured') || 'Company location not configured');
            return;
        }

        try {
            setLocationLoading(true);
            // Get fresh location
            const coords = await getCurrentLocationFresh();

            // Parse company GPS coordinates
            const companyGpsArray = company_gps.split(',');
            if (companyGpsArray.length !== 2) {
                throw new Error('Invalid company GPS format');
            }

            const companyLat = parseFloat(companyGpsArray[0]);
            const companyLon = parseFloat(companyGpsArray[1]);
            const toleranceKm = parseFloat(tolerance);

            // Validate parsed values
            if (isNaN(companyLat) || isNaN(companyLon) || isNaN(toleranceKm)) {
                throw new Error('Invalid GPS or tolerance values');
            }

            console.log('📍 Current Location:', coords.latitude, coords.longitude);
            console.log('🏢 Company Location:', companyLat, companyLon);
            console.log('📏 Tolerance (km):', toleranceKm);

            // Calculate distance
            const distance = calculateDistance(coords.latitude, coords.longitude, companyLat, companyLon);
            const distanceInMeters = distance * 1000;
            const toleranceInMeters = toleranceKm * 1000; // Convert tolerance to meters

            console.log('📐 Distance:', distanceInMeters, 'meters');
            console.log('✅ Allowed Tolerance:', toleranceInMeters, 'meters');
            console.log('🎯 Within Range?', distanceInMeters <= toleranceInMeters);

            // Check if user is within tolerance
            if (distanceInMeters > toleranceInMeters) {
                let distance;
                if (distanceInMeters >= 1000) {
                    distance = `${(distanceInMeters / 1000).toFixed(2)} km`;
                } else {
                    distance = `${Math.round(distanceInMeters)} meters`;
                }

                const errorMessage = t('MSG.OutsideCompany', { distance }) ||
                    `You are outside company premises. You are ${distance} away from your office location. Please move closer to your workplace.`;
                showToast('warning', errorMessage);
                return;
            }

            console.log('✅ Location validation passed!');

            if (type === 'checkout' && under_30min) {
                setShowUnder30MinPopup(true);
                return;
            }

            setSubmitting(true);
            const gpsString = `${coords.latitude},${coords.longitude}`;
            let response;

            if (type === 'checkin') {
                const formData = new FormData();
                formData.append('check_in_gps', gpsString);
                response = await postFormData('/api/employee-tracker', formData);
            } else {
                await handleCheckoutSubmit(coords);
                return;
            }

            console.log(`${type} response:`, response);

            if (response && (response.tracker || response.id || response.tracker_id || response.trackerId || response.success || response.message === 'success')) {
                const successMessage = t('MSG.checkInSuccess') || 'Check-in successful';
                showToast('success', successMessage);

                if (response.tracker && response.tracker.id) {
                    setTrackerId(response.tracker.id);
                }

                await fetchEmployeeStatus();
            } else {
                const errorMessage = response?.message || response?.error || t('MSG.operationFailed') || 'Operation failed';
                showToast('warning', errorMessage);
            }
        } catch (error) {
            console.error(`${type} error:`, error);
            let errorMessage = t('MSG.error') || 'Error';
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || error.response.data.error || `${errorMessage}: ${error.message}`;
            } else if (error.message) {
                errorMessage = `${errorMessage}: ${error.message}`;
            }
            showToast('warning', errorMessage);
        } finally {
            if (type !== 'checkout' || !under_30min) {
                setSubmitting(false);
                setLocationLoading(false);
            }
        }
    }, [status, getCurrentLocationFresh, calculateDistance, showToast, t, fetchEmployeeStatus, trackerId, handleCheckoutSubmit]);

    // Load data on component mount only
    useEffect(() => {
        console.log('Initial fetchEmployeeStatus called');
        fetchEmployeeStatus();
        // Empty dependency array to run only once on mount
    }, []); // Removed fetchEmployeeStatus from dependencies

    // Component for Action Buttons
    const ActionButtons = () => (
        <div className="row g-2 g-sm-3 g-md-4 mb-3 mb-sm-4">
            <div className="col-12 col-sm-6">
                <CButton
                    color="primary"
                    className="w-100 py-3 py-sm-3"
                    onClick={() => handleAction('checkin')}
                    disabled={status.checkIn || submitting || locationLoading || !coordinatesLoaded}
                    style={{ fontSize: '1rem', fontWeight: 'bold' }}
                >
                    {submitting && !locationLoading ? (
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
                    onClick={() => handleAction('checkout')}
                    disabled={!status.checkIn || status.checkOut || submitting || locationLoading || !coordinatesLoaded}
                    style={{ fontSize: '1rem', fontWeight: 'bold' }}
                >
                    {submitting && !locationLoading ? (
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
            <CContainer fluid className="flex-grow-1 d-flex  justify-content-center py-2 py-sm-3 py-md-4">
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

                                        {/* Action Buttons */}
                                        <div className="mb-4 mb-sm-5">
                                            <h5 className="mb-3 mb-sm-4 text-muted fw-bold fs-6">{t('LABELS.quickActions')}</h5>
                                            <ActionButtons />
                                        </div>

                                        {/* Actions Section */}
                                        <div className="mb-4 mb-sm-5">
                                            <h5 className="mb-3 mb-sm-4 text-muted fw-bold fs-6">{t('LABELS.actions')}</h5>
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
                                        </div>
                                    </div>

                                    {/* Layout for Mobile and Small Screens */}
                                    <div className="d-block d-md-none">
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
                                        <ActionButtons />
                                    </div>
                                </CCardBody>
                            </CCard>
                        </div>
                    </CCol>
                </CRow>
            </CContainer>

            {/* Under 30 Minutes Confirmation Popup */}
            {showUnder30MinPopup && (
                <CModal visible={showUnder30MinPopup} onClose={() => setShowUnder30MinPopup(false)} alignment="center">
                    <CModalHeader>
                        <CModalTitle>{t('LABELS.confirmCheckout') || 'Confirm Check-Out'}</CModalTitle>
                    </CModalHeader>
                    <CModalBody>
                        <p className="text-muted fs-6">
                            {t('MSG.under30MinWarning') || 'Checking out now will mark your attendance as absent because your shift duration is less than 30 minutes. Do you want to proceed?'}
                        </p>
                    </CModalBody>
                    <CModalFooter>
                        <CButton 
                            color="secondary" 
                            onClick={() => setShowUnder30MinPopup(false)}
                        >
                            {t('LABELS.no') || 'No'}
                        </CButton>
                        <CButton 
                            color="primary" 
                            onClick={() => handleCheckoutSubmit({ latitude: status.latitude, longitude: status.longitude })}
                            disabled={submitting}
                        >
                            {submitting && <CSpinner size="sm" className="me-2" />}
                            {t('LABELS.yes') || 'Yes'}
                        </CButton>
                    </CModalFooter>
                </CModal>
            )}

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
                                    onClick={() => setShowCompletedPopup(false)}
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