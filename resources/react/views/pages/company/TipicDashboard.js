import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CCard,
  CCardBody,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CNav,
  CNavItem,
  CNavLink,
  CTabContent,
  CTabPane,
  CBadge,
  CAlert,
} from '@coreui/react';
import { CFormInput, CInputGroup, CInputGroupText, CFormSelect } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { 
  cilSearch, 
  cilBuilding, 
  cilCheckCircle, 
  cilMoney, 
  cilActionUndo, 
  cilWallet,
  cilPeople,
  cilChart,
  cilBell,
  cilDollar,
  cilCreditCard,
  cilCalendar,
  cilWarning,
  cilPhone,
  cilChatBubble
} from '@coreui/icons';
import { getAPICall } from '../../../util/api';
import { getUserData, getUserType } from '../../../util/session';
import { useToast } from '../../common/toast/ToastContext';
import { useTranslation } from 'react-i18next';

const TipicAdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0].slice(0, 8) + '01'); // First day of current month
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]); // Today
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [renewalFilter, setRenewalFilter] = useState('all');
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState('all');

  const { showToast } = useToast();
  const userData = getUserData();
  const { t, i18n } = useTranslation('global');

  // Extract data from dashboardData - moved before useMemo hooks
  const salesSummary = dashboardData?.sales_summary || {};
  const partnersSummary = dashboardData?.partners_summary || {};
  const paymentOverview = dashboardData?.payment_overview || {};
  const commissionSummary = dashboardData?.commission_summary || {};
  const renewalAlerts = dashboardData?.renewal_alerts || {};

// Fixed filteredCompanies useMemo with proper data normalization
const filteredCompanies = useMemo(() => {
  const expiringCompanies = renewalAlerts.expiring_companies || [];
  const expiredCompanies = renewalAlerts.expired_companies || [];
  
  // Normalize expired companies to have consistent structure
  const normalizedExpired = expiredCompanies.map(company => ({
    ...company,
    // Fix: Ensure negative days_remaining for overdue companies
    days_remaining: company.days_remaining !== undefined 
      ? company.days_remaining 
      : company.days_overdue 
        ? -Math.abs(company.days_overdue)
        : -1 // Default to -1 if no overdue info
  }));
  
  const allCompanies = [...expiringCompanies, ...normalizedExpired];
  
  if (allCompanies.length === 0) return [];
  
  switch (renewalFilter) {
    case 'critical':
      return allCompanies.filter(c => c.days_remaining <= 7 && c.days_remaining >= 0);
    case 'upcoming':
      return allCompanies.filter(c => c.days_remaining > 7 && c.days_remaining <= 30);
    case 'overdue':
      return allCompanies.filter(c => c.days_remaining < 0);
    default:
      return allCompanies;
  }
}, [renewalAlerts.expiring_companies, renewalAlerts.expired_companies, renewalFilter]);

// Fixed handleCSVExport function with proper data normalization
const handleCSVExport = (filterType) => {
  const expiringCompanies = renewalAlerts.expiring_companies || [];
  const expiredCompanies = renewalAlerts.expired_companies || [];
  
  // Apply the same normalization as in filteredCompanies
  const normalizedExpired = expiredCompanies.map(company => ({
    ...company,
    days_remaining: company.days_remaining !== undefined 
      ? company.days_remaining 
      : company.days_overdue 
        ? -Math.abs(company.days_overdue)
        : -1
  }));
  
  const allCompanies = [...expiringCompanies, ...normalizedExpired];
  
  let dataToExport = [];
  let filename = '';
  
  switch (filterType) {
    case 'critical':
      dataToExport = allCompanies.filter(
        (c) => c.days_remaining <= 7 && c.days_remaining >= 0
      );
      filename = 'Critical_Renewals';
      break;
    case 'upcoming':
      dataToExport = allCompanies.filter(
        (c) => c.days_remaining > 7 && c.days_remaining <= 30
      );
      filename = 'Upcoming_Renewals';
      break;
    case 'overdue':
      dataToExport = allCompanies.filter(
        (c) => c.days_remaining < 0
      );
      filename = 'Overdue_Renewals';
      break;
    default:
      dataToExport = allCompanies;
      filename = 'All_Renewals';
  }
  
  // Enhanced data formatting with better status logic
  const formattedData = dataToExport.map((company) => {
    let status;
    if (company.days_remaining < 0) {
      status = `${Math.abs(company.days_remaining)} days overdue`;
    } else if (company.days_remaining <= 7) {
      status = 'Critical';
    } else if (company.days_remaining <= 15) {
      status = 'Warning';
    } else {
      status = 'Upcoming';
    }
    
    return {
      'Company Name': company.company_name || 'N/A',
      'Company ID': company.company_id || 'N/A',
      'Email': company.email_id || 'N/A',
      'Phone Number': company.phone_no || 'N/A',
      'Days Remaining': company.days_remaining,
      'Status': status,
      'Export Date': new Date().toLocaleDateString(),
      'Export Time': new Date().toLocaleTimeString()
    };
  });
  
  console.log(`Attempting to export ${dataToExport.length} ${filterType} records`);
  console.log('Sample data:', dataToExport.slice(0, 2)); // Debug log
  
  if (formattedData.length > 0) {
    exportToCSV(formattedData, filename);
    showToast('success', `Exported ${formattedData.length} records to ${filename}.csv`);
  } else {
    showToast('warning', `No ${filterType} data to export`);
    console.log('All companies data:', allCompanies); // Debug log
  }
};

