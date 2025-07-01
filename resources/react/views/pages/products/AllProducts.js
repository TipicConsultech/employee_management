import React, { useEffect, useState } from 'react';
import { CBadge, CButton, CCardHeader, CRow } from '@coreui/react';
import { MantineReactTable } from 'mantine-react-table';
import { deleteAPICall, getAPICall, postFormData } from '../../../util/api';
import ConfirmationModal from '../../common/ConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../common/toast/ToastContext';
import ProductModal from './ProductModals';
import ProductForm from './NewProduct';
import { useTranslation } from 'react-i18next';
import CIcon from '@coreui/icons-react';
import { cilArrowThickToBottom, cilArrowThickToTop } from '@coreui/icons';
import { host } from '../../../util/constants';
import { getToken, getUserData } from '../../../util/session';


const AllProducts = ( ) => {
   const { t, i18n } = useTranslation("global");
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [deleteProduct, setDeleteProduct] = useState();
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { showToast } = useToast();
  const [showModal, setShowModal] = useState(false);
   const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

      const user = getUserData();
    

  const fetchProducts = async () => {
    try {
      const response = await getAPICall('/api/getCombinedProducts');
      setProducts(response.data);
    } catch (error) {
      showToast('danger', 'Error occurred ' + error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = (p) => {
    setDeleteProduct(p);
    setDeleteModalVisible(true);
  };

   const handleFileChange = (e) => {
      setSelectedFile(e.target.files[0]);
    };
  
    const handleSubmit = async () => {
      if (!selectedFile) return;
  
      setUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
     
      try {
        const res = await postFormData('/api/uploadProductCsv', formData);
        alert('File uploaded successfully!');
        fetchProducts();
      } catch (error) {
        console.error('Upload failed:', error);
        alert('Upload failed');
      } finally {
        setUploading(false);
        setSelectedFile(null);
      }
    };

  const handleDownload = async () => {
    try {

       const token = getToken()
      const response = await fetch(host+'/api/productSampleCsv', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
  
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products_csv_sample.csv'); // filename must match backend
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
    }
  };
  
  const shortenFileName = (name) => {
    if (!name) return '';
    if (name.length <= 6) return name;
    const extension = name.split('.').pop();
    return `${name.substring(0, 4)}..${extension}`;
  };
  

  const onDelete = async () => {
    try {
      await deleteAPICall('/api/product/' + deleteProduct.id);
      setDeleteModalVisible(false);
      fetchProducts();
    } catch (error) {
      showToast('danger', 'Error occurred ' + error);
    }
  };

  const handleEdit = (p) => {
    setSelectedProduct(p);
    setEditModalVisible(true);
  };

  const columns = [
    {
      accessorKey: 'source_type',
      header: `${t('LABELS.product_type')}`,
      Cell: ({ cell }) => (
        cell.row.original.source_type === "retail" ? (
          <CBadge color="success">{t('LABELS.retail')}</CBadge>
        ) : (
          <CBadge color="info">{t('LABELS.factory')}</CBadge>
        )
      ),
    },
    { accessorKey: 'name', header: `${t('LABELS.product_name')}`, },
    { accessorKey: 'local_name', header: `${t('LABELS.product_local_name')}`, },
    {
      accessorKey: 'sellingPrice',
      header: `${t('LABELS.price')}`,
      Cell: ({ cell }) => {
        const price = cell.row.original.price; 
          
        return price ? `${price} ₹` : '';
      },
    },
    {
      accessorKey: 'status',
      header: `${t('LABELS.status')}`,
      Cell: ({ cell }) => (
        cell.row.original.is_visible == true ? (
          <CBadge color="success">{t('LABELS.visible')}</CBadge>
        ) : (
          <CBadge color="danger">{t('LABELS.hidden')}</CBadge>
        )
      ),
    },
    {
      accessorKey: 'actions',
      header: `${t('LABELS.action')}`,
      Cell: ({ cell }) => (
        <div>
          <CBadge
            role="button"
            color="info"
            onClick={() => handleEdit(cell.row.original)}
          >
           {t('LABELS.edit')}
          </CBadge>
          &nbsp;
          {/* <CBadge
            role="button"
            color="danger"
            onClick={() => handleDelete(cell.row.original)}
          >
            Delete
          </CBadge> */}
        </div>
      ),
    },
  ];

  const data = products.map((p, index) => ({
    ...p,
    index: index + 1,
  }));

  return (
     <div className="p-0">
          <CCardHeader style={{ backgroundColor: '#d6eaff'}} className='p-2  rounded'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h5 className="mb-0" >{t('LABELS.all_product')}</h5> 
            </div>
          </CCardHeader>
       <div  style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' ,paddingTop:'10px'  }}>
         <CButton color="primary" onClick={handleDownload} style={{marginRight:'10px'}}>
                        <CIcon icon={cilArrowThickToBottom} size="sm" style={{ marginRight: 3 }}/>
                        {t('LABELS.download_template')}
                      </CButton>
        <div className="d-flex gap-2 mb-2">
                        
               {/* {user?.type===1 &&(
                <CButton color="primary" onClick={handleDownload} style={{ flex: '1' }}>
                <CIcon icon={cilArrowThickToBottom} size="sm" style={{ marginRight: 3 }}/>
                {t('LABELS.template')}
                 </CButton>
              
               )} */}
                      
                      <input
  type="file"
  id="fileInput"
  accept=".csv"
  style={{ display: 'none' }}
  onChange={handleFileChange}
/>    
              {user?.type===1 && (
                 <CButton
                color={selectedFile ? "primary" : "primary"} 
                variant={selectedFile ? "solid" : "outline"}
                onClick={() => document.getElementById('fileInput').click()}
                style={{ 
                   flex: '1',
                   overflow: 'hidden', 
                   marginRight:'10px',
                   marginTop:'10px',
                   whiteSpace: 'nowrap', 
                   textOverflow: 'ellipsis', 
                   maxWidth: '200px', // limit button width
                    // 👈 add right gap (you can adjust value)
                   }}
               >
                   {!selectedFile && (<CIcon icon={cilArrowThickToTop} size="sm" style={{ marginRight: 0 }}/>)}
                   {selectedFile ? shortenFileName(selectedFile.name) : `${t('LABELS.upload_csv')}`}
               </CButton>
               )}
        
          
        
              
                      {selectedFile && user?.type===1 && (
                        <div style={{padding:'5px',marginTop:'7px'}}>
                        <CButton
                          color="success"
                          disabled={uploading}
                          onClick={handleSubmit}
                          style={{ flex: '1',
                          marginRight: '10px',
                          padding:'-5px'
                          }}
                        >
                          {uploading ? `${t('LABELS.uplaoding')}` : `${t('LABELS.submit')}`}
                        </CButton>
                        </div>
                      )}
                    </div>

            <CButton color="primary" onClick={()=>setShowModal(true)}>{t('LABELS.add_product')}</CButton>
       </div>
          <ProductForm 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        fetchProducts ={fetchProducts }
      />
          <div className="p-3">
   <CRow>
      <ConfirmationModal
        visible={deleteModalVisible}
        setVisible={setDeleteModalVisible}
        onYes={onDelete}
        resource={'Delete product - ' + deleteProduct?.name}
      />
      
      {selectedProduct && (
        <ProductModal
          productId={selectedProduct.id}
          sourceType={selectedProduct.source_type}
          visible={editModalVisible}
          setVisible={setEditModalVisible}
          onSuccess={fetchProducts}
          
        />
      )}
      
      <MantineReactTable 
        columns={columns} 
        data={data} 
        enableFullScreenToggle={false}
     initialState={{
        density: 'xs', // ✅ Set default row density to "Compact"
      }}
   
      />
    </CRow>
    </div>
    </div>
  );
};

export default AllProducts;