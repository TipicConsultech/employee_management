import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CContainer, CCard, CCardBody, CCardHeader, CRow, CCol, CTable, CTableHead,
  CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CSpinner,
  CFormInput, CButton, CFormSelect, CCollapse, CModal, CModalHeader,
  CModalTitle, CModalBody, CModalFooter, CTab, CTabContent, CTabList,
  CTabPanel, CTabs, CBadge, CAlert
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { getAPICall, post } from '../../../util/api';
import { useTranslation } from 'react-i18next';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Monthly from './ShowingDataPage/monthly';
import Weekly from './ShowingDataPage/weekly';
import Customly from './ShowingDataPage/customly';
import Contract from './ShowingDataPage/contract';
import { cilArrowLeft, cilPencil, cilMagnifyingGlass, cilPhone, cilMoney, cilWallet } from '@coreui/icons';

const EmployeeDetailsPage = () => {
  const { t } = useTranslation("global");
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workSummary, setWorkSummary] = useState(null);
  const [viewDocuments, setViewDocuments] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('month');

  // Memoized helper function for showing notifications
  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    if (type === 'success') {
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
    }
  }, []);

  useEffect(() => {
    if (employee && workSummary) {
      setWorkSummary((prev) => ({
        ...prev,
        custom_regular_wage: prev.custom_regular_wage ?? employee.wage_hour,
        custom_overtime_wage: prev.custom_overtime_wage ?? employee.wage_overtime,
      }));
    }
  }, [employee, workSummary]);

  // Fetch employee data
  const fetchEmployee = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAPICall(`/api/employee/${id}`);
      if (data) {
        setEmployee(data);
      } else {
        showNotification('warning', t('MSG.failedToFetchEmployee'));
      }
    } catch (error) {
      console.error('Error loading employee:', error);
      showNotification('warning', `${t('MSG.error')}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [id, showNotification, t]);

  useEffect(() => {
    fetchEmployee();
  }, [fetchEmployee]);

  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      showNotification('warning', t('MSG.selectBothDates'));
      return;
    }

    const requestData = {
      employee_id: parseInt(id),
      start_date: startDate,
      end_date: endDate,
      working_hours: 8
    };

    try {
      const response = await post('/api/workSummary', requestData);
      if (response) {
        setWorkSummary(response);
      } else {
        showNotification('warning', t('MSG.failedToFetchWorkSummary'));
      }
    } catch (error) {
      console.error('Error fetching work summary:', error);
      showNotification('warning', `${t('MSG.error')}: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    const regularWage = workSummary.custom_regular_wage ?? employee.wage_hour;
    const overtimeWage = workSummary.custom_overtime_wage ?? employee.wage_overtime;

    const salary_amount =
      (workSummary.regular_hours * regularWage) +
      (workSummary.overtime_hours * overtimeWage);

    const payload = {
      start_date: startDate,
      end_date: endDate,
      employee_id: parseInt(id),
      payed_amount: workSummary.payed_amount,
      salary_amount,
      payment_type: workSummary.payment_type,
    };

    try {
      const res = await post('/api/payment', payload);
      if (res) {
        showNotification('success', t('MSG.paymentSubmittedSuccess'));
        setWorkSummary((prev) => ({
          ...prev,
          custom_regular_wage: '',
          custom_overtime_wage: '',
          payed_amount: '',
          pending_payment: 0,
          payment_type: '',
        }));
      } else {
        showNotification('warning', t('MSG.failedToSubmitPayment'));
      }
    } catch (error) {
      console.error('Payment Error:', error);
      showNotification('warning', `${t('MSG.error')}: ${error.message}`);
    }
  };

  const fetchDocuments = async () => {
    try {
      const res = await getAPICall(`/api/documents/${id}`);
      return res.map((doc) => {
        const isPdf = doc.document_link.startsWith('JVBER');
        if (isPdf) {
          const byteCharacters = atob(doc.document_link);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          return {
            name: doc.document_type_name,
            type: 'pdf',
            url,
          };
        } else {
          return {
            name: doc.document_type_name,
            type: 'image',
            url: `data:image/jpeg;base64,${doc.document_link}`,
          };
        }
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
      showNotification('warning', `${t('MSG.error')}: ${error.message}`);
      return [];
    }
  };

  const handleViewDocuments = async () => {
    setViewDocuments(prev => !prev);
    if (!viewDocuments) {
      try {
        const docs = await fetchDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error('Error fetching documents:', err);
        showNotification('warning', `${t('MSG.error')}: ${err.message}`);
      }
    }
  };

  const handleOpenDocument = (doc) => {
    const isMobile = window.innerWidth <= 768;
    if (doc.type === 'pdf' && isMobile) {
      window.open(doc.url, '_blank');
    } else {
      setSelectedDocument(doc);
      setModalVisible(true);
    }
  };

  const handleDownload = () => {
    if (selectedDocument && selectedDocument.url) {
      const link = document.createElement('a');
      link.href = selectedDocument.url;
      const extension = selectedDocument.type === 'pdf' ? 'pdf' : 'png';
      const employeeName = employee?.name?.replace(/\s+/g, '_') || 'Document';
      const docName = selectedDocument.name?.replace(/\s+/g, '_') || 'file';
      link.download = `${employeeName}-${docName}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleEditEmployee = () => {
    navigate(`/editEmployeeDetails/${id}`, {
      state: {
        employeeData: employee,
        isEdit: true
      }
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getWorkTypeBadgeColor = (workType) => {
    switch (workType) {
      case 'fulltime':
        return 'success';
      case 'contract':
        return 'warning';
      case 'parttime':
        return 'info';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  if (!employee) {
    return <p>{t('MSG.employeeNotFound')}</p>;
  }

  return (
    <CContainer fluid className="px-3 px-md-4">
      {notification.show && (
        <CAlert color={notification.type} dismissible onClose={() => setNotification({ show: false, type: '', message: '' })}>
          {notification.message}
        </CAlert>
      )}

      <CButton
        color="secondary"
        variant="outline"
        size="sm"
        onClick={() => navigate(-1)}
        className="d-flex align-items-center gap-2 mb-2"
      >
        <CIcon icon={cilArrowLeft} className="me-0" />
        {t('LABELS.back')}
      </CButton>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mt-3">
        <div className="mb-2 mb-md-0">
          <h4 className="mb-1 fw-bold text-dark">{employee.name}</h4>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <CBadge color={getWorkTypeBadgeColor(employee.work_type)} className="text-capitalize">
              {t(`LABELS.${employee.work_type}`)}
            </CBadge>
            <small className="text-muted">{t('LABELS.id')}: {employee.id}</small>
          </div>
        </div>

        <div className="merged-button-wrapper d-none d-md-flex">
          <CButton
            color="warning"
            className="merged-button edit-button"
            onClick={handleEditEmployee}
          >
            <CIcon icon={cilPencil} className="me-2" />
            {t('LABELS.editEmployeeDetails')}
          </CButton>
          <CButton
            color="primary"
            className="merged-button view-button"
            onClick={handleViewDocuments}
          >
            <CIcon icon={cilMagnifyingGlass} className="me-2" />
            {t('LABELS.viewDocuments')}
          </CButton>
        </div>
      </div>

      <CRow className="g-2 g-md-3 mb-3">
        <CCol xs={12} md={6} lg={4}>
          <CCard className="h-100 shadow-sm border-0 rounded-3 sleek-border-card">
            <CCardBody className="p-2 p-md-2">
              <div className="d-flex align-items-center mb-1 mb-md-1">
                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3 d-none d-md-flex">
                  <CIcon icon={cilPhone} className="text-primary" />
                </div>
                <div>
                  <h6 className="mb-0 text-muted">
                    <CIcon icon={cilPhone} className="text-primary me-2 d-md-none" />
                    {t('LABELS.contactDetails')}
                  </h6>
                </div>
              </div>
              <div className="row">
                <div className="col-6 col-md-6">
                  <small className="text-muted d-block">{t('LABELS.mobile')}</small>
                  <h6 className="mb-0 fw-semibold d-md-none">{employee.mobile}</h6>
                  <h6 className="mb-0 fw-semibold d-none d-md-block">{employee.mobile}</h6>
                </div>
                <div className="col-6 col-md-6">
                  <small className="text-muted d-block">{t('LABELS.aadhaar')}</small>
                  <h6 className="mb-0 fw-semibold">{employee.adhaar_number}</h6>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} md={6} lg={4}>
          <CCard className="h-100 shadow-sm border-0 rounded-3 sleek-border-card">
            <CCardBody className="p-2 p-md-2">
              <div className="d-flex align-items-center mb-1 mb-md-1">
                <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3 d-none d-md-flex">
                  <CIcon icon={cilMoney} className="text-success" />
                </div>
                <div>
                  <h6 className="mb-0 text-muted">
                    <CIcon icon={cilMoney} className="text-success me-2 d-md-none" />
                    {t('LABELS.wageDetails')}
                  </h6>
                </div>
              </div>
              <div className="row">
                <div className="col-6 col-md-6">
                  <small className="text-muted d-block">{t('LABELS.regular')}</small>
                  <div className="d-flex align-items-center">
                    <h6 className="mb-0 fw-semibold text-success d-md-none">{formatCurrency(employee.wage_hour)} </h6>
                    <h5 className="mb-0 fw-semibold text-success d-none d-md-block">{formatCurrency(employee.wage_hour)} </h5>
                    <small className="text-muted me-1">{t('LABELS.perHour')}</small>
                  </div>
                </div>
                <div className="col-6 col-md-6">
                  <small className="text-muted d-block">{t('LABELS.overtime')}</small>
                  <div className="d-flex align-items-center">
                    <h6 className="mb-0 fw-semibold text-warning d-md-none">{formatCurrency(employee.wage_overtime)} </h6>
                    <h5 className="mb-0 fw-semibold text-warning d-none d-md-block">{formatCurrency(employee.wage_overtime)} </h5>
                    <small className="text-muted me-1">{employee.overtime_type === "hourly" ? t('LABELS.perHour') : t('LABELS.perDay')}</small>
                  </div>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol xs={12} md={6} lg={4}>
          <CCard className="h-100 shadow-sm border-0 rounded-3 sleek-border-card">
            <CCardBody className="p-2 p-md-2">
              <div className="d-flex align-items-center mb-1 mb-md-1">
                <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3 d-none d-md-flex">
                  <CIcon icon={cilWallet} className="text-info" />
                </div>
                <div>
                  <h6 className="mb-0 text-muted">
                    <CIcon icon={cilWallet} className="text-info me-2 d-md-none" />
                    {t('LABELS.financialSummary')}
                  </h6>
                </div>
              </div>
              <div className="row">
                <div className="col-6 col-md-6">
                  <small className="text-muted d-block">{t('LABELS.credit')}</small>
                  <h6 className="mb-1 fw-semibold text-success d-md-none">{formatCurrency(employee.credit)}</h6>
                  <h5 className="mb-2 fw-semibold text-success d-none d-md-block">{formatCurrency(employee.credit)}</h5>
                </div>
                <div className="col-6 col-md-6">
                  <small className="text-muted d-block">{t('LABELS.debit')}</small>
                  <h6 className="mb-0 fw-semibold text-danger d-md-none">{formatCurrency(employee.debit)}</h6>
                  <h5 className="mb-0 fw-semibold text-danger d-none d-md-block">{formatCurrency(employee.debit)}</h5>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <div className="d-md-none mb-3">
        <div className="merged-button-wrapper d-flex justify-content-center">
          <CButton
            color="warning"
            className="merged-button edit-button d-flex justify-content-center align-items-center"
            onClick={handleEditEmployee}
          >
            <CIcon icon={cilPencil} className="me-2" />
            {t('LABELS.editEmployeeDetails')}
          </CButton>
          <CButton
            color="primary"
            className="merged-button view-button d-flex justify-content-center align-items-center"
            onClick={handleViewDocuments}
          >
            <CIcon icon={cilMagnifyingGlass} className="me-2" />
            {t('LABELS.viewDocuments')}
          </CButton>
        </div>
      </div>

      <CCollapse visible={viewDocuments}>
        <CCard className="mb-3 shadow-sm border-0 rounded-3">
          <CCardHeader className="bg-light border-0 rounded-top-3 py-2 py-md-3">
            <h6 className="mb-0 fw-semibold">
              <i className="fas fa-folder-open me-2"></i>
              {t('LABELS.employeeDocuments')}
            </h6>
          </CCardHeader>
          <CCardBody className="p-3 p-md-4">
            {documents.length === 0 ? (
              <div className="text-center py-3 py-md-5">
                <i className="fas fa-file-alt text-muted" style={{ fontSize: '2rem' }}></i>
                <p className="text-muted mt-2 mb-0">{t('MSG.noDocumentsAvailable')}</p>
              </div>
            ) : (
              <CRow className="g-2 g-md-3">
                {documents.map((doc, index) => (
                  <CCol key={index} xs={6} sm={6} md={4} lg={3}>
                    <CCard className="h-100 shadow-sm border-0 rounded-3 document-card">
                      <CCardBody className="p-2 p-md-3 d-flex flex-column">
                        <div className="text-center mb-2 mb-md-3">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2 p-md-3 d-inline-flex">
                            <i className="fas fa-file-image text-primary" style={{ fontSize: '1rem' }}></i>
                          </div>
                        </div>
                        <h6 className="text-center mb-2 mb-md-3 fw-semibold text-truncate" style={{ fontSize: '0.85rem' }}>
                          {doc.name || t('LABELS.unknownDocument')}
                        </h6>
                        <div className="mt-auto">
                          <CButton
                            color="primary"
                            size="sm"
                            className="w-100 rounded-pill"
                            style={{ fontSize: '0.75rem' }}
                            onClick={() => handleOpenDocument(doc)}
                          >
                            <i className="fas fa-eye me-1"></i>
                            {t('LABELS.view')}
                          </CButton>
                        </div>
                      </CCardBody>
                    </CCard>
                  </CCol>
                ))}
              </CRow>
            )}
          </CCardBody>
        </CCard>
      </CCollapse>

      <CModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        size="xl"
        fullscreen="md"
        className="document-modal"
      >
        <CModalHeader className="border-0 pb-0">
          <CModalTitle className="d-flex align-items-center">
            <i className="fas fa-file-alt me-2 text-primary"></i>
            {selectedDocument?.name || t('LABELS.documentPreview')}
          </CModalTitle>
        </CModalHeader>
        <CModalBody style={{ height: '75vh', padding: '1rem' }}>
          {selectedDocument?.url ? (
            selectedDocument?.type === 'pdf' ? (
              <iframe
                src={selectedDocument.url}
                title={selectedDocument?.name}
                width="100%"
                height="100%"
                style={{ border: 'none', minHeight: '400px' }}
              />
            ) : (
              <div className="d-flex justify-content-center align-items-center h-100">
                <img
                  src={selectedDocument.url}
                  alt={selectedDocument?.name}
                  className="img-fluid rounded shadow-sm"
                  style={{ maxHeight: '100%', maxWidth: '100%' }}
                />
              </div>
            )
          ) : (
            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
              <i className="fas fa-file-alt" style={{ fontSize: '4rem' }}></i>
              <p className="mt-3">{t('LABELS.documentPreview')}</p>
            </div>
          )}
        </CModalBody>
        <CModalFooter className="border-0 pt-0">
          <CButton
            color="primary"
            onClick={handleDownload}
            className="me-2"
          >
            <i className="fas fa-download me-1"></i>
            {t('LABELS.download')}
          </CButton>
          <CButton
            color="secondary"
            variant="outline"
            onClick={() => setModalVisible(false)}
          >
            {t('LABELS.close')}
          </CButton>
        </CModalFooter>
      </CModal>

      <CCard className="shadow-sm border-0 rounded-3">
        <CCardHeader className="bg-light border-0 rounded-top-3">
          <h6 className="mb-0 fw-semibold">
            <i className="fas fa-chart-line me-2"></i>
            {t('LABELS.workHistoryAndReports')}
          </h6>
        </CCardHeader>
        <CCardBody className="p-0">
          {employee.work_type === 'fulltime' ? (
            <CTabs activeItemKey={activeTab} onActiveItemChange={setActiveTab} defaultActiveItemKey="month">
              <CTabList variant="pills" className="p-3 pb-0">
                <CTab itemKey="month" className="rounded-pill me-2">
                  <i className="fas fa-calendar-alt me-1"></i>
                  {t('LABELS.monthly')}
                </CTab>
                <CTab itemKey="Week" className="rounded-pill me-2">
                  <i className="fas fa-calendar-week me-1"></i>
                  {t('LABELS.weekly')}
                </CTab>
                <CTab itemKey="Custom" className="rounded-pill">
                  <i className="fas fa-calendar-day me-1"></i>
                  {t('LABELS.custom')}
                </CTab>
              </CTabList>
              <CTabContent>
                <CTabPanel className="p-3" itemKey="month">
                  <Monthly id={id} employee={employee}/>
                </CTabPanel>
                <CTabPanel className="p-3" itemKey="Week">
                  <Weekly id={id} employee={employee}/>
                </CTabPanel>
                <CTabPanel className="p-3" itemKey="Custom">
                  <Customly id={id} employee={employee}/>
                </CTabPanel>
              </CTabContent>
            </CTabs>
          ) : (
            <div className="p-3">
              <Contract id={id} employee={employee}/>
            </div>
          )}
        </CCardBody>
      </CCard>

      <style jsx>{`
        .document-card {
          transition: all 0.3s ease;
        }

        .document-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1) !important;
        }

        .document-modal .modal-content {
          border-radius: 1rem;
        }

        .nav-pills .nav-link {
          border-radius: 50px !important;
          padding: 0.5rem 1rem;
          font-weight: 500;
        }

        .nav-pills .nav-link.active {
          background-color: #007bff !important;
        }

        .bg-opacity-10 {
          background-color: rgba(var(--bs-primary-rgb), 0.1) !important;
        }

        .card {
          transition: all 0.3s ease;
        }

        .card:hover {
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1) !important;
        }

        .rounded-3 {
          border-radius: 1rem !important;
        }

        .rounded-top-3 {
          border-top-left-radius: 1rem !important;
          border-top-right-radius: 1rem !important;
        }

        .rounded-pill {
          border-radius: 50px !important;
        }

        /* Sleek Revolving Border Animation */
        .sleek-border-card {
          position: relative;
          overflow: hidden;
        }

        .sleek-border-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 1rem;
          padding: 2px;
          background: linear-gradient(45deg,
            #ff6b6b, /* Vibrant coral */
            #ff8e53, /* Warm orange */
            #ff6b6b,
            #ff8e53,
            #ff6b6b
          );
          background-size: 200% 200%;
          animation: revolvingBorder 4s linear infinite;
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask-composite: xor;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          z-index: 1;
        }

        .sleek-border-card .card-body {
          position: relative;
          z-index: 2;
          background: white;
          border-radius: calc(1rem - 2px);
          margin: 2px;
        }

        @keyframes revolvingBorder {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 200% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .merged-button-wrapper {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .merged-button {
          border-radius: 8px !important;
          padding: 0.75rem 1.5rem;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .edit-button {
          background: linear-gradient(45deg, #f0ad4e, #f7c65e);
          border: none;
          color: white;
        }

        .view-button {
          background: linear-gradient(45deg, #007bff, #4dabf7);
          border: none;
          color: white;
        }

        .edit-button:hover {
          background: linear-gradient(45deg, #e0a042, #e6b952);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .view-button:hover {
          background: linear-gradient(45deg, #0069d9, #339af0);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        @media (max-width: 768px) {
          .merged-button-wrapper {
            flex-direction: column;
            width: 100%;
          }

          .merged-button {
            width: 100%;
            padding: 0.65rem 1rem;
            font-size: 0.85rem;
            border-radius: 6px !important;
          }

          .modal-xl {
            max-width: 95% !important;
          }
        }

        @media (min-width: 769px) {
          .merged-button {
            min-width: 180px;
          }
        }
      `}</style>
    </CContainer>
  );
};

export default EmployeeDetailsPage;
//------------------------------------------------------------------------------------------------


// import React, { useEffect, useState } from 'react';
// import { useParams,useNavigate } from 'react-router-dom';
// import {
//   CContainer, CCard, CCardBody, CCardHeader, CRow, CCol, CTable, CTableHead,
//   CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CSpinner,
//   CFormInput, CButton,
//   CFormSelect,
//   CCollapse,
//   CModal,
//   CModalHeader,
//   CModalTitle,
//   CModalBody,
//   CModalFooter,
//   CTab, CTabContent, CTabList, CTabPanel, CTabs,
//   CBadge
// } from '@coreui/react';
// import CIcon from '@coreui/icons-react';
// import { getAPICall, post } from '../../../util/api';
// import { useTranslation } from 'react-i18next';
// import Calendar from 'react-calendar';
// import 'react-calendar/dist/Calendar.css';
// import Monthly from './ShowingDataPage/monthly';
// import Weekly from './ShowingDataPage/weekly';
// import Customly from './ShowingDataPage/customly';
// import Contract from './ShowingDataPage/contract';
// import { cilArrowLeft } from '@coreui/icons';

// const EmployeeDetailsPage = () => {
// const { t, i18n } = useTranslation("global");
//   const { id } = useParams();
//     const navigate = useNavigate();
//   const [employee, setEmployee] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [startDate, setStartDate] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [workSummary, setWorkSummary] = useState(null);

//   const [viewDocuments, setViewDocuments] = useState(false);
//   const [documents, setDocuments] = useState([]);
//   const [selectedDocument, setSelectedDocument] = useState(null);
//   const [modalVisible, setModalVisible] = useState(false);

//    const [activeTab, setActiveTab] = useState('month')



//   useEffect(() => {
//     if (employee && workSummary) {
//       setWorkSummary((prev) => ({
//         ...prev,
//         custom_regular_wage: prev.custom_regular_wage ?? employee.wage_hour,
//         custom_overtime_wage: prev.custom_overtime_wage ?? employee.wage_overtime,
//       }));
//     }
//   }, [employee, workSummary]);

//   useEffect(() => {
//     getAPICall(`/api/employee/${id}`)
//       .then(data => {
//         setEmployee(data);
//         setLoading(false);
//       })
//       .catch(error => {
//         console.error('Error loading employee:', error);
//         setLoading(false);
//       });
//   }, [id]);

//   const handleCalculate = async () => {
//     if (!startDate || !endDate) {
//       alert('Please select both start and end dates.');
//       return;

//     }

//     const requestData = {
//       employee_id: parseInt(id),
//       start_date: startDate,
//       end_date: endDate,
//       working_hours: 8
//     };

//     try {
//       const response = await post('/api/workSummary', requestData);
//       const data =  response;
//       setWorkSummary(data);

//     } catch (error) {
//       console.error('Error fetching work summary:', error);
//     }
//   };



//   if (loading) return <CSpinner color="primary" />;
//   if (!employee) return <p>Employee not found.</p>;





// const handleSubmit = async () => {
//   const regularWage = workSummary.custom_regular_wage ?? employee.wage_hour;
//   const overtimeWage = workSummary.custom_overtime_wage ?? employee.wage_overtime;

//   const salary_amount =
//     (workSummary.regular_hours * regularWage) +
//     (workSummary.overtime_hours * overtimeWage);

//   const payload = {
//     start_date: startDate,
//     end_date: endDate,
//     employee_id: parseInt(id),
//     payed_amount: workSummary.payed_amount,
//     salary_amount,
//     payment_type: workSummary.payment_type,
//   };

//   try {
//     const res = await post('/api/payment', payload);
//     const data = await res
//     console.log('Payment Submitted:', data);
//     alert('Payment submitted successfully!');
//       setWorkSummary((prev) => ({
//       ...prev,
//       custom_regular_wage: '',
//       custom_overtime_wage: '',
//       payed_amount: '',
//       pending_payment: 0,
//       payment_type: '',
//     }));
//   } catch (err) {
//     console.error('Payment Error:', err);
//     alert('Something went wrong while submitting payment.');
//   }
// };

// //  const HandleViewDocuments = async() =>{
// //     console.log("xyz");
// //     // setViewDocuments(true);
// //     setViewDocuments(prev => !prev);

// //  }

// //  _____________________________________________________________________________


// // const fetchDocuments = async () => {
// //   try {
// //     const res = await getAPICall(`/api/documents/${id}`);
// //     const data = await res; // ✅ make sure to parse JSON
// //     // console.log("res",res);


// //     return data.map((doc) => ({
// //       name: doc.document_type_name,
// //       url: `data:image/png;base64,${doc.document_link}`, // ✅ Image instead of PDF
// //     }));
// //   } catch (error) {
// //     console.error('Error fetching documents:', error);
// //     return [];
// //   }
// // };
// const fetchDocuments = async () => {
//   try {
//     const res = await getAPICall(`/api/documents/${id}`);

//     return res.map((doc) => {
//       const isPdf = doc.document_link.startsWith('JVBER'); // Base64-encoded PDF always starts with 'JVBER'

//       if (isPdf) {
//         // Convert base64 string to Blob and create object URL
//         const byteCharacters = atob(doc.document_link);
//         const byteNumbers = new Array(byteCharacters.length);
//         for (let i = 0; i < byteCharacters.length; i++) {
//           byteNumbers[i] = byteCharacters.charCodeAt(i);
//         }
//         const byteArray = new Uint8Array(byteNumbers);
//         const blob = new Blob([byteArray], { type: 'application/pdf' });
//         const url = URL.createObjectURL(blob);

//         return {
//           name: doc.document_type_name,
//           type: 'pdf',
//           url,
//         };
//       } else {
//         // Assume image
//         return {
//           name: doc.document_type_name,
//           type: 'image',
//           url: `data:image/jpeg;base64,${doc.document_link}`,
//         };
//       }
//     });
//   } catch (error) {
//     console.error('Error fetching documents:', error);
//     return [];
//   }
// };






//   const handleViewDocuments = async () => {
//     setViewDocuments(prev => !prev);

//     if (!viewDocuments) {
//       try {
//         const docs = await fetchDocuments();
//         setDocuments(docs);
//       } catch (err) {
//         console.error('Error fetching documents:', err);
//       }
//     }
//   };

//   // const handleOpenDocument = (doc) => {
//   //   setSelectedDocument(doc);
//   //   setModalVisible(true);
//   // };
//   const handleOpenDocument = (doc) => {
//   const isMobile = window.innerWidth <= 768;

//   if (doc.type === 'pdf' && isMobile) {
//     // Open PDF in new tab for mobile
//     window.open(doc.url, '_blank');
//   } else {
//     // Use modal for image or desktop PDF
//     setSelectedDocument(doc);
//     setModalVisible(true);
//   }
// };


// //   const handleDownload = () => {
// //   if (selectedDocument && selectedDocument.url) {
// //     const link = document.createElement('a');
// //     link.href = selectedDocument.url;

// //     // 👇 Customize download file name
// //     const employeeName = employee?.name || 'Document';
// //     const docName = selectedDocument.name || 'file';
// //     link.download = `${employeeName} - ${docName}`;

// //     document.body.appendChild(link);
// //     link.click();
// //     document.body.removeChild(link);
// //   }
// // };
// const handleDownload = () => {
//   if (selectedDocument && selectedDocument.url) {
//     const link = document.createElement('a');
//     link.href = selectedDocument.url;
//     const extension = selectedDocument.type === 'pdf' ? 'pdf' : 'png';
//     const employeeName = employee?.name?.replace(/\s+/g, '_') || 'Document';
//     const docName = selectedDocument.name?.replace(/\s+/g, '_') || 'file';
//     link.download = `${employeeName}-${docName}.${extension}`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   }
// };

// // Handle edit employee details
//   const handleEditEmployee = () => {
//     // Navigate to Employee_Registration with employee data
//     navigate(`/editEmployeeDetails/${id}`, {
//       state: {
//         employeeData: employee,
//         isEdit: true
//       }
//     });
//   };

//   // Helper function to format currency
//   const formatCurrency = (amount) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       maximumFractionDigits: 0
//     }).format(amount);
//   };

//   // Helper function to get work type badge color
//   const getWorkTypeBadgeColor = (workType) => {
//     switch (workType) {
//       case 'fulltime':
//         return 'success';
//       case 'contract':
//         return 'warning';
//       case 'parttime':
//         return 'info';
//       default:
//         return 'secondary';
//     }
//   };

// // _______________________________________________________________________________


//   return (
//     <CContainer fluid className="px-3 px-md-4">
//       <CButton
//       color="secondary"
//       variant="outline"
//       size="sm"
//       onClick={() => navigate(-1)}
//       className="d-flex align-items-center gap-2 mb-2"
//     >
//       <CIcon icon={cilArrowLeft} className="me-0" />
//       Back
//     </CButton>
//       {/* Header Section */}
//       <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 mt-3">
//         <div className="mb-2 mb-md-0">
//           <h4 className="mb-1 fw-bold text-dark">{employee.name}</h4>
//           <div className="d-flex flex-wrap gap-2 align-items-center">
//             <CBadge color={getWorkTypeBadgeColor(employee.work_type)} className="text-capitalize">
//               {employee.work_type}
//             </CBadge>
//             <small className="text-muted">ID: {employee.id}</small>
//           </div>
//         </div>


//         <div className="d-flex gap-2 d-md-flex d-none">
//           <CButton
//             color="warning"
//             variant="outline"
//             onClick={handleEditEmployee}
//             className="d-flex align-items-center gap-2"
//           >
//             {/* <i className="fas fa-edit"></i> */}
//             Edit Employee Details
//           </CButton>
//           <CButton
//             color="primary"
//             variant="outline"
//             onClick={handleViewDocuments}
//             className="d-flex align-items-center gap-2"
//           >
//             <i className="fas fa-file-alt"></i>
//             {viewDocuments ? t('LABELS.hideDocuments') : t('LABELS.viewDocuments')}
//           </CButton>
//         </div>
//       </div>





//       {/* Employee Information Cards */}
//       <CRow className="g-2 g-md-3 mb-3">
//         {/* Contact Information - Mobile: Full width, Desktop: Same */}
//         <CCol xs={12} md={6} lg={4}>
//           <CCard className="h-100 shadow-sm border-0 rounded-3">
//             <CCardBody className="p-3 p-md-4">
//               <div className="d-flex align-items-center mb-2 mb-md-3">
//                 <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3 d-none d-md-flex">
//                   <i className="fas fa-phone text-primary"></i>
//                 </div>
//                 <div>
//                   <h6 className="mb-0 text-muted">
//                     <i className="fas fa-phone text-primary me-2 d-md-none"></i>
//                     Contact Details
//                   </h6>
//                 </div>
//               </div>
//               <div className="row">
//                 <div className="col-6 col-md-12 mb-2 mb-md-3">
//                   <small className="text-muted d-block">Mobile</small>
//                   <h6 className="mb-0 fw-semibold d-md-none">{employee.mobile}</h6>
//                   <h5 className="mb-0 fw-semibold d-none d-md-block">{employee.mobile}</h5>
//                 </div>
//                 <div className="col-6 col-md-12">
//                   <small className="text-muted d-block">Aadhaar</small>
//                   <h6 className="mb-0 fw-semibold">{employee.adhaar_number}</h6>
//                 </div>
//               </div>
//             </CCardBody>
//           </CCard>
//         </CCol>

//         {/* Wage Information */}
//         <CCol xs={12} md={6} lg={4}>
//           <CCard className="h-100 shadow-sm border-0 rounded-3">
//             <CCardBody className="p-3 p-md-4">
//               <div className="d-flex align-items-center mb-2 mb-md-3">
//                 <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3 d-none d-md-flex">
//                   <i className="fas fa-rupee-sign text-success"></i>
//                 </div>
//                 <div>
//                   <h6 className="mb-0 text-muted">
//                     <i className="fas fa-rupee-sign text-success me-2 d-md-none"></i>
//                     Wage Details
//                   </h6>
//                 </div>
//               </div>
//               <div className="row">
//                 <div className="col-6">
//                   <small className="text-muted d-block">Regular</small>
//                   <h6 className="mb-0 fw-semibold text-success d-md-none">{formatCurrency(employee.wage_hour)}</h6>
//                   <h5 className="mb-0 fw-semibold text-success d-none d-md-block">{formatCurrency(employee.wage_hour)}</h5>
//                   <small className="text-muted d-none d-md-block">per hour</small>
//                 </div>
//                 <div className="col-6">
//                   <small className="text-muted d-block">Overtime</small>
//                   <h6 className="mb-0 fw-semibold text-warning d-md-none">{formatCurrency(employee.wage_overtime)}</h6>
//                   <h5 className="mb-0 fw-semibold text-warning d-none d-md-block">{formatCurrency(employee.wage_overtime)}</h5>
//                   <small className="text-muted d-none d-md-block">{employee.overtime_type=="hourly" ?"per hour":"per day"}</small>
//                 </div>
//               </div>
//             </CCardBody>
//           </CCard>
//         </CCol>

//         {/* Financial Summary */}
//         <CCol xs={12} md={6} lg={4}>
//           <CCard className="h-100 shadow-sm border-0 rounded-3">
//             <CCardBody className="p-3 p-md-4">
//               <div className="d-flex align-items-center mb-2 mb-md-3">
//                 <div className="bg-info bg-opacity-10 rounded-circle p-2 me-3 d-none d-md-flex">
//                   <i className="fas fa-wallet text-info"></i>
//                 </div>
//                 <div>
//                   <h6 className="mb-0 text-muted">
//                     <i className="fas fa-wallet text-info me-2 d-md-none"></i>
//                     Financial Summary
//                   </h6>
//                 </div>
//               </div>
//               <div className="row">
//                 <div className="col-6">
//                   <small className="text-muted d-block">Credit</small>
//                   <h6 className="mb-1 fw-semibold text-success d-md-none">{formatCurrency(employee.credit)}</h6>
//                   <h5 className="mb-2 fw-semibold text-success d-none d-md-block">{formatCurrency(employee.credit)}</h5>
//                   <small className="text-muted d-block">Debit</small>
//                   <h6 className="mb-0 fw-semibold text-danger d-md-none">{formatCurrency(employee.debit)}</h6>
//                   <h5 className="mb-0 fw-semibold text-danger d-none d-md-block">{formatCurrency(employee.debit)}</h5>
//                 </div>
//                 <div className="col-6">
//                   <small className="text-muted d-block">Referred By</small>
//                   <h6 className="mb-2 fw-semibold">{employee.refferal_by || '-'}</h6>
//                   <small className="text-muted d-block">Refferal Mobile</small>
//                   <h6 className="mb-0 fw-semibold">{employee.refferal_number || '-'}</h6>
//                 </div>
//               </div>
//             </CCardBody>
//           </CCard>
//         </CCol>
//       </CRow>

//       {/* Mobile Documents Button */}
//       <div className="d-md-none mb-3">
//        <div className="d-md-none mb-3">
//         <CRow className="g-2">
//           <CCol xs={12}>
//             <CButton
//               color="warning"
//               variant="outline"
//               onClick={handleEditEmployee}
//               className="w-100 d-flex align-items-center justify-content-center gap-2"
//             >
//               <i className="fas fa-edit"></i>
//               Edit Employee Details
//             </CButton>
//           </CCol>
//           <CCol xs={12}>
//             <CButton
//               color="primary"
//               variant="outline"
//               onClick={handleViewDocuments}
//               className="w-100 d-flex align-items-center justify-content-center gap-2"
//             >
//               <i className="fas fa-file-alt"></i>
//               {viewDocuments ? t('LABELS.hideDocuments') : t('LABELS.viewDocuments')}
//             </CButton>
//           </CCol>
//         </CRow>
//       </div>

//       </div>

//       {/* Collapsible Document Section */}
//       <CCollapse visible={viewDocuments}>
//         <CCard className="mb-3 shadow-sm border-0 rounded-3">
//           <CCardHeader className="bg-light border-0 rounded-top-3 py-2 py-md-3">
//             <h6 className="mb-0 fw-semibold">
//               <i className="fas fa-folder-open me-2"></i>
//               Employee Documents
//             </h6>
//           </CCardHeader>
//           <CCardBody className="p-3 p-md-4">
//             {documents.length === 0 ? (
//               <div className="text-center py-3 py-md-5">
//                 <i className="fas fa-file-alt text-muted" style={{ fontSize: '2rem' }}></i>
//                 <p className="text-muted mt-2 mb-0">No documents available</p>
//               </div>
//             ) : (
//               <CRow className="g-2 g-md-3">
//                 {documents.map((doc, index) => (
//                   <CCol key={index} xs={6} sm={6} md={4} lg={3}>
//                     <CCard className="h-100 shadow-sm border-0 rounded-3 document-card">
//                       <CCardBody className="p-2 p-md-3 d-flex flex-column">
//                         <div className="text-center mb-2 mb-md-3">
//                           <div className="bg-primary bg-opacity-10 rounded-circle p-2 p-md-3 d-inline-flex">
//                             <i className="fas fa-file-image text-primary" style={{ fontSize: '1rem' }}></i>
//                           </div>
//                         </div>
//                         <h6 className="text-center mb-2 mb-md-3 fw-semibold text-truncate" style={{ fontSize: '0.85rem' }}>
//                           {doc.name || 'Unknown Document'}
//                         </h6>
//                         <div className="mt-auto">
//                           <CButton
//                             color="primary"
//                             size="sm"
//                             className="w-100 rounded-pill"
//                             style={{ fontSize: '0.75rem' }}
//                             onClick={() => handleOpenDocument(doc)}
//                           >
//                             <i className="fas fa-eye me-1"></i>
//                             View
//                           </CButton>
//                         </div>
//                       </CCardBody>
//                     </CCard>
//                   </CCol>
//                 ))}
//               </CRow>
//             )}
//           </CCardBody>
//         </CCard>
//       </CCollapse>

//       {/* Document Preview Modal */}
//       <CModal
//         visible={modalVisible}
//         onClose={() => setModalVisible(false)}
//         size="xl"
//         fullscreen="md"
//         className="document-modal"
//       >
//         <CModalHeader className="border-0 pb-0">
//           <CModalTitle className="d-flex align-items-center">
//             <i className="fas fa-file-alt me-2 text-primary"></i>
//             {selectedDocument?.document_type_name || 'Document Preview'}
//           </CModalTitle>
//         </CModalHeader>

//   <CModalBody style={{ height: '75vh', padding: '1rem' }}>
//   {selectedDocument?.url ? (
//     selectedDocument?.type === 'pdf' ? (
//       <iframe
//         src={selectedDocument.url}
//         title={selectedDocument?.name}
//         width="100%"
//         height="100%"
//         style={{ border: 'none', minHeight: '400px' }}
//       />
//     ) : (
//       <div className="d-flex justify-content-center align-items-center h-100">
//         <img
//           src={selectedDocument.url}
//           alt={selectedDocument?.name}
//           className="img-fluid rounded shadow-sm"
//           style={{ maxHeight: '100%', maxWidth: '100%' }}
//         />
//       </div>
//     )
//   ) : (
//     <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
//       <i className="fas fa-file-alt" style={{ fontSize: '4rem' }}></i>
//       <p className="mt-3">{t('LABELS.documentPreview')}</p>
//     </div>
//   )}
// </CModalBody>



//         <CModalFooter className="border-0 pt-0">
//           <CButton
//             color="primary"
//             onClick={handleDownload}
//             className="me-2"
//           >
//             <i className="fas fa-download me-1"></i>
//             {t('LABELS.download')}
//           </CButton>
//           <CButton
//             color="secondary"
//             variant="outline"
//             onClick={() => setModalVisible(false)}
//           >
//             {t('LABELS.close')}
//           </CButton>
//         </CModalFooter>
//       </CModal>

//       {/* Work Data Section */}
//       <CCard className="shadow-sm border-0 rounded-3">
//         <CCardHeader className="bg-light border-0 rounded-top-3">
//           <h6 className="mb-0 fw-semibold">
//             <i className="fas fa-chart-line me-2"></i>
//             Work History & Reports
//           </h6>
//         </CCardHeader>
//         <CCardBody className="p-0">
//           {employee.work_type === 'fulltime' ? (
//             <CTabs activeItemKey={activeTab} onActiveItemChange={setActiveTab} defaultActiveItemKey="month">
//               <CTabList variant="pills" className="p-3 pb-0">
//                 <CTab itemKey="month" className="rounded-pill me-2">
//                   <i className="fas fa-calendar-alt me-1"></i>
//                   Monthly
//                 </CTab>
//                 <CTab itemKey="Week" className="rounded-pill me-2">
//                   <i className="fas fa-calendar-week me-1"></i>
//                   Weekly
//                 </CTab>
//                 <CTab itemKey="Custom" className="rounded-pill">
//                   <i className="fas fa-calendar-day me-1"></i>
//                   Custom
//                 </CTab>
//               </CTabList>
//               <CTabContent>
//                 <CTabPanel className="p-3" itemKey="month">
//                   <Monthly id={id} employee={employee}/>
//                 </CTabPanel>
//                 <CTabPanel className="p-3" itemKey="Week">
//                   <Weekly id={id} employee={employee}/>
//                 </CTabPanel>
//                 <CTabPanel className="p-3" itemKey="Custom">
//                   <Customly id={id} employee={employee}/>
//                 </CTabPanel>
//               </CTabContent>
//             </CTabs>
//           ) : (
//             <div className="p-3">
//               <Contract id={id} employee={employee}/>
//             </div>
//           )}
//         </CCardBody>
//       </CCard>

//       {/* Custom Styles */}
//       <style jsx>{`
//         .document-card {
//           transition: all 0.3s ease;
//         }

//         .document-card:hover {
//           transform: translateY(-2px);
//           box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1) !important;
//         }

//         .document-modal .modal-content {
//           border-radius: 1rem;
//         }

//         .nav-pills .nav-link {
//           border-radius: 50px !important;
//           padding: 0.5rem 1rem;
//           font-weight: 500;
//         }

//         .nav-pills .nav-link.active {
//           background-color: #007bff !important;
//         }

//         .bg-opacity-10 {
//           background-color: rgba(var(--bs-primary-rgb), 0.1) !important;
//         }

//         .card {
//           transition: all 0.3s ease;
//         }

//         .card:hover {
//           box-shadow: 0 4px 25px rgba(0, 0, 0, 0.1) !important;
//         }

//         .rounded-3 {
//           border-radius: 1rem !important;
//         }

//         .rounded-top-3 {
//           border-top-left-radius: 1rem !important;
//           border-top-right-radius: 1rem !important;
//         }

//         .rounded-pill {
//           border-radius: 50px !important;
//         }

//         @media (max-width: 768px) {
//           .modal-xl {
//             max-width: 95% !important;
//           }
//         }
//       `}</style>
//     </CContainer>
//   );
// };

// export default EmployeeDetailsPage;
// //