// Your existing exportToCSV function (no changes needed)
const exportToCSV = (data, filename) => {
  if (data.length === 0) {
    showToast('warning', 'No data to export');
    return;
  }
  
  // Get headers from first object
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const value = row[header] || '';
        // Escape commas and quotes in CSV
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(',')
    )
  ].join('\n');
  
  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  // Fetch complete dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate
      });
      
      const response = await getAPICall(`/api/admin/dashboard/overview?${params.toString()}`);
      
      if (response && response.success) {
        setDashboardData(response.data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
      
    } catch (error) {
      setError('Failed to load dashboard data');
      showToast('danger', 'Error occurred: ' + error.message);
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    let start, end;

    if (selectedMonth === 'all') {
      start = new Date(selectedYear, 0, 1); // Jan 1
      end = new Date(selectedYear, 11, 31); // Dec 31
    } else {
      start = new Date(selectedYear, selectedMonth - 1, 1);
      end = new Date(selectedYear, selectedMonth, 0);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getStatusBadge = (status) => {
    const isActive = status === 0;
    return (
      <CBadge color={isActive ? 'success' : 'danger'}>
        {isActive ? 'Active' : 'Blocked'}
      </CBadge>
    );
  };

  const getUrgencyBadge = (daysRemaining) => {
    if (daysRemaining <= 7) return <CBadge color="danger">Critical</CBadge>;
    if (daysRemaining <= 15) return <CBadge color="warning">Warning</CBadge>;
    return <CBadge color="info">Upcoming</CBadge>;
  };

  const getExpiredBadge = (daysExpired) => {
    if (daysExpired > 30) return <CBadge color="dark">Overdue</CBadge>;
    return <CBadge color="danger">Expired</CBadge>;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading Tipic Admin Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <CAlert color="danger">
        <strong>Error:</strong> {error}
      </CAlert>
    );
  }
  return (
    <>
      {/* Header Section */}
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="align-items-center">
            <CCol>
              <h2 className="mb-1">Tipic Admin Dashboard</h2>
              <p className="text-muted mb-0">Complete business overview and analytics</p>
            </CCol>
            <CCol xs="auto">
              <CRow className="g-2">
              <CCol>
                <label className="form-label small">Select Month</label>
                <CFormSelect 
                    size="sm"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                >
                    <option value="all">All Months</option>
                    {[...Array(12).keys()].map(m => (
                    <option key={m + 1} value={m + 1}>
                        {new Date(0, m).toLocaleString('default', { month: 'long' })}
                    </option>
                    ))}
                </CFormSelect>
                </CCol>


<CCol>
  <label className="form-label small">Select Year</label>
  <CFormSelect 
    size="sm"
    value={selectedYear}
    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
  >
    {[...Array(5).keys()].map(y => (
      <option key={currentYear - y} value={currentYear - y}>
        {currentYear - y}
      </option>
    ))}
  </CFormSelect>
</CCol>

                {/* <CCol>
                  <label className="form-label small">Start Date</label>
                  <CFormInput 
                    type="date"
                    size="sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </CCol>
                <CCol>
                  <label className="form-label small">End Date</label>
                  <CFormInput 
                    type="date"
                    size="sm"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </CCol> */}
              </CRow>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Overview Stats Cards */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="mb-4">
            <CCardBody>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    <CIcon icon={cilBuilding} className="text-primary" size="lg" />
                  </div>
                </div>
                <div className="ms-3">
                  <div className="text-muted small">Total Active Companies</div>
                  <div className="fs-4 fw-semibold">{salesSummary.summary?.total_companies || 0}</div>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="mb-4">
            <CCardBody>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    <CIcon icon={cilChart} className="text-success" size="lg" />
                  </div>
                </div>
                <div className="ms-3">
                  <div className="text-muted small">Total Companies Sales</div>
                  <div className="fs-4 fw-semibold">{formatCurrency(salesSummary.summary?.total_sales)}</div>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="mb-4">
            <CCardBody>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    <CIcon icon={cilMoney} className="text-warning" size="lg" />
                  </div>
                </div>
                <div className="ms-3">
                  <div className="text-muted small">Total Commission</div>
                  <div className="fs-4 fw-semibold">{formatCurrency(commissionSummary.summary?.total_commission_paid)}</div>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol sm={6} lg={3}>
          <CCard className="mb-4">
            <CCardBody>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div className="bg-danger bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '48px', height: '48px' }}>
                    <CIcon icon={cilBell} className="text-danger" size="lg" />
                  </div>
                </div>
                <div className="ms-3">
                  <div className="text-muted small">Renewal Alerts</div>
                  <div className="fs-4 fw-semibold">{renewalAlerts.renewal_stats?.total_requiring_attention || 0}</div>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Renewal Alerts Banner */}
      {renewalAlerts.renewal_stats && renewalAlerts.renewal_stats.total_requiring_attention > 0 && (
        <CAlert color="warning" className="mb-4">
          <CIcon icon={cilWarning} className="me-2" />
          <strong>Attention Required:</strong> {renewalAlerts.renewal_stats.critical_renewals} critical renewals, 
          {' '}{renewalAlerts.renewal_stats.upcoming_renewals} upcoming renewals, and 
          {' '}{renewalAlerts.renewal_stats.overdue_renewals} overdue subscriptions need follow-up.
        </CAlert>
      )}

      {/* Tabbed Content */}
      <CCard>
        <CCardBody>
          <CNav variant="tabs" role="tablist">
            <CNavItem>
              <CNavLink 
                active={activeTab === 0} 
                onClick={() => setActiveTab(0)}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={cilChart} className="me-2" />
                Sales Summary
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink 
                active={activeTab === 1} 
                onClick={() => setActiveTab(1)}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={cilPeople} className="me-2" />
                Partners Summary
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink 
                active={activeTab === 2} 
                onClick={() => setActiveTab(2)}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={cilCreditCard} className="me-2" />
                Payment Overview
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink 
                active={activeTab === 3} 
                onClick={() => setActiveTab(3)}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={cilDollar} className="me-2" />
                Commission Details
              </CNavLink>
            </CNavItem>
            <CNavItem>
              <CNavLink 
                active={activeTab === 4} 
                onClick={() => setActiveTab(4)}
                style={{ cursor: 'pointer' }}
              >
                <CIcon icon={cilCalendar} className="me-2" />
                Renewal Alerts
              </CNavLink>
            </CNavItem>
          </CNav>

          <CTabContent className="mt-3">
            {/* Sales Summary Tab */}
            <CTabPane role="tabpanel" visible={activeTab === 0}>
              <CRow className="mb-3">
                <CCol>
                  <h4>All Companies Sales Summary</h4>
                  <p className="text-muted">Sales performance of all onboarded companies</p>
                </CCol>
                <CCol md={4}>
                  <CInputGroup size="sm">
                    <CFormInput
                      placeholder="Search companies..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <CInputGroupText>
                      <CIcon icon={cilSearch} />
                    </CInputGroupText>
                  </CInputGroup>
                </CCol>
              </CRow>

              {/* Sales Summary Cards */}
              <CRow className="mb-4">
                <CCol md={2}>
                  <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                    <div className="text-muted small">Total Orders</div>
                    <div className="fs-5 fw-bold text-primary">{salesSummary.summary?.total_orders || 0}</div>
                  </div>
                </CCol>
                {/* <CCol md={2}>
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <div className="text-muted small">Total Paid</div>
                    <div className="fs-6 fw-bold text-success">{formatCurrency(salesSummary.summary?.total_paid)}</div>
                  </div>
                </CCol>
                <CCol md={2}>
                  <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                    <div className="text-muted small">Total Pending</div>
                    <div className="fs-6 fw-bold text-warning">{formatCurrency(salesSummary.summary?.total_pending)}</div>
                  </div>
                </CCol>
                <CCol md={2}>
                  <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                    <div className="text-muted small">Total Profit</div>
                    <div className="fs-6 fw-bold text-info">{formatCurrency(salesSummary.summary?.total_profit)}</div>
                  </div>
                </CCol> */}
                <CCol md={2}>
                  <div className="text-center p-3 bg-secondary bg-opacity-10 rounded">
                    <div className="text-muted small">Avg Sale/Company</div>
                    <div className="fs-6 fw-bold text-secondary">{formatCurrency(salesSummary.summary?.average_sale_per_company)}</div>
                  </div>
                </CCol>
              </CRow>

              {/* Companies Sales Table */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <CTable hover responsive>
                  <CTableHead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2 }}>
                    <CTableRow>
                      <CTableHeaderCell style={{ width: '25%' }}>Company Details</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '25%' }}>Partner</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '25%' }} >Orders</CTableHeaderCell>
                      <CTableHeaderCell style={{ width: '25%' }} >Total Sales</CTableHeaderCell>
                      {/* <CTableHeaderCell className="text-center">Paid</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Pending</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Profit</CTableHeaderCell> */}
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {salesSummary.companies_sales?.filter(company => 
                      !searchTerm || company.company_name.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map((company, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell>
                          <div>
                            <div className="fw-semibold">{company.company_name}</div>
                            <div className="text-muted small">Mobile: {company.phone_no}</div>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          {company.partner_name ? (
                            <div>
                              <div>{company.partner_name}</div>
                              <div className="text-muted small">{company.partner_mobile}</div>
                            </div>
                          ) : (
                            <span className="text-muted">Direct</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell className="fw-semibold">
                          {company.total_orders}
                        </CTableDataCell>
                        <CTableDataCell className=" fw-semibold">
                          {formatCurrency(company.total_sales)}
                        </CTableDataCell>
                        {/* <CTableDataCell className="text-center text-success">
                          {formatCurrency(company.total_paid)}
                        </CTableDataCell>
                        <CTableDataCell className="text-center text-warning">
                          {formatCurrency(company.total_pending)}
                        </CTableDataCell>
                        <CTableDataCell className="text-center text-info fw-semibold">
                          {formatCurrency(company.total_profit)}
                        </CTableDataCell> */}
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>
            </CTabPane>

            {/* Partners Summary Tab */}
            <CTabPane role="tabpanel" visible={activeTab === 1}>
              <CRow className="mb-3">
                <CCol>
                  <h4>Sales Partners Performance</h4>
                  <p className="text-muted">Customer onboarding by sales partners</p>
                </CCol>
              </CRow>

              {/* Partners Summary Cards */}
              <CRow className="mb-4">
                <CCol md={2}>
                  <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                    <div className="text-muted small">Total Partners</div>
                    <div className="fs-5 fw-bold text-primary">{partnersSummary.summary?.total_partners || 0}</div>
                  </div>
                </CCol>
                <CCol md={2}>
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <div className="text-muted small">Active Customers</div>
                    <div className="fs-6 fw-bold text-success">{partnersSummary.summary?.total_active_customers || 0}</div>
                  </div>
                </CCol>
                <CCol md={2}>
                  <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                    <div className="text-muted small">Blocked Customers</div>
                    <div className="fs-6 fw-bold text-warning">{partnersSummary.summary?.total_blocked_customers || 0}</div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                    <div className="text-muted small">Total New Customers</div>
                    <div className="fs-6 fw-bold text-info">{partnersSummary.summary?.total_end_customers || 0}</div>
                  </div>
                </CCol>
              </CRow>

              {/* Partners Table */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <CTable hover responsive>
                  <CTableHead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2 }}>
                    <CTableRow>
                      <CTableHeaderCell>Partner Details</CTableHeaderCell>
                      <CTableHeaderCell>Partner Type</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Companies Onboarded</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Active/Blocked</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Recent Growth</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {partnersSummary.partners?.map((partner, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell>
                          <div>
                            <div className="fw-semibold">{partner.partner_name}</div>
                            <div className="text-muted small">Mobile: {partner.partner_mobile}</div>
                            <div className="text-muted small">Email: {partner.partner_email}</div>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div>
                            <CBadge color="info">{partner.partner_type}</CBadge>
                            <div className="text-muted small mt-1">Commission: {partner.commission_rate}%</div>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell className="text-center fw-semibold">
                          {partner.total_customers_onboarded}
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <div className="text-success">{partner.active_customers} Active</div>
                          <div className="text-danger">{partner.blocked_customers} Blocked</div>
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          <CBadge color="success">
                            +{partner.new_customers_last_30_days} (30d)
                          </CBadge>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>
            </CTabPane>

            {/* Payment Overview Tab */}
            <CTabPane role="tabpanel" visible={activeTab === 2}>
              <CRow className="mb-3">
                <CCol>
                  <h4>Payment Overview</h4>
                  <p className="text-muted">Payment details across all categories</p>
                </CCol>
              </CRow>

              {/* Payment Summary Cards */}
              <CRow className="mb-4">
                <CCol md={2}>
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <div className="text-muted small">Subscription Revenue</div>
                    <div className="fs-6 fw-bold text-success">{formatCurrency(paymentOverview.summary?.total_subscription_revenue)}</div>
                  </div>
                </CCol>
                <CCol md={2}>
                  <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                    <div className="text-muted small">Partner Commission</div>
                    <div className="fs-6 fw-bold text-warning">{formatCurrency(paymentOverview.summary?.total_partner_commission)}</div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                    <div className="text-muted small">Customer Outstanding</div>
                    <div className="fs-6 fw-bold text-info">{formatCurrency(paymentOverview.summary?.total_customer_outstanding)}</div>
                  </div>
                </CCol>
                <CCol md={2}>
                  <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                    <div className="text-muted small">Receivable</div>
                    <div className="fs-6 fw-bold text-primary">{formatCurrency(paymentOverview.summary?.total_customer_receivable)}</div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="text-center p-3 bg-danger bg-opacity-10 rounded">
                    <div className="text-muted small">Payable</div>
                    <div className="fs-6 fw-bold text-danger">{formatCurrency(paymentOverview.summary?.total_customer_payable)}</div>
                  </div>
                </CCol>
              </CRow>

              {/* Subscription Payments */}
              <div className="mb-4">
                <h5>Subscription Payments</h5>
                <CTable hover responsive>
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>Plan Name</CTableHeaderCell>
                      <CTableHeaderCell>Plan Price</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Total Subscriptions</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Total Revenue</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {paymentOverview.subscription_payments?.map((payment, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell className="fw-semibold">{payment.plan_name}</CTableDataCell>
                        <CTableDataCell>{formatCurrency(payment.plan_price)}</CTableDataCell>
                        <CTableDataCell className="text-center">{payment.total_subscriptions}</CTableDataCell>
                        <CTableDataCell className="text-center fw-semibold">{formatCurrency(payment.total_revenue)}</CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>

              {/* Customer Payment Details */}
              <div className="mb-4">
                <h5 className="mb-3">Customer Payment Details</h5>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  <CTable hover responsive>
                    <CTableHead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2 }}>
                      <CTableRow>
                        <CTableHeaderCell>Company</CTableHeaderCell>
                        <CTableHeaderCell>Plan</CTableHeaderCell>
                        <CTableHeaderCell className="text-center">Amount Paid</CTableHeaderCell>
                        <CTableHeaderCell className="text-center">Outstanding</CTableHeaderCell>
                        <CTableHeaderCell className="text-center">Payment Status</CTableHeaderCell>
                        <CTableHeaderCell className="text-center">Last Payment</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {paymentOverview.customer_payments?.map((payment, index) => (
                        <CTableRow key={index}>
                          <CTableDataCell>
                            <div>
                              <div className="fw-semibold">{payment.company_name}</div>
                              <div className="text-muted small">{payment.owner_name}</div>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <CBadge color="info">{payment.plan_name}</CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="text-center text-success fw-semibold">
                            {formatCurrency(payment.amount_paid)}
                          </CTableDataCell>
                          <CTableDataCell className="text-center text-warning">
                            {formatCurrency(payment.outstanding_amount)}
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            <CBadge color={payment.payment_status === 'paid' ? 'success' : payment.payment_status === 'partial' ? 'warning' : 'danger'}>
                              {payment.payment_status?.toUpperCase()}
                            </CBadge>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            {payment.last_payment_date ? formatDate(payment.last_payment_date) : 'N/A'}
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>
              </div>
            </CTabPane>

            {/* Commission Details Tab */}
            <CTabPane role="tabpanel" visible={activeTab === 3}>
              <CRow className="mb-3">
                <CCol>
                  <h4>Commission Calculation Summary</h4>
                  <p className="text-muted">Commission details for all sales partners - {commissionSummary.period?.month_name}</p>
                </CCol>
              </CRow>

              {/* Commission Summary Cards */}
              <CRow className="mb-4">
                <CCol md={3}>
                  <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                    <div className="text-muted small">Total Commission Paid</div>
                    <div className="fs-5 fw-bold text-primary">{formatCurrency(commissionSummary.summary?.total_commission_paid)}</div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                    <div className="text-muted small">Revenue Generated</div>
                    <div className="fs-6 fw-bold text-success">{formatCurrency(commissionSummary.summary?.total_revenue_generated)}</div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                    <div className="text-muted small">Partners with Earnings</div>
                    <div className="fs-5 fw-bold text-info">{commissionSummary.summary?.partners_with_earnings || 0}</div>
                  </div>
                </CCol>
                <CCol md={3}>
                  <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                    <div className="text-muted small">Avg Commission/Partner</div>
                    <div className="fs-6 fw-bold text-warning">{formatCurrency(commissionSummary.summary?.average_commission_per_partner)}</div>
                  </div>
                </CCol>
              </CRow>

              {/* Commission Details Table */}
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <CTable hover responsive>
                  <CTableHead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2 }}>
                    <CTableRow>
                      <CTableHeaderCell>Partner Details</CTableHeaderCell>
                      <CTableHeaderCell>Partner Type</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Referred Companies</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Companies with Payments</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Revenue Generated</CTableHeaderCell>
                      <CTableHeaderCell className="text-center">Commission Earned</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {commissionSummary.partners_commission?.map((partner, index) => (
                      <CTableRow key={index}>
                        <CTableDataCell>
                          <div>
                            <div className="fw-semibold">{partner.partner_name}</div>
                            <div className="text-muted small">Mobile: {partner.partner_mobile}</div>
                            <div className="text-muted small">Email: {partner.partner_email}</div>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell>
                          <div>
                            <CBadge color="info">{partner.partner_type}</CBadge>
                            <div className="text-muted small mt-1">Rate: {partner.commission_rate}%</div>
                          </div>
                        </CTableDataCell>
                        <CTableDataCell className="text-center fw-semibold">
                          {partner.total_referred_companies}
                        </CTableDataCell>
                        <CTableDataCell className="text-center">
                          {partner.companies_with_payments}
                        </CTableDataCell>
                        <CTableDataCell className="text-center text-success fw-semibold">
                          {formatCurrency(partner.revenue_generated)}
                        </CTableDataCell>
                        <CTableDataCell className="text-center text-warning fw-semibold">
                          {formatCurrency(partner.commission_earned)}
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              </div>
            </CTabPane>

          <CTabPane role="tabpanel" visible={activeTab === 4}>
  <CRow className="mb-3">
    <CCol>
      <h4>Subscription Renewal Alerts</h4>
      <p className="text-muted">Companies requiring subscription renewal follow-up</p>
    </CCol>
  </CRow>

  {/* Summary Cards - Now Clickable for Filtering */}
  <CRow className="mb-4">
    <CCol md={3}>
      <div 
        className={`text-center p-3 bg-warning bg-opacity-10 rounded cursor-pointer border ${
          renewalFilter === 'critical' ? 'border-warning border-2' : 'border-0'
        }`}
        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        onClick={() => setRenewalFilter(renewalFilter === 'critical' ? 'all' : 'critical')}
        title="Click to filter critical renewals"
      >
        <div className="text-muted small">Critical (≤7 days)</div>
        <div className="fs-5 fw-bold text-warning">{renewalAlerts.summary?.critical_renewals || 0}</div>
        {renewalFilter === 'critical' && <div className="small text-warning mt-1">● Filtered</div>}
      </div>
    </CCol>
    <CCol md={3}>
      <div 
        className={`text-center p-3 bg-info bg-opacity-10 rounded cursor-pointer border ${
          renewalFilter === 'upcoming' ? 'border-info border-2' : 'border-0'
        }`}
        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        onClick={() => setRenewalFilter(renewalFilter === 'upcoming' ? 'all' : 'upcoming')}
        title="Click to filter upcoming renewals"
      >
        <div className="text-muted small">Upcoming (≤30 days)</div>
        <div className="fs-5 fw-bold text-info">{renewalAlerts.summary?.upcoming_renewals || 0}</div>
        {renewalFilter === 'upcoming' && <div className="small text-info mt-1">● Filtered</div>}
      </div>
    </CCol>
    <CCol md={3}>
      <div 
        className={`text-center p-3 bg-danger bg-opacity-10 rounded cursor-pointer border ${
          renewalFilter === 'overdue' ? 'border-danger border-2' : 'border-0'
        }`}
        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        onClick={() => setRenewalFilter(renewalFilter === 'overdue' ? 'all' : 'overdue')}
        title="Click to filter overdue renewals"
      >
        <div className="text-muted small">Overdue</div>
        <div className="fs-5 fw-bold text-danger">{renewalAlerts.summary?.overdue_renewals || 0}</div>
        {renewalFilter === 'overdue' && <div className="small text-danger mt-1">● Filtered</div>}
      </div>
    </CCol>
    <CCol md={3}>
      <div 
        className={`text-center p-3 bg-info bg-opacity-10 rounded cursor-pointer border ${
          renewalFilter === 'all' ? 'border-info border-2' : 'border-0'
        }`}
        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
        onClick={() => setRenewalFilter('all')}
        title="Click to show all renewals"
      >
        <div className="text-muted small">Total Requiring Attention</div>
        <div className="fs-5 fw-bold text-info">{renewalAlerts.renewal_stats?.total_requiring_attention || 0}</div>
        {renewalFilter === 'all' && <div className="small text-info mt-1">● All Data</div>}
      </div>
    </CCol>
  </CRow>

  {/* Filter Status */}
  {renewalFilter !== 'all' && (
    <CRow className="mb-3">
      <CCol>
        <div className="alert alert-danger d-flex justify-content-between align-items-center">
          <span>
            <strong>Filter Active:</strong> Showing {filteredCompanies.length} {renewalFilter} renewal(s)
          </span>
          <button 
            className="btn btn-sm btn-outline-danger"
            onClick={() => setRenewalFilter('all')}
          >
            Clear Filter
          </button>
        </div>
      </CCol>
    </CRow>
  )}

  {/* Table */}
  <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
    <CTable hover responsive>
      <CTableHead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2 }}>
        <CTableRow>
          <CTableHeaderCell>Company Name</CTableHeaderCell>
          <CTableHeaderCell>Email</CTableHeaderCell>
          <CTableHeaderCell>Days Remaining</CTableHeaderCell>
          <CTableHeaderCell>Call</CTableHeaderCell>
          <CTableHeaderCell>Message</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {filteredCompanies.map((company, index) => (
          <CTableRow key={index}
            className={
              company.days_remaining < 0
                ? 'table-danger'
                : company.days_remaining <= 7
                ? 'table-warning'
                : company.days_remaining <= 15
                ? 'table-info'
                : ''
            }
          >
            <CTableDataCell>
              <div className="fw-semibold">{company.company_name}</div>
              <div className="text-muted small">ID: {company.company_id}</div>
            </CTableDataCell>
            <CTableDataCell>{company.email_id || 'N/A'}</CTableDataCell>
            <CTableDataCell>
              {company.days_remaining >= 0 ? (
                <span
                  className={`fw-bold ${
                    company.days_remaining <= 7
                      ? 'text-warning'
                      : company.days_remaining <= 15
                      ? 'text-info'
                      : 'text-info'
                  }`}
                >
                  {company.days_remaining} days left
                </span>
              ) : (
                <span className="fw-bold text-danger">
                  {Math.abs(company.days_remaining)} days overdue
                </span>
              )}
            </CTableDataCell>
            <CTableDataCell className="text-center">
              <a
                className="btn btn-outline-primary btn-sm"
                href={`tel:+91${company.phone_no?.replace(/^(\+91)?/, '')}`}
                title="Call Customer"
              >
                <CIcon icon={cilPhone} />
              </a>
            </CTableDataCell>
           <CTableDataCell className="text-center">
            <a
                className="btn btn-outline-success btn-sm"
                href={`sms:+91${company.phone_no?.replace(/^(\+91)?/, '')}?body=${encodeURIComponent(
                company.days_remaining >= 0
                    ? `Hi ${company.company_name}, your subscription expires in ${company.days_remaining} days.\n\nAvailable Plans:\n- Yearly Plan: ₹9999\n- Half Yearly Plan: ₹4999.50\n\nPlease renew soon to continue enjoying our services-TiPic ConsulTech.`
                    : `Hi ${company.company_name}, your subscription expired ${Math.abs(company.days_remaining)} days ago.\n\nAvailable Plans:\n- Yearly Plan: ₹9999\n- Half Yearly Plan: ₹4999.50\n\nPlease renew immediately to restore services.`
                )}`}
                title="Send SMS"
            >
                <CIcon icon={cilChatBubble} />
            </a>
            </CTableDataCell>
          </CTableRow>
        ))}
        {filteredCompanies.length === 0 && (
          <CTableRow>
            <CTableDataCell colSpan={5} className="text-center text-muted py-4">
              <div className="py-3">
                <div className="fs-5 mb-2">📋</div>
                <div>No companies found for the selected filter.</div>
                <small className="text-muted">Try selecting a different filter or clear the current filter.</small>
              </div>
            </CTableDataCell>
          </CTableRow>
        )}
      </CTableBody>
    </CTable>
  </div>

  {/* Quick Actions - Enhanced with CSV Export */}
  <div className="mt-4">
    <h6>Quick Actions</h6>
    <CRow className="mb-3">
      <CCol md={3}>
        <div className="d-grid">
          <button
            className="btn btn-warning"
            onClick={() => handleCSVExport('critical')}
            disabled={!renewalAlerts.summary?.critical_renewals}
          >
            Export Critical Renewals ({renewalAlerts.summary?.critical_renewals || 0})
          </button>
        </div>
      </CCol>
      <CCol md={3}>
        <div className="d-grid">
          <button
            className="btn btn-info"
            onClick={() => handleCSVExport('upcoming')}
            disabled={!renewalAlerts.summary?.upcoming_renewals}
          >
            Export Upcoming Renewals ({renewalAlerts.summary?.upcoming_renewals || 0})
          </button>
        </div>
      </CCol>
      <CCol md={3}>
        <div className="d-grid">
          <button
            className="btn btn-danger"
            onClick={() => handleCSVExport('overdue')}
            disabled={!renewalAlerts.summary?.overdue_renewals}
          >
            Export Overdue Renewals ({renewalAlerts.summary?.overdue_renewals || 0})
          </button>
        </div>
      </CCol>
      <CCol md={3}>
        <div className="d-grid">
          <button
            className="btn btn-info"
            onClick={() => handleCSVExport('all')}
            disabled={!renewalAlerts.expiring_companies?.length}
          >
            Export All Renewals ({renewalAlerts.expiring_companies?.length || 0})
          </button>
        </div>
      </CCol>
    </CRow>
  </div>
</CTabPane>

          </CTabContent>
        </CCardBody>
      </CCard>

      {/* Additional Insights Section */}
      <CRow className="mt-4 mb-5">  {/* Added mb-5 for bottom margin */}
  {/* System Health card */}
  <CCol md={6}>
    <CCard>
      <CCardBody>
        <h5>System Health</h5>
        <div className="row text-center">
          <div className="col">
            <div className="text-muted small">Active Partners</div>
            <div className="fs-5 fw-bold text-primary">
              {partnersSummary.summary?.total_partners || 0}
            </div>
          </div>
          <div className="col">
            <div className="text-muted small">Active Companies</div>
            <div className="fs-5 fw-bold text-info">
              {salesSummary.summary?.total_companies || 0}
            </div>
          </div>
        </div>
      </CCardBody>
    </CCard>
  </CCol>
</CRow>

    </>
  );
};

export default TipicAdminDashboard;