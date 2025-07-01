import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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
} from '@coreui/react'
import { CFormInput, CInputGroup, CInputGroupText } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import WidgetsDropdown from '../widgets/WidgetsDropdown'
import MainChart from './MainChart'
import { getAPICall } from '../../util/api'
import { getUserData, getUserType } from '../../util/session'
import { useToast } from '../common/toast/ToastContext'
import { useTranslation } from 'react-i18next'

const Dashboard = (Props) => {
  const user = getUserType()
  const [reportMonth, setReportMonth] = useState({
    monthlySales: Array(12).fill(0),
    monthlyExpense: Array(12).fill(0),
    monthlyPandL: Array(12).fill(0),
  })
  const [stock, setStock] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const { showToast } = useToast()
  const userData = getUserData()
  const mode = userData?.company_info?.appMode ?? 'advance'
  const { t, i18n } = useTranslation('global')
  const lng = i18n.language

  // Calculate the financial year dynamically
  const currentYear = new Date().getFullYear()
  const financialYearStart = currentYear
  const financialYearEnd = currentYear + 1
  const financialYear = `April ${financialYearStart} - March ${financialYearEnd}`

  useEffect(() => {
    try {
      const fetchMonthlySales = async () => {
        const response = await getAPICall('/api/monthlyReport')
        setReportMonth(response)
      }
      if (mode === 'advance') {
        fetchMonthlySales()
      }
    } catch (error) {
      showToast('danger', 'Error occurred ' + error)
    }
  }, [])

  useEffect(() => {
    try {
      const fetchStock = async () => {
         const params = new URLSearchParams({type: 1 })
        const response = await getAPICall(`/api/finalProductInventory?${params.toString()}`);
        setStock(response)
      }
      fetchStock()
    } catch (error) {
      showToast('danger', 'Error occurred ' + error)
    }
  }, [])

  const decodeUnicode = (str) => {
    return str.replace(/\\u[\dA-F]{4}/gi, (match) => {
      return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
    });
  };

  return (
    <>
      {mode === 'advance' && <WidgetsDropdown className="mb-4" reportMonth={reportMonth} />}
      {stock.length > 0 && (
        <CCard className="mt-4 mb-4">
          <CCardBody>
            <CRow className="justify-content-center">
              <h4 className="card-title mb-0 text-center">{t('LABELS.overview')}</h4>
            </CRow>
            
            {/* Add search input with icon */}
            <CRow className="mb-3 mt-3">
<CCol md={4} className="ms-auto">
<CInputGroup size="sm">
<CFormInput
        style={{ borderColor: '#007BFF', color: '#0d6efd' }} // blue border & text
        placeholder={t('LABELS.search_name')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
<CInputGroupText style={{ borderColor: '#007BFF',backgroundColor: '#0d6efd', color: 'white' }}>
<CIcon icon={cilSearch} />
</CInputGroupText>
</CInputGroup>
</CCol>
</CRow>
            
            <div className="overflow-x-auto w-full" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <CTable className="min-w-[600px]">
                <CTableHead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 2 }}>
                  <CTableRow>
                    <CTableHeaderCell scope="col" style={{ width: '25%' }}>{t('LABELS.stock_product')}</CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center" style={{ width: '25%' }}>
                      {t('LABELS.currentCapacity')} 
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center" style={{ width: '25%' }}>
                      {t('LABELS.available_stock')}
                    </CTableHeaderCell>
                    <CTableHeaderCell scope="col" className="text-center" style={{ width: '25%' }}>
                      {t('LABELS.cost')} 
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
  
                <CTableBody>
                  {stock
                  
                    .filter((p) => {
                      // Only filter if search term has 2 or more characters
                      if (searchTerm.length < 2) return true;
                      
                      // Search in product name (based on current language)
                      const productName = lng === 'en' ? p.name : decodeUnicode(p.localName);
                      console.log("p.local_name",productName);
                      
                      return productName && productName.toLowerCase().includes(searchTerm.toLowerCase());
                    })
                    .map((p) => {
                      // Calculate the total cost (quantity × price)
                      const totalCost = p.qty * (p.dPrice || 0);
                      
                      return (
                        <CTableRow key={p.id}>
                          <CTableHeaderCell>{lng === 'en' ? p.name : decodeUnicode(p.localName)}</CTableHeaderCell>
  
                          <CTableDataCell className="text-center font-weight-bold text-black" style={{ width: '16%' }}>
                            {p.max_stock} {p.unit || '-'}
                          </CTableDataCell>
  
                          <CTableDataCell className="text-center font-weight-bold text-black" style={{ width: '16%' }}>
                            {p.qty}  {p.unit || '-'}
                          </CTableDataCell>
  
                          <CTableDataCell className="text-center font-weight-bold text-black" style={{ width: '16%' }}>
                            {totalCost.toFixed(0)}&nbsp; ₹ 
                          </CTableDataCell>
                        </CTableRow>
                      )
                    })}
                </CTableBody>
              </CTable>
            </div>
          </CCardBody>
        </CCard>
      )}
  
      {((user === 0 || user === 1) && mode === 'advance') && (
        <CCard className="mt-4 mb-4">
          <CCardBody>
            <CRow>
              <CCol sm={5}>
                <h4 id="traffic" className="card-title mb-0">
                  P&L (In Thousands)
                </h4>
                <div className="small text-body-secondary">{financialYear}</div>
              </CCol>
              <CCol sm={7} className="d-none d-md-block">
                {/* Additional buttons or controls can go here */}
              </CCol>
            </CRow>
            <MainChart monthlyPandL={reportMonth.monthlyPandL} />
          </CCardBody>
        </CCard>
      )}
    </>
  )
}

export default Dashboard
