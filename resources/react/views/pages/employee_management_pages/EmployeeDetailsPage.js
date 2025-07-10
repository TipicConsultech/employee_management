
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  CContainer, CCard, CCardBody, CCardHeader, CRow, CCol, CTable, CTableHead,
  CTableRow, CTableHeaderCell, CTableBody, CTableDataCell, CSpinner,
  CFormInput, CButton,
  CFormSelect,
  CCollapse,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CTab, CTabContent, CTabList, CTabPanel, CTabs
} from '@coreui/react';
import { getAPICall, post } from '../../../util/api';
import { useTranslation } from 'react-i18next';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import Monthly from './ShowingDataPage/monthly';
import Weekly from './ShowingDataPage/weekly';
import Customly from './ShowingDataPage/customly';

const EmployeeDetailsPage = () => {
const { t, i18n } = useTranslation("global");
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [workSummary, setWorkSummary] = useState(null);

  const [viewDocuments, setViewDocuments] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

   const [activeTab, setActiveTab] = useState('month')
  


  useEffect(() => {
    if (employee && workSummary) {
      setWorkSummary((prev) => ({
        ...prev,
        custom_regular_wage: prev.custom_regular_wage ?? employee.wage_hour,
        custom_overtime_wage: prev.custom_overtime_wage ?? employee.wage_overtime,
      }));
    }
  }, [employee, workSummary]);

  useEffect(() => {
    getAPICall(`/api/employee/${id}`)
      .then(data => {
        setEmployee(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading employee:', error);
        setLoading(false);
      });
  }, [id]);

  const handleCalculate = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
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
      const data =  response;
      setWorkSummary(data);

    } catch (error) {
      console.error('Error fetching work summary:', error);
    }
  };

  

  // if (loading) return <CSpinner color="primary" />;
  // if (!employee) return <p>Employee not found.</p>;





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
    const data = await res
    console.log('Payment Submitted:', data);
    alert('Payment submitted successfully!');
      setWorkSummary((prev) => ({
      ...prev,
      custom_regular_wage: '',
      custom_overtime_wage: '',
      payed_amount: '',
      pending_payment: 0,
      payment_type: '',
    }));
  } catch (err) {
    console.error('Payment Error:', err);
    alert('Something went wrong while submitting payment.');
  }
};

 const HandleViewDocuments = async() =>{
    console.log("xyz");
    // setViewDocuments(true);
    setViewDocuments(prev => !prev); 
    
 }

//  _____________________________________________________________________________ 


const fetchDocuments = async () => {
  try {
    const res = await getAPICall(`/api/documents/${id}`);
    const data = await res; // ✅ make sure to parse JSON

    return data.map((doc) => ({
      name: doc.document_name,
      url: `data:image/png;base64,${doc.document_link}`, // ✅ Image instead of PDF
    }));
  } catch (error) {
    console.error('Error fetching documents:', error);
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
      }
    }
  };

  const handleOpenDocument = (doc) => {
    setSelectedDocument(doc);
    setModalVisible(true);
  };

  const handleDownload = () => {
    if (selectedDocument) {
      const link = document.createElement('a');
      link.href = selectedDocument.url;
      link.download = selectedDocument.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

// _______________________________________________________________________________ 


  return (
    <CContainer>
      <CCard className="mt-4  p-0">
        <CCardHeader>{t('LABELS.employeeHistory')}: {employee?.name}</CCardHeader>
        <CCardBody>
          {/* Employee Info */}
          <CRow>
            <CCol md={6}>
             <CRow className="">
  <CCol md={2}>
    <p><strong>{t('LABELS.id')}:</strong> {employee?.id}</p>
  </CCol>
  <CCol md={3}>
    <p><strong>{t('LABELS.mobile')}:</strong> {employee?.mobile}</p>
  </CCol>
  <CCol md={3}>
    <p><strong>{t('LABELS.adhaar')}:</strong> {employee?.adhaar_number}</p>
  </CCol>
  <CCol md={3}>
    <p><strong>{t('LABELS.wagePerHour')}:</strong> ₹{employee?.wage_hour}</p>
  </CCol>
</CRow>
             </CCol>




            
            <CCol md={6}>
  <CRow className="">
  <CCol md={2}>
    <p><strong>{t('LABELS.wageOT')}:</strong> ₹{employee?.wage_overtime}</p>
  </CCol>
  <CCol md={2}>
    <p><strong>{t('LABELS.credit')}:</strong>₹{employee?.credit}</p>
  </CCol>
  <CCol md={2}>
    <p><strong>{t('LABELS.debit')}:</strong> ₹{employee?.debit}</p>
  </CCol>
  <CCol md={2}>
    <p><strong>{t('LABELS.referral')}:</strong> {employee?.refferal_by}</p>
  </CCol>
  <CCol md={4}>
    {/* <CButton className='border border-primary' onClick={handleViewDocuments}>
                    {viewDocuments ? t('LABELS.hideDocuments') : t('LABELS.viewDocuments')}
                  
                </CButton> */}
  </CCol>
</CRow>

            </CCol>
          </CRow>

        
      {/* Collapsible Document List */}
      <CCollapse visible={viewDocuments}>
        <CCard className="mt-3">
          <CCardBody>
            {documents.length === 0 && <p>No documents available.</p>}
            {documents.map((doc, index) => (
              <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                <span>{doc.name}</span>
                <CButton color="link" onClick={() => handleOpenDocument(doc)}>
                  View
                </CButton>
              </div>
            ))}
          </CCardBody>
        </CCard>
      </CCollapse>

      {/* Modal for Document Preview */}
      <CModal visible={modalVisible} onClose={() => setModalVisible(false)} size="xl">
        <CModalHeader>
          <CModalTitle>{selectedDocument?.name}</CModalTitle>
        </CModalHeader>
        <CModalBody style={{ height: '80vh' }}>
          {selectedDocument?.url ? (
            <iframe
              src={selectedDocument.url}
              title={selectedDocument.name}
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          ) : (
            <p>{t('LABELS.documentPreview')}</p>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="primary" onClick={handleDownload}>{t('LABELS.download')}
</CButton>
          <CButton color="secondary" onClick={() => setModalVisible(false)}>{t('LABELS.close')}</CButton>
        </CModalFooter>
      </CModal>


{/* Section Monthly weekly custom */}
      <CTabs activeItemKey={activeTab} onActiveItemChange={setActiveTab} defaultActiveItemKey="month">
      <CTabList variant="tabs">
        <CTab itemKey="month">Month</CTab>
        <CTab itemKey="Week">Week</CTab>
        <CTab itemKey="Custom">Custom</CTab>
       
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

          {/* Filter Section */}
        
     </CCardBody>
</CCard>
  </CContainer>
  );
};

export default EmployeeDetailsPage;
// _________________________________________