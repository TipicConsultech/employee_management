import React, { useState, useEffect } from 'react';
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
} from '@coreui/react';
import { CFormInput, CInputGroup, CInputGroupText, CFormSelect } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch, cilBuilding, cilCheckCircle, cilMoney, cilActionUndo, cilWallet } from '@coreui/icons';
import { getAPICall } from '../../../util/api';
import { getUserData, getUserType } from '../../../util/session';
import { useToast } from '../../common/toast/ToastContext';
import { useTranslation } from 'react-i18next';

const PartnerDashboard = () => {
  const [partnerData, setPartnerData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [receiptCommissionData, setReceiptCommissionData] = useState({
    commission_rate: "0.00",
    receipts_commission: [],
    summary: {
      total_referred_companies: 0,
      companies_with_payments: 0,
      successful_transactions: 0
    },
    total_monthly_commission: 0,
    total_receipts: 0,
    total_revenue_generated: 0
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { showToast } = useToast();
  const userData = getUserData();
  const { t, i18n } = useTranslation('global');
  const lng = i18n.language;

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];

  const years = [2024, 2025, 2026];

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getAPICall('/api/partner/dashboard');
      
      if (response) {
        setPartnerData(response.partner);
        setCompanies(response.companies || []);
      }
      
      // Fetch receipt-based commission data for current month
      await fetchReceiptCommissionData();
      
    } catch (error) {
      setError('Failed to load dashboard data');
      showToast('danger', 'Error occurred: ' + error.message);
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch receipt-based commission calculation
  const fetchReceiptCommissionData = async () => {
    try {
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString()
      });
      const response = await getAPICall(`/api/partner/receipt-based-commission?${params.toString()}`);
      
      if (response) {
        setReceiptCommissionData({
          commission_rate: response.commission_rate || "0.00",
          receipts_commission: response.receipts_commission || [],
          summary: response.summary || {
            total_referred_companies: 0,
            companies_with_payments: 0,
            successful_transactions: 0
          },
          total_monthly_commission: response.total_monthly_commission || 0,
          total_receipts: response.total_receipts || 0,
          total_revenue_generated: response.total_revenue_generated || 0,
          partner_type: response.partner_type || "Partner"
        });
      }
    } catch (error) {
      showToast('danger', 'Error occurred: ' + error.message);
      console.error('Receipt Commission fetch error:', error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (partnerData) {
      fetchReceiptCommissionData();
    }
  }, [selectedMonth, selectedYear]);

  const getStatusBadge = (status) => {
    const isActive = status === 0;
    return (
      <span 
        className={`badge ${isActive ? 'bg-success' : 'bg-danger'}`}
        style={{
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500'
        }}
      >
        {isActive ? 'Active' : 'Blocked'}
      </span>
    );
  };

  const isSubscriptionExpired = (validityDate) => {
    return new Date(validityDate) < new Date();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const decodeUnicode = (str) => {
    if (!str) return '';
    return str.replace(/\\u[\dA-F]{4}/gi, (match) => {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <>
      {/* Header Section */}
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="align-items-center">
            <CCol>
              <h2 className="mb-1">Partner Dashboard</h2>
              <p className="text-muted mb-0">Welcome back, {partnerData?.name}</p>
              <small className="text-info">Commission based on actual payments received</small>
            </CCol>
            <CCol xs="auto">
              <CRow className="g-2">
                <CCol>
                  <CFormSelect 
                    size="sm"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>
                        {month.label}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol>
                  <CFormSelect 
                    size="sm"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Stats Cards */}
      <CRow className="mb-4">
        <CCol sm={6} lg={3}>
          <CCard className="mb-4">
            <CCardBody>
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <div 
                    className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '48px', height: '48px' }}
                  >
                    <CIcon icon={cilBuilding} className="text-primary" size="lg" />
                  </div>
                </div>
                <div className="ms-3">
                  <div className="text-muted small">Total Companies</div>
                  <div className="fs-4 fw-semibold">{receiptCommissionData.summary.total_referred_companies}</div>
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
                  <div 
                    className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '48px', height: '48px' }}
                  >
                    <CIcon icon={cilCheckCircle} className="text-success" size="lg" />
                  </div>
                </div>
                <div className="ms-3">
                  <div className="text-muted small">Companies with Payments</div>
                  <div className="fs-4 fw-semibold">{receiptCommissionData.summary.companies_with_payments}</div>
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
                  <div 
                    className="bg-warning bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '48px', height: '48px' }}
                  >
                    <CIcon icon={cilMoney} className="text-warning" size="lg" />
                  </div>
                </div>
                <div className="ms-3">
                  <div className="text-muted small">Monthly Commission</div>
                  <div className="fs-4 fw-semibold">{formatCurrency(receiptCommissionData.total_monthly_commission)}</div>
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
                  <div 
                    className="bg-info bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: '48px', height: '48px' }}
                  >
                    <CIcon icon={cilWallet} className="text-info" size="lg" />
                  </div>
                </div>
                <div className="ms-3">
                  <div className="text-muted small">Successful Transactions</div>
                  <div className="fs-4 fw-semibold">{receiptCommissionData.summary.successful_transactions}</div>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* Commission Summary */}
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="justify-content-center">
            <h4 className="card-title mb-3 text-center">Commission Summary - Receipt Based</h4>
          </CRow>
          <CRow>
            <CCol md={3}>
              <div className="text-center p-3 bg-primary bg-opacity-10 rounded">
                <div className="text-muted small">Current Month Commission</div>
                <div className="fs-3 fw-bold text-primary">
                  {formatCurrency(receiptCommissionData.total_monthly_commission)}
                </div>
                <div className="text-muted small">
                  {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
                </div>
              </div>
            </CCol>
            <CCol md={3}>
              <div className="text-center p-3 bg-success bg-opacity-10 rounded">
                <div className="text-muted small">Total Revenue Generated</div>
                <div className="fs-3 fw-bold text-success">
                  {formatCurrency(receiptCommissionData.total_revenue_generated)}
                </div>
                <div className="text-muted small">From successful payments</div>
              </div>
            </CCol>
            <CCol md={3}>
              <div className="text-center p-3 bg-info bg-opacity-10 rounded">
                <div className="text-muted small">Partner Type</div>
                <div className="fs-5 fw-semibold text-info">
                  {receiptCommissionData.partner_type || partnerData?.partner_types?.partner_type}
                </div>
                <div className="text-muted small">{receiptCommissionData.commission_rate}% Commission</div>
              </div>
            </CCol>
            <CCol md={3}>
              <div className="text-center p-3 bg-warning bg-opacity-10 rounded">
                <div className="text-muted small">Total Receipts</div>
                <div className="fs-3 fw-bold text-warning">
                  {receiptCommissionData.total_receipts}
                </div>
                <div className="text-muted small">This month</div>
              </div>
            </CCol>
          </CRow>
        </CCardBody>
      </CCard>

      {/* Companies Table */}
      {companies.length > 0 && (
        <CCard className="mb-4">
          <CCardBody>
            <CRow className="justify-content-between align-items-center mb-3">
              <CCol>
                <h4 className="card-title mb-0">Onboarded Companies</h4>
                <small className="text-muted">All companies you have referred</small>
              </CCol>
              <CCol md={4}>
                <CInputGroup size="sm">
                  <CFormInput
                    style={{ borderColor: '#007BFF', color: '#0d6efd' }}
                    placeholder="Search companies..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <CInputGroupText style={{ borderColor: '#007BFF', backgroundColor: '#0d6efd', color: 'white' }}>
                    <CIcon icon={cilSearch} />
                  </CInputGroupText>
                </CInputGroup>
              </CCol>
            </CRow>
            
            <div className="overflow-x-auto w-full" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <CTable className="min-w-[600px]">
                <CTableHead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2 }}>
                  <CTableRow>
                    <CTableHeaderCell scope="col">Company</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Contact</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Plan</CTableHeaderCell>
                    <CTableHeaderCell scope="col">Subscription Validity</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center">Potential Commission</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center">Status</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {companies
                    .filter((company) => {
                      if (searchTerm.length < 2) return true;
                      const companyName = company.company_name || '';
                      const email = company.email_id || '';
                      return companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             email.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .map((company) => {
                      const potentialCommission = ((company.plan_details?.price || 0) * parseFloat(receiptCommissionData.commission_rate)) / 100;
                      const isExpired = isSubscriptionExpired(company.subscription_validity);
                      
                      return (
                        <CTableRow key={company.company_id}>
                          <CTableDataCell>
                            <div>
                              <div className="fw-semibold">{company.company_name}</div>
                              <div className="text-muted small">ID: {company.company_id}</div>
                            </div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div>{company.email_id}</div>
                            <div className="text-muted small">{company.phone_no}</div>
                          </CTableDataCell>
                          <CTableDataCell>
                            <div>{company.plan_details?.name || 'N/A'}</div>
                            <div className="text-muted small">
                              {formatCurrency(company.plan_details?.price || 0)}/month
                            </div>
                          </CTableDataCell>
                          
                          <CTableDataCell>
                            <div>
                              {new Date(company.subscription_validity).toLocaleDateString()}
                            </div>
                            <div className={`small ${isExpired ? 'text-danger' : 'text-success'}`}>
                              {isExpired ? 'Expired' : 'Active'}
                            </div>
                          </CTableDataCell>
                          <CTableDataCell className="text-center fw-bold">
                            <div>{formatCurrency(potentialCommission)}</div>
                            <div className="text-muted small">per payment</div>
                          </CTableDataCell>
                          <CTableDataCell className="text-center">
                            {getStatusBadge(company.block_status)}
                          </CTableDataCell>
                        </CTableRow>
                      );
                    })}
                </CTableBody>
              </CTable>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* Receipt Commission Details */}
      {receiptCommissionData.receipts_commission && receiptCommissionData.receipts_commission.length > 0 && (
        <CCard className="mb-4">
          <CCardBody>
            <h4 className="card-title mb-3">
              Commission Earned - {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </h4>
            <div className="alert alert-info">
              <strong>Note:</strong> These are actual commissions earned from successful payments made by your referred companies.
            </div>
            <div className="overflow-x-auto w-full" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <CTable>
                <CTableHead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2 }}>
                  <CTableRow>
                    <CTableHeaderCell>Company</CTableHeaderCell>
                    <CTableHeaderCell>Plan</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Payment Date</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Amount Paid</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Commission Rate</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Commission Earned</CTableHeaderCell>
                    <CTableHeaderCell className="text-center">Transaction ID</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {receiptCommissionData.receipts_commission.map((receipt, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell className="fw-semibold">
                        {receipt.company_name}
                      </CTableDataCell>
                      <CTableDataCell>
                        {receipt.plan_name}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        {new Date(receipt.payment_date).toLocaleDateString()}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        {formatCurrency(receipt.receipt_amount)}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        {receipt.commission_rate}%
                      </CTableDataCell>
                      <CTableDataCell className="text-center fw-bold text-success">
                        {formatCurrency(receipt.commission_amount)}
                      </CTableDataCell>
                      <CTableDataCell className="text-center">
                        <small className="text-muted">{receipt.transaction_id}</small>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          </CCardBody>
        </CCard>
      )}

      {/* No Commission Data Message */}
      {receiptCommissionData.receipts_commission && receiptCommissionData.receipts_commission.length === 0 && (
        <CCard className="mb-4">
          <CCardBody className="text-center py-5">
            <CIcon icon={cilWallet} size="3xl" className="text-muted mb-3" />
            <h5 className="text-muted">No Commission Earned This Month</h5>
            <p className="text-muted mb-0">
              No successful payments were made by your referred companies in {months.find(m => m.value === selectedMonth)?.label} {selectedYear}.
              <br />
              Commission is calculated based on actual payments received from companies.
            </p>
          </CCardBody>
        </CCard>
      )}
    </>
  );
};

export default PartnerDashboard;