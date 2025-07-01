// import React, { useState, useEffect } from 'react';
// import {
//   CButton,
//   CModal,
//   CModalHeader,
//   CModalTitle,
//   CModalBody,
//   CModalFooter,
//   CForm,
//   CFormLabel,
//   CFormInput,
//   CFormSelect,
//   CFormCheck,
//   CRow,
//   CCol,
//   CSpinner
// } from '@coreui/react';
// import { getAPICall, put } from '../../../util/api';
// import { useToast } from '../../common/toast/ToastContext';
// import { useTranslation } from 'react-i18next';

// const ProductModal = ({ productId, sourceType, visible, setVisible, onSuccess }) => {
//        const { t, i18n } = useTranslation("global");
//   const { showToast } = useToast();
//   const [loading, setLoading] = useState(false);
//   const [formData, setFormData] = useState({});
//   const [factoryProductData, setFactoryProductData] = useState([])
//   const [selectedFactorySizeId, setSelectedFactorySizeId] = useState('');
//   const [mappedFactoryProductId, setMappedFactoryProductId] = useState('');

//   useEffect(() => {
//      fetchFactoryProduct()
     
//    }, [])
 
//    const fetchFactoryProduct = async () => {
//      try {
//        const res = await getAPICall('/api/getProductsByProductType')    // showAllFactoryProducts
//        console.log(res);
       
//        setFactoryProductData(res?.products)
//      } catch (err) {
//        console.error('Error fetching tank data:', err)
//      }
//    }

//   useEffect(() => {
//     if (productId && visible) {
//       fetchProductData();
//     }
//   }, [productId, visible]);

//   const fetchProductData = async () => {
//     setLoading(true);
//     try {
//       let endpoint = sourceType === 'retail' 
//         ? `/api/retailProduct/${productId}` 
//         :`/api/retailProduct/${productId}`;
      
//       const response = await getAPICall(endpoint);
      
//       // Handle different response formats based on source type
//       if (sourceType === 'retail' && response.data) {
//         // Retail product returns data in nested object
//         setFormData(response.data);
//       } else {
//         // Factory product returns flat object
//         setFormData(response.data);
//       }
//     } catch (error) {
//       showToast('danger', 'Error fetching product data: ' + error);
//     } finally {
//       setLoading(false);
//     }
//   };
//   const productTypeOptions = [
//     { value: '2', label: `${t('LABELS.retail')}`  },
//     { value: '1', label:`${t('LABELS.factory')}` },
//     { value: '0', label: `${t('LABELS.delivery_product')}` }
//   ]
 
//   const handleChange = (e) => {
//     const { name, value, type, checked } = e.target;
    
//     // Special handling for unit selection
//     if (name === 'unit' && sourceType === 'retail') {
//       let labelValue = formData.label_value || 0;
//       const newFormData = {
//         ...formData,
//         [name]: value
//       };
      
//       // Calculate unit_multiplier and convert label_value based on unit selection
//       if (value === 'kg' || value === 'ltr') {
//         newFormData.unit_multiplier = formData.label_value;
//       } else if (value === 'gm' || value === 'ml') {
//         newFormData.unit_multiplier = parseFloat(formData.label_value) / 1000 || 0;
//         // No need to convert label_value here, as that will happen in handleSubmit
//       }
      
//       setFormData(newFormData);
//     } else if (name === 'label_value' && sourceType === 'retail') {
//       // Just update the label_value field without conversion
//       setFormData({
//         ...formData,
//         [name]: value
//       });
//     } else {
//       setFormData({
//         ...formData,
//         [name]: type === 'checkbox' ? checked : value
//       });
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       let endpoint = sourceType === 'retail' 
//         ? `/api/updateProductSize/${productId}` 
//         : `/api/updateProductSize/${productId}`;
  
//       let dataToSubmit = formData;
  
//       // Include mapped_factory_product_size_id if selectedFactorySizeId is set
//       if (formData.productType === '2' && selectedFactorySizeId) {
//         dataToSubmit = {
//           ...formData,
//           mapped_factory_product_size_id: selectedFactorySizeId, // Add this line
//         };
//       }
//       console.log('Selected Factory Size ID:', selectedFactorySizeId);

//       // For retail products, ensure boolean is properly formatted
//       if (sourceType === 'retail') {
//         dataToSubmit = {
//           ...dataToSubmit,
//           returnable: dataToSubmit.returnable ? 1 : 0,
//           show: dataToSubmit.show ? 1 : 0
//         };
//       } else {
//         // For factory products, ensure boolean is properly formatted
//         dataToSubmit = {
//           ...dataToSubmit,
//           is_visible: dataToSubmit.is_visible ? true : false
//         };
//       }
  
