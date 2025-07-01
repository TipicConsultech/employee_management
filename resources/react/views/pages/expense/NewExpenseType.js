import React, { useState } from 'react'
import {
  CAlert,
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
  CFormTextarea,
  CRow,
} from '@coreui/react'
import { post } from '../../../util/api'
import { useToast } from '../../common/toast/ToastContext';
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom';


const NewExpenseType = () => {
  const [validated, setValidated] = useState(false)
  const { showToast } = useToast();
  const { t } = useTranslation("global")
  const navigate = useNavigate();
  const [state, setState] = useState({
    name: '',
    slug: '',
    localName: '',
     expense_category : '',
    desc: '',
    show: true,
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setState({ ...state, [name]: value })
  }

  const handleCBChange = (e) => {
    const { name, checked } = e.target
    setState({ ...state, [name]: checked })
  }

  const handleSubmit = async (event) => {
    const form = event.currentTarget
    event.preventDefault()
    event.stopPropagation()
    setValidated(true)
    if (form.checkValidity() !== true) {
      return
    }
    let data = { ...state }
    data.slug = data.name.replace(/[^\w]/g, '_')
    try {
      const resp = await post('/api/expenseType', data)
      if (resp?.id) {
        showToast('success',t("MSG.expense_type_added_successfully_msg"));
        navigate('/expense/new');
      } else {
        showToast('danger', t("MSG.failed_to_add_expense_type_msg"));
      }
      handleClear()
    } catch (error) {
      showToast('danger', 'Error occured ' + error);
    }
  }

  const handleClear = async () => {
    setState({
      name: '',
      slug: '',
      localName: '',
       expense_category : '',
      desc: '',
      show: true,
    })
    setValidated(false)
  }
  return (
    <CRow>
      <CCol xs={12}>
        <CCard className="mb-4">
          <CCardHeader>
            <strong>{t("LABELS.create_new_expense_type")}</strong>
          </CCardHeader>
          <CCardBody>
            <CForm noValidate={true} validated={validated} onSubmit={handleSubmit}>
              <div className="mb-3">
                <CFormLabel htmlFor="pname"><b>{t("LABELS.expense_type_name")}</b></CFormLabel>
                <CFormInput
                  type="text"
                  id="pname"
                  placeholder=""
                  name="name"
                  value={state.name}
                  onChange={handleChange}
                  required
                  feedbackInvalid="Please provide name."
                />
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="pname"><b>{t("LABELS.expense_type_local_name")}</b></CFormLabel>
                <CFormInput
                  type="text"
                  id="plname"
                  placeholder=""
                  name="localName"
                  value={state.localName}
                  onChange={handleChange}
                  required
                  feedbackInvalid="Please provide local name."
                />
              </div>
               <div className="mb-3">
                <CFormLabel htmlFor="expense_category"><b>{t("LABELS.expense_category")}</b></CFormLabel>
                <CFormSelect
                  id="expense_category"
                  name="expense_category"
                  value={state.expense_category}
                  onChange={handleChange}
                  required
                  feedbackInvalid="Please select an expense category."
                >
                  <option value="">-- Select Category --</option>
                  <option value="Operational Expense">Operational Expense</option>
                  <option value="Capital Expense">Capital Expense</option>
                </CFormSelect>
              </div>
              <div className="mb-3">
                <CFormLabel htmlFor="desc"><b>{t("LABELS.short_description")}</b></CFormLabel>
                <CFormTextarea
                  id="desc"
                  rows={3}
                  name="desc"
                  value={state.desc}
                  onChange={handleChange}
                  required
                  feedbackInvalid="Please provide description."
                ></CFormTextarea>
              </div>
              <div className="mb-3">
                <CFormCheck
                  id="flexCheckDefault"
                  label={t("LABELS.show_for_expense_records")}
                  name="show"
                  checked={state.show}
                  onChange={handleCBChange}
                />
              </div>
              <div className="mb-3">
                <CButton color="success" type="submit">
                {t("LABELS.submit")}
                </CButton>
                &nbsp;
                <CButton color="secondary" onClick={handleClear}>
                {t("LABELS.clear")}
                </CButton>
              </div>
            </CForm>
          </CCardBody>
        </CCard>
      </CCol>
    </CRow>
  )
}

export default NewExpenseType
