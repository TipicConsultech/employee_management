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
import { getAPICall, post, postFormData } from '../../../util/api';
import { useTranslation } from 'react-i18next';
import CIcon from '@coreui/icons-react';
import { cilZoom, cilCloudUpload, cilX } from '@coreui/icons';

function EmployeeDocumentUpload() {
    // Add translation hook
    const { t } = useTranslation("global");

    // State management
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


    // Modal state for document preview
    const [previewModal, setPreviewModal] = useState({
        visible: false,
        document: null,
        previewUrl: null,
        fileName: '',
        fileType: ''
    });

    // Enhanced status code message mapping
    const getStatusMessage = (statusCode, responseData = null) => {
        const statusMessages = {
            200: 'Operation completed successfully',
            201: 'Document uploaded successfully',
            400: 'Invalid request. Please check your input',
            401: 'Unauthorized. Please login again',
            403: 'Access denied. You do not have permission',
            404: 'Resource not found',
            409: 'Conflict. Document already exists',
            413: 'File too large. Please upload a smaller file',
            415: 'Unsupported file type',
            422: 'Validation failed. Please check required fields',
            500: 'Internal server error. Please try again later',
            502: 'Server unavailable. Please try again later',
            503: 'Service temporarily unavailable'
        };

        // Check if response has custom error message
        if (responseData) {
            if (responseData.message) {
                return responseData.message;
            }
            if (responseData.error) {
                return responseData.error;
            }
            if (responseData.errors && Array.isArray(responseData.errors)) {
                return responseData.errors.join(', ');
            }
        }

        return statusMessages[statusCode] || `Unexpected response (Status: ${statusCode})`;
    };

    // Enhanced API response handler
    const handleAPIResponse = (response, successMessage = 'Operation completed successfully') => {
        console.log('API Response:', response); // Debug log

        // Handle different response structures
        if (!response) {
            showNotification('danger', 'No response received from server');
            return false;
        }

        // Check for HTTP status codes
        if (response.status !== undefined) {
            const statusCode = response.status;

            if (statusCode >= 200 && statusCode < 300) {
                showNotification('success', successMessage);
                return true;
            } else {
                const errorMessage = getStatusMessage(statusCode, response.data);
                showNotification('danger', errorMessage);
                return false;
            }
        }

        // Check for success property
        if (response.success !== undefined) {
            if (response.success === true) {
                showNotification('success', response.message || successMessage);
                return true;
            } else {
                const errorMessage = response.message || response.error || 'Operation failed';
                showNotification('danger', errorMessage);
                return false;
            }
        }

        // Check for error property
        if (response.error !== undefined) {
            if (!response.error) {
                showNotification('success', response.message || successMessage);
                return true;
            } else {
                const errorMessage = response.message || response.error || 'Operation failed';
                showNotification('danger', errorMessage);
                return false;
            }
        }

        // Check for data property existence (assume success if data exists)
        if (response.data !== undefined) {
            showNotification('success', successMessage);
            return true;
        }

        // If response is an array (for list endpoints)
        if (Array.isArray(response)) {
            showNotification('success', successMessage);
            return true;
        }

        // Default case - if we can't determine success/failure
        console.warn('Unable to determine API response status:', response);
        showNotification('warning', 'Response received but status unclear');
        return false;
    };

    // Memoized helper function for showing notifications
    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        // Auto hide success messages after 4 seconds
        if (type === 'success') {
            setTimeout(() => {
                setNotification({ show: false, type: '', message: '' });
            }, 4000);
        }
    }, []);

    // Enhanced fetch employees function
    const fetchEmployees = useCallback(async () => {
        try {
            setEmployeesLoading(true);
            const response = await getAPICall('/api/employees');
            console.log('Employees API Response:', response); // Debug log

            if (response && (response.data || Array.isArray(response))) {
                const employeesData = response.data || response;
                setEmployees(employeesData);

                if (employeesData.length === 0) {
                    showNotification('info', 'No employees found');
                } else {
                    handleAPIResponse(response, `${employeesData.length} employees loaded successfully`);
                }
            } else {
                handleAPIResponse(response, 'Failed to fetch employees');
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            showNotification('danger', `Error connecting to server: ${error.message}`);
        } finally {
            setEmployeesLoading(false);
        }
    }, [showNotification]);

    // Enhanced fetch document types function
    const fetchDocumentTypes = useCallback(async () => {
        try {
            setDocumentTypesLoading(true);
            const response = await getAPICall('/api/document-type');
            console.log('Document Types API Response:', response); // Debug log

            if (response && (response.data || Array.isArray(response))) {
                const documentTypesData = response.data || response;
                setDocumentTypes(documentTypesData);

                if (documentTypesData.length === 0) {
                    showNotification('info', 'No document types found');
                    setDocumentUploads([]);
                } else {
                    // Auto-generate document upload rows for each document type
                    const documentRows = documentTypesData.map(type => ({
                        id: type.id,
                        documentType: type.id,
                        documentTypeName: type.document_name,
                        file: null,
                        fileName: '',
                        previewUrl: null
                    }));
                    setDocumentUploads(documentRows);
                    handleAPIResponse(response, `${documentTypesData.length} document types loaded successfully`);
                }
            } else {
                handleAPIResponse(response, 'Failed to fetch document types');
            }
        } catch (error) {
            console.error('Error fetching document types:', error);
            showNotification('danger', `Error connecting to server: ${error.message}`);
        } finally {
            setDocumentTypesLoading(false);
        }
    }, [showNotification]);

    // Fetch data on component mount
    useEffect(() => {
        fetchEmployees();
        fetchDocumentTypes();
    }, [fetchEmployees, fetchDocumentTypes]);

    // Handle file upload
    const handleFileUpload = (id, event) => {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
            if (!allowedTypes.includes(file.type)) {
                showNotification('warning', 'Please upload only JPEG, JPG, PNG, or PDF files');
                return;
            }

            // Validate file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                showNotification('warning', 'File size must be less than 10MB');
                return;
            }

            // Create preview URL for images
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

            showNotification('success', `File "${file.name}" selected successfully`);
        }
    };

    // Preview document in modal
    const previewDocument = (doc) => {
        if (!doc.file) {
            showNotification('info', 'Please select a file to preview');
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
            showNotification('info', 'Preview not available for this file type');
        }
    };

    // Close preview modal
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

    // Enhanced upload documents function
    // const uploadDocuments = async () => {
    //     if (!selectedEmployee) {
    //         showNotification('warning', 'Please select an employee');
    //         return;
    //     }

    //     if (documentUploads.length === 0) {
    //         showNotification('warning', 'Please add at least one document');
    //         return;
    //     }

    //     // Validate all documents - only check if at least one file is uploaded
    //     const uploadedFiles = documentUploads.filter(doc => doc.file);
    //     if (uploadedFiles.length === 0) {
    //         showNotification('warning', 'Please upload at least one document');
    //         return;
    //     }

    //     try {
    //         setUploading(true);

    //         // Create FormData for file upload with document type IDs as keys
    //         const formData = new FormData();
    //         formData.append('employee_id', selectedEmployee);

    //         // Only include documents that have files uploaded
    //         const documentsToUpload = documentUploads.filter(doc => doc.file);
    //         documentsToUpload.forEach((doc) => {
    //             // Use actual document type ID as key
    //             formData.append(doc.documentType.toString(), doc.file);
    //         });

    //         console.log('Uploading documents for employee:', selectedEmployee);
    //         console.log('Documents to upload:', documentsToUpload.length);

    //         const response = await postFormData('/api/employee-details', formData);
    //         console.log('Upload API Response:', response); // Debug log

    //         // Handle response with proper status code checking
    //         if (handleAPIResponse(response, `${documentsToUpload.length} documents uploaded successfully`)) {
    //             // Reset form on success
    //             setSelectedEmployee('');
    //             setDocumentUploads(documentUploads.map(doc => ({
    //                 ...doc,
    //                 file: null,
    //                 fileName: '',
    //                 previewUrl: null
    //             })));

    //             // Clear file inputs
    //             const fileInputs = document.querySelectorAll('input[type="file"]');
    //             fileInputs.forEach(input => input.value = '');
    //         }
    //     } catch (error) {
    //         console.error('Error uploading documents:', error);

    //         // More specific error handling
    //         if (error.response) {
    //             // Server responded with error status
    //             const errorMessage = getStatusMessage(error.response.status, error.response.data);
    //             showNotification('danger', errorMessage);
    //         } else if (error.request) {
    //             // Network error
    //             showNotification('danger', 'Network error. Please check your connection and try again');
    //         } else {
    //             // Other error
    //             showNotification('danger', `Error uploading documents: ${error.message}`);
    //         }
    //     } finally {
    //         setUploading(false);
    //     }
    // };
 const uploadDocuments = async () => {
    if (!selectedEmployee) {
        showNotification('warning', 'Please select an employee');
        return;
    }

    const uploadedDocs = documentUploads.filter(doc => doc.file);
    const hasOtherDoc = otherDocument.file && otherDocument.name.trim();

    if (uploadedDocs.length === 0 && !hasOtherDoc) {
        showNotification('warning', 'Please upload at least one document');
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

        if (handleAPIResponse(response, `${uploadedDocs.length + (hasOtherDoc ? 1 : 0)} document(s) uploaded successfully`)) {
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
        }
    } catch (error) {
        console.error('Error uploading documents:', error);
        const msg = error.response
            ? getStatusMessage(error.response.status, error.response.data)
            : (error.request
                ? 'Network error. Please check your connection and try again'
                : `Error uploading documents: ${error.message}`);
        showNotification('danger', msg);
    } finally {
        setUploading(false);
    }
};



    // Cancel and reset form
    const cancelUpload = () => {
        setSelectedEmployee('');
        // Reset only the files, keep the document types structure
        setDocumentUploads(documentUploads.map(doc => ({
            ...doc,
            file: null,
            fileName: '',
            previewUrl: null
        })));

        // Clear file inputs
        const fileInputs = document.querySelectorAll('input[type="file"]');
        fileInputs.forEach(input => input.value = '');

        setNotification({ show: false, type: '', message: '' });
        showNotification('info', 'Form reset successfully');
    };

    return (
        <>
            <CRow>
                <CCol xs={12}>
                    <CCard className="mb-4 shadow-sm">
                        <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
                            <div className="d-flex align-items-center">
                                <CIcon icon={cilCloudUpload} className="me-2" />
                                <strong>Employee Document Upload</strong>
                            </div>
                            <small className="text-muted">Upload important documents for your employees securely</small>
                        </CCardHeader>

                        {/* Enhanced Notifications */}
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
                            {/* Employee Selection */}
                            <CRow className="mb-4">
                                <CCol md={6}>
                                    <CFormLabel htmlFor="employeeSelect" className="fw-bold">
                                        Select Employee <span className="text-danger">*</span>
                                    </CFormLabel>
                                    <CFormSelect
                                        id="employeeSelect"
                                        value={selectedEmployee}
                                        onChange={(e) => setSelectedEmployee(e.target.value)}
                                        disabled={employeesLoading}
                                        className={selectedEmployee ? 'border-success' : ''}
                                    >
                                        <option value="">Choose an employee</option>
                                        {employees.map((employee) => (
                                            <option key={employee.id} value={employee.id}>
                                                {employee.id} - {employee.name}
                                            </option>
                                        ))}
                                    </CFormSelect>
                                    {employeesLoading && (
                                        <div className="mt-2">
                                            <CSpinner size="sm" className="me-2" />
                                            <small className="text-muted">Loading employees...</small>
                                        </div>
                                    )}
                                    {!employeesLoading && employees.length === 0 && (
                                        <small className="text-warning mt-1 d-block">
                                            No employees available. Please add employees first.
                                        </small>
                                    )}
                                </CCol>
                            </CRow>

                            {/* Document Uploads Section */}
                            <div className="mb-4">
                                <div className="mb-3">
                                    <CFormLabel className="fw-bold mb-0">Document Uploads</CFormLabel>
                                    <small className="text-muted d-block">
                                        Upload at least one document to proceed
                                    </small>
                                </div>

                                {documentTypesLoading ? (
                                    <div className="d-flex justify-content-center align-items-center py-4">
                                        <CSpinner color="primary" className="me-2" />
                                        <span>Loading document types...</span>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <CTable hover bordered>
                                            <CTableHead>
                                                <CTableRow>
                                                    <CTableHeaderCell scope="col" style={{ width: '30%' }}>
                                                        Document Type
                                                    </CTableHeaderCell>
                                                    <CTableHeaderCell scope="col" style={{ width: '40%' }}>
                                                        Document Upload
                                                    </CTableHeaderCell>
                                                    <CTableHeaderCell scope="col" style={{ width: '30%' }}>
                                                        Preview Document
                                                    </CTableHeaderCell>
                                                </CTableRow>
                                            </CTableHead>
                                            <CTableBody>
                                                {documentUploads.length > 0 ? (
                                                    documentUploads.map((doc) => (
                                                        <>
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
                                                                        ✓ Selected: {doc.fileName}
                                                                    </small>
                                                                )}
                                                                <small className="text-muted">
                                                                    Accepted: JPEG, JPG, PNG, PDF (Max 10MB)
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
                                                                    Preview
                                                                </CButton>
                                                            </CTableDataCell>
                                                        </CTableRow>
                                                    </>
                                                    ))
                                                ) : (
                                                    <CTableRow>
                                                        <CTableDataCell colSpan="3" className="text-center py-4">
                                                            <div className="text-muted">
                                                                <CIcon icon={cilCloudUpload} size="xl" className="mb-2" />
                                                                <p className="mb-0">No document types available</p>
                                                                <small>Document types will appear here once loaded</small>
                                                            </div>
                                                        </CTableDataCell>
                                                    </CTableRow>
                                                )}

                                                                                                      
<CTableRow>
  <CTableDataCell>
    <CFormInput
      type="text"
      name="otherDocumentName"
      placeholder="Enter document description"
      className="mt-0"
      value={otherDocument.name}
      onChange={(e) =>
        setOtherDocument((prev) => ({ ...prev, name: e.target.value }))
      }
    />
    <div className="fw-medium">Other Document</div>
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
            showNotification('warning', 'Invalid file type.');
            return;
          }
          if (file.size > 10 * 1024 * 1024) {
            showNotification('warning', 'File must be under 10MB.');
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

          showNotification('success', `Selected: ${file.name}`);
        }
      }}
    />
   {otherDocument.fileName && (
  <small className="text-success d-block mt-1">
    ✓ Selected: {otherDocument.fileName}
  </small>
)}

    <small className="text-muted d-block mt-1">
      Accepted: JPEG, JPG, PNG, PDF (Max 10MB)
    </small>
  </CTableDataCell>

  <CTableDataCell>
    <CButton
      color="info"
      variant="outline"
      size="sm"
      onClick={() => {
        if (!otherDocument.file) {
          showNotification('warning', 'Please select a file first.');
        } else {
          previewDocument({
            documentTypeName: otherDocument.name || 'Other Document',
            file: otherDocument.file,
            fileName: otherDocument.fileName,
            previewUrl: otherDocument.previewUrl
          });
        }
      }}
      disabled={!otherDocument.file}
    >
      <CIcon icon={cilZoom} className="me-1" />
      Preview
    </CButton>
  </CTableDataCell>