//       await put(endpoint, dataToSubmit);
//       showToast('success', 'Product updated successfully');
//       setVisible(false);
//       if (onSuccess) onSuccess();
//     } catch (error) {
//       showToast('danger', 'Error updating product: ' + error);
//     } finally {
//       setLoading(false);
//     }
//   };
  

//   const handleDefaultQtyChange = (e) => {
//     const { value } = e.target;

//     // Allow empty string to let the field appear blank when clicked
//     if (value === '' || /^[0-9]+$/.test(value)) {
//       setFormData((prev) => ({
//         ...prev,
//         default_qty: value === '' ? '' : parseInt(value),
//       }));
//     }
//   };

//   // Render the appropriate form based on the source type
//   const renderForm = () => {
//     if (sourceType === 'retail' || sourceType === 'factory') {
//       return (
//         <CForm onSubmit={handleSubmit}>
//       <CRow className="mb-3">

//             <CCol md={6}>
//               <CFormLabel htmlFor="name">{t('LABELS.product_name')}</CFormLabel>
//               <CFormInput
//                 id="name"
//                 name="name"
//                 value={formData.name || ''}
//                 onChange={handleChange}
//                 required
//               />
//             </CCol>
//             <CCol md={6}>
//               <CFormLabel htmlFor="localName">{t('LABELS.product_local_name')}</CFormLabel>
//               <CFormInput
//                 id="localName"
//                 name="localName"
//                 value={formData.localName || ''}
//                 onChange={handleChange}
//               />
//             </CCol>
//           </CRow>
//           <CRow className="mb-3">
//           <CCol md={4}>
//                       <CFormLabel htmlFor="product_type">{t('LABELS.product_type')}</CFormLabel>
//                       <CFormSelect 
//                         id="product_type" 
//                         name="product_type" 
//                         value={formData.product_type}
//                         onChange={handleChange}
//                       >
//                         {productTypeOptions.map(option => (
//                           <option key={option.value} value={option.value}>{option.label}</option>
//                         ))}
//                       </CFormSelect>
//             </CCol>
                 
//             <CCol md={4}>
//               <CFormLabel htmlFor="qty">{t('LABELS.availableQuantity')}</CFormLabel>
//               <CFormInput
//                 id="qty"
//                 name="qty"
//                 type="number"
//                 value={formData.qty || ''}
//                 onChange={handleChange}
//                 required
//               />
//             </CCol>
//             <CCol md={4}>
//               <CFormLabel htmlFor="max_stock">{t('LABELS.Capacity')}</CFormLabel>
//               <CFormInput
//                 id="max_stock"
//                 name="max_stock"
//                 type="number"
//                 value={formData.max_stock || ''}
//                 onChange={handleChange}
//               />
//             </CCol>
//           </CRow>
//           <CRow className="mb-3">
//           <CCol md={4}>
//               <CFormLabel htmlFor="label_value">{t('LABELS.weight')}</CFormLabel>
//               <CFormInput
//                 id="label_value"
//                 name="label_value"
//                 value={formData.label_value || ''}
//                 onChange={handleChange}
//               />
//             </CCol>
//             <CCol md={4}>
//               <CFormLabel htmlFor="unit">{t('LABELS.units')}</CFormLabel>
//               <CFormSelect
//                 id="unit"
//                 name="unit"
//                 value={formData.unit || 'kg'}
//                 onChange={handleChange}
//                 required
//               >
//                 <option value="kg">{t('LABELS.Kilogram')}</option>
//                 <option value="ltr">{t('LABELS.liter')}</option>
//                 <option value="gm">{t('LABELS.grams')}</option>
//                 <option value="ml">{t('LABELS.milli_liter')}</option>
//                 <option value="pcs">{t('LABELS.pcs')}</option>
//               </CFormSelect>
//             </CCol>
//             <CCol md={4}>
//               <CFormLabel htmlFor="dPrice">{t('LABELS.price')}</CFormLabel>
//               <CFormInput
//                 id="dPrice"
//                 name="dPrice"
//                 type="number"
//                 value={formData.dPrice || ''}
//                 onChange={handleChange}
//               />
//             </CCol>
//           </CRow>
//           <CRow className="mb-3">
           
            
//             {/* Unit multiplier field is hidden but still part of the form data */}
//             <input 
//               type="hidden" 
//               name="unit_multiplier" 
//               value={formData.unit_multiplier || '1'}
//             />
//           </CRow>
         
          
//           <CRow className="mb-3">
           
