import React, { useEffect, useState, useRef } from 'react'
import './Invoice.css'
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
import { cilDelete, cilPlus } from '@coreui/icons'
import { cilChevronBottom, cilX } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import { getAPICall, post } from '../../../util/api'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../../common/toast/ToastContext'
import NewCustomerModal from '../../common/NewCustomerModal'
import { useSpinner } from '../../common/spinner/SpinnerProvider'
import { useTranslation } from 'react-i18next' // Import the translation hook

let debounceTimer;
const Invoice = () => {
  const { t, i18n } = useTranslation("global"); // Initialize translation function with namespace
  const [validated, setValidated] = useState(false)
  const [errorMessage, setErrorMessage] = useState()
  const [products, setProducts] = useState()
  const [allProducts, setAllProducts] = useState()
  const [customerHistory, setCustomerHistory] = useState()
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const navigate = useNavigate();
  const location = useLocation();
   // New refs and state for product dropdown
   const productsDropdownRef = useRef(null);
   const [isProductsDropdownOpen, setIsProductsDropdownOpen] = useState(false);
   const [productOptions, setProductOptions] = useState([]);
   const [currentEditIndex, setCurrentEditIndex] = useState(null);
  const queryParams = new URLSearchParams(location.search);
  const id = queryParams.get('id');

  const { showSpinner, hideSpinner } = useSpinner();
  const timeNow = ()=> `${new Date().getHours()}:${new Date().getMinutes().toString().padStart(2, '0')}`;
  const [state, setState] = useState({
    customer_id: 0,
    lat:'',
    long:'',
    payLater: false,
    isSettled: false,
    invoiceDate: new Date().toISOString().split('T')[0],
    deliveryTime: timeNow(),
    deliveryDate: new Date().toISOString().split('T')[0],
    invoiceType: 1,
    items: [
      {
        product_id: undefined,
        product_sizes_id: 0,
        product_name: '',
        product_unit: '',
        product_local_name: '',
        size_name: '',
        size_local_name: '',
        oPrice: 0,
        bPrice: 0,
        dPrice: 0,
        dQty: '',
        eQty: 0,
        qty: 0,
        total_price: 0,
        returnable: 0,
      },
    ],
    orderStatus: 1,
    totalAmount: 0,
    discount: 0,
    balanceAmount: 0,
    paidAmount: 0,
    finalAmount: 0,
    paymentType: 1,
  })

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productsDropdownRef.current && !productsDropdownRef.current.contains(event.target)) {
        setIsProductsDropdownOpen(false);
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const [showAlert, setShowAlert] = useState(false);
  const [message, setMessage] = useState('');
  async function getProductFromParam(){
    try{
      const data=await getAPICall(`/api/productSizes/${id}`);
      setState(prev => ({
        ...prev,
        items: [
          {
            product_id: data.product_id.toString(),
            product_sizes_id: data.id,
            product_name: data.name, // you can populate this if available in response
            name: data.name,
            product_name: data.name,
            product_local_name: data.localName,
            localName:data.localName,
            size_name: data.name,
            size_local_name: data.localName,
            oPrice: data.oPrice,
            bPrice: data.bPrice,
            dPrice: data.dPrice,
            id:'0',
            dQty: '',
            eQty: 0,
            qty: data.qty,
            total_price: 0,
            returnable: data.returnable,
            unit:data.unit
          },
        ]
      }));
    }
    catch(e){
      console.error(e)
    }
  }

  // useEffect(()=>{
  //   if(id){
  //     getProductFromParam();
  //   }
  // },[id]);

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

  const searchCustomer = async (value) => {
    try {
      const customers = await getAPICall('/api/searchCustomer?searchQuery=' + value);
      if (customers?.length) {
        setSuggestions(customers);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      showToast('danger', t('MSG.errorOccurred') + ' ' + error);
    }
  };

  // Wrap the searchCustomer function with debounce
  const debouncedSearchCustomer = debounce(searchCustomer, 750);

  const handleNameChange = (event) => {
    const value = event.target.value;
    setCustomerName({name : value});
    // Filter suggestions based on input
    if (value) {
      debouncedSearchCustomer(value)
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setCustomerName(suggestion);
    setState((pre)=>({...pre, customer_id: suggestion.id}))
    const updatedProducts = discountedPrices([...allProducts], suggestion.discount)
    setAllProducts(updatedProducts);
    calculateTotal(updatedProducts);
    setSuggestions([]);
    getCustomerHistory(suggestion.id);
  };

  const onCustomerAdded = (customer) => {
    handleSuggestionClick(customer);
    setShowCustomerModal(false);
  }

  const getDiscountedPrice = (p, discount) =>{
    const value = p.sizes[0]?.oPrice ?? 0;
    const price = value - (value * (discount || (customerName.discount ?? 0)) /100);
    return Math.round(price);
  }

  const discountedPrices = (products, discount) =>{
    products.forEach(p=>{
      if(p.sizes.length>0){
        p.sizes[0].dPrice = getDiscountedPrice(p, discount)
      }

    })
    return products;
  }

  const getCustomerHistory = async (customer_id)=>{
    try {
      //customerHistory
      const response = await getAPICall('/api/customerHistory?id=' + customer_id);
      if (response) {
        setCustomerHistory(response);
      }
    } catch (error) {
      showToast('danger', t('MSG.errorOccurred') + ' ' + error);
    }
  }

  const fetchProduct = async () => {
    showSpinner();
    const response = await getAPICall('/api/product')
    hideSpinner();
    setAllProducts(discountedPrices([...response.filter((p) => p.show == 1 )]));
    
    // Extract product names for dropdown options
    const productNames = response
      .filter((p) => p.show == 1)
      .map((p) => p.sizes[0].name);
    
    setProductOptions(productNames);
    
    // Legacy options setup (keep for compatibility)
    const options = ['Select Product']
    options.push(
      ...response
        .filter((p) => p.show == 1 )
        .map((p) => {
          return {
            label: p.sizes[0].name,
            value: p.sizes[0].id,
            disabled: p.sizes[0].show === 0,
          }
        }),
    )
    setProducts(options)
    
    // Default selected product
    if (id) {
      let data = response.filter((p) => p.show == 1 && p.sizes[0].id == id)[0]?.sizes[0];
      if (data) {
        setState(prev => ({
          ...prev,
          items: [
            {
              product_id: data.product_id.toString(),
              product_sizes_id: data.id,
              product_name: data.name,
              name: data.name,
              product_name: data.name,
              product_local_name: data.localName,
              localName:data.localName,
              size_name: data.name,
              size_local_name: data.localName,
              oPrice: data.oPrice,
              bPrice: data.bPrice,
              dPrice: data.dPrice,
              id:'0',
              dQty: '',
              eQty: 0,
              qty: data.qty,
              total_price: 0,
              returnable: data.returnable,
              unit:data.unit
            },
          ]
        }));
      }
    }
  }
 

  const handleAddProductRow = () => {
    setState((prev) => {
      const old = { ...prev }
      old.items.push({
        product_id: undefined,
        product_sizes_id: 0,
        product_name: '',
        product_unit: '',
        product_local_name: '',
        size_name: '',
        size_local_name: '',
        oPrice: 0,
        dPrice: 0,
        bPrice: 0,
        qty: 0,
        dQty: '',
        eQty: 0,
        total_price: 0,
        returnable: 0,
      })
      return { ...old }
    })
  }

  const calculateTotal = (items) => {
    let total = 0
    items.forEach((item) => {
      total += item.total_price
    })
    return total
  }

  const handleRemoveProductRow = (index) => {
    setState((prev) => {
      const old = { ...prev }
      old.items.splice(index, 1)
      return { ...old }
    })
  }

  useEffect(() => {
    fetchProduct()
  }, [])

  const calculateFinalAmount = (old) => {
    old.finalAmount = old.totalAmount - ((old.totalAmount * old.discount) / 100 || 0)
    old.balanceAmount = 0
    old.paidAmount = old.finalAmount
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'discount') {
      setState((prev) => {
        const old = { ...prev }
        old.discount = value
        calculateFinalAmount(old)
        return { ...old }
      })
    } else if (name === 'paidAmount') {
      setState((prev) => {
        const old = { ...prev }
        old.paidAmount = value
        old.balanceAmount = old.finalAmount - old.paidAmount
        return { ...old }
      })
    } else {
      setState({ ...state, [name]: value })
    }
  }

  const handleProductSearchChange = (e, index) => {
    const value = e.target.value;
    
    // Update the product name in the current item
    setState(prev => {
      const old = { ...prev };
      old.items[index].product_name = value;
      return { ...old };
    });
    
    // Keep track of which item we're editing
    setCurrentEditIndex(index);
    
    // Show dropdown when typing
    if (value) {
      setIsProductsDropdownOpen(true);
    }
  };

  // Handle product selection from dropdown
  // const handleProductSelectFromDropdown = (selectedProductName, index) => {
  //   const p = allProducts.find((p) => p.sizes[0].name === selectedProductName);
  //   if (p && p.sizes[0]) {
  //     const size = p.sizes[0];
  //     setState((prev) => {
  //       const old = { ...prev };
  //       old.items[index].product_id = p.id;
  //       old.items[index].id = p.id;
  //       old.items[index].product_sizes_id = size.id;
  //       old.items[index].name = size.name;
  //       old.items[index].product_name = size.name;
  //       old.items[index].localName = size.localName;
  //       old.items[index].unit = p.unit;
  //       old.items[index].size_name = size.name;
  //       old.items[index].size_local_name = size.localName;
  //       old.items[index].product_local_name = p.localName;
  //       old.items[index].oPrice = size.oPrice;
  //       old.items[index].qty = size.qty; // used for placeholder only
  //       old.items[index].eQty = 0;
  //       old.items[index].dQty = ''; // ⛔ keep blank until user types
  //       old.items[index].dPrice = size.dPrice;
  //       old.items[index].bPrice = size.bPrice;
  //       old.items[index].returnable = size.returnable;
  //       old.items[index].total_price = 0; // Reset total until quantity is typed
  //       return { ...old };
  //     });
  
  //     setIsProductsDropdownOpen(false);
  //   }
  // };
 const handleProductSelectFromDropdown = (selectedProductName, index) => {
    const p = allProducts.find((p) => p.sizes[0].name === selectedProductName);
    if (p && p.sizes[0]) {
      const size = p.sizes[0];
      setState((prev) => {
        const old = { ...prev };
        old.items[index].product_id = p.id;
        old.items[index].id = p.id;
        old.items[index].product_sizes_id = size.id;
        old.items[index].name = size.name;
        old.items[index].product_name = size.name;
        old.items[index].localName = size.localName;
        old.items[index].unit = size.unit || ''; // ✅ ensure fallback
        old.items[index].product_unit = size.unit || ''; // ✅ Add product_unit for backend
        old.items[index].size_name = size.name;
        old.items[index].size_local_name = size.localName;
        old.items[index].product_local_name = p.localName;
        old.items[index].oPrice = size.oPrice;
        old.items[index].qty = size.qty ?? 0; // ✅ fallback for placeholder
        old.items[index].eQty = 0;
        old.items[index].dQty = ''; // ⛔ reset input
        old.items[index].dPrice = size.dPrice ?? 0; // ✅ fallback for price
        old.items[index].bPrice = size.bPrice;
        old.items[index].returnable = size.returnable;
        old.items[index].total_price = 0;
        old.items[index].notSelected = false; // ✅ add this to fix invalid feedback
        return { ...old };
      });
  
      setIsProductsDropdownOpen(false);
    }
  };
  // Legacy handler (keep for compatibility)
  const handleProductChange = (e, index) => {
    const { value } = e.target
    const p = allProducts.find((p) => p.id == value)
    if (p && p.sizes[0]) {
      setState((prev) => {
        const old = { ...prev }
        old.items[index].product_id = value
        old.items[index].id = value
        old.items[index].product_sizes_id = p.sizes[0].id
        old.items[index].name = p.sizes[0].name
        old.items[index].localName = p.sizes[0].localName
        old.items[index].unit = p.unit
        old.items[index].product_name = p.name
        old.items[index].size_name = p.sizes[0].name
        old.items[index].size_local_name = p.sizes[0].localName
        old.items[index].product_local_name = p.localName
        old.items[index].oPrice = p.sizes[0].oPrice
        old.items[index].dQty = 0
        old.items[index].eQty = 0
        old.items[index].dPrice = p.sizes[0].dPrice
        old.items[index].bPrice = p.sizes[0].bPrice
        old.items[index].returnable = p.sizes[0].returnable
        old.items[index].total_price = p.sizes[0].dPrice * old.items[index].dQty
        old.totalAmount = calculateTotal(old.items)
        calculateFinalAmount(old)
        return { ...old }
      })
    }
  }

  const clearProductSelection = (index) => {
    setState((prev) => {
      const old = { ...prev };
      old.items[index].product_id = undefined;
      old.items[index].product_sizes_id = 0;
      old.items[index].product_name = '';
      old.items[index].name = '';
      old.items[index].localName = '';
      old.items[index].unit = '';
      old.items[index].size_name = '';
      old.items[index].size_local_name = '';
      old.items[index].product_local_name = '';
      old.items[index].oPrice = 0;
      old.items[index].dQty = '';
      old.items[index].eQty = 0;
      old.items[index].dPrice = 0;
      old.items[index].bPrice = 0;
      old.items[index].returnable = 0;
      old.items[index].total_price = 0;
      old.totalAmount = calculateTotal(old.items);
      calculateFinalAmount(old);
      return { ...old };
    });
  };


  const handleQtyChange = (e, index) => {
    const { value } = e.target
    setState((prev) => {
      const old = { ...prev }
      old.items[index].dQty = value
      old.items[index].total_price = old.items[index].dPrice * old.items[index].dQty
      old.totalAmount = calculateTotal(old.items)
      calculateFinalAmount(old)
      return { ...old }
    })
  }

  const handleSubmit = async (event) => {
    try {
      event.preventDefault()
      event.stopPropagation()
      //Valdation
      let isInvalid = false
      let clonedState = {
        ...state,
        finalAmount: state.totalAmount,
        deliveryTime: timeNow(),
      };

      const eligibleToSubmit = clonedState.balanceAmount>=0 && clonedState.customer_id > 0 && (clonedState.paidAmount > 0 || clonedState.items.length)

      if (!isInvalid && eligibleToSubmit) {
        showSpinner();
        const res = await post('/api/order', { ...clonedState })
        if (res) {
          if(res.id){
            showToast('success', t('MSG.orderDelivered'));
            navigate('/invoice-details/'+res.id);
            setShowAlert(false);
            setMessage('');
            handleClear()
          } else if(res.error_message){
            setShowAlert(true);
            setMessage(res.error_message);
          }
        }
      } else {
        showToast('warning', t('MSG.provideValidData'));
        setState(clonedState)
      }
      setValidated(true)
    } catch (error) {
      showToast('danger', t('MSG.errorPlacingOrder'));
    } finally {
      hideSpinner();
    }
  }

  const handleClear = async () => {
    setState({
      customer_id: 0,
      lat:'',
      long:'',
      payLater: false,
      isSettled: false,
      invoiceDate: new Date().toISOString().split('T')[0],
      deliveryTime: timeNow(),
      deliveryDate: new Date().toISOString().split('T')[0],
      invoiceType: 1,
      items: [
        {
          product_id: undefined,
          product_sizes_id: 0,
          product_name: '',
          product_unit: '',
          product_local_name: '',
          size_name: '',
          size_local_name: '',
          oPrice: 0,
          dPrice: 0,
          bPrice: 0,
          qty: 0,
          total_price: 0,
        },
      ],
      totalAmount: 0,
      discount: 0,
      balanceAmount: 0,
      paidAmount: 0,
      finalAmount: 0,
      paymentType: 1,
    })
    setCustomerName({});
  }

  const dropdownIconStyle = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    zIndex: 1
  };

  const clearButtonStyle = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    zIndex: 1
  };

  const inputContainerStyle = {
    position: 'relative'
  };

  


  return (
    <CRow>
       {showAlert && (
              <CAlert color="danger" onDismiss={() => setShowAlert(false)}>
                <div>{message}</div>
              </CAlert>
            )}
       <NewCustomerModal hint={customerName.name} onSuccess={onCustomerAdded} visible={showCustomerModal} setVisible={setShowCustomerModal}/>
      <CCol xs={12}>
         {/* Back Button */}
    <div className="mb-3">
      <a
        onClick={() => navigate(-1)}
        className="d-inline-flex align-items-center text-decoration-none"
        style={{
          cursor: 'pointer',
          color: '#0d6efd',
          fontWeight: '500',
          fontSize: '1rem',
          transition: 'color 0.2s ease',
        }}
        onMouseEnter={(e) => (e.target.style.color = '#0a58ca')}
        onMouseLeave={(e) => (e.target.style.color = '#0d6efd')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          fill="currentColor"
          className="bi bi-arrow-left me-2"
          viewBox="0 0 16 16"
        >
          <path fillRule="evenodd" d="M15 8a.5.5 0 0 1-.5.5H2.707l3.147 3.146a.5.5 0 0 1-.708.708l-4-4a.5.5 0 0 1 0-.708l4-4a.5.5 0 1 1 .708.708L2.707 7.5H14.5A.5.5 0 0 1 15 8z" />
        </svg>
        Back
      </a>
    </div>
        
        <CCard className="mb-4">
          <CCardHeader>
            <strong>{t('LABELS.newInvoice')}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm noValidate validated={validated} onSubmit={handleSubmit}>
            <div className="row mb-2">
              {/* Modified customer search section for responsive design */}
              <div className="col-md-8 col-12 mb-2">
                <CFormLabel htmlFor="invoiceDate">{t('LABELS.searchCustomer')}</CFormLabel>
                <div className="d-flex position-relative">
                  <CFormInput
                    type="text"
                    id="pname"
                    placeholder={t('LABELS.customerName')}
                    name="customerName"
                    value={customerName.name || ''}
                    onChange={handleNameChange}
                    autoComplete='off'
                    required
                    className="w-100"
                  />
                  {!customerName.id && customerName.name?.length > 0 && (
                    <CBadge
                      role="button"
                      color="danger"
                      onClick={() => setShowCustomerModal(true)}
                      className="position-absolute"
                      style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}
                    >
                      + {t('LABELS.new')}
                    </CBadge>
                  )}
                </div>
                {customerName.name?.length > 0 && (
                  <ul className="suggestions-list" style={{ zIndex: 1000, position: 'absolute', width: 'calc(100% - 30px)' }}>
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
                        {t('LABELS.newCustomer')}
                      </CBadge>
                    </li>}
                  </ul>
                )}
              </div>
              <div className="col-md-4 col-12 mb-2">
                <div className="mb-3">
                  <CFormLabel htmlFor="invoiceDate">{t('LABELS.invoiceDate')}</CFormLabel>
                  <CFormInput
                    type="date"
                    id="invoiceDate"
                    placeholder="Pune"
                    name="invoiceDate"
                    value={state.invoiceDate}
                    onChange={handleChange}
                    required
                    feedbackInvalid={t('MSG.pleaseSelectDate')}
                  />
                </div>
              </div>
            </div>
             {/* Products table - fully responsive for all screen sizes */}

