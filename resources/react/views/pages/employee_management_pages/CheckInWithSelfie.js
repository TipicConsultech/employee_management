import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    CModalBody,
    CModalHeader,
    CModalTitle,
    CModalFooter,
    CToast, 
    CToaster, 
    CToastBody
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilClock, cilLocationPin, cilCheckCircle, cilXCircle } from '@coreui/icons';
import { getAPICall, postFormData, put } from '../../../util/api';
import { useTranslation } from 'react-i18next';

function CheckInWithSelfie() {
    const { t } = useTranslation("global");

    // State management
    const [status, setStatus] = useState({ checkIn: false, checkOut: false });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [showCompletedPopup, setShowCompletedPopup] = useState(false);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [trackerId, setTrackerId] = useState(null);
    const [actionType, setActionType] = useState('');
    const [cameraModal, setCameraModal] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [compressedImage, setCompressedImage] = useState(null);
    const [gpsCoordinates, setGpsCoordinates] = useState(null);
  
    // Camera refs
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const toaster = useRef();

const toasterElement = (
    <CToaster ref={toaster} placement="top-end" />
);

    // Notification helper
    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        if (type === 'success') {
            setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
        }
    }, []);

    // Fetch employee status
    const fetchEmployeeStatus = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getAPICall('/api/employee-tracker/status');
            if (response) {
                setStatus(response);
                const id = response.id || response.tracker_id || response.trackerId;
                if (id) setTrackerId(id);
                if (response.checkIn && response.checkOut) {
                    setShowCompletedPopup(true);
                }
            }
        } catch (error) {
            console.error('Error fetching employee status:', error);
            showNotification('warning', `${t('MSG.errorConnectingToServer')}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [showNotification, t]);

    // Get GPS coordinates
const getCurrentLocationFresh = useCallback(() => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        console.log('🔄 Fetching fresh GPS location...');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
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
                console.error('❌ GPS Error:', error);
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,  // Increased timeout
                maximumAge: 0    // Force fresh location (no cache)
            }
        );
    });
}, []);

    // Image compression
    const compressImage = useCallback((file, quality = 0.7, maxWidth = 800, maxHeight = 600) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                let { width, height } = img;
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    const compressedFile = new File([blob], 'selfie.jpg', {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    resolve(compressedFile);
                }, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }, []);

    // Camera functions
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            showNotification('danger', t('MSG.cameraAccessError') || 'Camera access is required. Please allow camera access to continue.');
        }
    }, [showNotification, t]);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const capturePhoto = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(async (blob) => {
            if (blob) {
                setCapturedImage(URL.createObjectURL(blob));
                const compressedFile = await compressImage(blob);
                setCompressedImage(compressedFile);
                showNotification('success', t('MSG.photoCapturepd') || 'Photo captured successfully');
            }
        }, 'image/jpeg', 0.8);
    }, [compressImage, showNotification, t]);

    // Handle check-in/check-out submission
    const handleSubmit = useCallback(async () => {
        if (!compressedImage) {
            showNotification('warning', t('MSG.pleaseUploadImage') || 'Please capture or upload an image');
            return;
        }

        setSubmitting(true);
        try {
            let currentCoords = gpsCoordinates;
            if (!currentCoords) {
                try {
                    currentCoords = await getCurrentLocation();
                } catch (gpsError) {
                    console.error('GPS Error:', gpsError);
                    showNotification('warning', 'Could not get GPS coordinates. Using default location.');
                    currentCoords = { latitude: 18.5597952, longitude: 73.8033664 };
                }
            }

            const formData = new FormData();
            const gpsString = `${currentCoords.latitude},${currentCoords.longitude}`;

            if (actionType === 'checkin') {
                formData.append('check_in_gps', gpsString);
                formData.append('checkin_img', compressedImage);
            } else {
                formData.append('check_out_gps', gpsString);
                formData.append('checkout_img', compressedImage);
            }

            const endpoint = actionType === 'checkin' ? '/api/employee-tracker' : `/api/employee-tracker/${trackerId}`;
            const response = await postFormData(endpoint, formData);

            if (response && (response.tracker || response.message)) {
                const successMessage = response.message || 
                    (actionType === 'checkin' ? t('MSG.checkinSuccess') || 'Check-in successful' : t('MSG.checkoutSuccess') || 'Check-out successful');

                showNotification('success', successMessage);
                
                if (response.tracker && response.tracker.id) {
                    setTrackerId(response.tracker.id);
                }

                resetCameraState();
                setTimeout(() => fetchEmployeeStatus(), 500);
            } else {
                const errorMessage = response?.message || response?.error || t('MSG.operationFailed') || 'Operation failed';
                showNotification('danger', errorMessage);
            }
        } catch (error) {
            console.error('Error submitting:', error);
            let errorMessage = t('MSG.error') || 'Error';
            if (error.response && error.response.data) {
                errorMessage = error.response.data.message || error.response.data.error || `${errorMessage}: ${error.message}`;
            } else if (error.message) {
                errorMessage = `${errorMessage}: ${error.message}`;
            }
            showNotification('danger', errorMessage);
        } finally {
            setSubmitting(false);
        }
    }, [compressedImage, actionType, gpsCoordinates, getCurrentLocationFresh, showNotification, t, fetchEmployeeStatus, trackerId]);

    // Reset camera state
    const resetCameraState = useCallback(() => {
        setCapturedImage(null);
        setCompressedImage(null);
        setGpsCoordinates(null);
        stopCamera();
        setCameraModal(false);
    }, [stopCamera]);



const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
}, []);

    // Open camera modal
const openCameraModal = useCallback(async (type) => {
    const { checkIn, checkOut, company_gps, tolerance } = status;
    
    console.log('🚀 Button clicked for:', type);
    console.log('📊 Status data:', { checkIn, checkOut, company_gps, tolerance });
    
    // Validate check-in/check-out conditions
    if (type === 'checkin' && checkIn) {
        showNotification('warning', t('MSG.alreadyCheckedIn') || 'Already checked in for today');
        return;
    }
    
    if (type === 'checkout' && !checkIn) {
        showNotification('warning', t('MSG.checkInFirst') || 'Please check in first');
        return;
    }
    
    if (type === 'checkout' && checkOut) {
        showNotification('warning', t('MSG.alreadyCheckedOut') || 'Already checked out for today');
        return;
    }

    // Validate company GPS and tolerance data
    if (!company_gps || !tolerance) {
        showNotification('danger', t('MSG.companyLocationNotConfigured') || 'Company location not configured');
        return;
    }

    try {
        setLocationLoading(true);
        showNotification('info', t('MSG.gettingLocation') || 'Getting your current location...');
        
        // ALWAYS get fresh location - never use cached coordinates
        console.log('🔄 Starting fresh location fetch...');
        const coords = await getCurrentLocationFresh();
        
        // Update state with fresh coordinates
        setGpsCoordinates(coords);
        
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
        console.log('📏 Tolerance (degrees):', toleranceKm);
        console.log('⏰ Location Age: Fresh (just fetched)');
        
        // Calculate distance between current location and company location
        const distance = calculateDistance(coords.latitude, coords.longitude, companyLat, companyLon);
        const distanceInMeters = distance * 1000;
        
        // Convert tolerance from degrees to approximate meters (1 degree ≈ 111,320 meters)
        const toleranceInMeters = toleranceKm * 111320;
        
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
            
            const errorMessage = t('MSG.OutsideCompany',{distance}) || 
                `❌ You are outside company premises. You are ${distance} away from your office location. Please move closer to your workplace.`;
            
            console.log('❌ Location validation failed:', errorMessage);
            
            // Show toast notification
            if (toaster?.current) {
                toaster.current.add({
                    body: <CToastBody>{errorMessage}</CToastBody>,
                    autohide: 5000,
                });
            } else {
                showNotification('danger', errorMessage);
            }
            
            setLocationLoading(false);
            return;
        }
        
        console.log('✅ Location validation passed!');
        
        // Location validation passed - proceed with camera modal
        setActionType(type);
        setCameraModal(true);
        setCapturedImage(null);
        setCompressedImage(null);
        
        showNotification('success', t('MSG.locationVerified') || '✅ Location verified successfully');
        
    } catch (error) {
        console.error('❌ Error getting GPS or validating location:', error);
        
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
        
        showNotification('danger', errorMessage);
    } finally {
        setLocationLoading(false);
    }
}, [status, getCurrentLocationFresh, showNotification, t, toaster, calculateDistance]);

    // Effects
    useEffect(() => {
        fetchEmployeeStatus();
    }, [fetchEmployeeStatus]);

    useEffect(() => {
        if (cameraModal) {
            startCamera();
        }
        return () => {
            if (cameraModal) {
                stopCamera();
            }
        };
    }, [cameraModal, startCamera, stopCamera]);

    // Action Buttons Component
    const ActionButtons = () => (
        <div className="row g-2 g-sm-3 g-md-4 mb-3 mb-sm-4">
            <div className="col-12 col-sm-6">
                <CButton
                    color="primary"
                    className="w-100 py-3 py-sm-3"
                    onClick={() => openCameraModal('checkin')}
                    disabled={status.checkIn || submitting || locationLoading}
                    style={{ fontSize: '1rem', fontWeight: 'bold' }}
                >
                    {submitting && actionType === 'checkin' ? (
                        <>
                            <CSpinner size="sm" className="me-2" />
                            <span className="d-none d-sm-inline">{t('LABELS.processing')}</span>
                            <span className="d-inline d-sm-none">...</span>
                        </>
                    ) : (
                        <>{t('LABELS.checkIn')}</>
                    )}
                </CButton>
            </div>
            <div className="col-12 col-sm-6">
                <CButton
                    color="success"
                    className="w-100 py-3 py-sm-3"
                    onClick={() => openCameraModal('checkout')}
                    disabled={!status.checkIn || status.checkOut || submitting || locationLoading}
                    style={{ fontSize: '1rem', fontWeight: 'bold' }}
                >
                    {submitting && actionType === 'checkout' ? (
                        <>
                            <CSpinner size="sm" className="me-2" />
                            <span className="d-none d-sm-inline">{t('LABELS.processing')}</span>
                            <span className="d-inline d-sm-none">...</span>
                        </>
                    ) : (
                        <>{t('LABELS.checkOut')}</>
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
            {toasterElement}
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
                            <CCard className="shadow-lg border-0">
                                <CCardHeader
                                    className="py-3 py-sm-4"
                                    style={{ backgroundColor: "#E6E6FA", borderBottom: '3px solid #6c757d' }}
                                >
                                    <div className="d-flex align-items-center">
                                        <CIcon icon={cilClock} className="me-2 me-sm-3" size="lg" />
                                        <div>
                                            <h4 className="mb-1 fw-bold fs-5 fs-sm-4">{t('LABELS.checkInCheckOut') || 'Check-In / Check-Out'}</h4>
                                            <p className="text-muted mb-0 d-none d-sm-block small">{t('LABELS.checkInOutSecurely')}</p>
                                        </div>
                                    </div>
                                </CCardHeader>

                                <CCardBody className="p-3 p-sm-4">
                                    {/* Layout for Large Screens */}
                                    <div className="d-none d-md-block">
                                        {/* Current Status */}
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

                                    {/* Layout for Mobile */}
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

            {/* Camera Modal */}
            <CModal visible={cameraModal} onClose={resetCameraState} size="lg" alignment="center">
                <CModalHeader>
                    <CModalTitle>
                        {actionType === 'checkin' ? t('LABELS.checkInPhoto') || 'Check-In Photo' : t('LABELS.checkOutPhoto') || 'Check-Out Photo'}
                    </CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <div className="text-center">
                        {/* {gpsCoordinates && (
                            <div className="mb-2 text-success small">
                                📍 Location: {gpsCoordinates.latitude.toFixed(6)}, {gpsCoordinates.longitude.toFixed(6)}
                            </div>
                        )} */}

                        {!capturedImage ? (
                            <div>
                                <div className="position-relative mb-3">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        muted
                                        className="w-100 rounded"
                                        style={{ maxHeight: '400px', objectFit: 'cover' }}
                                    />
                                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                                </div>
                                <CButton color="primary" size="lg" onClick={capturePhoto} className="mb-3">
                                    📷 {t('LABELS.capturePhoto') || 'Capture Photo'}
                                </CButton>
                            </div>
                        ) : (
                            <div>
                                <div className="mb-3">
                                    <img
                                        src={capturedImage}
                                        alt="Captured"
                                        className="img-fluid rounded"
                                        style={{ maxHeight: '400px', objectFit: 'cover' }}
                                    />
                                </div>
                                <div className="d-flex gap-2 justify-content-center">
                                    <CButton
                                        color="secondary"
                                        onClick={() => {
                                            setCapturedImage(null);
                                            setCompressedImage(null);
                                            startCamera();
                                        }}
                                    >
                                        {t('LABELS.retake') || 'Retake'}
                                    </CButton>
                                    <CButton color="success" onClick={handleSubmit} disabled={submitting}>
                                        {submitting && <CSpinner size="sm" className="me-2" />}
                                        {actionType === 'checkin' ? t('LABELS.submitCheckIn') || 'Submit Check-In' : t('LABELS.submitCheckOut') || 'Submit Check-Out'}
                                    </CButton>
                                </div>
                            </div>
                        )}
                    </div>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={resetCameraState}>
                        {t('LABELS.cancel') || 'Cancel'}
                    </CButton>
                </CModalFooter>
            </CModal>

            {/* Completed Popup */}
            {showCompletedPopup && (
                <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                    <div className="modal-dialog modal-dialog-centered mx-3 mx-sm-auto">
                        <div className="modal-content">
                            <div className="modal-body text-center p-4 p-sm-5">
                                <CIcon icon={cilCheckCircle} className="text-success mb-3 mb-sm-4" style={{ fontSize: '3rem' }} />
                                <h4 className="mb-2 mb-sm-3 fw-bold fs-5 fs-sm-4">{t('LABELS.allSet')}</h4>
                                <p className="text-muted mb-3 mb-sm-4 fs-6">{t('MSG.dailyCheckInCheckOutCompleted')}</p>
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

export default CheckInWithSelfie;