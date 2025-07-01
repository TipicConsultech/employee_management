import React, { useState, useEffect } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CRow,
} from '@coreui/react'
import { getAPICall, post } from '../../../util/api'
import { useToast } from '../../common/toast/ToastContext';
import { useTranslation } from 'react-i18next';

const ProductForm = ({ isOpen, onClose,fetchProducts }) => {
     const { t, i18n } = useTranslation("global");
   const [factoryProductData, setFactoryProductData] = useState([])
   const [selectedFactorySizeId, setSelectedFactorySizeId] = useState('');


   const [searchTerm, setSearchTerm] = useState('');
const [dropdownOpen, setDropdownOpen] = useState(false);
// const [selectedFactorySizeId, setSelectedFactorySizeId] = useState('');


  const { showToast } = useToast();
  const [state, setState] = useState({
    name: '',
    localName: '',
    slug: '',
    categoryId: 0,
    incStep: 1,
    desc: '',
    multiSize: false,
    show: true,
    returnable: false,
    showOnHome: true,
    unit: 'Kg',
    productType: '2', // Default to Retail
    qty: 0,
    default_qty: 0,
    oPrice: 0,
    max_stock:0,
    bPrice: 0,
    weight: 0,
    unit_multiplier:0,
    lable_value: '',
    media: [],
    sizes: [],
    isFactory: false
  })
  const [mappedFactoryProductId, setMappedFactoryProductId] = useState('');

   useEffect(() => {
      fetchFactoryProduct()
      
    }, [])
  
    const fetchFactoryProduct = async () => {
      try {
        const res = await getAPICall('/api/getProductsByProductType')    // showAllFactoryProducts
        setFactoryProductData(res?.products)
      } catch (err) {
        console.error('Error fetching tank data:', err)
      }
    }
  

  const unitOptions = [
    { value: 'Kg', label: `${t('LABELS.Kilogram')}` },
    { value: 'Ltr', label: `${t('LABELS.liter')}`  },
    { value: 'ml', label: `${t('LABELS.milli_liter')}`  },
    { value: 'gm', label: `${t('LABELS.grams')}`  },
    { value: 'Pcs', label: `${t('LABELS.pcs')}`  },
  ]

  const productTypeOptions = [
    { value: '2', label: `${t('LABELS.retail')}`  },
    { value: '1', label:`${t('LABELS.factory')}` },
    { value: '0', label: `${t('LABELS.delivery_product')}` }
  ]
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setState({ ...state, [name]: value })
    
    // Calculate lable_value based on weight and unit
    if (name === 'weight' || name === 'unit') {
      const weight = name === 'weight' ? parseFloat(value) || 0 : parseFloat(state.weight) || 0
      const unit = name === 'unit' ? value : state.unit
      
      let lable_value = weight
      let unit_multiplier=0;
      
      // Apply conversion based on unit
      if (unit === 'ml' || unit === 'gm') {
        unit_multiplier = weight / 1000
      }
      else{
        unit_multiplier = weight / 1
      }
      
      setState(prev => ({ 
        ...prev, 
        [name]: value,
        lable_value: lable_value,
        unit_multiplier: unit_multiplier
      }))
    }
  }

  const handleCBChange = (e) => {
    const { name, checked } = e.target
    setState({ ...state, [name]: checked })
  }

  const handleDefaultQtyChange = (e) => {
    const { value } = e.target;

    // Allow empty string to let the field appear blank when clicked
    if (value === '' || /^[0-9]+$/.test(value)) {
      setState((prev) => ({
        ...prev,
        default_qty: value === '' ? '' : parseInt(value),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target
    if (!form.checkValidity()) {
      form.classList.add('was-validated')
      return
    }

    let data = { ...state, sizes: [] }
    data.slug = data.name.replace(/[^\w]/g, '_')
    
    // Set isFactory based on productType
    data.isFactory = data.productType === '1'
    
    if (!state.multiSize) {
      data.sizes.push({
        name: data.name,
        localName: data.localName,
        qty: data.qty,
        oPrice: data.oPrice,
        bPrice: data.bPrice,
        dPrice: data.oPrice,
        default_qty: data.default_qty,
        stock: data.qty,
        show: true,
        isFactory: data.isFactory,
        returnable: data.returnable,
        unit_multiplier:data.unit_multiplier,
        lable_value: data.lable_value,
        unit:data.unit,
        product_type:data.productType,
        max_stock:data.max_stock
      })
      delete data.oPrice
      delete data.bPrice
      delete data.qty
    }

    if (state.productType === '2' && selectedFactorySizeId) {
  data.mapped_factory_product_size_id = selectedFactorySizeId;
}

    
    try {
      const resp = await post('/api/product', data)
      if (resp) {
        showToast('success', 'Product added successfully');
        handleClear()
        fetchProducts()
        // fetchProducts
        onClose && onClose()
      } else {
        showToast('danger', 'Error occured, please try again later.');
      }
    } catch (error) {
      showToast('danger', 'Error occured ' + error);
    }
  }

  const handleClear = () => {
    setState({
      name: '',
      localName: '',
      slug: '',
      categoryId: 0,
      incStep: 1,
      desc: '',
      multiSize: false,
      show: true,
      returnable: false,
      showOnHome: true,
      unit: 'Kg',
      productType: '2',
      qty: 0,
      oPrice: 0,
      default_qty: 0,
      bPrice: 0,
      weight: 0,
      lable_value: 0,
      media: [],
      sizes: [],
      isFactory: false,
      unit_multiplier:0,
      lable_value: '',
     

    })
  }

  const renderForm = () => (
    <CForm className="needs-validation" noValidate onSubmit={handleSubmit}>
      <div className="row mb-2">
        <div className="col-md-6 col-12 mb-2">
          <CFormLabel htmlFor="pname">{t('LABELS.product_name')}</CFormLabel>
          <CFormInput
            type="text"
            id="pname"
            placeholder="Product Name"
            name="name"
            value={state.name}
            onChange={handleChange}
            required
            feedbackInvalid="Please provide name."
            feedbackValid="Looks good!"
          />
          <div className="invalid-feedback">Product name is required</div>
        </div>
        <div className="col-md-6 col-12 mb-2">
          <CFormLabel htmlFor="plname">{t('LABELS.product_local_name')}</CFormLabel>
          <CFormInput
            type="text"
            id="plname"
            placeholder="Local Name"
            name="localName"
            value={state.localName}
            onChange={handleChange}
            required
            feedbackInvalid="Please provide Local name."
            feedbackValid="Looks good!"
          />
          <div className="invalid-feedback">Local name is required</div>
        </div>
      </div>
      
      <div className="row mb-2">
        <div className="col-md-4 col-12 mb-2">
          <CFormLabel htmlFor="productType">{t('LABELS.product_type')}</CFormLabel>
          <CFormSelect 
            id="productType" 
            name="productType" 
            value={state.productType}
            onChange={handleChange}
          >
            {productTypeOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </CFormSelect>
        </div>
        <div className="col-md-4 col-12 mb-2">
          <CFormLabel htmlFor="qty">{t('LABELS.availableQuantity')}</CFormLabel>
          <CFormInput
            type="number"
            id="qty"
            placeholder="0"
            min="1"
            name="qty"
            value={state.qty}
            onChange={handleChange}
            required
          />
          <div className="invalid-feedback">Quantity must be greater than 0</div>
        </div>
        
        <div className="col-md-4 col-12 mb-2">
          <CFormLabel htmlFor="oPrice">{t('LABELS.Capacity')}</CFormLabel>
          <CFormInput
            type="number"
            id="max_stock"
            placeholder="0"
            min="1"
            name="max_stock"
            value={state.max_stock}
            onChange={handleChange}
            required
          />
          <div className="invalid-feedback">Selling price must be greater than 0</div>
        </div>
      </div>
      
      <div className="row mb-2">
       
        <div className="col-md-4 col-12 mb-2">
          <CFormLabel htmlFor="weight">{t('LABELS.weight')}</CFormLabel>
          <CFormInput
            type="number"
            id="weight"
            placeholder="0"
            min="0"
            step="0.01"
            name="weight"
            value={state.weight}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4 col-12 mb-2">
          <CFormLabel htmlFor="unit">{t('LABELS.units')}</CFormLabel>
          <CFormSelect 
            id="unit" 
            name="unit" 
            value={state.unit}
            onChange={handleChange}
          >
            {unitOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </CFormSelect>
        </div>
        <div className="col-md-4 col-12 mb-2">
          <CFormLabel htmlFor="oPrice"> {t('LABELS.price')}</CFormLabel>
          <CFormInput
            type="number"
            id="oPrice"
            placeholder="0"
            min="1"
            name="oPrice"
            value={state.oPrice}
            onChange={handleChange}
            required
          />
          <div className="invalid-feedback">Selling price must be greater than 0</div>
        </div>
      </div>

      <div className="row mb-2">
        <div className="col-md-4 col-12 mb-2">
          <CFormCheck
            id="returnable"
            label={t('LABELS.returnable')}
            name="returnable"
            checked={state.returnable}
            onChange={handleCBChange}
          />
        </div>
        
        {state.productType === '2' && (
  <div className="row mb-2">
    <div className="col-md-6 col-12 mb-2">
      <CFormLabel htmlFor="selectedFactorySizeId">{t('LABELS.product_mapping')}</CFormLabel>

      {/* <CFormSelect
        id="selectedFactorySizeId"
        name="selectedFactorySizeId"
        value={selectedFactorySizeId}
        onChange={(e) => setSelectedFactorySizeId(e.target.value)}
      >
        <option value="">Select Factory Product Size</option>
        {factoryProductData.map(fp => (
          <option key={fp.id} value={fp.id}>
            {fp.name}
          </option>
        ))}

      </CFormSelect> */}
  <div style={{ position: 'relative' }}>
  <CFormInput
    type="text"
    id="selectedFactorySizeId"
    value={searchTerm}
    placeholder="Search or select factory product size"
    onChange={(e) => {
      const value = e.target.value;
      setSearchTerm(value);
      setSelectedFactorySizeId('');
      setDropdownOpen(true);
    }}
    onFocus={() => setDropdownOpen(true)}
    onBlur={() => {
      setTimeout(() => setDropdownOpen(false), 150);
    }}
    className="border  rounded "
  />

  {dropdownOpen && (
    <div
      className="position-absolute w-100 mb-1 border rounded bg-white shadow z-index-dropdown"
      style={{
        maxHeight: '200px',
        overflowY: 'auto',
        bottom: '105%', // Makes the dropdown appear above the input
        zIndex: 1050,
      }}
    >
      {factoryProductData
        .filter((fp) =>
          fp.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .map((fp) => (
          <div
            key={fp.id}
            className="px-3 py-2 dropdown-item"
            style={{
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseDown={() => {
              setSelectedFactorySizeId(fp.id);
              setSearchTerm(fp.name);
              setDropdownOpen(false);
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = '#f0f8ff')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'transparent')
            }
          >
            {fp.name}
          </div>
        ))}
    </div>
  )}
</div>

    </div>
  </div>
)}


        {/* {state.returnable && (
    
    <div className="col-md-4 col-12 mb-2">
      <CFormLabel htmlFor="default_qty">{t('LABELS.default_qty')}</CFormLabel>
      <CFormInput
        type="number"
        id="default_qty"
        placeholder="0"
        min="1"
        name="default_qty"
        value={state.default_qty}
        onChange={handleDefaultQtyChange}
      />
    </div>

)} */}
      </div>
      
      <div className="mb-3">
        <CButton color="success" type="submit" className="me-2 mb-2">
        {t('LABELS.submit')}
        </CButton>
        <CButton color="secondary" onClick={handleClear} className="me-2 mb-2">
        {t('LABELS.clear')}
        </CButton>
        {onClose && (
          <CButton color="danger" onClick={onClose} className="mb-2">
            {t('LABELS.cancel')}
          </CButton>
        )}
      </div>
    </CForm>
  )

  // If used as a modal component
  if (isOpen !== undefined) {
    return (
      // <CModal 
      //   visible={isOpen} 
      //   onClose={onClose}
      //   size="lg"
      //   alignment="center"
      // >
      //   <CModalHeader>
      //     <CModalTitle>{t('LABELS.create_new_product')}</CModalTitle>
      //   </CModalHeader>
      //   <CModalBody>
      //     {renderForm()}
      //   </CModalBody>
      // </CModal>
      <CModal 
  visible={isOpen} 
  onClose={onClose}
  size="lg"
  alignment="center"
  backdrop="static" // Prevent closing on outside click
>
  <CModalHeader>
    <CModalTitle>{t('LABELS.create_new_product')}</CModalTitle>
  </CModalHeader>
  <CModalBody>
    {renderForm()}
  </CModalBody>
</CModal>
    )
  }

  // If used as a standalone page
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>Create New Product</strong>
          </CCardHeader>
          <CCardBody>
            {renderForm()}
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default ProductForm