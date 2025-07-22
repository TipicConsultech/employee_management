import React, { useState, useEffect, useCallback } from 'react';
import {
    CButton,
    CCard,
    CCardBody,
    CCardHeader,
    CCol,
    CFormSelect,
    CFormLabel,
    CRow,
    CTable,
    CTableBody,
    CTableDataCell,
    CTableHead,
    CTableHeaderCell,
    CTableRow,
    CSpinner,
    CAlert,
    CFormInput,
    CModal,
    CModalBody,
    CModalFooter,
    CModalHeader,
    CModalTitle
} from '@coreui/react';
import { getAPICall, postFormData } from '../../../util/api';
import { useTranslation } from 'react-i18next';
import CIcon from '@coreui/icons-react';
import { cilZoom, cilCloudUpload, cilX } from '@coreui/icons';
// import { cilZoom, cilCloudUpload, cilX } from '@coreui/icons';
import { useToast } from '../../common/toast/ToastContext';

function EmployeeDocumentUpload() {
    const { t } = useTranslation("global");
const { showToast } = useToast();
    const [employees, setEmployees] = useState([]);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [documentUploads, setDocumentUploads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [employeesLoading, setEmployeesLoading] = useState(true);
    const [documentTypesLoading, setDocumentTypesLoading] = useState(true);
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });
    const [uploading, setUploading] = useState(false);
    const [otherDocument, setOtherDocument] = useState({
        name: '',
        file: null,
        fileName: '',
        previewUrl: null
    });

    const [previewModal, setPreviewModal] = useState({
        visible: false,
        document: null,
        previewUrl: null,
        fileName: '',
        fileType: ''
    });

    const getStatusMessage = (statusCode, responseData = null) => {
        const statusMessages = {
            200: t('MSG.operationSuccess'),
            201: t('MSG.documentUploadedSuccess'),
            400: t('MSG.invalidRequest'),
            401: t('MSG.unauthorized'),
            403: t('MSG.accessDenied'),
            404: t('MSG.resourceNotFound'),
            409: t('MSG.documentExists'),
            413: t('MSG.fileTooLarge'),
            415: t('MSG.unsupportedFileType'),
            422: t('MSG.validationFailed'),
            500: t('MSG.serverError'),
            502: t('MSG.serverUnavailable'),
            503: t('MSG.serviceUnavailable')
        };

        if (responseData) {
            if (responseData.message) return responseData.message;
            if (responseData.error) return responseData.error;
            if (responseData.errors && Array.isArray(responseData.errors)) {
                return responseData.errors.join(', ');
            }
        }

        return statusMessages[statusCode] || t('MSG.unexpectedResponse', { status: statusCode });
    };

    const handleAPIResponse = (response, successMessage = t('MSG.operationSuccess')) => {
        if (!response) {
            // showNotification('danger', t('MSG.noResponse'));
             showToast('danger', t('MSG.noResponse'));
            return false;
        }

        if (response.status !== undefined) {
            const statusCode = response.status;
            if (statusCode >= 200 && statusCode < 300) {
                // showNotification('success', successMessage);
                 showToast('success', successMessage);
                return true;
            } else {
                const errorMessage = getStatusMessage(statusCode, response.data);
                // showNotification('danger', errorMessage);
                showToast('danger', errorMessage);
                return false;
            }
        }

        if (response.success !== undefined) {
            if (response.success === true) {
                // showNotification('success', response.message || successMessage);
                showToast('success', response.message || successMessage);
                return true;
            } else {
                const errorMessage = response.message || response.error || t('MSG.operationFailed');
                // showNotification('danger', errorMessage);
                 showToast('danger', errorMessage);
                return false;
            }
        }

        if (response.error !== undefined) {
            if (!response.error) {
                // showNotification('success', response.message || successMessage);
                 showToast('success', response.message || successMessage);
                return true;
            } else {
                const errorMessage = response.message || response.error || t('MSG.operationFailed');
                // showNotification('danger', errorMessage);
                showToast('danger', errorMessage);
                return false;
            }
        }

        if (response.data !== undefined) {
            // showNotification('success', successMessage);
            showToast('success', successMessage);
            return true;
        }

        if (Array.isArray(response)) {
            // showNotification('success', successMessage);
            showToast('success', successMessage);
            return true;
        }

        // showNotification('warning', t('MSG.responseUnclear'));
         showToast('warning', t('MSG.responseUnclear'));
        return false;
    };

    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        if (type === 'success') {
            setTimeout(() => {
                setNotification({ show: false, type: '', message: '' });
            }, 4000);
        }
    }, []);

    const fetchEmployees = useCallback(async () => {
        try {
            setEmployeesLoading(true);
            const response = await getAPICall('/api/employees');
            if (response && (response.data || Array.isArray(response))) {
                const employeesData = response.data || response;
                setEmployees(employeesData);

                if (employeesData.length === 0) {
                    // showNotification('info', t('MSG.noEmployeesFound'));
                    showToast('info', t('MSG.noEmployeesFound'));
                } else {
                    handleAPIResponse(response, t('MSG.employeesLoaded', { count: employeesData.length }));
                    showToast('success',t('MSG.employeesLoaded', { count: employeesData.length }));
                }
            } else {
                handleAPIResponse(response, t('MSG.failedToFetchEmployees'));
            }
        } catch (error) {
            // showNotification('danger', `${t('MSG.errorConnectingToServer')}: ${error.message}`);
            showToast('danger', `${t('MSG.errorConnectingToServer')}: ${error.message}`);
        } finally {
            setEmployeesLoading(false);
        }
    }, [showNotification, t]);

    const fetchDocumentTypes = useCallback(async () => {
        try {
            setDocumentTypesLoading(true);
            const response = await getAPICall('/api/document-type');
            if (response && (response.data || Array.isArray(response))) {
                const documentTypesData = response.data || response;
                setDocumentTypes(documentTypesData);

                if (documentTypesData.length === 0) {
                    // showNotification('info', t('MSG.noDocumentTypesFound'));
                     showToast('info', t('MSG.noDocumentTypesFound'));
                    setDocumentUploads([]);
                } else {
                    const documentRows = documentTypesData.map(type => ({
                        id: type.id,
                        documentType: type.id,
                        documentTypeName: type.document_name,
                        file: null,
                        fileName: '',
                        previewUrl: null
                    }));
                    setDocumentUploads(documentRows);
                   handleAPIResponse(response, t('MSG.documentTypesLoaded', { count: documentTypesData.length }));
                   showToast('success',t('MSG.documentTypesLoaded', { count: documentTypesData.length }));

                }
            } else {
                handleAPIResponse(response, t('MSG.failedToFetchDocumentTypes'));
            }
        } catch (error) {
            // showNotification('danger', `${t('MSG.errorConnectingToServer')}: ${error.message}`);
             showToast('danger', `${t('MSG.errorConnectingToServer')}: ${error.message}`);
        } finally {
            setDocumentTypesLoading(false);
        }
    }, [showNotification, t]);

    useEffect(() => {
        fetchEmployees();
        fetchDocumentTypes();
    }, [fetchEmployees, fetchDocumentTypes]);

    const handleFileUpload = (id, event) => {
        const file = event.target.files[0];
        if (file) {
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                // showNotification('warning', t('MSG.invalidFileType'));
                 showToast('warning', t('MSG.invalidFileType'));
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                // showNotification('warning', t('MSG.fileTooLarge'));
                showToast('warning', t('MSG.fileTooLarge'));
                return;
            }
            let previewUrl = null;
            if (file.type.startsWith('image/')) {
                previewUrl = URL.createObjectURL(file);
            }
            setDocumentUploads(documentUploads.map(doc =>
                doc.id === id ? {
                    ...doc,
                    file: file,
                    fileName: file.name,
                    previewUrl: previewUrl
                } : doc
            ));
            // showNotification('success', t('MSG.fileSelected', { fileName: file.name }));
             showToast('success', t('MSG.fileSelected', { fileName: file.name }));
        }
    };

    const previewDocument = (doc) => {
        if (!doc.file) {
            // showNotification('info', t('MSG.selectFileToPreview'));
            showToast('info', t('MSG.selectFileToPreview'));
            return;
        }
        let previewUrl = null;
        let fileType = doc.file.type;

        if (doc.file.type.startsWith('image/')) {
            previewUrl = doc.previewUrl || URL.createObjectURL(doc.file);
        } else if (doc.file.type === 'application/pdf') {
            previewUrl = URL.createObjectURL(doc.file);
        }
        if (previewUrl) {
            setPreviewModal({
                visible: true,
                document: doc,
                previewUrl: previewUrl,
                fileName: doc.fileName,
                fileType: fileType
            });
        } else {
            // showNotification('info', t('MSG.previewNotAvailable'));
             showToast('info', t('MSG.previewNotAvailable'));
        }
    };

    const closePreviewModal = () => {
        if (previewModal.previewUrl && previewModal.fileType === 'application/pdf') {
            URL.revokeObjectURL(previewModal.previewUrl);
        }
        setPreviewModal({
            visible: false,
            document: null,
            previewUrl: null,
            fileName: '',
            fileType: ''
        });
    };

    const uploadDocuments = async () => {
        if (!selectedEmployee) {
            // showNotification('warning', t('MSG.selectEmployee'));
            showToast('warning', t('MSG.selectEmployee'));
            return;
        }

        const uploadedDocs = documentUploads.filter(doc => doc.file);
        const hasOtherDoc = otherDocument.file && otherDocument.name.trim();

        if (uploadedDocs.length === 0 && !hasOtherDoc) {
            // showNotification('warning', t('MSG.uploadAtLeastOneDocument'));
             showToast('warning', t('MSG.uploadAtLeastOneDocument'));
            return;
        }

        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('employee_id', selectedEmployee);

            uploadedDocs.forEach(doc => {
                formData.append(doc.documentType.toString(), doc.file);
            });

            if (hasOtherDoc) {
                formData.append('custom_document_name', otherDocument.name.trim());
                formData.append('custom_document_file', otherDocument.file);
            }

            const response = await postFormData('/api/employee-details', formData);

            if (handleAPIResponse(response, t('MSG.documentsUploaded', { count: uploadedDocs.length + (hasOtherDoc ? 1 : 0) }))) {
                setSelectedEmployee('');
                setDocumentUploads(documentUploads.map(doc => ({
                    ...doc,
                    file: null,
                    fileName: '',
                    previewUrl: null
                })));
                setOtherDocument({
                    name: '',
                    file: null,
                    fileName: '',
                    previewUrl: null
                });
                const fileInputs = document.querySelectorAll('input[type="file"]');
                fileInputs.forEach(input => input.value = '');

                window.scrollTo({ top: 0, behavior: "smooth" });
            }
        } catch (error) {
            const msg = error.response
                ? getStatusMessage(error.response.status, error.response.data)
                : (error.request
                    ? t('MSG.networkError')
                    : t('MSG.errorUploadingDocuments', { error: error.message }));
            // showNotification('danger', msg);
            showToast('danger', msg);
        } finally {
            setUploading(false);
        }
    };

    const cancelUpload = () => {
        setSelectedEmployee('');
        setDocumentUploads(documentUploads.map(doc => ({
            ...doc,
            file: null,
            fileName: '',
            previewUrl: null
        })));
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => input.value = '');
        setNotification({ show: false, type: '', message: '' });
        // showNotification('info', t('MSG.formResetSuccess'));
        showToast('info', t('MSG.formResetSuccess'));
    };

    return (
        <>
            <CRow>
                <CCol xs={12}>
                    <CCard className="mb-4 shadow-sm">
                        <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
                            <div className="d-flex align-items-center">
                                <CIcon icon={cilCloudUpload} className="me-2" />
                                <strong>{t('LABELS.employeeDocumentUpload')}</strong>
                            </div>
                            <small className="text-muted">{t('LABELS.uploadDocumentsDescription')}</small>
                        </CCardHeader>

                        {notification.show && (
                            <CAlert
                                color={notification.type}
                                dismissible
                                onClose={() => setNotification({ show: false, type: '', message: '' })}
                                className="mb-0"
                            >
                                <div className="d-flex align-items-center">
                                    <div className="flex-grow-1">
                                        {notification.message}
                                    </div>
                                </div>
                            </CAlert>
                        )}

                        <CCardBody>
                            <CRow className="mb-4">
                                <CCol md={6}>
                                    <CFormLabel htmlFor="employeeSelect" className="fw-bold">
                                        {t('LABELS.selectEmployee')} <span className="text-danger">*</span>
                                    </CFormLabel>
                                    <CFormSelect
                                        id="employeeSelect"
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                        disabled={employeesLoading}
                                        className={selectedEmployee ? 'border-success' : ''}
                                    >
                                        <option value="">{t('LABELS.chooseEmployee')}</option>
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.id} - {employee.name}
                                            </option>
                                        ))}
                                    </CFormSelect>
                                    {employeesLoading && (
                                        <div className="mt-2">
                                            <CSpinner size="sm" className="me-2" />
                                            <small className="text-muted">{t('MSG.loadingEmployees')}</small>
                                        </div>
                                    )}
                                    {!employeesLoading && employees.length === 0 && (
                                        <small className="text-warning mt-1 d-block">
                                            {t('MSG.noEmployeesAvailable')}
                                        </small>
                                    )}
                                </CCol>
                            </CRow>

                            <div className="mb-4">
                                <div className="mb-3">
                                    <CFormLabel className="fw-bold mb-0">{t('LABELS.documentUploads')}</CFormLabel>
                                    <small className="text-muted d-block">
                                        {t('LABELS.uploadDocumentsInstruction')}
                                    </small>
                                </div>

                                {documentTypesLoading ? (
                                    <div className="d-flex justify-content-center align-items-center py-4">
                                        <CSpinner color="primary" className="me-2" />
                                        <span>{t('MSG.loadingDocumentTypes')}</span>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <CTable hover bordered>
                                            <CTableHead>
                                                <CTableRow>
                                                    <CTableHeaderCell scope="col" style={{ width: '30%' }}>
                                                        {t('LABELS.documentType')}
                                                    </CTableHeaderCell>
                                                    <CTableHeaderCell scope="col" style={{ width: '40%' }}>
                                                        {t('LABELS.documentUpload')}
                                                    </CTableHeaderCell>
                                                    <CTableHeaderCell scope="col" style={{ width: '30%' }}>
                                                        {t('LABELS.previewDocument')}
                                                    </CTableHeaderCell>
                                                </CTableRow>
                                            </CTableHead>
                                            <CTableBody>
                                                {documentUploads.length > 0 ? (
                                                    documentUploads.map((doc) => (
                                                        <CTableRow key={doc.id}>
                                                            <CTableDataCell>
                                                                <span className="fw-medium">{doc.documentTypeName}</span>
                                                            </CTableDataCell>
                                                            <CTableDataCell>
                                                                <CFormInput
                                                                    type="file"
                                                                    size="sm"
                                                                    accept=".jpeg,.jpg,.png,.pdf"
                                                                    onChange={(e) => handleFileUpload(doc.id, e)}
                                                                    className={doc.file ? 'border-success' : ''}
                                                                />
                                                                {doc.fileName && (
                                                                    <small className="text-success d-block mt-1">
                                                                        ✓ {t('MSG.selectedFile', { fileName: doc.fileName })}
                                                                    </small>
                                                                )}
                                                                <small className="text-muted">
                                                                    {t('LABELS.acceptedFileTypes')}
                                                                </small>
                                                            </CTableDataCell>
                                                            <CTableDataCell>
                                                                <CButton
                                                                    color="info"
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => previewDocument(doc)}
                                                                    disabled={!doc.file}
                                                                >
                                                                    <CIcon icon={cilZoom} className="me-1" />
                                                                    {t('LABELS.preview')}
                                                                </CButton>
                                                            </CTableDataCell>
                                                        </CTableRow>
                                                    ))
                                                ) : (
                                                    <CTableRow>
                                                        <CTableDataCell colSpan="3" className="text-center py-4">
                                                            <div className="text-muted">
                                                                <CIcon icon={cilCloudUpload} size="xl" className="mb-2" />
                                                                <p className="mb-0">{t('MSG.noDocumentTypesAvailable')}</p>
                                                                <small>{t('MSG.documentTypesWillAppear')}</small>
                                                            </div>
                                                        </CTableDataCell>
                                                    </CTableRow>
                                                )}

                                                <CTableRow>
                                                    <CTableDataCell>
                                                        <CFormInput
                                                            type="text"
                                                            name="otherDocumentName"
                                                            placeholder={t('LABELS.enterDocumentDescription')}
                                                            className="mt-0"
                                                            value={otherDocument.name}
                                                            onChange={(e) =>
                                                                setOtherDocument((prev) => ({ ...prev, name: e.target.value }))
                                                            }
                                                        />
                                                        <div className="fw-medium">{t('LABELS.otherDocument')}</div>
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                        <CFormInput
                                                            type="file"
                                                            name="otherDocumentFile"
                                                            size="sm"
                                                            accept=".jpeg,.jpg,.png,.pdf"
                                                            onChange={(e) => {
                                                                const file = e.target.files[0];
                                                                if (file) {
                                                                    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
                                                                    if (!allowedTypes.includes(file.type)) {
                                                                        // showNotification('warning', t('MSG.invalidFileType'));
                                                                        showToast('warning', t('MSG.invalidFileType'));
                                                                        return;
                                                                    }
                                                                    if (file.size > 10 * 1024 * 1024) {
                                                                        // showNotification('warning', t('MSG.fileTooLarge'));
                                                                        showToast('warning', t('MSG.fileTooLarge'));
                                                                        return;
                                                                    }

                                                                    const previewUrl = file.type.startsWith('image/') || file.type === 'application/pdf'
                                                                        ? URL.createObjectURL(file)
                                                                        : null;

                                                                    setOtherDocument((prev) => ({
                                                                        ...prev,
                                                                        file: file,
                                                                        fileName: file.name,
                                                                        previewUrl: previewUrl
                                                                    }));

                                                                    // showNotification('success', t('MSG.fileSelected', { fileName: file.name }));
                                                                    showToast('success', t('MSG.fileSelected', { fileName: file.name }));
                                                                }
                                                            }}
                                                        />
                                                        {otherDocument.fileName && (
                                                            <small className="text-success d-block mt-1">
                                                                ✓ {t('MSG.selectedFile', { fileName: otherDocument.fileName })}
                                                            </small>
                                                        )}
                                                        <small className="text-muted d-block mt-1">
                                                            {t('LABELS.acceptedFileTypes')}
                                                        </small>
                                                    </CTableDataCell>
                                                    <CTableDataCell>
                                                        <CButton
                                                            color="info"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                if (!otherDocument.file) {
                                                                    // showNotification('warning', t('MSG.selectFileFirst'));
                                                                    showToast('warning', t('MSG.selectFileFirst'));
                                                                } else {
                                                                    previewDocument({
                                                                        documentTypeName: otherDocument.name || t('LABELS.otherDocument'),
                                                                        file: otherDocument.file,
                                                                        fileName: otherDocument.fileName,
                                                                        previewUrl: otherDocument.previewUrl
                                                                    });
                                                                }
                                                            }}
                                                            disabled={!otherDocument.file}
                                                        >
                                                            <CIcon icon={cilZoom} className="me-1" />
                                                            {t('LABELS.preview')}
                                                        </CButton>
                                                    </CTableDataCell>
                                                </CTableRow>
                                            </CTableBody>
                                        </CTable>
                                    </div>
                                )}
                            </div>

                            {documentUploads.length > 0 && (
                                <div className="mb-3">
                                    <small className="text-info">
                                        <strong>{t('LABELS.uploadSummary')}:</strong> {t('MSG.uploadSummary', {
                                            selected: documentUploads.filter(doc => doc.file).length,
                                            total: documentUploads.length
                                        })}
                                    </small>
                                </div>
                            )}

                            <div className="d-flex justify-content-end gap-2">
                                <CButton
                                    color="secondary"
                                    variant="outline"
                                    onClick={cancelUpload}
                                    disabled={uploading}
                                >
                                    <CIcon icon={cilX} className="me-1" />
                                    {t('LABELS.cancel')}
                                </CButton>
                                <CButton
                                    color="primary"
                                    onClick={uploadDocuments}
                                    disabled={uploading || documentUploads.length === 0 || !selectedEmployee}
                                >
                                    {uploading ? (
                                        <>
                                            <CSpinner size="sm" className="me-2" />
                                            {t('LABELS.uploading')}
                                        </>
                                    ) : (
                                        <>
                                            <CIcon icon={cilCloudUpload} className="me-2" />
                                            {t('LABELS.uploadDocuments')}
                                        </>
                                    )}
                                </CButton>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            <CModal
                visible={previewModal.visible}
                onClose={closePreviewModal}
                size="lg"
                scrollable
                className="document-preview-modal"
            >
                <CModalHeader>
                    <CModalTitle>{t('LABELS.documentPreview')}</CModalTitle>
                </CModalHeader>
                <CModalBody className="p-0">
                    <div className="bg-light p-3 border-bottom">
                        <h6 className="mb-1 text-truncate">{previewModal.fileName}</h6>
                        <small className="text-muted">
                            {previewModal.document?.documentTypeName}
                        </small>
                    </div>

                    <div className="p-3">
                        {previewModal.fileType?.startsWith('image/') ? (
                            <div className="text-center">
                                <img
                                    src={previewModal.previewUrl}
                                    alt={t('LABELS.documentPreview')}
                                    className="img-fluid rounded shadow-sm"
                                    style={{ maxHeight: '500px', width: 'auto' }}
                                />
                            </div>
                        ) : previewModal.fileType === 'application/pdf' ? (
                            <div className="text-center">
                                <iframe
                                    src={previewModal.previewUrl}
                                    width="100%"
                                    height="500px"
                                    title={t('LABELS.pdfPreview')}
                                    className="border rounded"
                                    style={{ minHeight: '500px' }}
                                />
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <CIcon icon={cilZoom} size="xl" className="text-muted mb-3" />
                                <p className="text-muted mb-0">{t('MSG.previewNotAvailable')}</p>
                            </div>
                        )}
                    </div>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={closePreviewModal}>
                        <CIcon icon={cilX} className="me-2" />
                        {t('LABELS.close')}
                    </CButton>
                </CModalFooter>
            </CModal>

            <style jsx>{`
                .document-preview-modal .modal-dialog {
                    max-width: 800px;
                }
                @media (max-width: 768px) {
                    .document-preview-modal .modal-dialog {
                        max-width: 95%;
                        margin: 10px auto;
                    }
                    .document-preview-modal iframe {
                        height: 400px !important;
                        min-height: 400px !important;
                    }
                }
                @media (max-width: 576px) {
                    .document-preview-modal .modal-dialog {
                        max-width: 100%;
                        margin: 5px;
                    }
                    .document-preview-modal iframe {
                        height: 300px !important;
                        min-height: 300px !important;
                    }
                }
            `}</style>
        </>
    );
}

export default EmployeeDocumentUpload;
