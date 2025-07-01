import React, { useEffect, useState, useCallback } from 'react'
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormInput,
  CFormLabel,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { getAPICall } from '../../../util/api'
import { useToast } from '../../common/toast/ToastContext';
import CIcon from '@coreui/icons-react';
import { cilChatBubble, cilPhone } from '@coreui/icons';
import { getUserData } from '../../../util/session';
import { useTranslation } from 'react-i18next';

let debounceTimer;
const debounceDelay = 300;

const CreditReport = () => {
  const [report, setReport] = useState([]);
  const [filteredReport, setFilteredReport] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataFetched, setDataFetched] = useState(false);
  const { showToast } = useToast();
  const company = getUserData()?.company_info?.company_name || '';
  const { t, i18n } = useTranslation("global");
  const lng = i18n.language;

  // Fetch data only once when component mounts
  useEffect(() => {
    // Only fetch if we haven't fetched yet
    if (!dataFetched) {
      const fetchReport = async () => {
        try {
          setLoading(true);
          const response = await getAPICall('/api/creditReport');

          if(response && response.data) {
            // Make sure we're properly filtering data
            const filteredData = response.data
              .filter(r => {
                // Check if there are any items with quantity > 0
                return r.items && Array.isArray(r.items) &&
                       r.items.some(i => i && typeof i.quantity === 'number' && i.quantity > 0);
              })
              .sort((c1, c2) => c1.name.localeCompare(c2.name));

            setReport(filteredData);
            setFilteredReport(filteredData);
          } else {
            setReport([]);
            setFilteredReport([]);
          }
        } catch (error) {
          setError('Error fetching data: ' + (error.message || 'Unknown error'));
          showToast('danger', 'Error occurred ' + (error.message || 'Unknown error'));
        } finally {
          setLoading(false);
          setDataFetched(true); // Mark data as fetched regardless of success/failure
        }
      };

      fetchReport();
    }
  }, [dataFetched, showToast]);

  // Handle search with debounce
  const onSearchChange = useCallback((searchTerm) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if(searchTerm?.length > 0){
        setFilteredReport(report.filter(r =>
          r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.mobile?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.address?.toLowerCase().includes(searchTerm.toLowerCase())
        ));
      } else {
        setFilteredReport(report);
      }
    }, debounceDelay);
  }, [report]);

  // SMS body creation helper
  const getSmsBody = useCallback((p) => {
    if (!p.items || !Array.isArray(p.items)) {
      return `${t('MSG.sms_part_1')}${t('MSG.sms_part_2')}${t('MSG.sms_part_3')} ${company}`;
    }

    let products = "";
    p.items.forEach(i => {
      if(i && typeof i.quantity === 'number' && i.quantity > 0) {
        const productName = lng === 'en' ? i.product_name : i.product_local_name;
        products += ` ${i.quantity} ${t('LABELS.empty')} ${productName || ''}`;
      }
    });

    return `${t('MSG.sms_part_1')}${t('MSG.sms_part_2')}${products}${t('MSG.sms_part_3')} ${company}`;
  }, [company, lng, t]);

  // Calculate total crates by summing up quantities from all customers' items
  const calculateTotalCrates = useCallback(() => {
    let total = 0;
    filteredReport.forEach(customer => {
      if (customer.items && Array.isArray(customer.items)) {
        customer.items.forEach(item => {
          if (item && typeof item.quantity === 'number' && item.quantity > 0) {
            total += item.quantity;
          }
        });
      }
    });
    return total;
  }, [filteredReport]);

  // Get the total crates count
  const totalCrates = calculateTotalCrates();

  if (loading) {
    return (
      <CRow>
        <CCol xs={12}>
          <CCard>
            <CCardBody>
              <div className="d-flex justify-content-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    );
  }

  if (error) {
    return (
      <CRow>
        <CCol xs={12}>
          <CAlert color="danger">{error}</CAlert>
        </CCol>
      </CRow>
    );
  }

  return (
    <CRow>
      <CCol xs={12} style={{ padding: '2px' }}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>{t('LABELS.credit_report')}</strong>
            {report.length > 0 && (
              <span className="ms-2">
                <CBadge color="info">{report.length} {t('LABELS.customers')}</CBadge>
              </span>
            )}
          </CCardHeader>
          <CCardBody>
            {/* Search Input Box */}
            <CForm className="mb-3">
              <CFormInput
                type="text"
                placeholder={t('LABELS.search')}
                value={searchTerm}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setSearchTerm(newValue);
                  onSearchChange(newValue);
                }}
              />
            </CForm>

            <div className='table-responsive'>
              <CTable hover striped small>
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell scope="col" className="d-none d-sm-table-cell">{t('LABELS.id')}</CTableHeaderCell>
                    <CTableHeaderCell scope="col">{t('LABELS.name')}</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="d-none d-sm-table-cell">{t('LABELS.mobile_number')}</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="d-none d-md-table-cell">{t('LABELS.address')}</CTableHeaderCell>
                    <CTableHeaderCell scope="col">{t('LABELS.return_items')}</CTableHeaderCell>
                    <CTableHeaderCell scope="col">{t('LABELS.remark')}</CTableHeaderCell>
                    <CTableHeaderCell scope="col">{t('LABELS.actions')}</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                {filteredReport.length > 0 ? (
                  <>
                    {filteredReport.map((p, index) => {
                      const validItems = p.items && Array.isArray(p.items) ?
                        p.items.filter(i => i && typeof i.quantity === 'number' && i.quantity > 0) : [];

                      return (
                        <CTableRow key={`${p.mobile || 'unknown'}_${index}`}>
                          <CTableDataCell className="d-none d-sm-table-cell" scope="row">{index + 1}</CTableDataCell>
                          <CTableDataCell>{p.name || '-'}</CTableDataCell>
                          <CTableDataCell className="d-none d-sm-table-cell">{p.mobile || '-'}</CTableDataCell>
                          <CTableDataCell className="d-none d-md-table-cell">{p.address || '-'}</CTableDataCell>
                          <CTableDataCell>
                            {validItems.length > 0 ? (
                              <table className="table table-sm borderless m-0 p-0">
                                <tbody>
                                {
                                  validItems.map((i, idx) => (
                                    <tr key={`item-${i.id || idx}`}>
                                      <td>
                                        {lng === 'en' ? i.product_name : i.product_local_name} {i.quantity + ` (${t('LABELS.empty')})`}
                                      </td>
                                    </tr>
                                  ))
                                }
                                </tbody>
                              </table>
                            ) : '-'}
                          </CTableDataCell>
                          <CTableDataCell>
                            {validItems.filter(i => i.remark).map((i, idx) => (
                              <div key={`remark-${i.id || idx}`} className="mb-1">
                                {i.remark || '-'}
                              </div>
                            ))}
                            {!validItems.some(i => i.remark) && '-'}
                          </CTableDataCell>
                          <CTableDataCell>
                            {p.mobile && (
                              <>
                                <a className='btn btn-outline-primary btn-sm me-1' href={`tel:${p.mobile}`}>
                                  <CIcon icon={cilPhone} />
                                </a>
                                <a className='btn btn-outline-success btn-sm' href={`sms:+91${p.mobile}?body=${encodeURIComponent(getSmsBody(p))}`}>
                                  <CIcon icon={cilChatBubble} />
                                </a>
                              </>
                            )}
                            {!p.mobile && (
                              <span className="text-muted">No contact</span>
                            )}
                          </CTableDataCell>
                        </CTableRow>
                      );
                    })}
                    <CTableRow className="fw-bold bg-light">
                      <CTableDataCell className="d-none d-sm-table-cell"></CTableDataCell>
                      <CTableDataCell>{t('LABELS.totals')}</CTableDataCell>
                      <CTableDataCell className="d-none d-sm-table-cell"></CTableDataCell>
                      <CTableDataCell className="d-none d-md-table-cell"></CTableDataCell>
                      <CTableDataCell>
                        <CBadge color={totalCrates > 0 ? "danger" : "primary"}>
                          {totalCrates} {t('LABELS.empty')}
                        </CBadge>
                      </CTableDataCell>
                      <CTableDataCell></CTableDataCell>
                      <CTableDataCell></CTableDataCell>
                    </CTableRow>
                  </>
                ) : (
                  <CTableRow>
                    <CTableDataCell colSpan={7} className="text-center py-3">
                      {searchTerm ? `${t('LABELS.no_matching_records')}` : `${t('LABELS.no_records_found')}`}
                    </CTableDataCell>
                  </CTableRow>
                )}
                </CTableBody>
              </CTable>
            </div>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default CreditReport
