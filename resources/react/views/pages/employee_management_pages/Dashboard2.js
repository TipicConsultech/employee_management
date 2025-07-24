import React, { useEffect, useState } from 'react';
import {
  CContainer, CRow, CCol, CCard, CCardBody, CCardHeader, CTable,
  CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
  CButton, CBadge, CAvatar
} from '@coreui/react';
import { ChevronDown, ChevronRight, Users, Clock, IndianRupee , TrendingUp, User, Plus, Minus } from 'lucide-react';
import { getAPICall, post } from '../../../util/api';
import { Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import BulkEmployeeCheckInOut from './BulkEmployeeTracker';


const Dashboard2 = () => {
  const { t, i18n } = useTranslation("global");
  
  const [employees, setEmployees] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  
  const navigate = useNavigate();
  
  useEffect(() => {
    post('/api/employeeDtailsForDashboard', { date: new Date().toISOString().split('T')[0] })
      .then(data => setEmployees(data))
      .catch(err => console.error('Error fetching employee data:', err));
  }, []);
  
  const toggleRowExpansion = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  
  const calculateTotal = (key) => employees.reduce((sum, e) => sum + Number(e[key] || 0), 0);
  const totalEmployees = employees.length;
  
const presentEmployees = employees.filter(e =>
  Array.isArray(e.trackers) &&
  e.trackers.some(t => t.check_in == true)  // note the double ==
).length;



  
  return (
    <>
      <CContainer fluid className="px-2 px-md-4">
        {/* Header */}
        <CRow className="mb-2 mb-md-2">
          <CCol>
            {/* <h5 className="fw-bold text-dark mb-0 fs-4 fs-md-3">
              {t('LABELS.employeeAttendance')}
            </h5> */}
            <h5 className="text-muted mt-4">{t('LABELS.dashboardOverview')} </h5>
          </CCol>
        </CRow>


        {/* Stats Cards */}
        <CRow className="g-2 g-md-3 mb-4">
          <CCol xs={6} lg={3}>
            <StatCard 
              title={t('LABELS.totalEmployees')} 
              value={totalEmployees} 
              icon={<Users />} 
              color="primary" 
              bgColor="rgba(99, 102, 241, 0.1)"
              iconBg="linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
              borderColor="#6366f1"
            />
          </CCol>
          <CCol xs={6} lg={3}>
            <StatCard 
              title={t('LABELS.presentToday')} 
              value={presentEmployees} 
              icon={<Clock />} 
              color="success" 
              bgColor="rgba(34, 197, 94, 0.1)"
              iconBg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
              borderColor="#22c55e"
            />
          </CCol>
          <CCol xs={6} lg={3}>
            <StatCard 
              title={t('LABELS.totalCredit')} 
              value={`₹${calculateTotal('credit')}`} 
              icon={<TrendingUp />} 
              color="info" 
              bgColor="rgba(59, 130, 246, 0.1)"
              iconBg="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
              borderColor="#3b82f6"
            />
          </CCol>
          <CCol xs={6} lg={3}>
            <StatCard 
              title={t('LABELS.totalDebit')} 
              value={`₹${calculateTotal('debit')}`} 
              icon={<IndianRupee/>} 
              color="warning" 
              bgColor="rgba(245, 158, 11, 0.1)"
              iconBg="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
              borderColor="#f59e0b"
            />
          </CCol>
        </CRow>
      </CContainer>


      <BulkEmployeeCheckInOut />
    </>
  );
};


const StatCard = ({ title, value, icon, color, bgColor, iconBg, borderColor }) => (
  <CCard 
    className="border-0 shadow-sm h-100 overflow-hidden position-relative"
    style={{ 
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
      border: `1px solid ${borderColor}20`,
      borderRadius: '16px',
      boxShadow: '0 2px 16px rgba(0,0,0,0.3)' // Extra dark default shadow
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
      e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.6)'; // Extra dark hover shadow
      e.currentTarget.style.borderColor = '#00000080'; // Dark border on hover
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'; // Extra dark leave shadow
      e.currentTarget.style.borderColor = `${borderColor}20`;
    }}
  >
    <CCardBody className="p-3 p-md-4 position-relative">
      <div className="d-flex justify-content-between align-items-start">
        <div className="flex-grow-1">
          <small 
            className="fw-medium d-block mb-2"
            style={{ 
              fontSize: '0.8rem',
              lineHeight: '1.2',
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {title}
          </small>
          <h4 
            className="fw-bold mb-0"
            style={{ 
              fontSize: 'clamp(1.3rem, 2.5vw, 1.8rem)',
              lineHeight: '1.2',
              color: '#1e293b',
              fontWeight: '700'
            }}
          >
            {value}
          </h4>
        </div>
        <div 
          className="d-flex align-items-center justify-content-center ms-3"
          style={{
            width: '48px',
            height: '48px',
            background: iconBg,
            borderRadius: '16px',
            flexShrink: 0,
            boxShadow: '0 8px 36px rgba(0,0,0,0.5)' // Extra dark icon shadow
          }}
        >
          {React.cloneElement(icon, { 
            size: 24, 
            color: 'white',
            strokeWidth: 2.5
          })}
        </div>
      </div>
      
      {/* Modern decorative elements */}
      <div 
        className="position-absolute"
        style={{
          top: '10px',
          right: '10px',
          width: '80px',
          height: '80px',
          background: bgColor,
          borderRadius: '50%',
          zIndex: 0,
          opacity: 0.3
        }}
      />
      <div 
        className="position-absolute"
        style={{
          bottom: '-20px',
          left: '-20px',
          width: '60px',
          height: '60px',
          background: bgColor,
          borderRadius: '50%',
          zIndex: 0,
          opacity: 0.2
        }}
      />
      
      {/* Subtle pattern overlay */}
      <div 
        className="position-absolute w-100 h-100"
        style={{
          top: 0,
          left: 0,
          background: `radial-gradient(circle at 20% 80%, ${bgColor} 0%, transparent 50%)`,
          zIndex: 0,
          pointerEvents: 'none'
        }}
      />
      
      {/* Content overlay to ensure text is above decorative elements */}
      <div 
        className="position-absolute w-100 h-100"
        style={{
          top: 0,
          left: 0,
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />
    </CCardBody>
  </CCard>
);


export default Dashboard2;