//             <CCol md={4}>
//               <CFormCheck
//                 id="show"
//                 name="show"
//                 label={t('LABELS.show')}
//                 checked={formData.show === 1 || formData.show === true}
//                 onChange={handleChange}
//               />
//             </CCol>
//             <CCol md={4}>
            
//              <CFormCheck
//                 id="returnable"
//                 name="returnable"
//                 label={t('LABELS.returnable')}
//                 checked={formData.returnable === 1 || formData.returnable === true}
//                 onChange={handleChange}
//               />
//             </CCol>
//             {formData.returnable ===1 ||formData.returnable ===true  && (
                
//                 <div className="col-md-4 col-12 mb-2 ">
//                   <CFormLabel htmlFor="default_qty">{t('LABELS.default_qty')} </CFormLabel>
//                   <CFormInput
//                     type="number"
//                     id="default_qty"
//                     placeholder="0"
//                     min="1"
//                     name="default_qty"
//                     value={formData.default_qty}
//                     onChange={handleDefaultQtyChange}
//                   />
//                 </div>
            
//             )}
            
//   <div className="row mb-2">
//     <div className="col-md-6 col-12 mb-2">
//       <CFormLabel htmlFor="selectedFactorySizeId">Map to Factory Product Size</CFormLabel>
//       <CFormSelect
//         id="selectedFactorySizeId"
//         name="selectedFactorySizeId"
//         value={selectedFactorySizeId}
//         onChange={(e) => setSelectedFactorySizeId(e.target.value)}
//       >
//         <option value="">Select Factory Product Size</option>
//         {factoryProductData.map(fp => (
//           <option key={fp.id} value={fp.id}>
//             {fp.name}
//           </option>
//         ))}

//       </CFormSelect>
//     </div>
//   </div>


//           </CRow>
//         </CForm>
//       );
//     } 
    
//   };

//   return (
//     <CModal 
//       visible={visible} 
//       onClose={() => setVisible(false)}
//       size="lg"
//       alignment="center"
//     >
//       <CModalHeader onClose={() => setVisible(false)}>
//         <CModalTitle>
//           {sourceType === 'retail' ? `${t('LABELS.edit_retail_product')}` : `${t('LABELS.edit_factory_product')}`}
//         </CModalTitle>
//       </CModalHeader>
//       <CModalBody>
//         {loading ? (
//           <div className="text-center">
//             <CSpinner />
//           </div>
//         ) : (
//           renderForm()
//         )}
//       </CModalBody>
//       <CModalFooter>
//         <CButton color="secondary" onClick={() => setVisible(false)}>
//         {t('LABELS.cancel')}
//         </CButton>
//         <CButton color="primary" onClick={handleSubmit} disabled={loading}>
//           {loading ? <CSpinner size="sm" /> : `${t('LABELS.save_changes')}`}
//         </CButton>
//       </CModalFooter>
//     </CModal>
//   );
// };

// export default ProductModal;

// ProductModals.js

import React, { useState, useEffect } from 'react';
import {
  CButton,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormLabel,
  CFormInput,
  CFormSelect,
  CFormCheck,
  CRow,
  CCol,
  CSpinner,
} from '@coreui/react';
import { getAPICall, put } from '../../../util/api';
import { useToast } from '../../common/toast/ToastContext';
import { useTranslation } from 'react-i18next';

