import React, { useState, useCallback, useMemo } from 'react';
import {
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CForm,
    CFormInput,
    CFormLabel,
    CFormSelect,
    CRow,
    CSpinner,
    CAlert,
    CFormFeedback,
    CInputGroup,
    CInputGroupText,
    CTooltip
} from '@coreui/react';
import { post } from '../../../util/api';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../common/toast/ToastContext';

// Constants for better maintainability
const COORDINATE_LIMITS = {
    LONGITUDE: { min: -180, max: 180 },
    LATITUDE: { min: -90, max: 90 }
};

const TOLERANCE_TYPES = {
    METERS: 'meters',
    CUSTOM_METERS: 'custom_meters',
    NO_LIMIT: 'no_limit'
};

// Utility function to convert meters to decimal degrees (approximate)
const metersToDecimalDegrees = (meters, latitude = 0) => {
    // At the equator, 1 degree ≈ 111,320 meters
    // This varies with latitude, so we use cosine for longitude
    const latRadians = (latitude * Math.PI) / 180;
    const metersPerDegreeLat = 111320;
    const metersPerDegreeLng = 111320 * Math.cos(latRadians);

    return {
        latitude: meters / metersPerDegreeLat,
        longitude: meters / metersPerDegreeLng
    };
};

function StoreCoordinates() {
    const { t } = useTranslation("global");
    const { showToast } = useToast();


    const [formData, setFormData] = useState({
        longitude: '',
        latitude: '',
        toleranceType: '',
        toleranceValue: '',
        customTolerance: ''
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({
        show: false,
        type: '',
        message: '',
        autoHide: true
    });

    // Enhanced tolerance options with meter-based options
    const toleranceOptions = useMemo(() => [
        {
            value: '',
            label: t('LABELS.selectTolerance') || 'Select Tolerance',
            type: null
        },
        {
            value: 'preset_25',
            label: '25 meters',
            type: TOLERANCE_TYPES.METERS,
            meters: 25
        },
        {
            value: 'preset_50',
            label: '50 meters',
            type: TOLERANCE_TYPES.METERS,
            meters: 50
        },
        {
            value: 'preset_100',
            label: '100 meters',
            type: TOLERANCE_TYPES.METERS,
            meters: 100
        },
        {
            value: 'custom',
            label: t('LABELS.customTolerance') || 'Custom Tolerance',
            type: TOLERANCE_TYPES.CUSTOM_METERS
        },
        {
            value: 'no_limit',
            label: t('LABELS.noLimit') || 'No Limit',
            type: TOLERANCE_TYPES.NO_LIMIT,
            decimalDegrees: 999
        }
    ], [t]);

    // Get selected tolerance option
    const selectedToleranceOption = useMemo(() => {
        return toleranceOptions.find(opt => opt.value === formData.toleranceType);
    }, [formData.toleranceType, toleranceOptions]);

    // Calculate final tolerance value in decimal degrees
    const getFinalToleranceValue = useCallback(() => {
        if (!selectedToleranceOption) return null;

        const latitude = parseFloat(formData.latitude) || 0;

        switch (selectedToleranceOption.type) {
            case TOLERANCE_TYPES.METERS:
                // Convert preset meter values to decimal degrees
                const presetConversion = metersToDecimalDegrees(selectedToleranceOption.meters, latitude);
                return presetConversion.latitude; // Use latitude conversion as it's more conservative
            case TOLERANCE_TYPES.CUSTOM_METERS:
                // Convert custom meter input to decimal degrees
                const customMeters = parseFloat(formData.customTolerance) || 0;
                const customConversion = metersToDecimalDegrees(customMeters, latitude);
                return customConversion.latitude; // Use latitude conversion as it's more conservative
            case TOLERANCE_TYPES.NO_LIMIT:
                return 999;
            default:
                return null;
        }
    }, [selectedToleranceOption, formData.customTolerance, formData.latitude]);

    // Enhanced notification system
    const showNotification = useCallback((type, message, autoHide = true) => {
        setNotification({ show: true, type, message, autoHide });

        if (autoHide && type === 'success') {
            setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
            }, 5000);
        }
    }, []);

    // Enhanced validation with more comprehensive checks
    const validateForm = useCallback(() => {
        const newErrors = {};

        // Longitude validation
        if (!formData.longitude.trim()) {
            newErrors.longitude = t('MSG.longitudeRequired') || 'Longitude is required';
        } else {
            const lng = parseFloat(formData.longitude);
            if (isNaN(lng)) {
                newErrors.longitude = t('MSG.longitudeInvalidFormat') || 'Longitude must be a valid number';
            } else if (lng < COORDINATE_LIMITS.LONGITUDE.min || lng > COORDINATE_LIMITS.LONGITUDE.max) {
                newErrors.longitude = t('MSG.longitudeInvalid') || `Longitude must be between ${COORDINATE_LIMITS.LONGITUDE.min} and ${COORDINATE_LIMITS.LONGITUDE.max}`;
            }
        }

        // Latitude validation
        if (!formData.latitude.trim()) {
            newErrors.latitude = t('MSG.latitudeRequired') || 'Latitude is required';
        } else {
            const lat = parseFloat(formData.latitude);
            if (isNaN(lat)) {
                newErrors.latitude = t('MSG.latitudeInvalidFormat') || 'Latitude must be a valid number';
            } else if (lat < COORDINATE_LIMITS.LATITUDE.min || lat > COORDINATE_LIMITS.LATITUDE.max) {
                newErrors.latitude = t('MSG.latitudeInvalid') || `Latitude must be between ${COORDINATE_LIMITS.LATITUDE.min} and ${COORDINATE_LIMITS.LATITUDE.max}`;
            }
        }

        // Tolerance validation
        if (!formData.toleranceType) {
            newErrors.toleranceType = t('MSG.toleranceRequired') || 'Tolerance selection is required';
        } else if (formData.toleranceType === 'custom') {
            if (!formData.customTolerance.trim()) {
                newErrors.customTolerance = t('MSG.customToleranceRequired') || 'Custom tolerance value is required';
            } else {
                const customTol = parseFloat(formData.customTolerance);
                if (isNaN(customTol)) {
                    newErrors.customTolerance = t('MSG.customToleranceInvalidFormat') || 'Custom tolerance must be a valid number';
                } else if (customTol <= 0) {
                    newErrors.customTolerance = t('MSG.customTolerancePositive') || 'Custom tolerance must be greater than 0';
                } else if (customTol > 100000) {
                    newErrors.customTolerance = t('MSG.customToleranceHigh') || 'Custom tolerance seems unusually high. Are you sure?';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData, t]);

    // Handle input changes with debounced validation
    const handleInputChange = useCallback((field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear related errors
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }

        // Clear custom tolerance when changing tolerance type
        if (field === 'toleranceType' && value !== 'custom') {
            setFormData(prev => ({
                ...prev,
                customTolerance: ''
            }));
            setErrors(prev => ({
                ...prev,
                customTolerance: ''
            }));
        }
    }, [errors]);

    // Enhanced form submission with better error handling and response messages
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            // showNotification('danger', t('MSG.pleaseCorrectErrors') || 'Please correct the errors below', false);
            showToast('danger', t('MSG.pleaseCorrectErrors') || 'Please correct the errors below', false);
            return;
        }

        const finalToleranceValue = getFinalToleranceValue();
        if (finalToleranceValue === null) {
            // showNotification('danger', t('MSG.invalidTolerance') || 'Invalid tolerance configuration', false);
             showToast('danger', t('MSG.invalidTolerance') || 'Invalid tolerance configuration', false);
            return;
        }

        try {
            setLoading(true);

            const payload = {
                longitude: parseFloat(formData.longitude),
                latitude: parseFloat(formData.latitude),
                tolerance: finalToleranceValue
            };

            const response = await post('/api/storeCordinates', payload);

            console.log('API Response:', response); // Debug log to see actual response structure

            // Handle successful response - check multiple possible success indicators
            const isSuccess = response.success === true ||
                             response.status === 'success' ||
                             response.success === 'true' ||
                             (!response.error && !response.errors && response.id) ||
                             (response.message && !response.error && !response.errors);

            if (isSuccess) {
                let successMessage = t('MSG.coordinatesStoredSuccess') || 'Coordinates stored successfully';

                // Check if ID is created and include it in success message
                if (response.id) {
                    successMessage = t('MSG.coordinatesStoredWithId') ||
                        `Coordinates stored successfully `;
                }

                // Include any additional success details from response
                if (response.message && !response.message.toLowerCase().includes('error') && !response.message.toLowerCase().includes('fail')) {
                    successMessage += `. ${response.message}`;
                }

                // showNotification('success', successMessage, true);
                showToast('success', successMessage, true);

                // Reset form on success
                setFormData({
                    longitude: '',
                    latitude: '',
                    toleranceType: '',
                    toleranceValue: '',
                    customTolerance: ''
                });
                setErrors({});
            } else {
                // Handle failure response
                let errorMessage = t('MSG.failedToStoreCoordinates') || 'Failed to store coordinates';

                // Use specific error message from response if available
                if (response.message) {
                    errorMessage = response.message;
                } else if (response.error) {
                    errorMessage = response.error;
                } else if (response.msg) {
                    errorMessage = response.msg;
                }

                // Handle validation errors from server
                if (response.errors && Array.isArray(response.errors)) {
                    errorMessage += ': ' + response.errors.join(', ');
                } else if (response.errors && typeof response.errors === 'object') {
                    const serverErrors = Object.values(response.errors).flat().join(', ');
                    errorMessage += ': ' + serverErrors;
                }

                // showNotification('danger', errorMessage, false);
                showToast('danger', errorMessage, false);
            }
        } catch (error) {
            console.error('Error storing coordinates:', error);

            // Handle different types of errors
            let errorMessage = t('MSG.error') || 'Error';

            if (error.response) {
                // Server responded with error status
                if (error.response.data && error.response.data.message) {
                    errorMessage = error.response.data.message;
                } else if (error.response.data && error.response.data.error) {
                    errorMessage = error.response.data.error;
                } else {
                    errorMessage = `${errorMessage}: ${error.response.status} - ${error.response.statusText}`;
                }
            } else if (error.request) {
                // Network error
                errorMessage = t('MSG.networkError') || 'Network error: Please check your connection';
            } else {
                // Other error
                errorMessage = `${errorMessage}: ${error.message || 'An unexpected error occurred'}`;
            }

            // showNotification('danger', errorMessage, false);
            showToast('danger', errorMessage, false);
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, getFinalToleranceValue, selectedToleranceOption, t, showNotification]);

    // Get current location (optional feature)
    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            // showNotification('warning', t('MSG.geolocationNotSupported') || 'Geolocation is not supported by this browser', false);
             showToast('warning', t('MSG.geolocationNotSupported') || 'Geolocation is not supported by this browser', false);
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData(prev => ({
                    ...prev,
                    longitude: position.coords.longitude.toString(),
                    latitude: position.coords.latitude.toString()
                }));
                setLoading(false);
                // showNotification('success', t('MSG.locationDetected') || 'Current location detected');
                showToast('success', t('MSG.locationDetected') || 'Current location detected');
            },
            (error) => {
                setLoading(false);
                let errorMessage = t('MSG.locationError') || 'Failed to get current location';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = t('MSG.locationPermissionDenied') || 'Location access denied by user';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = t('MSG.locationUnavailable') || 'Location information is unavailable';
                        break;
                    case error.TIMEOUT:
                        errorMessage = t('MSG.locationTimeout') || 'Location request timed out';
                        break;
                }
                // showNotification('danger', errorMessage, false);
                showToast('danger', errorMessage, false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, [showNotification, t]);

    return (
        <CRow>
            <CCol xs={12}>
                <CCard className="mb-4 shadow-sm">
                    <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
                        <div className="d-flex justify-content-between align-items-center flex-wrap">
                            <strong>{t('LABELS.storeCoordinates') || 'Store Coordinates'}</strong>
                            <CButton
                                color="info"
                                variant="outline"
                                size="sm"
                                onClick={getCurrentLocation}
                                disabled={loading}
                            >
                                📍 {t('LABELS.useCurrentLocation') || 'Use Current Location'}
                            </CButton>
                        </div>
                    </CCardHeader>

                    {/* Enhanced Notifications */}
                    {notification.show && (
                        <CAlert
                            color={notification.type}
                            dismissible={notification.autoHide}
                            onClose={() => setNotification(prev => ({ ...prev, show: false }))}
                            className="mb-0"
                        >
                            <div dangerouslySetInnerHTML={{ __html: notification.message }} />
                        </CAlert>
                    )}

                    <CCardBody>
                        <CForm onSubmit={handleSubmit}>
                            <CRow className="mb-3">
                                <CCol md={6}>
                                    <CFormLabel htmlFor="longitude">
                                        {t('LABELS.longitude') || 'Longitude'} <span className="text-danger">*</span>
                                    </CFormLabel>
                                    <CInputGroup>
                                        <CFormInput
                                            type="number"
                                            id="longitude"
                                            placeholder={t('PLACEHOLDERS.enterLongitude') || 'Enter longitude (-180 to 180)'}
                                            value={formData.longitude}
                                            onChange={(e) => handleInputChange('longitude', e.target.value)}
                                            invalid={!!errors.longitude}
                                            step="any"
                                            min="-180"
                                            max="180"
                                        />
                                        <CInputGroupText>°</CInputGroupText>
                                    </CInputGroup>
                                    {errors.longitude && (
                                        <CFormFeedback invalid className="d-block">
                                            {errors.longitude}
                                        </CFormFeedback>
                                    )}
                                </CCol>
                                <CCol md={6}>
                                    <CFormLabel htmlFor="latitude">
                                        {t('LABELS.latitude') || 'Latitude'} <span className="text-danger">*</span>
                                    </CFormLabel>
                                    <CInputGroup>
                                        <CFormInput
                                            type="number"
                                            id="latitude"
                                            placeholder={t('PLACEHOLDERS.enterLatitude') || 'Enter latitude (-90 to 90)'}
                                            value={formData.latitude}
                                            onChange={(e) => handleInputChange('latitude', e.target.value)}
                                            invalid={!!errors.latitude}
                                            step="any"
                                            min="-90"
                                            max="90"
                                        />
                                        <CInputGroupText>°</CInputGroupText>
                                    </CInputGroup>
                                    {errors.latitude && (
                                        <CFormFeedback invalid className="d-block">
                                            {errors.latitude}
                                        </CFormFeedback>
                                    )}
                                </CCol>
                            </CRow>

                            <CRow className="mb-3">
                                <CCol md={selectedToleranceOption?.type === TOLERANCE_TYPES.CUSTOM_METERS ? 6 : 12}>
                                    <CFormLabel htmlFor="toleranceType">
                                        {t('LABELS.tolerance') || 'Tolerance'} <span className="text-danger">*</span>
                                    </CFormLabel>
                                    <CFormSelect
                                        id="toleranceType"
                                        value={formData.toleranceType}
                                        onChange={(e) => handleInputChange('toleranceType', e.target.value)}
                                        invalid={!!errors.toleranceType}
                                    >
                                        {toleranceOptions.map((option, index) => (
                                            <option key={index} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </CFormSelect>
                                    {errors.toleranceType && (
                                        <CFormFeedback invalid className="d-block">
                                            {errors.toleranceType}
                                        </CFormFeedback>
                                    )}
                                </CCol>

                                {selectedToleranceOption?.type === TOLERANCE_TYPES.CUSTOM_METERS && (
                                    <CCol md={6}>
                                        <CFormLabel htmlFor="customTolerance">
                                            {t('LABELS.customToleranceValue') || 'Custom Tolerance (meters)'} <span className="text-danger">*</span>
                                        </CFormLabel>
                                        <CInputGroup>
                                            <CFormInput
                                                type="number"
                                                id="customTolerance"
                                                placeholder="100"
                                                value={formData.customTolerance}
                                                onChange={(e) => handleInputChange('customTolerance', e.target.value)}
                                                invalid={!!errors.customTolerance}
                                                step="1"
                                                min="1"
                                                max="100000"
                                            />
                                            <CInputGroupText>m</CInputGroupText>
                                        </CInputGroup>
                                        {errors.customTolerance && (
                                            <CFormFeedback invalid className="d-block">
                                                {errors.customTolerance}
                                            </CFormFeedback>
                                        )}
                                        <small className="text-muted">
                                            {t('LABELS.customToleranceHelp') || 'Enter tolerance distance in meters (e.g., 25, 50, 100)'}
                                        </small>
                                    </CCol>
                                )}
                            </CRow>

                            {/* Tolerance Preview */}
                            {selectedToleranceOption && getFinalToleranceValue() !== null && (
                                <CRow className="mb-3">
                                    <CCol>
                                        <div className="p-3 bg-light rounded">
                                            <strong>{t('LABELS.tolerancePreview') || 'Tolerance Preview'}:</strong>
                                            <br />
                                            <span className="text-muted">
                                                {selectedToleranceOption.type === TOLERANCE_TYPES.NO_LIMIT ? (
                                                    t('LABELS.noLimitDescription') || 'No geographical limits will be applied'
                                                ) : selectedToleranceOption.type === TOLERANCE_TYPES.METERS ? (
                                                    `${selectedToleranceOption.meters} meters (≈ ${getFinalToleranceValue().toFixed(6)}° decimal degrees)`
                                                ) : selectedToleranceOption.type === TOLERANCE_TYPES.CUSTOM_METERS ? (
                                                    `${formData.customTolerance} meters (≈ ${getFinalToleranceValue().toFixed(6)}° decimal degrees)`
                                                ) : (
                                                    `${getFinalToleranceValue()}° ${t('LABELS.decimalDegrees') || 'decimal degrees'}`
                                                )}
                                            </span>
                                        </div>
                                    </CCol>
                                </CRow>
                            )}

                            <CRow>
                                <CCol className="d-flex gap-2">
                                    <CButton
                                        type="submit"
                                        color="primary"
                                        disabled={loading}
                                        className="px-4"
                                    >
                                        {loading ? (
                                            <>
                                                <CSpinner size="sm" className="me-2" />
                                                {t('LABELS.submitting') || 'Submitting...'}
                                            </>
                                        ) : (
                                            t('LABELS.submit') || 'Submit'
                                        )}
                                    </CButton>

                                    <CButton
                                        type="button"
                                        color="secondary"
                                        variant="outline"
                                        onClick={() => {
                                            setFormData({
                                                longitude: '',
                                                latitude: '',
                                                toleranceType: '',
                                                toleranceValue: '',
                                                customTolerance: ''
                                            });
                                            setErrors({});
                                            setNotification({ show: false, type: '', message: '', autoHide: true });
                                        }}
                                    >
                                        {t('LABELS.reset') || 'Reset'}
                                    </CButton>
                                </CCol>
                            </CRow>
                        </CForm>
                    </CCardBody>
                </CCard>
            </CCol>
        </CRow>
    );
}

export default StoreCoordinates;
