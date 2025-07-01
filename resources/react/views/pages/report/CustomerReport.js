import './CustomerReport.css'
import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
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
import { useToast } from '../../common/toast/ToastContext'
import { generatePDFReport } from './CustomerReportPdf'
import CIcon from '@coreui/icons-react'
import { cilArrowCircleBottom, cilArrowCircleTop, cilCloudDownload, cilSearch } from '@coreui/icons'

let debounceTimer;

const CustomerReport = () => {
  const [validated, setValidated] = useState(false)
  const [report, setReport] = useState([])
  const [groupReport, setGroupReport] = useState([])
  const [expandedRows, setExpandedRows] = useState({})
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()
  const { t, i18n } = useTranslation("global")
  const lng = i18n.language
  const [state, setState] = useState({
    name: '',
    customer_id: '',
    start_date: '',
    end_date: '',
    customer: null,
  })
  const [suggestions, setSuggestions] = useState([])

  const handleChange = (e) => {
    const { name, value } = e.target
    setState({ ...state, [name]: value })
  }

  const groupDataByCustomer = (data) => {
    const groupedData = {}
  
    data.forEach(item => {
      const customerName = item.customer.name
      if (!groupedData[customerName]) {
        groupedData[customerName] = {
          customer: item.customer,
          totalPaid: 0,
          totalUnpaid: 0,
          grandTotal: 0,
          details: [],
          productTotals: {} // To hold product-wise quantities
        }
      }
  
      // Update totals
      groupedData[customerName].totalPaid += item.paidAmount
      groupedData[customerName].totalUnpaid += (item.totalAmount - item.paidAmount)
      groupedData[customerName].grandTotal += item.totalAmount
      groupedData[customerName].details.push(item)
  
      // Aggregate product quantities
      item.items.forEach(product => {
        const productName = lng === 'en' ? product.product_name : product.product_local_name
        const productUnit = product.unit || ''
        
        if (!groupedData[customerName].productTotals[productName]) {
          groupedData[customerName].productTotals[productName] = {
            dQty: 0,
            eQty: 0,
            unit: productUnit
          }
        }
        groupedData[customerName].productTotals[productName].dQty += product.dQty
        groupedData[customerName].productTotals[productName].eQty += product.eQty
      })
    })
  
    return Object.values(groupedData)
  }

  const fetchReport = async () => {
    try {
      setLoading(true)
      const reportData = await getAPICall(`/api/customerReport?id=${state.customer_id}&startDate=${state.start_date}&endDate=${state.end_date}`)
      if (reportData && reportData.length > 0) {
        setGroupReport(groupDataByCustomer(reportData))
        setExpandedRows({})
        setReport(reportData)
        showToast('success', t('MSG.report_fetched_successfully'))
      } else {
        setReport([])
        setGroupReport([])
        showToast('info', t('MSG.no_data_found'))
      }
    } catch (error) {
      showToast('danger', `${t('MSG.error_occurred')} ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event) => {
    try {
      const form = event.currentTarget
      event.preventDefault()
      event.stopPropagation()
      setValidated(true)
      if (form.checkValidity()) {
        await fetchReport()
      }
    } catch (error) {
      showToast('danger', `${t('MSG.error_occurred')} ${error}`)
    }
  }

  const debounce = (func, delay) => {
    return function(...args) {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        func.apply(this, args)
      }, delay)
    }
  }

  const searchCustomer = async (value) => {
    try {
      const customers = await getAPICall('/api/searchCustomer?searchQuery=' + value)
      if (customers?.length) {
        setSuggestions(customers)
      } else {
        setSuggestions([])
      }
    } catch (error) {
      showToast('danger', `${t('MSG.error_occurred')} ${error}`)
    }
  }

  // Wrap the searchCustomer function with debounce
  const debouncedSearchCustomer = debounce(searchCustomer, 200)

  const handleNameChange = (event) => {
    const value = event.target.value
    setState((pre) => ({...pre, name: value, customer_id: value ? pre.customer_id : ''}))
    // Filter suggestions based on input
    if (value) {
      debouncedSearchCustomer(value)
    } else {
      setTimeout(() => setSuggestions([]), 200)
    }
  }

  const handleSuggestionClick = (suggestion) => {
    setState((pre) => ({...pre, customer: suggestion, name: suggestion.name, customer_id: suggestion.id}))
    setSuggestions([])
    setReport([])
  }

  let grandTotalBill = 0
  let grandTotalCollection = 0
  const productTotals = {}

  const handleDownload = () => {
    if (report.length > 0) {
      generatePDFReport(grandTotalBill, state, report, (grandTotalBill - grandTotalCollection))
      showToast('success', t('MSG.report_downloaded'))
    } else {
      showToast('danger', t('MSG.no_report_to_download'))
    }
  }

  const formatDate = (dateString) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' }
    const date = new Date(dateString)
    const formattedDate = date.toLocaleDateString('en-US', options).replace(',', '')
    
    // Split the formatted date to rearrange it
    const [month, day, year] = formattedDate.split(' ')
    return `${day} ${month} ${year}`
  }

  function convertTo12HourFormat(time) {
    // Split the time into hours and minutes
    let [hours, minutes] = time.split(':').map(Number)
    
    // Determine AM or PM suffix
    const suffix = hours >= 12 ? 'PM' : 'AM'
    
    // Convert hours from 24-hour format to 12-hour format
    hours = hours % 12 || 12 // Convert 0 to 12 for midnight

    // Return the formatted time
    return `${hours}:${minutes.toString().padStart(2, '0')} ${suffix}`
  }

  const handleRowToggle = (customerName) => {
    setExpandedRows(prev => ({
      ...prev,
      [customerName]: !prev[customerName]
    }))
  }

  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4 shadow-sm">
          <CCardHeader className="bg-light">
            <strong>{t("LABELS.customer_report")}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm noValidate validated={validated} onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-3">
                  <div className="position-relative mb-3">
                    <CFormLabel htmlFor="customerName">{t("LABELS.customer_name")}</CFormLabel>
                    <div className="input-group">
                      <CFormInput
                        type="text"
                        id="customerName"
                        placeholder={t('MSG.enter_customer_name_msg')}
                        name="customerName"
                        value={state.name}
                        onChange={handleNameChange}
                        autoComplete='off'
                        className="rounded-end-0"
                      />
                      <span className="input-group-text bg-light">
                        <CIcon icon={cilSearch} size="sm" />
                      </span>
                    </div>
                    {suggestions.length > 0 && (
                      <ul className="suggestions-list shadow-sm">
                        {suggestions.map((suggestion, index) => (
                          <li 
                            key={index} 
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="suggestion-item"
                          >
                            <div className="d-flex justify-content-between">
                              <span>{suggestion.name}</span>
                              {suggestion.mobile && (
                                <small className="text-muted">{suggestion.mobile}</small>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="mb-3">
                    <CFormLabel htmlFor="start_date">{t('LABELS.start_date')}</CFormLabel>
                    <CFormInput
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={state.start_date}
                      onChange={handleChange}
                      required
                      feedbackInvalid={t('MSG.please_select_date_msg')}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="mb-3">
                    <CFormLabel htmlFor="end_date">{t('LABELS.end_date')}</CFormLabel>
                    <CFormInput
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={state.end_date}
                      onChange={handleChange}
                      required
                      feedbackInvalid={t('MSG.please_select_date_msg')}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="mb-3 pt-2 mt-4">
                    <CButton 
                      color="primary" 
                      type="submit" 
                      className="me-2" 
                      disabled={loading}
                    >
                      {loading ? `${t("LABELS.loading")}...` : t("LABELS.submit")}
                    </CButton>
                    {report.length > 0 && (
                      <CButton 
                        onClick={handleDownload} 
                        color="success"
                        disabled={loading}
                      >
                        <CIcon icon={cilCloudDownload} className="me-1" />
                        {t('LABELS.download')}
                      </CButton>
                    )}
                  </div>
                </div>
              </div>
              {state.customer && state.customer_id && (
                <div className="row">
                  <div className="col-sm-12">
                    <CAlert color="success" className="d-flex align-items-center">
                      <div>
                        <h6 className="mb-1">{state.customer.name}</h6>
                        <p className="mb-0">
                          {state.customer.mobile && (
                            <span className="me-3">
                              <strong>{t("LABELS.mobile")}:</strong> {state.customer.mobile}
                            </span>
                          )}
                          {state.customer.address && (
                            <span>
                              <strong>{t("LABELS.address")}:</strong> {state.customer.address}
                            </span>
                          )}
                        </p>
                      </div>
                    </CAlert>
                  </div>
                </div>
              )}
            </CForm>
            
            {report.length > 0 && (
              <>
                <hr className="my-4" />
                <div className='table-responsive'>
                  <CTable hover bordered className="border-top table-striped">
                    <CTableHead className="bg-light">
                      <CTableRow>
                        <CTableHeaderCell scope="col" width="5%">{t('LABELS.id')}</CTableHeaderCell>
                        <CTableHeaderCell scope="col" width="20%">{t('LABELS.name')}</CTableHeaderCell>
                        <CTableHeaderCell scope="col" width="35%">{t('LABELS.products')}</CTableHeaderCell>
                        <CTableHeaderCell scope="col" width="12%">{t('LABELS.paid')}</CTableHeaderCell>
                        <CTableHeaderCell scope="col" width="12%">{t('LABELS.credit')}</CTableHeaderCell>
                        <CTableHeaderCell scope="col" width="12%">{t('LABELS.total')}</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {groupReport.map((p, index) => {
                        grandTotalBill += p.grandTotal
                        grandTotalCollection += p.totalPaid
                        Object.keys(p.productTotals).forEach(key => {
                          if (productTotals[key]) {
                            productTotals[key].dQty += p.productTotals[key].dQty
                            productTotals[key].eQty += p.productTotals[key].eQty
                            productTotals[key].unit = p.productTotals[key].unit
                          } else {
                            productTotals[key] = {
                              dQty: p.productTotals[key].dQty, 
                              eQty: p.productTotals[key].eQty,
                              unit: p.productTotals[key].unit || ''
                            }
                          }
                        })
                        return (
                          <React.Fragment key={`customer-${p.customer.id}`}>
                            <CTableRow className={expandedRows[p.customer.name] ? 'expanded-row' : ''}>
                              <CTableHeaderCell scope="row">{index + 1}</CTableHeaderCell>
                              <CTableDataCell>
                                <div className="d-flex align-items-center">
                                  <CIcon 
                                    onClick={() => handleRowToggle(p.customer.name)} 
                                    icon={expandedRows[p.customer.name] ? cilArrowCircleTop : cilArrowCircleBottom} 
                                    className="me-2 cursor-pointer text-primary" 
                                    size="lg"
                                  />
                                  <span>{p.customer.name}</span>
                                </div>
                              </CTableDataCell>
                              <CTableDataCell>
  {Object.keys(p.productTotals).length > 0 ? (
    <div className="product-summary">
      {Object.keys(p.productTotals).map(productName => {
        const matchingItem = p.details
          .flatMap(detail => detail.items)
          .find(i => i.product_name === productName || i.product_local_name === productName)

        const unit = matchingItem?.product_unit || 'pcs' // ✅ fallback to 'pcs'

        // ✅ Also update productTotals with unit so it reflects in grand total summary
        if (!productTotals[productName]?.unit || productTotals[productName].unit === '') {
          productTotals[productName].unit = unit
        }

        return (
          <div key={productName} className="product-item">
            <div className="product-name">{productName}</div>
            <div className="product-quantities">
              {p.productTotals[productName].dQty > 0 && (
                <span className="delivered-qty">
                  {p.productTotals[productName].dQty}
                  <span className="unit-text"> {unit}</span>
                </span>
              )}
              {p.productTotals[productName].eQty > 0 && (
                <span className="collected-qty">
                  {p.productTotals[productName].eQty}
                  <span className="unit-text"> {unit}</span>
                  <span className="text-muted"> ({t('LABELS.collected')})</span>
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  ) : (
    <span className="text-muted">{t('LABELS.only_cash_collected')}</span>
  )}
</CTableDataCell>

                              <CTableDataCell>
                                {p.totalPaid > 0 ? (
                                  <CBadge color="success" shape="rounded-pill" className="px-3 py-2">
                                    ₹{p.totalPaid.toLocaleString()}
                                  </CBadge>
                                ) : (
                                  <span>₹0</span>
                                )}
                              </CTableDataCell>
                              <CTableDataCell>
                                {p.totalUnpaid > 0 ? (
                                  <CBadge color="danger" shape="rounded-pill" className="px-3 py-2">
                                    ₹{p.totalUnpaid.toLocaleString()}
                                  </CBadge>
                                ) : (
                                  <span>₹0</span>
                                )}
                              </CTableDataCell>
                              <CTableDataCell>
                                <strong>₹{p.grandTotal.toLocaleString()}</strong>
                              </CTableDataCell>
                            </CTableRow>
                            {expandedRows[p.customer.name] && (
                              <CTableRow className="expanded-details">
                                <CTableDataCell colSpan={6} className="p-0">
                                  <div className="px-4 py-3 bg-light border-top border-bottom">
                                    <h6 className="mb-2">{t('LABELS.transaction_details')}</h6>
                                  </div>
                                  <CTable hover borderless className="detail-table mb-0">
                                    <CTableHead className="table-light">
                                      <CTableRow>
                                        <CTableHeaderCell>{t('LABELS.date')}</CTableHeaderCell>
                                        <CTableHeaderCell>{t('LABELS.time')}</CTableHeaderCell>
                                        <CTableHeaderCell>{t('LABELS.products')}</CTableHeaderCell>
                                        <CTableHeaderCell>{t('LABELS.paid')}</CTableHeaderCell>
                                        <CTableHeaderCell>{t('LABELS.credit')}</CTableHeaderCell>
                                        <CTableHeaderCell>{t('LABELS.total')}</CTableHeaderCell>
                                        <CTableHeaderCell>{t('LABELS.delivered_by')}</CTableHeaderCell>
                                      </CTableRow>
                                    </CTableHead>
                                    <CTableBody>
                                      {p.details.map(detail => (
                                        <CTableRow key={detail.id}>
                                          <CTableDataCell>{formatDate(detail.deliveryDate)}</CTableDataCell>
                                          <CTableDataCell>{convertTo12HourFormat(detail.deliveryTime)}</CTableDataCell>
                                          <CTableDataCell>
                                            {detail.items.length > 0 ? (
                                              <div className="transaction-products">
                                                {detail.items.map(item => (
                                                  <div key={item.id} className="product-transaction-item">
                                                    <div className="product-transaction-name">
                                                      {lng === 'en' ? item.product_name : item.product_local_name}
                                                    </div>
                                                    <div className="quantities">
                                                      {item.dQty > 0 && (
                                                        <div className="delivered">
                                                          {item.dQty} 
                                                          {item.product_unit && <span className="unit-text"> {item.product_unit}</span>} 
                                                          <span className="price-text"> × ₹{item.dPrice}</span>
                                                        </div>
                                                      )}
                                                      {item.eQty > 0 && (
                                                        <div className="collected text-muted">
                                                          {item.eQty} 
                                                          {item.product_unit && <span className="unit-text"> {item.product_unit}</span>}
                                                          <span> ({t('LABELS.collected')})</span>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            ) : (
                                              <span className="text-muted">{t('LABELS.only_cash_collected')}</span>
                                            )}
                                          </CTableDataCell>
                                          <CTableDataCell>₹{detail.paidAmount}</CTableDataCell>
                                          <CTableDataCell className="text-danger">
                                            ₹{detail.totalAmount - detail.paidAmount}
                                          </CTableDataCell>
                                          <CTableDataCell><strong>₹{detail.totalAmount}</strong></CTableDataCell>
                                          <CTableDataCell>{detail.user.name}</CTableDataCell>
                                        </CTableRow>
                                      ))}
                                    </CTableBody>
                                  </CTable>
                                </CTableDataCell>
                              </CTableRow>
                            )}
                          </React.Fragment>
                        )
                      })}

                      <CTableRow className="table-summary bg-light fw-bold">
                        <CTableDataCell colSpan={2} className="text-end">
                          {t('LABELS.grand_total')}
                        </CTableDataCell>
                        <CTableDataCell >
                          <div className="total-products-summary">
                            {Object.keys(productTotals).map(key => (
                              <div key={key} className="total-product-item">
                                <div className="product-name">{key}</div>
                                <div className="product-quantities">
                                  {productTotals[key].dQty > 0 && (
                                    <span className="total-delivered">
                                      {productTotals[key].dQty}
                                      {productTotals[key].unit && 
                                        <span className="unit-text"> {productTotals[key].unit}</span>
                                      }
                                    </span>
                                  )}
                                  {productTotals[key].eQty > 0 && (
                                    <span className="total-collected">
                                      {productTotals[key].eQty}
                                      {productTotals[key].unit && 
                                        <span className="unit-text"> {productTotals[key].unit}</span>
                                      }
                                      <span className="text-muted"> ({t('LABELS.collected')})</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell >
                          <CBadge color="success" shape="rounded-pill" className="px-3 py-2">
                            ₹{grandTotalCollection.toLocaleString()}
                          </CBadge>
                        </CTableDataCell>

                       <CTableDataCell >
                          <CBadge color="danger" shape="rounded-pill" className="px-3 py-2">
                            ₹{(grandTotalBill - grandTotalCollection).toLocaleString()}
                          </CBadge>
                        </CTableDataCell>
                        <CTableDataCell >
                          <CBadge color="primary" shape="rounded-pill" className="px-3 py-2">
                            ₹{grandTotalBill.toLocaleString()}
                          </CBadge>
                        </CTableDataCell>
                      </CTableRow>
       

                    </CTableBody>
                  </CTable>
                </div>
              </>
            )}
            
            {report.length === 0 && validated && (
              <div className="text-center py-5">
                <div className="mb-3">
                  <CIcon icon={cilSearch} size="3xl" className="text-muted" />
                </div>
                <h5>{t('MSG.no_data_found')}</h5>
                <p className="text-muted">{t('MSG.adjust_search_criteria')}</p>
              </div>
            )}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default CustomerReport