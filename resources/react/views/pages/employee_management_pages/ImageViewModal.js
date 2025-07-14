import React from 'react';
import {
    CModal,
    CModalHeader,
    CModalTitle,
    CModalBody,
    CModalFooter,
    CButton,
    CSpinner,
    CAlert
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilX, cilWarning } from '@coreui/icons';
import { useTranslation } from 'react-i18next';

const ImageViewModal = ({
    isOpen,
    onClose,
    imageUrl,
    title = "Image View",
    employeeName = "",
    imageType = "" // "Check-in" or "Check-out"
}) => {
    // Add translation hook
    const { t } = useTranslation("global");

    const [imageLoading, setImageLoading] = React.useState(true);
    const [imageError, setImageError] = React.useState(false);

    // Reset states when modal opens/closes or image changes
    React.useEffect(() => {
        if (isOpen && imageUrl) {
            setImageLoading(true);
            setImageError(false);
        }
    }, [isOpen, imageUrl]);

    const handleImageLoad = () => {
        setImageLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setImageLoading(false);
        setImageError(true);
    };

    const isImageAvailable = imageUrl && imageUrl.trim() !== '';

    return (
        <CModal
            visible={isOpen}
            onClose={onClose}
            size="lg"
            centered
            backdrop="static"
            keyboard={false}
        >
            <CModalHeader className="pb-2">
                <CModalTitle className="fs-5 fw-bold">
                    {title}
                    {employeeName && (
                        <span className="text-muted fs-6 fw-normal ms-2">
                            - {employeeName}
                        </span>
                    )}
                    {imageType && (
                        <span className="text-primary fs-6 fw-normal ms-2">
                            ({imageType})
                        </span>
                    )}
                </CModalTitle>
            </CModalHeader>

            <CModalBody className="p-3">
                {!isImageAvailable ? (
                    // Image not available
                    <div className="text-center py-5">
                        <CIcon
                            icon={cilWarning}
                            className="text-warning mb-3"
                            style={{ fontSize: '3rem' }}
                        />
                        <h5 className="text-muted mb-2">{t('MSG.imageNotAvailable')}</h5>
                        <p className="text-muted small">
                            {imageType ? `${imageType} ${t('MSG.imageNotAvailableForEmployee')}` : t('MSG.imageNotAvailableForEmployee')}
                        </p>
                    </div>
                ) : (
                    // Image available
                    <div className="position-relative">
                        {imageLoading && (
                            <div className="position-absolute top-50 start-50 translate-middle">
                                <CSpinner color="primary" size="lg" />
                            </div>
                        )}

                        {imageError ? (
                            <div className="text-center py-5">
                                <CIcon
                                    icon={cilWarning}
                                    className="text-danger mb-3"
                                    style={{ fontSize: '3rem' }}
                                />
                                <h5 className="text-muted mb-2">{t('MSG.failedToLoadImage')}</h5>
                                <p className="text-muted small">
                                    {t('MSG.unableToLoadImage')}
                                </p>
                                <CAlert color="danger" className="mt-3">
                                    <small><strong>{t('LABELS.url')}:</strong> {imageUrl}</small>
                                </CAlert>
                            </div>
                        ) : (
                            <div className="text-center">
                                <img
                                    src={imageUrl}
                                    alt={`${imageType} ${t('MSG.imageFor')} ${employeeName}`}
                                    className="img-fluid rounded"
                                    style={{
                                        maxHeight: '70vh',
                                        maxWidth: '100%',
                                        objectFit: 'contain',
                                        display: imageLoading ? 'none' : 'block'
                                    }}
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />
                            </div>
                        )}
                    </div>
                )}
            </CModalBody>

            <CModalFooter className="pt-2">
                <CButton
                    color="secondary"
                    onClick={onClose}
                    className="px-4"
                >
                    <CIcon icon={cilX} className="me-2" />
                    {t('LABELS.close')}
                </CButton>
            </CModalFooter>
        </CModal>
    );
};

export default ImageViewModal;