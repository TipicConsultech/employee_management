import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CRow,
    CSpinner,
    CAlert,
    CModal,
    CModalBody,
    CModalHeader,
    CModalTitle,
    CModalFooter,
    CFormInput,
    CFormLabel,
    CContainer,
    CBadge
} from '@coreui/react';
import { useTranslation } from 'react-i18next';
import { postFormData, getAPICall } from '../../../util/api';

function CheckInCheckOut() {
    // Add translation hook
    const { t } = useTranslation("global");

    const [loading, setLoading] = useState(false);
    const [statusLoading, setStatusLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [cameraModal, setCameraModal] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [compressedImage, setCompressedImage] = useState(null);
    const [actionType, setActionType] = useState(''); // 'checkin' or 'checkout'
    const [employeeStatus, setEmployeeStatus] = useState({ checkIn: false, checkout: false });
    const [gpsCoordinates, setGpsCoordinates] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [trackerId, setTrackerId] = useState(null);
    const [completionModal, setCompletionModal] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    // Memoized helper function for showing notifications
    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        if (type === 'success') {
            setTimeout(() => {
                setNotification({ show: false, type: '', message: '' });
            }, 3000);
        }
    }, []);

    // Get GPS coordinates
    const getCurrentLocation = useCallback(() => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            setGpsLoading(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    setGpsCoordinates(coords);
                    setGpsLoading(false);
                    resolve(coords);
                },
                (error) => {
                    setGpsLoading(false);
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );
        });
    }, []);

    // Fetch employee status
    const fetchEmployeeStatus = useCallback(async () => {
        try {
            setStatusLoading(true);
            const response = await getAPICall('/api/employee-tracker/status');
            if (response && typeof response.checkIn !== 'undefined' && typeof response.checkOut !== 'undefined') {
                setEmployeeStatus({
                    checkIn: response.checkIn,
                    checkout: response.checkOut
                });
                if(response.tracker_id){
                    setTrackerId(response.tracker_id);
                }
                
                // Check for completion scenario after setting status
                if (response.checkIn && response.checkOut) {
                    setCompletionModal(true);
                }
            }
        } catch (error) {
            console.error('Error fetching employee status:', error);
            showNotification('danger', t('MSG.errorFetchingStatus') || 'Error fetching status');
        } finally {
            setStatusLoading(false);
        }
    }, [showNotification, t]);

    // Image compression function - Modified to return File object
    const compressImage = useCallback((file, quality = 0.7, maxWidth = 800, maxHeight = 600) => {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => {
                    // Convert blob to File object with JPEG type
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

    // Start camera function
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user', // Front camera preferred
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
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

    // Stop camera function
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    // Capture photo function
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

                // Compress the image and convert to File
                const compressedFile = await compressImage(blob);
                setCompressedImage(compressedFile);

                showNotification('success', t('MSG.photoCapturepd') || 'Photo captured successfully');
            }
        }, 'image/jpeg', 0.8);
    }, [compressImage, showNotification, t]);

    // Handle file upload (fallback for devices without camera)
    const handleFileUpload = useCallback(async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
        if (!allowedTypes.includes(file.type)) {
            showNotification('danger', t('MSG.invalidFileType') || 'Please upload a valid image file');
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showNotification('danger', t('MSG.fileTooLarge') || 'File size should be less than 10MB');
            return;
        }

        setCapturedImage(URL.createObjectURL(file));

        // Compress the image and convert to File
        const compressedFile = await compressImage(file);
        setCompressedImage(compressedFile);

        showNotification('success', t('MSG.imageUploaded') || 'Image uploaded successfully');
    }, [compressImage, showNotification, t]);

    // Submit check-in/check-out - Updated to handle the new response structure
    const handleSubmit = useCallback(async () => {
        if (!compressedImage) {
            showNotification('warning', t('MSG.pleaseUploadImage') || 'Please capture or upload an image');
            return;
        }

        setLoading(true);
        try {
            // Get current GPS coordinates
            let currentCoords = gpsCoordinates;
            if (!currentCoords) {
                try {
                    currentCoords = await getCurrentLocation();
                } catch (gpsError) {
                    console.error('GPS Error:', gpsError);
                    showNotification('warning', 'Could not get GPS coordinates. Using default location.');
                    // Use default coordinates if GPS fails
                    currentCoords = { latitude: 18.5597952, longitude: 73.8033664 };
                }
            }

            const formData = new FormData();
            
            // Send GPS coordinates as combined string with correct field name based on action type
            if (actionType === 'checkin') {
                formData.append('check_in_gps', `${currentCoords.latitude},${currentCoords.longitude}`);
                formData.append('checkin_img', compressedImage);
            } else {
                formData.append('check_out_gps', `${currentCoords.latitude},${currentCoords.longitude}`);
                formData.append('checkout_img', compressedImage);
            }

            let endpoint;
            if (actionType === 'checkin') {
                endpoint = '/api/employee-tracker';
            } else {
                // For checkout, use the tracker_id in the endpoint
                endpoint = `/api/employee-tracker/${trackerId}`;
            }

            const response = await postFormData(endpoint, formData);

            // Updated response handling to match the new structure
            // Check if response has tracker and message (successful response structure)
            if (response && (response.tracker || response.message)) {
                // Show success notification with the message from response
                const successMessage = response.message || 
                    (actionType === 'checkin' 
                        ? t('MSG.checkinSuccess') || 'Check-in successful'
                        : t('MSG.checkoutSuccess') || 'Check-out successful');

                showNotification('success', successMessage);

                // Reset form state
                setCapturedImage(null);
                setCompressedImage(null);
                setGpsCoordinates(null);

                // Stop camera immediately after successful submission
                stopCamera();

                // Close modal immediately after successful submission
                setCameraModal(false);

                // Update tracker ID if received in response
                if (response.tracker && response.tracker.id) {
                    setTrackerId(response.tracker.id);
                }

                // Refresh employee status after a short delay to ensure UI updates properly
                setTimeout(async () => {
                    await fetchEmployeeStatus();
                }, 500);
            } else {
                // Handle error response
                const errorMessage = response?.message || 
                    response?.error || 
                    t('MSG.operationFailed') || 
                    'Operation failed';
                showNotification('danger', errorMessage);
            }
        } catch (error) {
            console.error('Error submitting:', error);
            
            // Handle different types of errors
            let errorMessage = t('MSG.error') || 'Error';
            
            if (error.response && error.response.data) {
                // If it's an API error with response data
                errorMessage = error.response.data.message || 
                    error.response.data.error || 
                    `${errorMessage}: ${error.message}`;
            } else if (error.message) {
                errorMessage = `${errorMessage}: ${error.message}`;
            }
            
            showNotification('danger', errorMessage);
        } finally {
            setLoading(false);
        }
    }, [compressedImage, actionType, gpsCoordinates, getCurrentLocation, showNotification, t, stopCamera, fetchEmployeeStatus, trackerId]);

    // Open camera modal with validation
    const openCameraModal = useCallback((type) => {
        const { checkIn, checkout } = employeeStatus;
        
        // Validation logic for opening camera modal
        if (type === 'checkin' && checkIn) {
            showNotification('warning', t('MSG.alreadyCheckedIn') || 'You have already checked in today');
            return;
        }
        
        if (type === 'checkout' && !checkIn) {
            showNotification('warning', t('MSG.checkInFirst') || 'Please check in first before checking out');
            return;
        }
        
        if (type === 'checkout' && checkout) {
            showNotification('warning', t('MSG.alreadyCheckedOut') || 'You have already checked out today');
            return;
        }

        setActionType(type);
        setCameraModal(true);
        setCapturedImage(null);
        setCompressedImage(null);
        setGpsCoordinates(null);
        // Get GPS coordinates when modal opens
        getCurrentLocation().catch(error => {
            console.error('Error getting GPS:', error);
            showNotification('warning', 'Could not get GPS coordinates. Will use default location.');
        });
    }, [employeeStatus, getCurrentLocation, showNotification, t]);

    // Close camera modal
    const closeCameraModal = useCallback(() => {
        setCameraModal(false);
        stopCamera();
        setCapturedImage(null);
        setCompressedImage(null);
        setGpsCoordinates(null);
    }, [stopCamera]);

    // Effect for starting camera when modal opens
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

    // Effect for fetching employee status on component mount
    useEffect(() => {
        fetchEmployeeStatus();
    }, [fetchEmployeeStatus]);

    // Get current time
    const getCurrentTime = () => {
        return new Date().toLocaleString();
    };

    // Get button states based on employee status - Enhanced validation
    const getButtonStates = () => {
        const { checkIn, checkout } = employeeStatus;

        return {
            // Scenario 1: Both false - only check-in active
            checkInDisabled: checkIn, // Disabled if already checked in
            checkInActive: !checkIn, // Active only if not checked in
            
            // Scenario 2: checkIn true, checkout false - only check-out active
            checkOutDisabled: !checkIn || checkout, // Disabled if not checked in or already checked out
            checkOutActive: checkIn && !checkout, // Active only if checked in but not checked out
            
            // Scenario 3: Both true - show completion message
            bothCompleted: checkIn && checkout
        };
    };

    const buttonStates = getButtonStates();

    return (
        <CContainer fluid className="py-4">
            <CRow className="justify-content-center">
                <CCol xs={12} md={8} lg={6}>
                    <CCard className="mb-4 shadow-sm">
                        <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
                            <div className="d-flex justify-content-between align-items-center flex-wrap">
                                <strong>{t('LABELS.checkInCheckOut') || 'Check-In / Check-Out'}</strong>
                                <CBadge color="info">{getCurrentTime()}</CBadge>
                            </div>
                        </CCardHeader>

                        {/* Notifications - Fixed to use proper CoreUI alert colors */}
                        {notification.show && (
                            <CAlert
                                color={notification.type === 'success' ? 'success' : notification.type}
                                dismissible
                                onClose={() => setNotification({ show: false, type: '', message: '' })}
                            >
                                {notification.message}
                            </CAlert>
                        )}

                        <CCardBody>
                            {statusLoading ? (
                                <div className="text-center py-4">
                                    <CSpinner color="primary" />
                                    <p className="mt-2">{t('MSG.loadingStatus') || 'Loading status...'}</p>
                                </div>
                            ) : (
                                <>
                                    {/* Status Display */}
                                    <div className="mb-4 p-3 bg-light rounded">
                                        <h6 className="mb-2">{t('LABELS.currentStatus') || 'Current Status'}:</h6>
                                        <div className="d-flex gap-2 flex-wrap">
                                            <CBadge
                                                color={employeeStatus.checkIn ? 'success' : 'secondary'}
                                                className="py-1 px-2"
                                            >
                                                {t('LABELS.checkIn') || 'Check-In'}: {employeeStatus.checkIn ?
                                                    (t('LABELS.completed') || 'Completed') :
                                                    (t('LABELS.pending') || 'Pending')
                                                }
                                            </CBadge>
                                            <CBadge
                                                color={employeeStatus.checkout ? 'success' : 'secondary'}
                                                className="py-1 px-2"
                                            >
                                                {t('LABELS.checkOut') || 'Check-Out'}: {employeeStatus.checkout ?
                                                    (t('LABELS.completed') || 'Completed') :
                                                    (t('LABELS.pending') || 'Pending')
                                                }
                                            </CBadge>
                                        </div>
                                        {trackerId && (
                                            <div className="mt-2">
                                                <CBadge color="primary" className="py-1 px-2">
                                                    Tracker ID: {trackerId}
                                                </CBadge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Complete Status Message - Scenario 3 */}
                                    {buttonStates.bothCompleted && (
                                        <div className="mb-4 p-3 bg-success bg-opacity-10 rounded border border-success">
                                            <div className="text-success text-center">
                                                <h6 className="mb-0">
                                                    ✅ {t('MSG.dailyCheckInCheckOutCompleted') || 'Today\'s check-in and check-out already completed. Thank you!'}
                                                </h6>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons - Scenarios 1 & 2 */}
                                    {!buttonStates.bothCompleted && (
                                        <div className="d-grid gap-3">
                                            {/* Check-In Button - Active in Scenario 1 */}
                                            <CButton
                                                color={buttonStates.checkInActive ? "success" : "secondary"}
                                                size="lg"
                                                onClick={() => openCameraModal('checkin')}
                                                disabled={loading || buttonStates.checkInDisabled}
                                                className="py-3"
                                            >
                                                {loading && actionType === 'checkin' && <CSpinner size="sm" className="me-2" />}
                                                📸 {t('LABELS.checkIn') || 'Check In'}
                                                {buttonStates.checkInDisabled && (
                                                    <small className="d-block mt-1 opacity-75">
                                                        {t('MSG.alreadyCheckedIn') || 'Already checked in'}
                                                    </small>
                                                )}
                                            </CButton>

                                            {/* Check-Out Button - Active in Scenario 2 */}
                                            <CButton
                                                color={buttonStates.checkOutActive ? "danger" : "secondary"}
                                                size="lg"
                                                onClick={() => openCameraModal('checkout')}
                                                disabled={loading || buttonStates.checkOutDisabled}
                                                className="py-3"
                                            >
                                                {loading && actionType === 'checkout' && <CSpinner size="sm" className="me-2" />}
                                                📸 {t('LABELS.checkOut') || 'Check Out'}
                                                {buttonStates.checkOutDisabled && (
                                                    <small className="d-block mt-1 opacity-75">
                                                        {!employeeStatus.checkIn ?
                                                            (t('MSG.checkInFirst') || 'Check in first') :
                                                            (t('MSG.alreadyCheckedOut') || 'Already checked out')
                                                        }
                                                    </small>
                                                )}
                                            </CButton>
                                        </div>
                                    )}

                                    {/* Current Scenario Information */}
                                    <div className="mt-4 p-3 bg-warning bg-opacity-10 rounded">
                                        <h6 className="text-warning mb-2">
                                            {t('LABELS.currentScenario') || 'Current Scenario'}:
                                        </h6>
                                        <p className="mb-0 small">
                                            {!employeeStatus.checkIn && !employeeStatus.checkout && 
                                                (t('MSG.scenario1') || 'Scenario 1: Ready for check-in')
                                            }
                                            {employeeStatus.checkIn && !employeeStatus.checkout && 
                                                (t('MSG.scenario2') || 'Scenario 2: Checked in, ready for check-out')
                                            }
                                            {employeeStatus.checkIn && employeeStatus.checkout && 
                                                (t('MSG.scenario3') || 'Scenario 3: Both check-in and check-out completed')
                                            }
                                        </p>
                                    </div>

                                    {/* Instructions */}
                                    <div className="mt-4 p-3 bg-info bg-opacity-10 rounded">
                                        <h6 className="text-info mb-2">
                                            {t('LABELS.instructions') || 'Instructions'}:
                                        </h6>
                                        <ul className="mb-0 small">
                                            <li>{t('MSG.takeSelfieCameraOnly') || 'Take a selfie using your camera only'}</li>
                                            <li>{t('MSG.ensureGoodLighting') || 'Ensure good lighting for clear photo'}</li>
                                            <li>{t('MSG.imageAutoCompressed') || 'Image will be automatically compressed'}</li>
                                            <li>{t('MSG.cameraAccessRequired') || 'Camera access is required for this feature'}</li>
                                            <li>{t('MSG.cameraAccessReleased') || 'Camera access will be released after photo submission'}</li>
                                            <li>GPS location will be automatically captured for attendance</li>
                                        </ul>
                                    </div>
                                </>
                            )}
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Camera Modal */}
            <CModal
                visible={cameraModal}
                onClose={closeCameraModal}
                size="lg"
                alignment="center"
            >
                <CModalHeader>
                    <CModalTitle>
                        {actionType === 'checkin'
                            ? t('LABELS.checkInPhoto') || 'Check-In Photo'
                            : t('LABELS.checkOutPhoto') || 'Check-Out Photo'
                        }
                    </CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <div className="text-center">
                        {/* GPS Status */}
                        {gpsLoading && (
                            <div className="mb-2">
                                <CSpinner size="sm" /> Getting GPS coordinates...
                            </div>
                        )}
                        {gpsCoordinates && (
                            <div className="mb-2 text-success small">
                                📍 Location: {gpsCoordinates.latitude.toFixed(6)}, {gpsCoordinates.longitude.toFixed(6)}
                            </div>
                        )}

                        {!capturedImage ? (
                            <div>
                                {/* Camera View */}
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

                                {/* Capture Button */}
                                <CButton
                                    color="primary"
                                    size="lg"
                                    onClick={capturePhoto}
                                    className="mb-3"
                                >
                                    📷 {t('LABELS.capturePhoto') || 'Capture Photo'}
                                </CButton>
                            </div>
                        ) : (
                            <div>
                                {/* Preview Captured Image */}
                                <div className="mb-3">
                                    <img
                                        src={capturedImage}
                                        alt="Captured"
                                        className="img-fluid rounded"
                                        style={{ maxHeight: '400px', objectFit: 'cover' }}
                                    />
                                </div>

                                {/* Action Buttons */}
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
                                    <CButton
                                        color="success"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading && <CSpinner size="sm" className="me-2" />}
                                        {actionType === 'checkin'
                                            ? t('LABELS.submitCheckIn') || 'Submit Check-In'
                                            : t('LABELS.submitCheckOut') || 'Submit Check-Out'
                                        }
                                    </CButton>
                                </div>
                            </div>
                        )}
                    </div>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={closeCameraModal}>
                        {t('LABELS.cancel') || 'Cancel'}
                    </CButton>
                </CModalFooter>
            </CModal>

            {/* Completion Modal for Scenario 3 */}
            <CModal
                visible={completionModal}
                onClose={() => setCompletionModal(false)}
                size="md"
                alignment="center"
            >
                <CModalHeader>
                    <CModalTitle>
                        ✅ {t('LABELS.attendanceComplete') || 'Attendance Complete'}
                    </CModalTitle>
                </CModalHeader>
                <CModalBody>
                    <div className="text-center">
                        <div className="mb-3">
                            <div className="text-success" style={{ fontSize: '3rem' }}>
                                ✅
                            </div>
                        </div>
                        <h5 className="text-success mb-3">
                            {t('MSG.todaysAttendanceComplete') || 'Today\'s Check-in and Check-out Already Completed'}
                        </h5>
                        <p className="text-muted">
                            {t('MSG.thankYouMessage') || 'Thank you for maintaining your attendance record!'}
                        </p>
                        {trackerId && (
                            <div className="mt-3">
                                <CBadge color="primary" className="py-2 px-3">
                                    Tracker ID: {trackerId}
                                </CBadge>
                            </div>
                        )}
                    </div>
                </CModalBody>
                <CModalFooter>
                    <CButton color="primary" onClick={() => setCompletionModal(false)}>
                        {t('LABELS.ok') || 'OK'}
                    </CButton>
                </CModalFooter>
            </CModal>
        </CContainer>
    );
}

export default CheckInCheckOut;