const ProductModal = ({ productId, sourceType, visible, setVisible, onSuccess }) => {
  const { t } = useTranslation('global');
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [factoryProductData, setFactoryProductData] = useState([]);
  const [selectedFactorySizeId, setSelectedFactorySizeId] = useState('');

  useEffect(() => {
    fetchFactoryProduct();
  }, []);

  const fetchFactoryProduct = async () => {
    try {
      const res = await getAPICall('/api/getProductsByProductType');
      setFactoryProductData(res?.products || []);
    } catch (err) {
      console.error('Error fetching factory products:', err);
    }
  };

  useEffect(() => {
    if (productId && visible) {
      fetchProductData();
    }
  }, [productId, visible]);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      const endpoint = `/api/retailProduct/${productId}`;
      const response = await getAPICall(endpoint);
      if (response?.data) {
        setFormData(response.data);

        // Set selectedFactorySizeId from response
        const factoryId = response?.data?.product_mapping?.factory_productSize_id || '';
        setSelectedFactorySizeId(factoryId);
      }
    } catch (error) {
      showToast('danger', 'Error fetching product data: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = `/api/updateProductSize/${productId}`;
      let dataToSubmit = {
        ...formData,
        returnable: formData.returnable ? 1 : 0,
        show: formData.show ? 1 : 0,
      };

      if (formData.product_type === 2 && selectedFactorySizeId) {
        dataToSubmit.mapped_factory_product_size_id = selectedFactorySizeId;
      }

      await put(endpoint, dataToSubmit);
      showToast('success', 'Product updated successfully');
      setVisible(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      showToast('danger', 'Error updating product: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CModal visible={visible} backdrop="static"  onClose={() => setVisible(false)} size="lg" alignment="center">
      <CModalHeader onClose={() => setVisible(false)}>
        <CModalTitle>
          {sourceType === 'retail' ? t('LABELS.edit_retail_product') : t('LABELS.edit_factory_product')}
        </CModalTitle>
      </CModalHeader>
      <CModalBody>
        {loading ? (
          <div className="text-center">
            <CSpinner />
          </div>
        ) : (
          <CForm onSubmit={handleSubmit}>
            <CRow className="mb-3">
              <CCol md={6}>
                <CFormLabel htmlFor="name">{t('LABELS.product_name')}</CFormLabel>
                <CFormInput
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  required
                />
              </CCol>
              <CCol md={6}>
                <CFormLabel htmlFor="localName">{t('LABELS.product_local_name')}</CFormLabel>
                <CFormInput
                  id="localName"
                  name="localName"
                  value={formData.localName || ''}
                  onChange={handleChange}
                />
              </CCol>
            </CRow>

            {formData.product_type === 2 && (
              <CRow className="mb-3">
                <CCol md={12}>
                  <CFormLabel htmlFor="selectedFactorySizeId">Map to Factory Product Size</CFormLabel>
                  <CFormSelect
                    id="selectedFactorySizeId"
                    name="selectedFactorySizeId"
                    value={selectedFactorySizeId}
                    onChange={(e) => setSelectedFactorySizeId(e.target.value)}
                  >
                    <option value="">Select Factory Product Size</option>
                    {factoryProductData.map((fp) => (
                      <option key={fp.id} value={fp.id}>
                        {fp.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>
            )}

           


  <CRow className="mb-3">
  <CCol md={4}>
    <CFormLabel>{t('LABELS.product_type')}</CFormLabel>
<CFormInput
  value={formData.product_type === 1 ? 'Factory' : 'Retail'}
  disabled
  readOnly
/>
  </CCol>
  {/* <CCol md={4}>
    <CFormLabel>Available Stock</CFormLabel>
    <CFormInput
      name="qty"
      type="number"
      value={formData.qty || ''}
      onChange={handleChange}
    />
  </CCol> */}
  <CCol md={4}>
    <CFormLabel>{t('LABELS.Capacity')}</CFormLabel>
    <CFormInput
      name="max_stock"
      type="number"
      value={formData.max_stock || ''}
      onChange={handleChange}
    />
  </CCol>



  <CCol md={4}>
    <CFormLabel>{t('LABELS.weight')}</CFormLabel>
    <CFormInput
      name="label_value"
      type="number"
      value={formData.label_value || ''}
      onChange={handleChange}
    />
  </CCol>
</CRow>


  <CRow className="mb-3">
  <CCol md={4}>
  <CFormLabel>{t('LABELS.units')}</CFormLabel>
  <CFormSelect
    name="unit"
    value={formData.unit || ''}
    onChange={handleChange}
  >
    <option value="kg">{t('LABELS.Kilogram')}</option>
    <option value="ltr">{t('LABELS.liter')}</option>
    <option value="ml">{t('LABELS.milli_liter')}</option>
    <option value="gm">{t('LABELS.grams')}</option>
  
  </CFormSelect>
</CCol>
  <CCol md={4}>
    <CFormLabel>{t('LABELS.price')}</CFormLabel>
    <CFormInput
      name="oPrice"
      type="number"
      value={formData.oPrice || ''}
      onChange={handleChange}
    />
  </CCol>
</CRow>


 <CRow className="mb-3">
              <CCol md={6}>
                <CFormCheck
                  id="returnable"
                  name="returnable"
                  label={t('LABELS.returnable')}
                  checked={formData.returnable === 1 || formData.returnable === true}
                  onChange={handleChange}
                />
              </CCol>
              <CCol md={6}>
                <CFormCheck
                  id="show"
                  name="show"
                  label={t('LABELS.show')}
                  checked={formData.show === 1 || formData.show === true}
                  onChange={handleChange}
                />
              </CCol>
            </CRow>




          </CForm>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={() => setVisible(false)}>
          {t('LABELS.cancel')}
        </CButton>
        <CButton color="primary" onClick={handleSubmit} disabled={loading}>
          {loading ? <CSpinner size="sm" /> : t('LABELS.save_changes')}
        </CButton>
      </CModalFooter>
    </CModal>
  );
};

export default ProductModal;
