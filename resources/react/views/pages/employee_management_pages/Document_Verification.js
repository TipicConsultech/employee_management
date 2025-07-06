import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardHeader,
  CForm,
  CFormSelect,
  CFormInput,
  CFormLabel,
  CButton,
  CAlert,
  CSpinner,
  CBadge,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';
import { cilPlus, cilTrash, cilCloudUpload, cilCheckCircle, cilUser, cilFolder } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { useTranslation } from 'react-i18next';
import { getAPICall, postFormData } from '../../../util/api';

// Constants
const DUMMY_DOCUMENT_TYPES = [
  { id: 1, name: 'Police Clearance', description: 'Background verification certificate', fieldName: 'police_clearance' },
  { id: 2, name: 'Adhaar Card', description: 'Adhaar identification document', fieldName: 'adhaar' },
  { id: 3, name: 'PAN Card', description: 'Permanent Account Number card', fieldName: 'pan' }
];

const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const NOTIFICATION_TIMEOUT = 3000;

// Initial state
const INITIAL_FORM_DATA = {
  selectedEmployee: ''
};

const INITIAL_NOTIFICATION = {
  show: false,
  type: '',
  message: ''
};

const STATUS_MESSAGES = {
  SUCCESS_CODES: [200, 201, 202, 204], // Added more success codes
  ERROR_MESSAGES: {
    400: 'MSG.invalidRequestData',
    401: 'MSG.unauthorizedAccess',
    403: 'MSG.accessForbidden',
    404: 'MSG.employeeNotFound',
    413: 'MSG.fileTooLarge',
    415: 'MSG.unsupportedFileType',
    422: 'MSG.validationError',
    500: 'MSG.serverError',
    503: 'MSG.serviceUnavailable'
  },
  FALLBACK_MESSAGES: {
    SUCCESS: 'Documents uploaded successfully!',
    ERROR: 'Upload failed. Please try again.'
  }
};

// Helper functions
const normalizeEmployeeData = (response) => {
  let employeeData = [];

  if (response?.success && response?.data) {
    employeeData = Array.isArray(response.data) ? response.data : [];
  } else if (Array.isArray(response)) {
    employeeData = response;
  } else if (response?.employees) {
    employeeData = Array.isArray(response.employees) ? response.employees : [];
  } else if (response?.data && Array.isArray(response.data)) {
    employeeData = response.data;
  }

  return employeeData.filter(emp =>
    emp && (emp.isActive === undefined || emp.isActive === 1 || emp.isActive === true)
  );
};

const validateFile = (file) => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return { isValid: false, error: 'Please upload only JPEG, JPG, PNG, or PDF files' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: 'File size should be less than 10MB' };
  }

  return { isValid: true };
};

const processFilePreview = (file) => {
  return new Promise((resolve, reject) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    } else {
      resolve('');
    }
  });
};

const handleResponseStatus = (response, t, showNotification, resetForm) => {
  console.log('Response received:', response);

  // Extract status from response
  let status = response?.status || response?.statusCode;

  // Handle array responses (multiple documents) - get overall status
  if (Array.isArray(response)) {
    // Check if all documents were successful
    const allSuccessful = response.every(item => {
      const itemStatus = item?.status || item?.statusCode;
      return STATUS_MESSAGES.SUCCESS_CODES.includes(itemStatus) || (itemStatus >= 200 && itemStatus < 300);
    });

    if (allSuccessful) {
      status = 200; // Set overall success status
    } else {
      // Find the first error status
      const errorItem = response.find(item => {
        const itemStatus = item?.status || item?.statusCode;
        return !STATUS_MESSAGES.SUCCESS_CODES.includes(itemStatus) && !(itemStatus >= 200 && itemStatus < 300);
      });
      status = errorItem?.status || errorItem?.statusCode || 500;
    }
  }

  // Handle success cases
  if (STATUS_MESSAGES.SUCCESS_CODES.includes(status) || (status >= 200 && status < 300)) {
    const successMessage = response?.message || t('MSG.documentsUploadedSuccess') || STATUS_MESSAGES.FALLBACK_MESSAGES.SUCCESS;
    showNotification('success', successMessage);
    resetForm();
    return;
  }

  // Handle error cases
  const errorKey = STATUS_MESSAGES.ERROR_MESSAGES[status];
  const errorMessage = response?.message || (errorKey ? t(errorKey) : null) || `${STATUS_MESSAGES.FALLBACK_MESSAGES.ERROR} (Status: ${status})`;
  showNotification('danger', errorMessage);
};

