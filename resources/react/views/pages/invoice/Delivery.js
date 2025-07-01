import './Invoice.css';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  CFormSelect,
  CRow,
} from '@coreui/react'
import { getAPICall, post, put } from '../../../util/api'
import QRCodeModal from '../../common/QRCodeModal'
import ConfirmationModal from '../../common/ConfirmationModal'
import NewCustomerModal from '../../common/NewCustomerModal'
import { useToast } from '../../common/toast/ToastContext'
import { useTranslation } from 'react-i18next'
import { useSpinner } from '../../common/spinner/SpinnerProvider'
import { fetchCustomers, filterCustomers, invalidateCustomerCache } from '../../../util/customers'
import CIcon from '@coreui/icons-react'
import { cilSearch } from '@coreui/icons'
import AllCustomerModal from '../../common/AllCustomerModal';
let debounceTimer;
const Delivery = () => {
  const timeNow = useCallback(() => `${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`, []);
  const [validated, setValidated] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showAllCustomerModal, setShowAllCustomerModal] = useState(false)
  const [deleteModalVisible, setDeleteModalVisible] = useState(false)
  const [deliveryModalVisible, setDeliveryModalVisible] = useState(false)
  const [order, setOrder] = useState();
  const [allProducts, setAllProducts] = useState([])
  const [customerHistory, setCustomerHistory] = useState()
  const [bookings, setBookings] = useState([])
  const [state, setState] = useState({
    customer_id: 0,
    lat:'',
    long:'',
    payLater: false,
    isSettled: false,
    invoiceDate: new Date().toISOString().split('T')[0],
    deliveryTime: timeNow(),
    deliveryDate: '',
    invoiceType: 1,
    items: [],
    totalAmount:'',
    orderStatus: 1,
    discount: 0,
    balanceAmount: 0,
    paidAmount: 0,
    finalAmount: 0,
    paymentType: 1,
    remark: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showSpinner, hideSpinner } = useSpinner();

  const { t, i18n } = useTranslation("global")
  const lng = i18n.language;
  const { showToast } = useToast();
  const [customerName, setCustomerName] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const debounce = (func, delay) => {
      return function(...args) {
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
              func.apply(this, args);
          }, delay);
      };
  };

  const searchCustomer = useCallback(async (value) => {
    try {
      // const customers = await getAPICall('/api/searchCustomer?searchQuery=' + value);
      const customers = await fetchCustomers();
      const filteredCustomers = filterCustomers(customers,value);
      setSuggestions(filteredCustomers);
    } catch (error) {
      showToast('danger', 'Error occured ' + error);
    }
  });

  // Wrap the searchCustomer function with debounce
  const debouncedSearchCustomer = useMemo(() => debounce(searchCustomer, 300), [searchCustomer]);

  const handleNameChange = useCallback((event) => {
    const value = event.target.value;
    setCustomerName({name : value});
    // Filter suggestions based on input
    if (value) {
      debouncedSearchCustomer(value)
    } else {
      setSuggestions([]);
    }
  });
  const handleRemarkChange = (index, value) => {
    const allProductsCopy = [...allProducts];
    allProductsCopy[index].remark = value;
    setAllProducts([...allProductsCopy]);
  };



  const handleSuggestionClick = (suggestion) => {
    setCustomerName(suggestion);
    setState((pre) => ({...pre, customer_id: suggestion.id}))
    const updatedProducts = discountedPrices([...allProducts], suggestion.discount)
    setAllProducts(updatedProducts);
    calculateTotal(updatedProducts);
    setSuggestions([]);
    getCustomerHistory(suggestion.id);
    getBookings(suggestion.id);
  };

  const onCustomerAdded = (customer) => {
    handleSuggestionClick(customer);
    setShowCustomerModal(false);
    setShowAllCustomerModal(false);
    invalidateCustomerCache();
  }

  const getCustomerHistory = useCallback(async (customer_id) => {
    try {
      const response = await getAPICall('/api/customerHistory?id=' + customer_id);
      if (response) {
        setCustomerHistory(response);
      }
    } catch (error) {
      showToast('danger', 'Error occured ' + error);
    }
  }, []);

  const getBookings = useCallback(async (customer_id) => {
    showSpinner();
    try {
      //customerHistory
      const response = await getAPICall('/api/customerBookings?id=' + customer_id);
      if (response) {
        setBookings(response);
      }
    } catch (error) {
      showToast('danger', 'Error occured ' + error);
    } finally{
      hideSpinner();
    }
  });

  const discountedPrices = useCallback((products, discount) => {
    products.forEach(p=>{
      p.sizes[0].dPrice = getDiscountedPrice(p, discount)
    })
    return products;
  });

  const getDiscountedPrice = useCallback((p, discount) => {
    const value = p.sizes[0].oPrice;
    const price = value - (value * (discount || (customerName.discount ?? 0)) /100);
    return Math.round(price);
  });

  const fetchProduct = useCallback(async () => {
    try {
      showSpinner();
      const response = await getAPICall('/api/product');
      setAllProducts(
        discountedPrices(
          response.filter(
            (p) => p.show === 1 && p.sizes.length > 0 && p.sizes[0].returnable == 1
          )
        )
      );

    } catch (error) {
      showToast('danger', 'Error occured ' + error);
    } finally{
      hideSpinner();
    }
  });

  const calculateTotal = useCallback((items) => {
    let total = 0;
    items.forEach((item) => {
      const rowTotal = item.total !== undefined && item.total !== null
        ? parseFloat(item.total)
        : (item.dQty ?? 0) * item.sizes[0].dPrice;

      total += rowTotal;
    });
    setState((prev) => ({
      ...prev,
      totalAmount: 0,
      finalAmount: 0
    }));
  });



  //Disabled location fetching
  // useEffect(()=>{
  //   var options = {
  //     enableHighAccuracy: true,
  //     timeout: 5000,
  //     maximumAge: 0,
  //   };

  //   function success(pos) {
  //     var crd = pos.coords;
  //     console.log("Your current position is:",`Lat: ${crd.latitude}`,`Long: ${crd.longitude}`,`${crd.accuracy} meters`);
  //     setState((pre)=>({...pre, lat: crd.latitude, long: crd.longitude}))
  //   }

  //   function errors(err) {
  //     console.warn(`ERROR(${err.code}): ${err.message}`);
  //   }

  //   navigator.geolocation.getCurrentPosition(success, errors, options);
  // },[])

  useEffect(() => {
    fetchProduct();
  }, [])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setState({ ...state, [name]: value });  // Update the corresponding state field
  });

  const handleSubmit = useCallback(async (event) => {
    try {
      const form = event.currentTarget
      event.preventDefault()
      event.stopPropagation()
      if (isSubmitting) return; // Prevent multiple submissions
      setIsSubmitting(true);

      // Validation
      if (!state.customer_id) {
        showToast('warning', t("MSG.please_select_customer"));
        setValidated(true);
        setIsSubmitting(false);
        return;
      }

      // Collect JarTracker data from products that have quantities
      const jarTrackerEntries = allProducts
      .filter(p => (p.dQty > 0 || p.eQty > 0))
      .map(p => {
        const netQuantity = (p.dQty || 0) - (p.eQty || 0); // dQty - eQty
        const remarkParts = [];

        if (p.dQty > 0) remarkParts.push(`Delivered ${p.dQty}`);
        if (p.eQty > 0) remarkParts.push(`Returned ${p.eQty}`);
        if (p.remark) remarkParts.push(p.remark);

        return {
          customer_id: state.customer_id,
          product_sizes_id: p.sizes[0].id,
          product_name: p.name,
          product_local_name: p.localName,
          quantity: netQuantity,
          remark: remarkParts.join(' | '),
        };
      });


      if (jarTrackerEntries.length === 0) {
        showToast('warning', t("MSG.please_add_at_least_one_product"));
        setIsSubmitting(false);
        return;
      }

      showSpinner();

      // Submit each JarTracker entry
      const savePromises = jarTrackerEntries.map(entry =>
        post('/api/jarTracker', entry)
      );

      await Promise.all(savePromises);

      showToast('success', t("MSG.delivery_tracker_saved_successfully"));
      handleClear();

    } catch (error) {
      showToast('danger', t("MSG.error_saving_delivery_tracker") + ': ' + error);
    } finally {
      hideSpinner();
      setIsSubmitting(false);
    }
  });

  const handleTotalChange = (e, index) => {
    const newTotal = parseFloat(e.target.value) || 0;
    const updatedProducts = [...allProducts];
    updatedProducts[index].total = newTotal;
    setAllProducts(updatedProducts);
    calculateTotal(updatedProducts); // <-- ADD THIS
  };




  const handleClear = useCallback(async () => {
    setState({
      customer_id: 0,
      lat:'',
      long:'',
      payLater: false,
      isSettled: false,
      invoiceDate: new Date().toISOString().split('T')[0],
      deliveryTime: timeNow(),
      deliveryDate: '',
      invoiceType: 1,
      items: [],
      totalAmount: 0,
      discount: 0,
      balanceAmount: 0,
      paidAmount: 0,
      finalAmount: 0,
      paymentType: 1,
      orderStatus: 1,
      remark: ''
    })
    const allProductsCopy = [...allProducts];
    allProductsCopy.forEach(p=>{
      p['eQty'] = 0;
      p['dQty'] = 0;
      p.total = 0;
      p.remark = '';
      p.sizes[0].dPrice = getDiscountedPrice(p, 0);
    });
    setAllProducts([...allProductsCopy]);
    setCustomerName({name: ''});
    setCustomerHistory(undefined);
    setBookings([]);
    setDeleteModalVisible(false);
    setDeliveryModalVisible(false);
    setValidated(false);
  });

  const handleQuantityChange = useCallback((index, qty, key) => {
    const allProductsCopy = [...allProducts];
    allProductsCopy[index][key] = qty;
    setAllProducts([...allProductsCopy]);
    calculateTotal(allProductsCopy);
  });

  const handlePriceChange = useCallback((index, price) => {
    const allProductsCopy = [...allProducts];
    allProductsCopy[index].sizes[0].dPrice = price;
    setAllProducts([...allProductsCopy]);
    calculateTotal(allProductsCopy);
  });

  const handleQuantityChangeRate = useCallback((index, qty, key) => {
    const allProductsCopy = [...allProducts];
    allProductsCopy[index][key] = qty;

    // Reset manual total when qty changes
    allProductsCopy[index].total = allProductsCopy[index].sizes[0].default_qty * allProductsCopy[index].dQty;

    setAllProducts([...allProductsCopy]);
    calculateTotal(allProductsCopy);
  });

  const handlePriceChangeRate = useCallback((index, price) => {
    const allProductsCopy = [...allProducts];
    allProductsCopy[index].sizes[0].dPrice = price;

    // Reset manual total when price changes
    allProductsCopy[index].total = price * allProductsCopy[index].dQty;

    setAllProducts([...allProductsCopy]);
    calculateTotal(allProductsCopy);
  });


  const handleDelete = useCallback((order) => {
    setOrder(order);
    setDeleteModalVisible(true);
  });

  const handleEdit = useCallback((order) => {
    setOrder(order);
    setDeliveryModalVisible(true);
  });

  const onDeliver = useCallback(async () => {
    showSpinner();
    try {
      const res = await put(`/api/order/${order.id}`,
        {
          ...order, lat: state.lat, long: state.long,
          deliveryTime: timeNow(),
          deliveryDate: new Date().toISOString().split('T')[0], orderStatus: 1
        });
      if (res) {
        if (res.id) {
          handleClear()
          showToast('success', t("MSG.order_is_delivered_msg"));
        } else {
          showToast('danger', t("MSG.order_is_already_delivered_msg"));
        }
      }
    } catch (error) {
      showToast('danger', 'Error occured ' + error);
    }
    hideSpinner();
  });

  const onDelete = useCallback(async () => {
    showSpinner();
    try {
      const res = await put(`/api/order/${order.id}`, { ...order, orderStatus: 0 });
      if (res.id) {
        showToast('success', t("MSG.order_is_cancelled_msg"));
      } else {
        showToast('danger', t("MSG.order_is_already_cancelled_msg"));
      }
      setDeleteModalVisible(false);
      handleClear();
    } catch (error) {
      setDeleteModalVisible(false);
      showToast('danger', 'Error occured ' + error);
    }
    hideSpinner();
  });

  return (
    <CRow>
      <AllCustomerModal onClick={handleSuggestionClick} visible={showAllCustomerModal} setVisible={setShowAllCustomerModal} newCustomer={setShowCustomerModal}/>
      <ConfirmationModal visible={deleteModalVisible} setVisible={setDeleteModalVisible} onYes={onDelete} resource={t("LABELS.cancel_order")}/>
      <ConfirmationModal visible={deliveryModalVisible} setVisible={setDeliveryModalVisible} onYes={onDeliver} resource={t("LABELS.deliver_order")}/>
      <QRCodeModal visible={showQR} setVisible={setShowQR}></QRCodeModal>
      <NewCustomerModal hint={customerName.name} onSuccess={onCustomerAdded} visible={showCustomerModal} setVisible={setShowCustomerModal}/>
    <CCol xs={12}>
      <CCard className="mb-4">
        <CCardHeader>
          <strong>{t("LABELS.delivery_record")}</strong>
        </CCardHeader>
        <CCardBody>
          <CForm noValidate validated={validated} onSubmit={handleSubmit}>
            <div className="row mb-2">
              <div className="col-9" style={{ position: 'relative'}}>
                <CFormInput
                  type="text"
                  id="pname"
                  placeholder={t('LABELS.customer_name')}
                  name="customerName"
                  value={customerName.name}
                  onChange={handleNameChange}
                  feedbackInvalid={t('MSG.please_provide_name')}
                  autoComplete='off'
                  required
                />
                <CIcon
                    icon={cilSearch}
                    style={{ cursor: 'pointer', position: 'absolute', marginRight: '10px', right: '10px', top: '10px' }}
                    onClick={() => setShowAllCustomerModal(true)}
                  />
                {customerName.name?.length > 0 && (
                  <ul className="suggestions-list">
                    {suggestions.map((suggestion, index) => (
                      <li key={index} onClick={() => handleSuggestionClick(suggestion)}>
                        {suggestion.name + ' ('+suggestion.mobile+')'}
                      </li>
                    ))}
                    {!customerName.id && <li>
                      <CBadge
                        role="button"
                        color="danger"
                        onClick={() => setShowCustomerModal(true)}
                      >
                        {t("LABELS.new_customer")}
                      </CBadge>
                    </li>}
                  </ul>
                )}
              </div>
              <div className="col-3">
                <CBadge
                  role="button"
                  color="danger"
                  style={{
                    padding: '10px 8px',
                    width:'70px'
                  }}
                  onClick={() => setShowCustomerModal(true)}
                >
                  {t("LABELS.new")}
                </CBadge>
              </div>
            </div>
            {customerName.id && <div className="row">
              <div className="col-sm-12 mt-1">
              <CAlert color="success">
                <p>
                  <strong>{t("LABELS.name")}:</strong> {customerName.name} ({customerName.mobile}) <br/>
                  {customerName.address && <><strong>{t("LABELS.address")}: </strong> {customerName.address}</>}
                  {customerHistory && <>
                  {/* {
                    customerHistory.pendingPayment > 0 && <><br/>{t("LABELS.credit")} <strong className="text-danger">{customerHistory.pendingPayment}</strong> {t("LABELS.rs")}.</>
                  }
                  {
                    customerHistory.pendingPayment < 0 && <><br/>{t("LABELS.advance")} <strong className="text-success">{customerHistory.pendingPayment * -1}</strong> {t("LABELS.rs")}.</>
                  } */}
                  {
                    customerHistory.returnEmptyProducts.filter(p=>p.quantity>0).map(p=>(<React.Fragment key={p.id}>
                    <br/>{t("LABELS.collect")} <strong className="text-danger"> {p.quantity} </strong> {t("LABELS.empty")}  <strong className="text-danger"> {lng === 'en' ? p.product_name : p.product_local_name} </strong>
                    {p.last_remark &&
                        <span className="text-muted"> - ({p.last_remark})</span>
                      }
                    </React.Fragment>))
                  }
                  </>}
                </p>
                {bookings?.length >0 && <table className="table table-sm borderless">
                  <tbody>
                  {
                    bookings.map(b=><React.Fragment key={b.id}>
                      {
                        b.items.map((i,index)=>(<tr key={i.id}>
                            <td>{ (lng === 'en' ? i.product_name : i.product_local_name) + ' ' + i.dQty + ' X ' + i.dPrice + '₹ = ₹' + i.total_price }</td>
                            {index ===0 && <td rowSpan={b.items.length+1}>
                              <CBadge
                                role="button"
                                color="info"
                                onClick={() => handleEdit(b)}
                              >
                                {t("LABELS.deliver")}
                              </CBadge> <br/>
                              <CBadge
                                  role="button"
                                  color="danger"
                                  onClick={() => handleDelete(b)}
                                >
                                  {t("LABELS.cancel")}
                              </CBadge>
                              </td>}
                              {index!==0 && <td></td>}
                          </tr>))
                      }
                      <tr>
                      <td>
                      {t("LABELS.advance")+'₹ '+ b.paidAmount + ' '+t("LABELS.balance")+' ₹'}<span className="text-danger">{b.totalAmount - b.paidAmount}</span>
                      </td>
                      </tr>
                    </React.Fragment>)
                  }
                  </tbody>
                </table>}
              </CAlert>
              </div>
            </div>}
              <div className="side-by-side  d-none">
                <div className="col-sm-6 mb-3 pr-5">
                  <CFormLabel htmlFor="invoiceType">{t("LABELS.order_type")}</CFormLabel>
                  <CFormSelect
                    aria-label="Select Product Type"
                    name="invoiceType"
                    value={state.invoiceType}
                    options={[
                      {
                        label: 'Regular',
                        value: 1,
                      },
                      {
                        label: 'Advance Booking',
                        value: 2,
                      },
                    ]}
                    onChange={handleChange}
                    required
                    feedbackInvalid="Please select type."
                  />
                </div>
                <div className="col-sm-6 mb-3">
                  <CFormLabel htmlFor="invoiceDate">{t("LABELS.date")}</CFormLabel>
                  <CFormInput
                    type="date"
                    id="invoiceDate"
                    placeholder="Pune"
                    name="invoiceDate"
                    date= {new Date()}
                    //max={today}
                    value={state.invoiceDate}
                    onChange={handleChange}
                    required
                    feedbackInvalid="Please select date."
                  />
                </div>
              </div>
              <div className='mt-3'>
                {
                  allProducts.map((p, index)=> (<div key={p.id} className="row bottom-border">
                    <div className="col-6 mb-3 pr-5">
                      <CFormLabel htmlFor="product">
                      {(lng === 'en' ? p.name : p.localName) || ''} {t("LABELS.given")}
                    </CFormLabel>

                      <div className="input-group">
                      <button
                        className="btn btn-danger"
                        type="button"
                        onClick={() => {
                          handleQuantityChange(index, Math.max(0, (p.dQty ?? 1) - 1),'dQty')
                        }}
                      >
                        -
                      </button>
                      <CFormInput
                        type="number"
                        id="dQty"
                        placeholder="0"
                        name="dQty"
                        style={{height : '41px'}}
                        value={p.dQty}
                        onChange={(e)=>{
                          handleQuantityChangeRate(index, parseInt(e.target.value ?? '0'),'dQty')
                        }}
                        min="0"
                      />
                      <button
                        className="btn btn-success"
                        type="button"
                        onClick={() => {
                          handleQuantityChangeRate(index, Math.max(0, (p.dQty ?? 0) + 1),'dQty')
                        }}
                      >
                        +
                      </button>
                      </div>
                    </div>
                    {/* <div className="col-3 mb-3 pr-5 d-none">
                      <CFormLabel htmlFor="product">{t("LABELS.rate")}</CFormLabel>
                      <CFormInput
                        type="number"
                        readOnly
                        disabled
                        value={p.sizes[0].default_qty}
                      />
                    </div> */}
                    

<div className="col-12 col-sm-6 col-md-4 col-lg-3 mb-3 pr-5">
  <CFormLabel htmlFor="remark">{t("LABELS.remark")}</CFormLabel>
  <CFormInput
    type="text"
    placeholder={t("LABELS.enterRemark")}
    value={p.remark || ''}
    onChange={(e) => handleRemarkChange(index, e.target.value)}
  />
</div>
  {/* <CFormInput
    id="total"
    placeholder="0"
    name="total"
    value={
      p.total !== undefined && p.total !== null
        ? p.total
        : (p.sizes[0].default_qty * p.dQty) || ''
    }
    onChange={(e) => handleTotalChange(e, index)}
  /> */}





                    {p.sizes[0].returnable === 1 && <div className="col-6 mb-3 pr-5" >
                      <CFormLabel htmlFor="product">{t("LABELS.empty")} {lng === 'en' ? p.name : p.localName} {t("LABELS.return")}</CFormLabel>
                      <div className="input-group">
                        <button
                          className="btn btn-danger"
                          type="button"
                          onClick={() => handleQuantityChange(index, Math.max(0, (p.eQty ?? 0) - 1),'eQty')}
                        >
                          -
                        </button>
                        <CFormInput
                          type="number"
                          id="eQty"
                          placeholder="0"
                          name="eQty"
                          style={{height : '41px'}}
                          value={p.eQty ?? 0}
                          onChange={(e)=>{
                            const inputValue = e.target.value === '' ? 0 : parseInt(e.target.value);
                            const maxAllowed = customerHistory?.returnEmptyProducts?.find((itm)=> itm.product_sizes_id === p.sizes[0].id)?.quantity ?? 0;
                            const finalValue = Math.max(0, Math.min(inputValue, maxAllowed));
                            handleQuantityChange(index, finalValue, 'eQty');
                          }}
                          min="0"
                          max={customerHistory?.returnEmptyProducts?.find((itm)=> itm.product_sizes_id === p.sizes[0].id)?.quantity ?? 0}
                        />
                        <button
                          className="btn btn-success"
                          type="button"
                          onClick={() => handleQuantityChange(index, Math.min(parseInt(p.eQty ?? '0') + 1, (customerHistory?.returnEmptyProducts?.find((itm)=> itm.product_sizes_id === p.sizes[0].id)?.quantity ?? 0)),'eQty')}
                        >
                          +
                        </button>
                      </div>
                    </div>}
                    </div>))
                }
              </div>

            <div className="side-by-side">
              <CButton type="submit" color="success">{t("LABELS.submit")}</CButton>
              &nbsp; &nbsp;
              <CButton className='mr-20' type="button" onClick={handleClear} color="danger">{t("LABELS.clear")}</CButton>
            </div>

          </CForm>
        </CCardBody>
      </CCard>
    </CCol>
  </CRow>
  )
}

export default Delivery