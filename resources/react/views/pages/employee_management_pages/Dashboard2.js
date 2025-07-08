import React, { useEffect, useState } from 'react';
import {
  CContainer, CRow, CCol, CCard, CCardBody, CCardHeader, CTable,
  CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow,
  CButton, CBadge, CAvatar
} from '@coreui/react';
import { ChevronDown, ChevronRight, Users, Clock, DollarSign, TrendingUp, User, Plus, Minus } from 'lucide-react';
import { getAPICall } from '../../../util/api';
import { Navigate, useNavigate } from 'react-router-dom';

const Dashboard2 = () => {
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
    <CContainer fluid>
      <CRow className="mb-4">
        <CCol><h3>Employee Management Dashboard</h3></CCol>
      </CRow>

      {/* Top Stat Cards */}
      <CRow className="mb-4">
        <CCol lg={3}><StatCard title="Total Employees" value={totalEmployees} icon={<Users />} color="primary" /></CCol>
        <CCol lg={3}><StatCard title="Present Today" value={presentEmployees} icon={<Clock />} color="success" /></CCol>
        <CCol lg={3}><StatCard title="Total Credit" value={`₹${calculateTotal('credit')}`} icon={<TrendingUp />} color="info" /></CCol>
        <CCol lg={3}><StatCard title="Total Debit" value={`₹${calculateTotal('debit')}`} icon={<DollarSign />} color="danger" /></CCol>
      </CRow>

      {/* Table Section */}
      <CCard className="mb-4 shadow">
        <CCardHeader>Employee Attendance & Details</CCardHeader>
        <CCardBody>
          <CTable bordered hover responsive align="middle">
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell>Employee</CTableHeaderCell>
                <CTableHeaderCell>Check In</CTableHeaderCell>
                <CTableHeaderCell>Check Out</CTableHeaderCell>
                <CTableHeaderCell>Status</CTableHeaderCell>
                <CTableHeaderCell>Actions</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {employees.map(emp => {
                const tracker = emp.trackers?.[0] || {};
                const checkIn = tracker?.check_in ? '✔️' : '❌';
                const checkOut = tracker?.check_out ? '✔️' : '❌';

                return (
                  <React.Fragment key={emp.id}>
                    <CTableRow>
                      <CTableDataCell>
                        <div className="d-flex align-items-center">
                          <CAvatar className="bg-primary text-white me-3"><User size={20} /></CAvatar>
                          <div>
                            <div className="fw-semibold">{emp.name}</div>
                            <div className="text-medium-emphasis small">ID: {emp.id}</div>
                          </div>
                        </div>
                      </CTableDataCell>
                      <CTableDataCell>{checkIn}</CTableDataCell>
                      <CTableDataCell>{checkOut}</CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={tracker?.check_in ? "success" : "secondary"}>
                          {tracker?.check_in ? "Present" : "Absent"}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell>
                        {/* <CButton size="sm" color="primary" variant="outline" onClick={() => toggleRowExpansion(emp.id)}>
                          {expandedRows[emp.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          <span className="ms-1">Details</span>
                        </CButton> */}
                        <CButton
  size="sm"
  color="primary"
  variant="outline"
  onClick={() => navigate(`/employees/${emp.id}`)}
>
  <ChevronRight size={16} />
  <span className="ms-1">Details</span>
</CButton>

                      </CTableDataCell>
                    </CTableRow>

                  
                  </React.Fragment>
                );
              })}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
    </CContainer>
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