const DocumentUploadPage = () => {
  const { t } = useTranslation("global");

  // State management
  const [employees, setEmployees] = useState([]);
  const [documentTypes] = useState(DUMMY_DOCUMENT_TYPES);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(INITIAL_NOTIFICATION);
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Memoized values
  const selectedEmployee = useMemo(() =>
    employees.find(emp => emp.id.toString() === formData.selectedEmployee),
    [employees, formData.selectedEmployee]
  );

  const isFormValid = useMemo(() => {
    if (!formData.selectedEmployee || uploadedDocuments.length === 0) return false;
    return uploadedDocuments.every(doc => doc.documentType && doc.file);
  }, [formData.selectedEmployee, uploadedDocuments]);

  const hasRequiredData = useMemo(() =>
    employees.length > 0 && documentTypes.length > 0,
    [employees.length, documentTypes.length]
  );

  // Notification helper
  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    if (type === 'success') {
      setTimeout(() => {
        setNotification(INITIAL_NOTIFICATION);
      }, NOTIFICATION_TIMEOUT);
    }
  }, []);

  // API calls
  const fetchEmployees = useCallback(async () => {
    try {
      console.log('Fetching employees...');
      const response = await getAPICall('/api/employees');
      const activeEmployees = normalizeEmployeeData(response);

      setEmployees(activeEmployees);
      setError(null);

      if (activeEmployees.length === 0) {
        const message = response?.data?.length === 0
          ? t('MSG.noEmployeesFound') || 'No employees found'
          : t('MSG.noActiveEmployeesFound') || 'No active employees found';
        showNotification('info', message);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
      setEmployees([]);
      setError(err.message);
      showNotification('danger', `${t('MSG.errorConnectingToServer') || 'Error connecting to server'}: ${err.message}`);
    }
  }, [showNotification, t]);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      console.log('Using dummy document types...');
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Document types loaded:', DUMMY_DOCUMENT_TYPES.length);
    } catch (err) {
      console.error('Error loading document types:', err);
      showNotification('warning', `${t('MSG.errorLoadingDocumentTypes') || 'Error loading document types'}: ${err.message}`);
    }
  }, [showNotification, t]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([fetchEmployees(), fetchDocumentTypes()]);
    } catch (err) {
      console.error('Error during initialization:', err);
      setError(err.message);
      showNotification('danger', `${t('MSG.errorInitializingData') || 'Error initializing data'}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [fetchEmployees, fetchDocumentTypes, showNotification, t]);

  // Form handlers
  const handleFormChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setUploadedDocuments([]);
  }, []);

  const addNewDocument = useCallback(() => {
    const newDoc = {
      id: Date.now(),
      documentType: '',
      file: null,
      fileName: '',
      preview: ''
    };
    setUploadedDocuments(prev => [...prev, newDoc]);
  }, []);

  const removeDocument = useCallback((id) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== id));
  }, []);

  const handleDocumentTypeChange = useCallback((id, typeId) => {
    setUploadedDocuments(prev => prev.map(doc =>
      doc.id === id
        ? { ...doc, documentType: typeId, file: null, fileName: '', preview: '' }
        : doc
    ));
  }, []);

  const handleFileUpload = useCallback(async (id, event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.isValid) {
      showNotification('warning', t(validation.error) || validation.error);
      return;
    }

    try {
      const preview = await processFilePreview(file);

      setUploadedDocuments(prev => prev.map(doc =>
        doc.id === id ? {
          ...doc,
          file,
          fileName: file.name,
          preview
        } : doc
      ));
    } catch (err) {
      console.error('Error processing file:', err);
      showNotification('warning', t('MSG.errorProcessingFile') || 'Error processing file');
    }
  }, [showNotification, t]);

  const getAvailableDocumentTypes = useCallback((currentDocId) => {
    const selectedTypes = uploadedDocuments
      .filter(doc => doc.id !== currentDocId && doc.documentType)
      .map(doc => doc.documentType);

    return documentTypes.filter(type => !selectedTypes.includes(type.id.toString()));
  }, [uploadedDocuments, documentTypes]);

  const validateForm = useCallback(() => {
    if (!formData.selectedEmployee) {
      showNotification('warning', t('MSG.pleaseSelectEmployee') || 'Please select an employee');
      return false;
    }

    if (uploadedDocuments.length === 0) {
      showNotification('warning', t('MSG.pleaseAddDocuments') || 'Please add at least one document');
      return false;
    }

    const incompleteDocuments = uploadedDocuments.filter(doc => !doc.documentType || !doc.file);
    if (incompleteDocuments.length > 0) {
      showNotification('warning', t('MSG.completeAllDocuments') || 'Please complete all document uploads');
      return false;
    }

    return true;
  }, [formData, uploadedDocuments, showNotification, t]);

const handleSubmitDocuments = useCallback(async () => {
  if (!validateForm()) return;

  try {
    setSubmitting(true);

    if (!selectedEmployee) {
      showNotification('warning', t('MSG.selectedEmployeeNotFound') || 'Selected employee not found');
      return;
    }

    const formDataPayload = new FormData();
    formDataPayload.append('employee_id', formData.selectedEmployee);

    uploadedDocuments.forEach((doc) => {
      const documentType = documentTypes.find(type => type.id.toString() === doc.documentType);
      if (documentType?.fieldName && doc.file) {
        formDataPayload.append(documentType.fieldName, doc.file);
      }
    });

    // Debug logging
    console.log('Payload structure:');
    console.log('employee_id:', formData.selectedEmployee);
    uploadedDocuments.forEach((doc) => {
      const documentType = documentTypes.find(type => type.id.toString() === doc.documentType);
      if (documentType?.fieldName && doc.file) {
        console.log(`${documentType.fieldName}:`, doc.file.name);
      }
    });

    const response = await postFormData('/api/employee-details', formDataPayload);
    console.log('Full API response:', response);

    // Enhanced response handling
    if (response) {
      // Check if response has a direct status property
      if (response.status !== undefined || response.statusCode !== undefined) {
        handleResponseStatus(response, t, showNotification, resetForm);
      }
      // Check if response is an array (multiple document responses)
      else if (Array.isArray(response)) {
        handleResponseStatus(response, t, showNotification, resetForm);
      }
      // Check if response has a data property with status
      else if (response.data && (response.data.status !== undefined || response.data.statusCode !== undefined)) {
        handleResponseStatus(response.data, t, showNotification, resetForm);
      }
      // Legacy handling for responses with success property
      else if (response.success !== undefined) {
        if (response.success) {
          showNotification('success', response.message || t('MSG.documentsUploadedSuccess') || 'Documents uploaded successfully!');
          resetForm();
        } else {
          showNotification('danger', response.message || t('MSG.failedToUploadDocuments') || 'Failed to upload documents');
        }
      }
      // Fallback - assume success if no error indicators
      else {
        showNotification('success', response.message || t('MSG.documentsUploadedSuccess') || 'Documents uploaded successfully!');
        resetForm();
      }
    } else {
      showNotification('danger', t('MSG.noResponseReceived') || 'No response received from server');
    }
  } catch (err) {
    console.error('Error uploading documents:', err);

    // Enhanced error handling
    let errorMessage = t('MSG.networkError') || 'Network error occurred';
    let errorStatus = null;

    if (err.response) {
      // Server responded with error status
      errorStatus = err.response.status;
      const errorKey = STATUS_MESSAGES.ERROR_MESSAGES[errorStatus];
      errorMessage = err.response.data?.message || (errorKey ? t(errorKey) : null) || `Server Error: ${errorStatus}`;
    } else if (err.request) {
      // Request was made but no response received
      errorMessage = t('MSG.noResponseFromServer') || 'No response from server. Please check your internet connection.';
    } else {
      // Something else happened
      errorMessage = err.message || t('MSG.unexpectedError') || 'An unexpected error occurred';
    }

    showNotification('danger', errorMessage);
  } finally {
    setSubmitting(false);
  }
}, [formData, selectedEmployee, uploadedDocuments, documentTypes, validateForm, showNotification, resetForm, t]);

  const openPreview = useCallback((imageSrc) => {
    setPreviewImage(imageSrc);
    setShowPreview(true);
  }, []);

  const closePreview = useCallback(() => {
    setShowPreview(false);
    setPreviewImage('');
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(INITIAL_NOTIFICATION);
  }, []);

  // Effects
  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Render helpers
  const renderLoadingState = () => (
    <CContainer fluid className="min-h-screen d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <CSpinner color="primary" size="lg" />
        <p className="mt-3 text-muted fs-5">
          {t('LABELS.loadingData') || 'Loading data...'}
        </p>
      </div>
    </CContainer>
  );

  const renderErrorState = () => (
    <CContainer fluid className="min-h-screen d-flex align-items-center justify-content-center bg-light p-3">
      <CCard className="w-100" style={{ maxWidth: '400px' }}>
        <CCardBody className="p-4">
          <CAlert color="danger" className="border-0">
            <h5 className="text-danger fw-bold mb-3">
              {t('MSG.errorLoadingData') || 'Error Loading Data'}
            </h5>
            <p className="text-muted mb-4">{error}</p>
            <CButton color="primary" onClick={fetchInitialData} className="w-100">
              {t('LABELS.retry') || 'Retry'}
            </CButton>
          </CAlert>
        </CCardBody>
      </CCard>
    </CContainer>
  );

  const renderDocumentCard = (doc, index) => (
    <CCard key={doc.id} className="bg-light border mb-3">
      <CCardBody className="p-3">
        <CRow className="g-3 align-items-center">
          <CCol xs={12} md={5} lg={4}>
            <CFormLabel className="small fw-medium text-muted mb-1">
              Document Type
            </CFormLabel>
            <CFormSelect
              value={doc.documentType}
              onChange={(e) => handleDocumentTypeChange(doc.id, e.target.value)}
              size="sm"
              required
              disabled={submitting}
              className="w-100"
            >
              <option value="">
                {t('LABELS.selectDocumentType') || 'Select document type...'}
              </option>
              {getAvailableDocumentTypes(doc.id).map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </CFormSelect>
            {doc.documentType && (
              <p className="small text-muted mt-1 mb-0">
                {documentTypes.find(t => t.id.toString() === doc.documentType)?.description}
              </p>
            )}
          </CCol>

          <CCol xs={12} md={5} lg={6}>
            {doc.documentType && (
              <div>
                <CFormLabel className="small fw-medium text-muted mb-1">
                  Upload File
                </CFormLabel>
                <CFormInput
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileUpload(doc.id, e)}
                  size="sm"
                  required
                  disabled={submitting}
                  className="w-100"
                />
                <p className="small text-muted mt-1 mb-0">
                  {t('MSG.acceptedFormats') || 'Accepted: JPEG, JPG, PNG, PDF (Max 10MB)'}
                </p>
              </div>
            )}
          </CCol>

          <CCol xs={12} md={2} lg={2}>
            <div className="d-flex align-items-center justify-content-md-end gap-2">
              {doc.file && (
                <div className="d-flex align-items-center gap-2">
                  {doc.preview ? (
                    <CBadge
                      color="success"
                      className="cursor-pointer px-2 py-1 small"
                      onClick={() => openPreview(doc.preview)}
                      style={{ cursor: 'pointer' }}
                    >
                      <CIcon icon={cilCheckCircle} className="me-1" size="sm" />
                      <span className="d-none d-sm-inline">Preview</span>
                      <span className="d-sm-none">✓</span>
                    </CBadge>
                  ) : (
                    <CBadge color="success" className="px-2 py-1 small">
                      <CIcon icon={cilCheckCircle} className="me-1" size="sm" />
                      <span className="d-none d-lg-inline">
                        {doc.fileName.length > 8 ? `${doc.fileName.substring(0, 8)}...` : doc.fileName}
                      </span>
                      <span className="d-lg-none">✓</span>
                    </CBadge>
                  )}
                </div>
              )}
              <CButton
                color="danger"
                variant="outline"
                size="sm"
                onClick={() => removeDocument(doc.id)}
                disabled={submitting}
                className="px-2 py-1 d-flex align-items-center"
              >
                <CIcon icon={cilTrash} size="sm" />
              </CButton>
            </div>
          </CCol>
        </CRow>
      </CCardBody>
    </CCard>
  );

  const renderEmptyDocumentState = () => (
    <CCard className="bg-light border-2 border-dashed border-secondary">
      <CCardBody className="text-center py-5">
        <CIcon icon={cilCloudUpload} size="xl" className="text-muted mb-3" />
        <h5 className="text-muted fw-semibold mb-2">
          {t('MSG.noDocumentsAdded') || 'No documents added yet'}
        </h5>
        <p className="text-muted mb-0">
          {t('MSG.clickAddDocumentToStart') || 'Click "Add Document" to get started'}
        </p>
      </CCardBody>
    </CCard>
  );

  const renderNoDataState = () => (
    <CRow className="mt-4 mt-md-5">
      <CCol xs={12}>
        <CCard className="bg-light border-0">
          <CCardBody className="text-center py-5">
            <CIcon icon={cilFolder} size="xl" className="text-muted mb-3" />
            <h5 className="fw-semibold mb-2 text-muted">
              {employees.length === 0
                ? (t('MSG.noEmployeesAvailable') || 'No Employees Available')
                : (t('MSG.noDocumentTypesAvailable') || 'No Document Types Available')
              }
            </h5>
            <p className="text-muted mb-4">
              {employees.length === 0
                ? (t('MSG.contactAdminToAddEmployees') || 'Please contact your administrator to add employees.')
                : (t('MSG.contactAdminToAddDocumentTypes') || 'Please contact your administrator to add document types.')
              }
            </p>
            <CButton color="primary" variant="outline" onClick={fetchInitialData}>
              {t('LABELS.refresh') || 'Refresh'}
            </CButton>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  );

  // Early returns for loading and error states
  if (loading) return renderLoadingState();
  if (error && employees.length === 0) return renderErrorState();

  // Main render
  return (
    <CContainer fluid className="min-h-screen bg-light py-0 py-md-0">
      <CRow className="justify-content-center">
        <CCol xs={12} className="px-1">
          <div style={{ maxWidth: '100%', margin: '0' }}>

            {/* Notifications */}
            {notification.show && (
              <CRow className="mb-3 mb-md-4">
                <CCol xs={12}>
                  <CAlert
                    color={notification.type}
                    dismissible
                    onClose={closeNotification}
                    className="border-0 shadow-sm"
                  >
                    {notification.message}
                  </CAlert>
                </CCol>
              </CRow>
            )}

            {/* Main Form */}
            <CCard className="shadow-lg border-0">
              <CCardHeader className="bg-white border-bottom">
                <div className="d-flex align-items-center">
                  <CIcon icon={cilCloudUpload} className="me-2 me-md-3 text-primary" size="lg" />
                  <div>
                    <h2 className="h5 h4-md mb-1 text-dark fw-bold">
                      {t('LABELS.employeeDocumentUpload') || 'Employee Document Upload'}
                    </h2>
                    <p className="text-muted mb-0 small">
                      {t('MSG.uploadDocumentsSecurely') || 'Upload important documents for your employees securely'}
                    </p>
                  </div>
                </div>
              </CCardHeader>
              <CCardBody className="p-2 p-md-3 p-lg-4">
                <CForm>
                  {/* Employee Selection */}
                  <CRow className="mb-4 mb-md-5">
                    <CCol xs={12}>
                      <CFormLabel className="fw-semibold text-dark mb-3">
                        {t('LABELS.selectEmployee') || 'Select Employee'}
                        <span className="text-danger ms-1">*</span>
                      </CFormLabel>
                      <CInputGroup>
                        <CInputGroupText className="bg-light border-end-0 d-none d-sm-flex">
                          <CIcon icon={cilUser} className="text-muted" />
                        </CInputGroupText>
                        <CFormSelect
                          value={formData.selectedEmployee}
                          onChange={(e) => handleFormChange('selectedEmployee', e.target.value)}
                          disabled={submitting || employees.length === 0}
                          className="border-start-0 border-start-sm-1 focus-ring-primary"
                          required
                        >
                          <option value="">
                            {employees.length === 0
                              ? (t('LABELS.noEmployeesAvailable') || 'No employees available')
                              : (t('LABELS.chooseEmployee') || 'Choose an employee...')
                            }
                          </option>
                          {employees.map(employee => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name}
                            </option>
                          ))}
                        </CFormSelect>
                      </CInputGroup>
                      {employees.length === 0 && (
                        <p className="text-warning small mt-2 d-flex align-items-center">
                          <span className="me-1">⚠️</span>
                          {t('MSG.noEmployeesLoadRetry') || 'No employees loaded. Please refresh or contact support.'}
                        </p>
                      )}
                    </CCol>
                  </CRow>

                  {/* Document Upload Section */}
                  <CRow className="mb-4 mb-md-5">
                    <CCol xs={12}>
                      <CRow className="align-items-center mb-3 mb-md-4">
                        <CCol xs={12} sm={6}>
                          <CFormLabel className="fw-semibold text-dark mb-0">
                            {t('LABELS.documentUploads') || 'Document Uploads'}
                          </CFormLabel>
                        </CCol>
                        <CCol xs={12} sm={6} className="mt-2 mt-sm-0">
                          <div className="d-flex justify-content-sm-end">
                            <CButton
                              color="success"
                              variant="outline"
                              onClick={addNewDocument}
                              size="sm"
                              className="d-flex align-items-center px-3 py-2"
                              disabled={submitting || documentTypes.length === 0}
                            >
                              <CIcon icon={cilPlus} className="me-2" />
                              <span className="d-none d-sm-inline">{t('LABELS.addDocument') || 'Add Document'}</span>
                              <span className="d-sm-none">Add</span>
                            </CButton>
                          </div>
                        </CCol>
                      </CRow>

                      {uploadedDocuments.length === 0 ? (
                        renderEmptyDocumentState()
                      ) : (
                        <div className="space-y-3">
                          {uploadedDocuments.map(renderDocumentCard)}
                        </div>
                      )}
                    </CCol>
                  </CRow>

                  {/* Submit Button */}
                  <CRow>
                    <CCol xs={12}>
                      <div className="d-flex flex-column flex-sm-row gap-2 justify-content-sm-end">
                        <CButton
                          color="secondary"
                          variant="outline"
                          onClick={resetForm}
                          disabled={submitting}
                          className="px-4 py-2 fw-medium order-2 order-sm-1"
                        >
                          Cancel
                        </CButton>
                        <CButton
                          color="primary"
                          disabled={submitting || !isFormValid || !hasRequiredData}
                          onClick={handleSubmitDocuments}
                          className="px-4 py-2 fw-medium order-1 order-sm-2"
                        >
                          {submitting ? (
                            <>
                              <CSpinner size="sm" className="me-2" />
                              <span className="d-none d-sm-inline">{t('LABELS.uploadingDocuments') || 'Uploading...'}</span>
                              <span className="d-sm-none">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <CIcon icon={cilCloudUpload} className="me-2" />
                              <span className="d-none d-sm-inline">{t('LABELS.submitDocuments') || 'Upload Documents'}</span>
                              <span className="d-sm-none">Upload</span>
                            </>
                          )}
                        </CButton>
                      </div>
                    </CCol>
                  </CRow>
                </CForm>

                {/* No Data State */}
                {!hasRequiredData && !loading && renderNoDataState()}
              </CCardBody>
            </CCard>
          </div>
        </CCol>
      </CRow>

      {/* Image Preview Modal */}
      <CModal visible={showPreview} onClose={closePreview} size="lg">
        <CModalHeader className="border-bottom">
          <CModalTitle className="h5 fw-semibold">
            {t('LABELS.documentPreview') || 'Document Preview'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody className="text-center p-3 p-md-4">
          <img
            src={previewImage}
            alt="Document preview"
            className="img-fluid rounded shadow"
            style={{ maxHeight: '70vh' }}
          />
        </CModalBody>
        <CModalFooter className="border-top">
          <CButton
            color="secondary"
            onClick={closePreview}
            className="px-4 py-2"
          >
            {t('LABELS.close') || 'Close'}
          </CButton>
        </CModalFooter>
      </CModal>
    </CContainer>
  );
};

export default DocumentUploadPage;
