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

    // Fetch employee status
    const fetchEmployeeStatus = useCallback(async () => {
        try {
            setStatusLoading(true);
            const response = await getAPICall('/api/employee-tracker/status');
            if (response && typeof response.checkIn !== 'undefined' && typeof response.checkout !== 'undefined') {
                setEmployeeStatus({
                    checkIn: response.checkIn,
                    checkout: response.checkout
                });
            }
        } catch (error) {
            console.error('Error fetching employee status:', error);
            showNotification('danger', t('MSG.errorFetchingStatus') || 'Error fetching status');
        } finally {
            setStatusLoading(false);
        }
    }, [showNotification, t]);

    // Image compression function
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
                canvas.toBlob(resolve, 'image/jpeg', quality);
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

                // Compress the image
                const compressedBlob = await compressImage(blob);
                setCompressedImage(compressedBlob);

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

        // Compress the image
        const compressedBlob = await compressImage(file);
        setCompressedImage(compressedBlob);

        showNotification('success', t('MSG.imageUploaded') || 'Image uploaded successfully');
    }, [compressImage, showNotification, t]);

    // Submit check-in/check-out
    const handleSubmit = useCallback(async () => {
        if (!compressedImage) {
            showNotification('warning', t('MSG.pleaseUploadImage') || 'Please capture or upload an image');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', compressedImage, 'selfie.jpg');

            const endpoint = actionType === 'checkin'
                ? '/api/checkin'
                : '/api/checkout';
            const response = await postFormData(endpoint, formData);

            if (response.success) {
                showNotification('success',
                    actionType === 'checkin'
                        ? t('MSG.checkinSuccess') || 'Check-in successful'
                        : t('MSG.checkoutSuccess') || 'Check-out successful'
                );

                // Reset form and close modal
                setCapturedImage(null);
                setCompressedImage(null);
                setCameraModal(false);

                // Stop camera immediately after successful submission
                stopCamera();

                // Refresh employee status
                await fetchEmployeeStatus();
            } else {
                showNotification('danger', response.message || t('MSG.operationFailed') || 'Operation failed');
            }
        } catch (error) {
            console.error('Error submitting:', error);
            showNotification('danger', `${t('MSG.error') || 'Error'}: ${error.message}`);
        } finally {
            setLoading(false);
        }
    }, [compressedImage, actionType, showNotification, t, stopCamera, fetchEmployeeStatus]);

    // Open camera modal
    const openCameraModal = useCallback((type) => {
        setActionType(type);
        setCameraModal(true);
        setCapturedImage(null);
        setCompressedImage(null);
    }, []);

    // Close camera modal
    const closeCameraModal = useCallback(() => {
        setCameraModal(false);
        stopCamera();
        setCapturedImage(null);
        setCompressedImage(null);
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

    // Get button states based on employee status
    const getButtonStates = () => {
        const { checkIn, checkout } = employeeStatus;

        return {
            checkInDisabled: checkIn, // Disabled if already checked in
            checkOutDisabled: !checkIn || checkout, // Disabled if not checked in or already checked out
            bothCompleted: checkIn && checkout // Both actions completed
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

                        {/* Notifications */}
                        {notification.show && (
                            <CAlert
                                color={notification.type}
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
                                    </div>

                                    {/* Complete Status Message */}
                                    {buttonStates.bothCompleted && (
                                        <div className="mb-4 p-3 bg-success bg-opacity-10 rounded border border-success">
                                            <div className="text-success text-center">
                                                <h6 className="mb-0">
                                                    ✅ {t('MSG.dailyCheckInCheckOutCompleted') || 'Daily check-in and check-out completed successfully!'}
                                                </h6>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {!buttonStates.bothCompleted && (
                                        <div className="d-grid gap-3">
                                            <CButton
                                                color="success"
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

                                            <CButton
                                                color="danger"
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
        </CContainer>
    );
}

export default CheckInCheckOut;
