import { CBadge, CForm, CFormInput, CFormLabel, CModal, CModalBody, CModalHeader, CModalTitle, CButton } from '@coreui/react';
import { cilSortAscending, cilSortDescending, cilX } from '@coreui/icons'; // Import sorting and close icons
import { useCallback, useEffect, useState } from 'react';
import { useToast } from './toast/ToastContext';
import { useTranslation } from 'react-i18next';
import React from 'react';
import { fetchCustomers, filterCustomers } from '../../util/customers';
import CIcon from '@coreui/icons-react';

export default function AllCustomerModal({ visible, setVisible, newCustomer, onClick }) {
  const { showToast } = useToast();
  const { t } = useTranslation("global");
  const [suggestions, setSuggestions] = useState([]);
  const [filterText, setFilterText] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const searchCustomer = useCallback(async (value, sortValue=sortOrder) => {
    try {
      const customers = await fetchCustomers();
      const filteredCustomers = filterCustomers(customers, value);
      const sortedCustomers = filteredCustomers.sort((a, b) => 
        sortValue === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
      );
      setSuggestions(sortedCustomers, 'asc');
    } catch (error) {
      showToast('danger', 'Error occurred ' + error);
    }
  });

  useEffect(()=>{
    searchCustomer();
  },[visible]);
  
  const handleChange = (e) => {
    const { value } = e.target;
    setFilterText(value);
    searchCustomer(value);
  };

  const toggleSortOrder = () => {
    const newValue = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newValue);
    searchCustomer(filterText, newValue);
  };

  const handleClear = () => {
    setFilterText('');
  }
  
  return (
    <>
      <CModal
        backdrop="static"
        visible={visible}
        // closeButton={false}
        onClose={() => {handleClear();setVisible(false);}}
        aria-labelledby="StaticBackdropExampleLabel"
      >
        <CModalBody>
          <div>
          <CModalTitle id="StaticBackdropExampleLabel">{t("LABELS.all_customers")}</CModalTitle>
          <CButton
            color="danger"
            onClick={() => { handleClear(); setVisible(false); }}
            style={{ position: 'absolute', right: '10px', top: '10px' }} // Right align the button
            aria-label="Close"
          >
            <CIcon icon={cilX} />
          </CButton>
          </div>
          <CForm className="needs-validation" noValidate>
                <div className="mb-3">
                  {/* t("LABELS.customer_name") */}
                  <CFormLabel htmlFor="filterText">{}</CFormLabel>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CFormInput
                    type="text"
                    id="filterText"
                    placeholder={t('MSG.enter_customer_name_msg')}
                    name="filterText"
                    value={filterText}
                    onChange={handleChange}
                    required
                    feedbackInvalid={t('MSG.please_provide_name')}
                    feedbackValid={t('MSG.looks_good_msg')}
                  />
                    <CIcon 
                      icon={sortOrder === 'asc' ? cilSortAscending : cilSortDescending} 
                      style={{ cursor: 'pointer', marginLeft: '10px' }} 
                      onClick={toggleSortOrder}
                    />
                  </div>
                  <div className="invalid-feedback">{t("MSG.name_is_required_msg")}</div>
                </div>
                <ul className="suggestions-list" style={{maxHeight: '325px', overflowY: 'auto',right:'0px'}} >
                  {suggestions.map((suggestion, index) => (
                    <li key={index} onClick={() => {onClick(suggestion);setVisible(false);}}>
                      {suggestion.name + ' ('+suggestion.mobile+')'}
                    </li>
                  ))}
                  {suggestions.length == 0 && <li  onClick={() => newCustomer(true)}>
                    <CBadge
                      role="button"
                      color="danger"
                    >
                      {t("LABELS.new_customer")}
                    </CBadge>
                  </li>}
                </ul>
            </CForm>
        </CModalBody>
      </CModal>
    </>
  )
}
