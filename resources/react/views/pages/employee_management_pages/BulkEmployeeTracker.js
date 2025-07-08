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

// Constants for better maintainability
const COORDINATE_LIMITS = {
    LONGITUDE: { min: -180, max: 180 },
    LATITUDE: { min: -90, max: 90 }
};

const TOLERANCE_TYPES = {
    METERS: 'meters',
    DECIMAL_DEGREES: 'decimal_degrees',
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

    // Enhanced tolerance options with better categorization
    const toleranceOptions = useMemo(() => [
        {
            value: '',
            label: t('LABELS.selectTolerance') || 'Select Tolerance',
            type: null
        },
        {
            value: 'preset_100',
            label: '100m (≈ 0.0009°)',
            type: TOLERANCE_TYPES.METERS,
            meters: 100,
            decimalDegrees: 0.0009
        },
        {
            value: 'preset_500',
            label: '500m (≈ 0.0045°)',
            type: TOLERANCE_TYPES.METERS,
            meters: 500,
            decimalDegrees: 0.0045
        },
        {
            value: 'preset_1000',
            label: '1km (≈ 0.009°)',
            type: TOLERANCE_TYPES.METERS,
            meters: 1000,
            decimalDegrees: 0.009
        },
        {
            value: 'custom',
            label: t('LABELS.customTolerance') || 'Custom Tolerance',
            type: TOLERANCE_TYPES.DECIMAL_DEGREES
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

    // Calculate final tolerance value
    const getFinalToleranceValue = useCallback(() => {
        if (!selectedToleranceOption) return null;

        switch (selectedToleranceOption.type) {
            case TOLERANCE_TYPES.METERS:
                return selectedToleranceOption.decimalDegrees;
            case TOLERANCE_TYPES.DECIMAL_DEGREES:
                return parseFloat(formData.customTolerance) || 0;
            case TOLERANCE_TYPES.NO_LIMIT:
                return 999;
            default:
                return null;
        }
    }, [selectedToleranceOption, formData.customTolerance]);

    // Enhanced notification system
    const showNotification = useCallback((type, message, autoHide = true) => {
        setNotification({ show: true, type, message, autoHide });

        if (autoHide && type === 'success') {
            setTimeout(() => {
                setNotification(prev => ({ ...prev, show: false }));
            }, 4000);
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
                } else if (customTol > 1) {
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

    // Enhanced form submission with better error handling
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            showNotification('danger', t('MSG.pleaseCorrectErrors') || 'Please correct the errors below', false);
            return;
        }

        const finalToleranceValue = getFinalToleranceValue();
        if (finalToleranceValue === null) {
            showNotification('danger', t('MSG.invalidTolerance') || 'Invalid tolerance configuration', false);
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

            if (response.success) {
                showNotification('success', t('MSG.coordinatesStoredSuccess') || 'Coordinates stored successfully');
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
                showNotification('danger',
                    response.message || t('MSG.failedToStoreCoordinates') || 'Failed to store coordinates',
                    false
                );
            }
        } catch (error) {
            console.error('Error storing coordinates:', error);
            showNotification('danger',
                `${t('MSG.error') || 'Error'}: ${error.message || 'An unexpected error occurred'}`,
                false
            );
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, getFinalToleranceValue, selectedToleranceOption, t, showNotification]);

    // Get current location (optional feature)
    const getCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            showNotification('warning', t('MSG.geolocationNotSupported') || 'Geolocation is not supported by this browser', false);
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
                showNotification('success', t('MSG.locationDetected') || 'Current location detected');
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
                showNotification('danger', errorMessage, false);
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
                            {notification.message}
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
                                <CCol md={selectedToleranceOption?.type === TOLERANCE_TYPES.DECIMAL_DEGREES ? 6 : 12}>
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

                                {selectedToleranceOption?.type === TOLERANCE_TYPES.DECIMAL_DEGREES && (
                                    <CCol md={6}>
                                        <CFormLabel htmlFor="customTolerance">
                                            {t('LABELS.customToleranceValue') || 'Custom Tolerance (decimal degrees)'} <span className="text-danger">*</span>
                                        </CFormLabel>
                                        <CInputGroup>
                                            <CFormInput
                                                type="number"
                                                id="customTolerance"
                                                placeholder="0.001"
                                                value={formData.customTolerance}
                                                onChange={(e) => handleInputChange('customTolerance', e.target.value)}
                                                invalid={!!errors.customTolerance}
                                                step="0.000001"
                                                min="0"
                                                max="1"
                                            />
                                            <CInputGroupText>°</CInputGroupText>
                                        </CInputGroup>
                                        {errors.customTolerance && (
                                            <CFormFeedback invalid className="d-block">
                                                {errors.customTolerance}
                                            </CFormFeedback>
                                        )}
                                        <small className="text-muted">
                                            {t('LABELS.customToleranceHelp') || 'Tip: 0.001° ≈ 100m, 0.0001° ≈ 10m'}
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
