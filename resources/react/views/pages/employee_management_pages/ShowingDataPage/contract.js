import React, { useState, useCallback, useEffect } from 'react';
import { post } from '../../../../util/api';
import { useTranslation } from 'react-i18next';

function Contract({employee}) {
  const { t } = useTranslation('global');
  const showToast = useCallback((type, message) => {
    console.log(`Toast: ${type} - ${message}`);
  }, []);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workSummary, setWorkSummary] = useState({
    working_type: '',
    price: '',
    quantity: '',
    total_salary: 0,
    payed_amount: '',
    pending_payment: 0,
    payment_type: '',
    transactionId: '',
    current_credit: 0,
    current_debit: 0,
    updated_credit: 0,
    updated_debit: 0
  });

  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '' });
    }, 4000);
  }, []);

  useEffect(() => {
    const price = parseFloat(workSummary.price) || 0;
    const quantity = parseFloat(workSummary.quantity) || 0;
    const total_salary = price * quantity;
    const payed_amount = parseFloat(workSummary.payed_amount) || 0;
    const pending_payment = Math.max(0, total_salary - payed_amount);

    let newCredit = employee?.credit || 0;
    let newDebit = employee?.debit || 0;

    if (pending_payment > 0) {
      if (newCredit > 0 && newDebit === 0) {
        const creditUsed = Math.min(newCredit, pending_payment);
        newCredit -= creditUsed;
        const remainingPending = pending_payment - creditUsed;
        if (remainingPending > 0) {
          newDebit += remainingPending;
        }
      } else if (newCredit === 0 && newDebit >= 0) {
        newDebit += pending_payment;
      }
    } else if (pending_payment < 0) {
      const overpaidAmount = Math.abs(pending_payment);
      if (newDebit > 0) {
        const debitReduced = Math.min(newDebit, overpaidAmount);
        newDebit -= debitReduced;
        const remainingOverpaid = overpaidAmount - debitReduced;
        if (remainingOverpaid > 0) {
          newCredit += remainingOverpaid;
        }
      } else {
        newCredit += overpaidAmount;
      }
    }

    setWorkSummary(prev => ({
      ...prev,
      total_salary,
      pending_payment,
      current_credit: employee?.credit || 0,
      current_debit: employee?.debit || 0,
      updated_credit: newCredit,
      updated_debit: newDebit
    }));
  }, [workSummary.price, workSummary.quantity, workSummary.payed_amount, employee]);

  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'working_type':
        if (!value.trim()) error = t('MSG.workingTypeRequired');
        break;
      case 'price':
        if (!value || parseFloat(value) <= 0) error = t('MSG.priceMustBePositive');
        break;
      case 'quantity':
        if (!value || parseFloat(value) <= 0) error = t('MSG.quantityMustBePositive');
        break;
      case 'payed_amount':
        const paidAmount = parseFloat(value);
        const totalAmount = workSummary.total_salary;
        if (!value) {
          error = t('MSG.payedAmountRequired');
        } else if (paidAmount < 0) {
          error = t('MSG.payedAmountCannotBeNegative');
        } else if (paidAmount > totalAmount && totalAmount > 0) {
          error = t('MSG.payedAmountExceedsTotal');
        }
        break;
      case 'payment_type':
        if (!value) error = t('MSG.paymentMethodRequired');
        break;
      default:
        break;
    }

    setErrors(prev => ({
      ...prev,
      [name]: error
    }));

    return error === '';
  };

  const validateDates = () => {
    let dateErrors = {};

    if (!startDate) dateErrors.startDate = t('MSG.startDateRequired');
    if (!endDate) dateErrors.endDate = t('MSG.endDateRequired');
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      dateErrors.endDate = t('MSG.endDateAfterStartDate');
    }

    setErrors(prev => ({ ...prev, ...dateErrors }));
    return Object.keys(dateErrors).length === 0;
  };

  const handleNumberInput = (fieldName, value) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWorkSummary(prev => ({
        ...prev,
        [fieldName]: value
      }));

      if (value !== '') {
        validateField(fieldName, value);
      }
    }
  };

  const isFormValid = () => {
    const hasNoErrors = Object.keys(errors).every(key => !errors[key]);
    const hasRequiredFields = startDate && endDate && workSummary.working_type && 
      workSummary.price && workSummary.quantity && workSummary.payed_amount;

    return hasNoErrors && hasRequiredFields;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const isDateValid = validateDates();
    const isWorkingTypeValid = validateField('working_type', workSummary.working_type);
    const isPriceValid = validateField('price', workSummary.price);
    const isQuantityValid = validateField('quantity', workSummary.quantity);
    const isPaymentTypeValid = validateField('payment_type', workSummary.payment_type);
    const isPayedAmountValid = validateField('payed_amount', workSummary.payed_amount);
    const isTransactionIdValid = validateField('transactionId', workSummary.transactionId);

    if (!isDateValid || !isWorkingTypeValid || !isPriceValid || !isQuantityValid || 
        !isPaymentTypeValid || !isPayedAmountValid || !isTransactionIdValid) {
      setIsSubmitting(false);
      return;
    }

    const payload = {
      start_date: startDate,
      end_date: endDate,
      employee_id: employee.id,
      payed_amount: parseFloat(workSummary.payed_amount) || 0,
      salary_amount: workSummary.total_salary,
      payment_type: workSummary.payment_type,
      current_credit: workSummary.current_credit,
      current_debit: workSummary.current_debit,
      updated_credit: workSummary.updated_credit,
      updated_debit: workSummary.updated_debit
    };

    if (['upi', 'bank_transfer'].includes(workSummary.payment_type) && workSummary.transactionId !== "") {
      payload.transaction_id = workSummary.transactionId.trim();
    }

    try {
      await post('/api/payment', payload);
      showNotification('success', t('MSG.paymentSubmittedSuccess'));
      showToast('success', t('MSG.paymentSubmittedSuccess'));
      
      setStartDate('');
      setEndDate('');
      setWorkSummary({
        working_type: '',
        price: '',
        quantity: '',
        total_salary: 0,
        payed_amount: '',
        pending_payment: 0,
        payment_type: '',
        transactionId: '',
        current_credit: 0,
        current_debit: 0,
        updated_credit: 0,
        updated_debit: 0
      });
      setErrors({});
    } catch (err) {
      console.error('Payment Error:', err);
      showNotification('danger', t('MSG.paymentSubmissionError'));
      showToast('warning', t('MSG.paymentSubmissionError'));
    }
    
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="bg-light min-vh-100 py-2">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12">
              <div className="card shadow-lg border-0">
                <div className="card-body p-3">
                  {notification.show && (
                    <div className="mb-4">
                      <div className={`alert alert-${notification.type === 'success' ? 'success' : notification.type === 'danger' ? 'danger' : 'warning'} alert-dismissible fade show`} role="alert">
                        {notification.message}
                        <button 
                          type="button" 
                          className="btn-close" 
                          onClick={() => setNotification({ show: false, type: '', message: '' })}
                        ></button>
                      </div>
                    </div>
                  )}

                  <div className="mb-2">
                    <div className="border-start border-primary border-4 bg-light p-3 mb-4 rounded-end">
                      <h5 className="text-primary mb-0 d-flex align-items-center">
                        <span className="badge bg-primary me-2">1</span>
                        {t('LABELS.workPeriod')}
                      </h5>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-medium">
                          {t('LABELS.startDate')} <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className={`form-control ${errors.startDate ? 'is-invalid' : ''}`}
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            if (errors.startDate) validateDates();
                          }}
                        />
                        {errors.startDate && (
                          <div className="invalid-feedback">{errors.startDate}</div>
                        )}
                      </div>

                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-medium">
                          {t('LABELS.endDate')} <span className="text-danger">*</span>
                        </label>
                        <input
                          type="date"
                          className={`form-control ${errors.endDate ? 'is-invalid' : ''}`}
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            if (errors.endDate) validateDates();
                          }}
                        />
                        {errors.endDate && (
                          <div className="invalid-feedback">{errors.endDate}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="border-start border-success border-4 bg-light p-3 mb-2 rounded-end">
                      <h5 className="text-success mb-0 d-flex align-items-center">
                        <span className="badge bg-success me-2">2</span>
                        {t('LABELS.workDetails')}
                      </h5>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-medium">
                          {t('LABELS.description')} <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.working_type ? 'is-invalid' : ''}`}
                          placeholder={t('LABELS.enterWorkingType')}
                          value={workSummary.working_type}
                          onChange={(e) => {
                            setWorkSummary(prev => ({
                              ...prev,
                              working_type: e.target.value,
                            }));
                            validateField('working_type', e.target.value);
                          }}
                        />
                        {errors.working_type && (
                          <div className="invalid-feedback">{errors.working_type}</div>
                        )}
                      </div>

                      <div className="col-md-3 mb-3">
                        <label className="form-label fw-medium">
                          {t('LABELS.quantity')} <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.quantity ? 'is-invalid' : ''}`}
                          placeholder={t('LABELS.enterQuantity')}
                          value={workSummary.quantity}
                          onChange={(e) => handleNumberInput('quantity', e.target.value)}
                          onBlur={() => validateField('quantity', workSummary.quantity)}
                        />
                        {errors.quantity && (
                          <div className="invalid-feedback">{errors.quantity}</div>
                        )}
                      </div>

                      <div className="col-md-3 mb-3">
                        <label className="form-label fw-medium">
                          {t('LABELS.pricePerItem')} <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          className={`form-control ${errors.price ? 'is-invalid' : ''}`}
                          placeholder={t('LABELS.enterPrice')}
                          value={workSummary.price}
                          onChange={(e) => handleNumberInput('price', e.target.value)}
                          onBlur={() => validateField('price', workSummary.price)}
                        />
                        {errors.price && (
                          <div className="invalid-feedback">{errors.price}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-5">
                    <div className="border-start border-warning border-4 bg-light p-3 mb-4 rounded-end">
                      <h5 className="text-warning mb-0 d-flex align-items-center">
                        <span className="badge bg-warning text-dark me-2">3</span>
                        {t('LABELS.paymentDetails')}
                      </h5>
                    </div>

                    <div className="bg-primary bg-opacity-10 border border-primary border-opacity-25 rounded p-4 mb-4">
                      <div className="row">
                        <div className="col-md-4 mb-3">
                          <label className="form-label fw-medium">
                            {t('LABELS.totalAmount')}
                          </label>
                          <input
                            type="text"
                            className="form-control bg-white fw-bold text-success"
                            value={`₹${workSummary.total_salary.toFixed(2)}`}
                            disabled
                          />
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label fw-medium">
                            {t('LABELS.paidAmount')} <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.payed_amount ? 'is-invalid' : ''}`}
                            placeholder={t('LABELS.enterActualPayment')}
                            value={workSummary.payed_amount}
                            onChange={(e) => handleNumberInput('payed_amount', e.target.value)}
                            onBlur={() => validateField('payed_amount', workSummary.payed_amount)}
                          />
                          {errors.payed_amount && (
                            <div className="invalid-feedback">{errors.payed_amount}</div>
                          )}
                        </div>

                        <div className="col-md-4 mb-3">
                          <label className="form-label fw-medium">
                            {t('LABELS.pendingAmount')}
                          </label>
                          <input
                            type="text"
                            className={`form-control fw-bold ${
                              workSummary.pending_payment > 0 
                                ? 'bg-danger bg-opacity-10 text-danger' 
                                : 'bg-success bg-opacity-10 text-success'
                            }`}
                            value={`₹${workSummary.pending_payment.toFixed(2)}`}
                            disabled
                          />
                        </div>

                        <div className="col-md-3 mb-3">
                          <label className="form-label fw-medium">
                            {t('LABELS.currentCredit')}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={`₹${workSummary.current_credit.toFixed(2)}`}
                            disabled
                          />
                        </div>

                        <div className="col-md-3 mb-3">
                          <label className="form-label fw-medium">
                            {t('LABELS.currentDebit')}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={`₹${workSummary.current_debit.toFixed(2)}`}
                            disabled
                          />
                        </div>

                        <div className="col-md-3 mb-3">
                          <label className="form-label fw-medium">
                            {t('LABELS.updatedCredit')}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={`₹${workSummary.updated_credit.toFixed(2)}`}
                            disabled
                          />
                        </div>

                        <div className="col-md-3 mb-3">
                          <label className="form-label fw-medium">
                            {t('LABELS.updatedDebit')}
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            value={`₹${workSummary.updated_debit.toFixed(2)}`}
                            disabled
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-medium">
                          {t('LABELS.paymentMethod')} <span className="text-danger">*</span>
                        </label>
                        <select
                          className={`form-select ${errors.payment_type ? 'is-invalid' : ''}`}
                          value={workSummary.payment_type}
                          onChange={(e) => {
                            setWorkSummary(prev => ({
                              ...prev,
                              payment_type: e.target.value,
                            }));
                            validateField('payment_type', e.target.value);
                          }}
                        >
                          <option value="">{t('LABELS.selectPaymentMethod')}</option>
                          <option value="cash">{t('LABELS.cash')}</option>
                          <option value="upi">{t('LABELS.upi')}</option>
                          <option value="bank_transfer">{t('LABELS.bankTransfer')}</option>
                        </select>
                        {errors.payment_type && (
                          <div className="invalid-feedback">{errors.payment_type}</div>
                        )}
                      </div>

                      {['upi', 'bank_transfer'].includes(workSummary.payment_type) && (
                        <div className="col-md-6 mb-3">
                          <label className="form-label fw-medium">
                            {t('LABELS.transactionId')} <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            className={`form-control ${errors.transactionId ? 'is-invalid' : ''}`}
                            placeholder={t('LABELS.enterTransactionId')}
                            value={workSummary.transactionId}
                            onChange={(e) => {
                              setWorkSummary(prev => ({
                                ...prev,
                                transactionId: e.target.value,
                              }));
                              validateField('transactionId', e.target.value);
                            }}
                            onBlur={() => validateField('transactionId', workSummary.transactionId)}
                          />
                          {errors.transactionId && (
                            <div className="invalid-feedback">{errors.transactionId}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {Object.keys(errors).some(key => errors[key]) && (
                    <div className="mb-4">
                      <div className="alert alert-danger">
                        <strong className="fw-semibold">{t('MSG.fixErrors')}</strong>
                        <ul className="mb-0 mt-2">
                          {Object.entries(errors).map(([field, error]) =>
                            error && <li key={field}>{error}</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="fw-medium text-muted">Form Completion</span>
                      <span className="text-muted">
                        {Math.round((
                          (startDate ? 1 : 0) +
                          (endDate ? 1 : 0) +
                          (workSummary.working_type ? 1 : 0) +
                          (workSummary.price ? 1 : 0) +
                          (workSummary.quantity ? 1 : 0) +
                          (workSummary.payed_amount ? 1 : 0) +
                          (workSummary.payment_type ? 1 : 0)    
                        ) / 7 * 100)}%
                      </span>
                    </div>
                    <div className="progress" style={{height: '8px'}}>
                      <div 
                        className="progress-bar bg-primary transition-all"
                        role="progressbar"
                        style={{
                          width: `${Math.round((
                            (startDate ? 1 : 0) +
                            (endDate ? 1 : 0) +
                            (workSummary.working_type ? 1 : 0) +
                            (workSummary.price ? 1 : 0) +
                            (workSummary.quantity ? 1 : 0) +
                            (workSummary.payed_amount ? 1 : 0) +
                            (workSummary.payment_type ? 1 : 0)    
                          ) / 7 * 100)}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="text-center pt-3 border-top">
                    <button
                      type="button"
                      className={`btn btn-lg px-5 ${!isFormValid() || isSubmitting ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={handleSubmit}
                      disabled={!isFormValid() || isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                          {t('MSG.processing')}
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane me-2"></i>
                          {t('LABELS.submitAndSave')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Contract;