{/* Products section - Enhanced responsive design */}
<div className="products-section">
  {/* Desktop Table Header */}
  <div className="d-none d-lg-block">
    <div className="row py-3 bg-light border-bottom fw-bold">
      <div className="col-4">{t('LABELS.product')}</div>
      <div className="col-2 text-center">{t('LABELS.quantity')}</div>
      <div className="col-2 text-center">{t('LABELS.price')} ₹</div>
      <div className="col-2 text-center">{t('LABELS.totalRs')}</div>
      <div className="col-2 text-center">{t('LABELS.action')}</div>
    </div>
  </div>

  {/* Product Items */}
  {state.items?.map((oitem, index) => (
    <div key={index} className="product-item">
      
      {/* Desktop View */}
      <div className="d-none d-lg-block">
        <div className="row py-3 border-bottom align-items-center">
          {/* Product */}
          <div className="col-4">
            <div className="product-search-container desktop-product-search" ref={el => {
              // Create individual ref for each product row
              if (el) {
                if (!window.productRefs) window.productRefs = {};
                window.productRefs[index] = el;
              }
            }}>
              <CFormInput
                type="text"
                value={oitem.product_name || ''}
                onChange={(e) => handleProductSearchChange(e, index)}
                onFocus={() => {
                  setCurrentEditIndex(index);
                  setIsProductsDropdownOpen(true);
                }}
                placeholder="Search or select product"
                required
                invalid={oitem.notSelected === true}
                feedbackInvalid="Select product."
                className="product-search-input"
              />
              
              {!oitem.product_name ? (
                <div className="dropdown-icon desktop-dropdown-icon" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentEditIndex(index);
                  setIsProductsDropdownOpen(true);
                }}>
                  <CIcon icon={cilChevronBottom} size="sm" />
                </div>
              ) : (
                <div className="clear-button desktop-clear-button" onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearProductSelection(index);
                }}>
                  <CIcon icon={cilX} size="sm" />
                </div>
              )}
              
              {isProductsDropdownOpen && currentEditIndex === index && (
                <div className="products-dropdown desktop-dropdown">
                  <div className="dropdown-header">
                    <i className="fas fa-list me-2"></i>Available Products
                  </div>
                  {productOptions
                    .filter(item => 
                      item.toLowerCase().includes((oitem.product_name || '').toLowerCase())
                    )
                    .map((item, idx) => (
                      <div 
                        key={idx}
                        className="dropdown-item desktop-dropdown-item"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Immediately handle the selection
                          console.log('Desktop: Selecting product:', item, 'for index:', index);
                          handleProductSelectFromDropdown(item, index);
                          setIsProductsDropdownOpen(false);
                          setCurrentEditIndex(-1);
                        }}
                      >
                        <i className="fas fa-box me-2 text-muted"></i>
                        {item}
                      </div>
                    ))}
                  {productOptions.filter(item => 
                    item.toLowerCase().includes((oitem.product_name || '').toLowerCase())
                  ).length === 0 && (
                    <div className="dropdown-item text-muted">
                      <i className="fas fa-exclamation-circle me-2"></i>
                      No products found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div className="col-2 text-center">
            <CFormInput
              type="number"
              value={oitem.dQty === '' || oitem.dQty === undefined ? '' : oitem.dQty}
              placeholder={`Stock: ${oitem.qty ?? 0}`}
              onChange={(e) => {
                const inputValue = e.target.value;
                
                if (inputValue === '') {
                  const updatedItems = [...state.items];
                  updatedItems[index].dQty = '';
                  updatedItems[index].total_price = 0;
                  const updatedState = { 
                    ...state, 
                    items: updatedItems, 
                    totalAmount: calculateTotal(updatedItems), 
                  };
                  calculateFinalAmount(updatedState);
                  setState(updatedState);
                  return;
                }
                
                const value = parseFloat(inputValue);
                
                if (isNaN(value) || value <= 0) {
                  const updatedItems = [...state.items];
                  updatedItems[index].dQty = '';
                  updatedItems[index].total_price = 0;
                  const updatedState = { 
                    ...state, 
                    items: updatedItems, 
                    totalAmount: calculateTotal(updatedItems), 
                  };
                  calculateFinalAmount(updatedState);
                  setState(updatedState);
                  return;
                }
                
                const updatedItems = [...state.items];
                updatedItems[index].dQty = value;
                const price = parseFloat(updatedItems[index].dPrice || 0);
                const qty = parseFloat(value || 0);
                updatedItems[index].total_price = price && qty ? price * qty : 0;
                const updatedState = { 
                  ...state, 
                  items: updatedItems, 
                  totalAmount: calculateTotal(updatedItems), 
                };
                calculateFinalAmount(updatedState);
                setState(updatedState);
              }}
              className="text-center"
            />
          </div>

          {/* Price */}
          <div className="col-2 text-center">
            <span className="fw-semibold">{oitem.dPrice} ₹</span>
          </div>

          {/* Total */}
          <div className="col-2 text-center">
            <span className="fw-bold text-success">{oitem.total_price}</span>
          </div>

          {/* Actions */}
          <div className="col-2 text-center">
            <div className="d-flex justify-content-center gap-2">
              {state.items.length > 1 && (
                <CButton 
                  color="outline-danger" 
                  size="sm" 
                  onClick={() => handleRemoveProductRow(index)}
                  className="p-1"
                >
                  <CIcon icon={cilDelete} size="sm" />
                </CButton>
              )}
              {index === state.items.length - 1 && (
                <CButton 
                  color="outline-success" 
                  size="sm" 
                  onClick={handleAddProductRow}
                  className="p-1"
                >
                  <CIcon icon={cilPlus} size="sm" />
                </CButton>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Mobile View */}
      <div className="d-lg-none">
        <div className="mobile-product-card">
          <div className="card border-0 shadow-sm mb-3">
            <div className="card-header bg-gradient-primary text-white p-2">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold">
                  <i className="fas fa-box me-2"></i>Product #{index + 1}
                </h6>
                <div className="d-flex gap-1">
                  {state.items.length > 1 && (
                    <CButton 
                      color="outline-light" 
                      size="sm" 
                      onClick={() => handleRemoveProductRow(index)}
                      className="p-1 btn-sm-icon"
                      title="Remove Product"
                    >
                      <CIcon icon={cilDelete} size="sm" />
                    </CButton>
                  )}
                  {index === state.items.length - 1 && (
                    <CButton 
                      color="outline-light" 
                      size="sm" 
                      onClick={handleAddProductRow}
                      className="p-1 btn-sm-icon"
                      title="Add Product"
                    >
                      <CIcon icon={cilPlus} size="sm" />
                    </CButton>
                  )}
                </div>
              </div>
            </div>
            
            <div className="card-body p-3">
              
              {/* Product Selection */}
              <div className="mb-3">
                <label className="form-label fw-bold text-primary mb-2 d-flex align-items-center">
                  <i className="fas fa-search me-2"></i>
                  <span>{t('LABELS.product')}</span>
                  {oitem.product_name && (
                    <span className="badge bg-success ms-2">Selected</span>
                  )}
                </label>
                
                <div className="product-search-container" ref={productsDropdownRef}>
                  <CFormInput
                    type="text"
                    value={oitem.product_name || ''}
                    onChange={(e) => handleProductSearchChange(e, index)}
                    onFocus={() => {
                      setCurrentEditIndex(index);
                      setIsProductsDropdownOpen(true);
                    }}
                    placeholder="Search or select product"
                    required
                    invalid={oitem.notSelected === true}
                    feedbackInvalid="Please select a product."
                    className="product-search-input mobile-input"
                  />
                  
                  {!oitem.product_name ? (
                    <div className="dropdown-icon mobile-dropdown-icon" onClick={() => {
                      setCurrentEditIndex(index);
                      setIsProductsDropdownOpen(true);
                    }}>
                      <CIcon icon={cilChevronBottom} size="sm" />
                    </div>
                  ) : (
                    <div className="clear-button mobile-clear-button" onClick={() => clearProductSelection(index)}>
                      <CIcon icon={cilX} size="sm" />
                    </div>
                  )}
                  
                  {isProductsDropdownOpen && currentEditIndex === index && (
                    <div className="products-dropdown mobile-dropdown">
                      <div className="dropdown-header">
                        <i className="fas fa-list me-2"></i>Available Products
                      </div>
                      {productOptions
                        .filter(item => 
                          item.toLowerCase().includes((oitem.product_name || '').toLowerCase())
                        )
                        .map((item, idx) => (
                          <div 
                            key={idx}
                            className="dropdown-item mobile-dropdown-item"
                            onClick={() => handleProductSelectFromDropdown(item, index)}
                          >
                            <i className="fas fa-box me-2 text-muted"></i>
                            {item}
                          </div>
                        ))}
                      {productOptions.filter(item => 
                        item.toLowerCase().includes((oitem.product_name || '').toLowerCase())
                      ).length === 0 && (
                        <div className="dropdown-item text-muted">
                          <i className="fas fa-exclamation-circle me-2"></i>
                          No products found
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Selected Product Display */}
                {oitem.product_name && (
                  <div className="selected-product-info mt-2 p-2 bg-light rounded">
                    <small className="text-success fw-bold">
                      <i className="fas fa-check-circle me-1"></i>
                      Selected: {oitem.product_name}
                    </small>
                  </div>
                )}
              </div>

              {/* Quantity and Stock Info */}
              <div className="row mb-3">
                <div className="col-8">
                  <label className="form-label fw-bold text-info mb-2 d-flex align-items-center">
                    <i className="fas fa-calculator me-2"></i>
                    <span>{t('LABELS.quantity')}</span>
                  </label>
                  <CFormInput
                    type="number"
                    value={oitem.dQty === '' || oitem.dQty === undefined ? '' : oitem.dQty}
                    placeholder="Enter quantity"
                    onChange={(e) => {
                      const inputValue = e.target.value;
                      
                      if (inputValue === '') {
                        const updatedItems = [...state.items];
                        updatedItems[index].dQty = '';
                        updatedItems[index].total_price = 0;
                        const updatedState = { 
                          ...state, 
                          items: updatedItems, 
                          totalAmount: calculateTotal(updatedItems), 
                        };
                        calculateFinalAmount(updatedState);
                        setState(updatedState);
                        return;
                      }
                      
                      const value = parseFloat(inputValue);
                      
                      if (isNaN(value) || value <= 0) {
                        const updatedItems = [...state.items];
                        updatedItems[index].dQty = '';
                        updatedItems[index].total_price = 0;
                        const updatedState = { 
                          ...state, 
                          items: updatedItems, 
                          totalAmount: calculateTotal(updatedItems), 
                        };
                        calculateFinalAmount(updatedState);
                        setState(updatedState);
                        return;
                      }
                      
                      const updatedItems = [...state.items];
                      updatedItems[index].dQty = value;
                      const price = parseFloat(updatedItems[index].dPrice || 0);
                      const qty = parseFloat(value || 0);
                      updatedItems[index].total_price = price && qty ? price * qty : 0;
                      const updatedState = { 
                        ...state, 
                        items: updatedItems, 
                        totalAmount: calculateTotal(updatedItems), 
                      };
                      calculateFinalAmount(updatedState);
                      setState(updatedState);
                    }}
                    className="mobile-input"
                  />
                </div>
                
                <div className="col-4">
                  <label className="form-label fw-bold text-secondary mb-2 d-flex align-items-center">
                    <i className="fas fa-warehouse me-2"></i>
                    <span>Stock</span>
                  </label>
                  <div className="stock-display">
                    <span className="fw-bold text-info">{oitem.qty ?? 0}</span>
                  </div>
                </div>
              </div>

              {/* Price and Total */}
              <div className="row mb-3">
                <div className="col-6">
                  <label className="form-label fw-bold text-warning mb-2 d-flex align-items-center">
                    <i className="fas fa-tag me-2"></i>
                    <span>{t('LABELS.price')}</span>
                  </label>
                  <div className="price-display">
                    <span className="fw-bold fs-5 text-warning">
                      {oitem.dPrice ? `₹${oitem.dPrice}` : '₹0.00'}
                    </span>
                  </div>
                </div>
                
                <div className="col-6">
                  <label className="form-label fw-bold text-success mb-2 d-flex align-items-center">
                    <i className="fas fa-rupee-sign me-2"></i>
                    <span>{t('LABELS.totalRs')}</span>
                  </label>
                  <div className="total-display">
                    <span className="fw-bold fs-4 text-success">
                      ₹{oitem.total_price || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons - Full Width */}
              <div className="d-flex gap-2 mt-3">
                {state.items.length > 1 && (
                  <CButton 
                    color="outline-danger" 
                    className="flex-fill"
                    onClick={() => handleRemoveProductRow(index)}
                  >
                    <CIcon icon={cilDelete} size="sm" className="me-2" />
                    Remove Product
                  </CButton>
                )}
                {index === state.items.length - 1 && (
                  <CButton 
                    color="outline-success" 
                    className="flex-fill"
                    onClick={handleAddProductRow}
                  >
                    <CIcon icon={cilPlus} size="sm" className="me-2" />
                    Add New Product
                  </CButton>
                )}
              </div>
              
            </div>
          </div>
        </div>
      </div>

    </div>
  ))}
</div>

<style jsx>{`
  .products-section {
    margin-bottom: 2rem;
  }
  
  .product-search-container {
    position: relative;
  }
  
  .dropdown-icon, .clear-button {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
    z-index: 2;
  }
  
  .products-dropdown {
    position: absolute;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    background: white;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    margin-top: 4px;
  }
  
  .dropdown-item {
    padding: 0.75rem;
    cursor: pointer;
    border-bottom: 1px solid #f8f9fa;
    transition: background-color 0.15s ease-in-out;
  }
  
  .dropdown-item:hover {
    background-color: #e9ecef;
  }
  
  .dropdown-item:last-child {
    border-bottom: none;
  }
  
  /* Desktop specific styles */
  @media (min-width: 992px) {
    .products-section .row:hover {
      background-color: #f8f9fa;
      transition: background-color 0.15s ease-in-out;
    }
    
    .desktop-product-search {
      position: relative;
    }
    
    .desktop-dropdown {
      border-radius: 0.375rem;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.12);
    }
    
    .desktop-dropdown-icon, .desktop-clear-button {
      background: #f8f9fa;
      border-radius: 4px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease-in-out;
    }
    
    .desktop-dropdown-icon:hover {
      background: #e9ecef;
    }
    
    .desktop-clear-button {
      background: #dc3545;
      color: white;
    }
    
    .desktop-clear-button:hover {
      background: #c82333;
    }
    
    .desktop-dropdown-item {
      display: flex;
      align-items: center;
      padding: 0.625rem 0.75rem;
      font-size: 0.875rem;
    }
    
    .desktop-dropdown-item:hover {
      background: #f8f9fa;
      border-left: 3px solid #0d6efd;
    }
    
    .dropdown-header {
      background: #f8f9fa;
      padding: 0.5rem 0.75rem;
      font-weight: 600;
      font-size: 0.8125rem;
      color: #495057;
      border-bottom: 1px solid #dee2e6;
      border-radius: 0.375rem 0.375rem 0 0;
    }
  }
  
  /* Enhanced Mobile specific styles */
  @media (max-width: 991px) {
    .mobile-product-card {
      margin-bottom: 1.5rem;
    }
    
    .mobile-product-card .card {
      border-radius: 0.75rem;
      transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
      border: 1px solid #e9ecef;
    }
    
    .mobile-product-card .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 0.75rem 1.5rem rgba(0, 0, 0, 0.1) !important;
    }
    
    .card-header {
      border-radius: 0.75rem 0.75rem 0 0 !important;
      background: linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%) !important;
    }
    
    .mobile-input {
      border-radius: 0.5rem;
      border: 2px solid #e9ecef;
      transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    }
    
    .mobile-input:focus {
      border-color: #0d6efd;
      box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
    }
    
    .mobile-dropdown-icon, .mobile-clear-button {
      background: #f8f9fa;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      right: 8px;
    }
    
    .mobile-clear-button {
      background: #dc3545;
      color: white;
    }
    
    .mobile-dropdown {
      border-radius: 0.5rem;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }
    
    .dropdown-header {
      background: #f8f9fa;
      padding: 0.75rem;
      font-weight: bold;
      font-size: 0.875rem;
      color: #495057;
      border-bottom: 1px solid #dee2e6;
      border-radius: 0.5rem 0.5rem 0 0;
    }
    
    .mobile-dropdown-item {
      padding: 0.75rem;
      transition: all 0.15s ease-in-out;
    }
    
    .mobile-dropdown-item:hover {
      background: linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%);
      padding-left: 1rem;
    }
    
    .selected-product-info {
      border-left: 4px solid #198754;
      animation: fadeIn 0.3s ease-in-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .price-display, .total-display, .stock-display {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      padding: 0.75rem;
      border-radius: 0.5rem;
      text-align: center;
      border: 2px solid #e9ecef;
      min-height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease-in-out;
    }
    
    .total-display {
      background: linear-gradient(135deg, #d1e7dd 0%, #a3cfbb 100%);
      border-color: #198754;
    }
    
    .price-display {
      background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
      border-color: #ffc107;
    }
    
    .stock-display {
      background: linear-gradient(135deg, #cff4fc 0%, #9eeaf9 100%);
      border-color: #0dcaf0;
    }
    
    .form-label {
      font-size: 0.875rem;
      margin-bottom: 0.5rem;
    }
    
    .form-label i {
      color: inherit;
      font-size: 1rem;
    }
    
    .btn-sm-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }
    
    .badge {
      font-size: 0.7rem;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  }
`}</style>

              {/* Payment info - made responsive */}
              <div className="row mt-4">
                <div className="col-md-4 col-12 mb-3">
                  <div className="mb-3">
                    <CFormLabel htmlFor="balanceAmount">{t('LABELS.balanceAmountRs')}</CFormLabel>
                    <CFormInput
                      type="number"
                      id="balanceAmount"
                      placeholder=""
                      readOnly
                      name="balanceAmount"
                      value={state.balanceAmount}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-md-4 col-12 mb-3">
                  
                  <div className="mb-3">
  <CFormLabel htmlFor="paidAmount">{t('LABELS.paidAmountRs')}</CFormLabel>
  <CFormInput
    type="number"
    id="paidAmount"
    placeholder=""
    name="paidAmount"
    value={state.paidAmount}
    onChange={(e) => {
      const value = e.target.value;
      if (value === '' || parseFloat(value) >= 0) {
        handleChange(e);
      } else {
        // Clear the input if negative
        setState(prev => ({ ...prev, paidAmount: '' }));
      }
    }}
  />
</div>
                  
                </div>
                <div className="col-md-4 col-12 mb-3">
                  <div className="mb-3">
                    <CFormLabel htmlFor="finalAmount">{t('LABELS.totalAmountRs')}</CFormLabel>
                    <CFormInput
                      type="number"
                      id="finalAmount"
                      placeholder=""
                      name="finalAmount"
                      readOnly
                      value={state.finalAmount}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <div>
                {errorMessage && (
                  <CRow>
                    <CAlert color="danger">{errorMessage}</CAlert>
                  </CRow>
                )}
              </div>
              <div className="mb-3 mt-3 d-flex justify-content-start">
                <CButton
                  color="success"
                  type="submit"
                  className="mb-2 mb-md-0 me-md-2 "
                  style={{ width: '125px' }}
                >
                  {t('LABELS.submit')}
                </CButton>&nbsp;
                <CButton
                  color="secondary"
                  onClick={handleClear}
                  style={{ width: '125px' }}
                >
                  {t('LABELS.clear')}
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default Invoice