</CTableRow>



                                            </CTableBody>
                                        </CTable>
                                    </div>
                                )}
                            </div>

                            {/* Upload Summary */}
                            {documentUploads.length > 0 && (
                                <div className="mb-3">
                                    <small className="text-info">
                                        <strong>Upload Summary:</strong> {documentUploads.filter(doc => doc.file).length} of {documentUploads.length} documents selected
                                    </small>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="d-flex justify-content-end gap-2">
                                <CButton
                                    color="secondary"
                                    variant="outline"
                                    onClick={cancelUpload}
                                    disabled={uploading}
                                >
                                    <CIcon icon={cilX} className="me-1" />
                                    Cancel
                                </CButton>
                                <CButton
                                    color="primary"
                                    onClick={uploadDocuments}
                                    disabled={uploading || documentUploads.length === 0 || !selectedEmployee}
                                >
                                    {uploading ? (
                                        <>
                                            <CSpinner size="sm" className="me-2" />
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <CIcon icon={cilCloudUpload} className="me-2" />
                                            Upload Documents
                                        </>
                                    )}
                                </CButton>
                            </div>
                        </CCardBody>
                    </CCard>
                </CCol>
            </CRow>

            {/* Document Preview Modal */}
            <CModal
                visible={previewModal.visible}
                onClose={closePreviewModal}
                size="lg"
                scrollable
                className="document-preview-modal"
            >
                <CModalHeader>
                    <CModalTitle>Document Preview</CModalTitle>
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
                                    alt="Document preview"
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
                                    title="PDF Preview"
                                    className="border rounded"
                                    style={{ minHeight: '500px' }}
                                />
                            </div>
                        ) : (
                            <div className="text-center py-5">
                                <CIcon icon={cilZoom} size="xl" className="text-muted mb-3" />
                                <p className="text-muted mb-0">Preview not available for this file type</p>
                            </div>
                        )}
                    </div>
                </CModalBody>
                <CModalFooter>
                    <CButton color="secondary" onClick={closePreviewModal}>
                        <CIcon icon={cilX} className="me-2" />
                        Close
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
