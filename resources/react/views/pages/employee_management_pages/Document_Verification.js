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
    CFormInput
} from '@coreui/react';
import { getAPICall, post, postFormData } from '../../../util/api';
import { useTranslation } from 'react-i18next';
import CIcon from '@coreui/icons-react';
import { cilZoom, cilCloudUpload } from '@coreui/icons';

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

    // Memoized helper function for showing notifications
    const showNotification = useCallback((type, message) => {
        setNotification({ show: true, type, message });
        // Auto hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                setNotification({ show: false, type: '', message: '' });
            }, 3000);
        }
    }, []);

    // Fetch employees function
    const fetchEmployees = useCallback(async () => {
        try {
            setEmployeesLoading(true);
            const response = await getAPICall('/api/employees');
            if (response.data) {
                setEmployees(response.data);
            } else {
                showNotification('warning', 'Failed to fetch employees');
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
            showNotification('warning', `Error connecting to server: ${error.message}`);
        } finally {
            setEmployeesLoading(false);
        }
    }, [showNotification]);

    // Fetch document types function
    const fetchDocumentTypes = useCallback(async () => {
        try {
            setDocumentTypesLoading(true);
            const response = await getAPICall('/api/document-type');
            if (response) {
                setDocumentTypes(response);
                // Auto-generate document upload rows for each document type
                const documentRows = response.map(type => ({
                    id: type.id,
                    documentType: type.id,
                    documentTypeName: type.document_name,
                    file: null,
                    fileName: '',
                    previewUrl: null
                }));
                setDocumentUploads(documentRows);
            } else {
                showNotification('warning', 'Failed to fetch document types');
            }
        } catch (error) {
            console.error('Error fetching document types:', error);
            showNotification('warning', `Error connecting to server: ${error.message}`);
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
        }
    };

    // Preview document
    const previewDocument = (doc) => {
        if (doc.previewUrl) {
            window.open(doc.previewUrl, '_blank');
        } else if (doc.file && doc.file.type === 'application/pdf') {
            const fileUrl = URL.createObjectURL(doc.file);
            window.open(fileUrl, '_blank');
        } else {
            showNotification('info', 'Preview not available for this file type');
        }
    };

    // Upload documents
    const uploadDocuments = async () => {
        if (!selectedEmployee) {
            showNotification('warning', 'Please select an employee');
            return;
        }

        if (documentUploads.length === 0) {
            showNotification('warning', 'Please add at least one document');
            return;
        }

        // Validate all documents - only check if at least one file is uploaded
        const uploadedFiles = documentUploads.filter(doc => doc.file);
        if (uploadedFiles.length === 0) {
            showNotification('warning', 'Please upload at least one document');
            return;
        }

        try {
            setUploading(true);

            // Create FormData for file upload with document type IDs as keys
            const formData = new FormData();
            formData.append('employee_id', selectedEmployee);

            // Only include documents that have files uploaded
            const documentsToUpload = documentUploads.filter(doc => doc.file);
            documentsToUpload.forEach((doc) => {
                // Use actual document type ID as key
                formData.append(doc.documentType.toString(), doc.file);
            });

            const response = await postFormData('/api/employee-details', formData);

            if (response.success) {
                showNotification('success', 'Documents uploaded successfully');
                // Reset form
                setSelectedEmployee('');
                setDocumentUploads(documentUploads.map(doc => ({
                    ...doc,
                    file: null,
                    fileName: '',
                    previewUrl: null
                })));
            } else {
                showNotification('warning', 'Failed to upload documents');
            }
        } catch (error) {
            console.error('Error uploading documents:', error);
            showNotification('warning', `Error uploading documents: ${error.message}`);
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
        setNotification({ show: false, type: '', message: '' });
    };

    return (
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
                            </CCol>
                        </CRow>

                        {/* Document Uploads Section */}
                        <div className="mb-4">
                            <div className="mb-3">
                                <CFormLabel className="fw-bold mb-0">Document Uploads</CFormLabel>
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
                                                            />
                                                            {doc.fileName && (
                                                                <small className="text-muted d-block mt-1">
                                                                    Selected: {doc.fileName}
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
                                        </CTableBody>
                                    </CTable>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex justify-content-end gap-2">
                            <CButton
                                color="secondary"
                                variant="outline"
                                onClick={cancelUpload}
                                disabled={uploading}
                            >
                                Cancel
                            </CButton>
                            <CButton
                                color="primary"
                                onClick={uploadDocuments}
                                disabled={uploading || documentUploads.length === 0}
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
    );
}

export default EmployeeDocumentUpload;
