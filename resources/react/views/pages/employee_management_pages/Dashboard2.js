import React, { useEffect, useState } from 'react';
import {
  CContainer, CRow, CCol, CCard, CCardBody, CCardHeader, CTable,
  CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
  CButton, CBadge, CAvatar
} from '@coreui/react';
import { ChevronDown, ChevronRight, Users, Clock, DollarSign, TrendingUp, User, Plus, Minus } from 'lucide-react';
import { getAPICall } from '../../../util/api';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BulkEmployeeCheckInOut from './BulkEmployeeTracker';

const Dashboard2 = () => {

 const { t, i18n } = useTranslation("global");

  const [employees, setEmployees] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});

   const navigate = useNavigate();

  useEffect(() => {
  getAPICall('/api/employeeDtailsForDashboard')
      .then(data => setEmployees(data))
      .catch(err => console.error('Error fetching employee data:', err));
  }, []);

  const toggleRowExpansion = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const calculateTotal = (key) => employees.reduce((sum, e) => sum + Number(e[key] || 0), 0);
  const totalEmployees = employees.length;
  const presentEmployees = employees.filter(e => e.trackers?.some(t => t.check_in)).length;

  return (
<>
 <CContainer fluid>
      <CRow className="mb-4">
        <CCol><h3>{t('LABELS.employeeAttendance')}</h3></CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol lg={3}><StatCard title={t('LABELS.totalEmployees')} value={totalEmployees} icon={<Users />} color="primary" /></CCol>
        <CCol lg={3}><StatCard title={t('LABELS.presentToday')} value={presentEmployees} icon={<Clock />} color="success" /></CCol>
        <CCol lg={3}><StatCard title={t('LABELS.totalCredit')} value={`₹${calculateTotal('credit')}`} icon={<TrendingUp />} color="info" /></CCol>
        <CCol lg={3}><StatCard title={t('LABELS.totalDebit')} value={`₹${calculateTotal('debit')}`} icon={<DollarSign />} color="danger" /></CCol>
      </CRow>
    </CContainer>
     <BulkEmployeeCheckInOut/>
</>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <CCard className={`border-start border-${color} border-4 shadow`}>
    <CCardBody>
      <div className="d-flex justify-content-between align-items-center">
        <div>
          <small className={`text-uppercase text-${color} fw-semibold`}>{title}</small>
          <h5>{value}</h5>
        </div>
        {React.cloneElement(icon, { color: color, size: 32 })}
      </div>
    </CCardBody>
  </CCard>
);

export default Dashboard2;
