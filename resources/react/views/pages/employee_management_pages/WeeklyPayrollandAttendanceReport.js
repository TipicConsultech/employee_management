import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  CContainer,
  CRow,
  CCol,
  CCard,
  CCardHeader,
  CCardBody,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormInput,
  CButton,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CSpinner,
  CAlert,
} from '@coreui/react';
import { cilCloudDownload, cilCalendar, cilSpreadsheet, cilInput, cilCash, cilPlus } from '@coreui/icons';
import CIcon from '@coreui/icons-react';
import { getAPICall, post } from '../../../util/api';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import html2pdf from 'html2pdf.js';

const styles = `
  .table-container {
    max-height: 500px;
    overflow-y: auto;
    position: relative;
    width: 100%;
  }
  .table-responsive {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    width: 100%;
  }
  .sticky-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: auto;
  }
  .sticky-table thead {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: #343a40;
    color: white;
  }
  .sticky-table th {
    position: sticky;
    top: 0;
    z-index: 10;
    background-color: #343a40;
    color: white;
    border: 1px solid #dee2e6;
    padding: 8px;
    text-align: center;
    vertical-align: middle;
  }
  .sticky-table th.serial-no-column,
  .sticky-table th.employee-name-column {
    position: sticky;
    left: 0;
    z-index: 12;
    background-color: #343a40;
    color: white;
  }
  .sticky-table th.serial-no-column {
    left: 0;
  }
  .sticky-table th.employee-name-column {
    left: 50px;
  }
  .sticky-table td.serial-no-column,
  .sticky-table td.employee-name-column {
    position: sticky;
    z-index: 5;
    background-color: white;
  }
  .sticky-table td.serial-no-column {
    left: 0;
  }
  .sticky-table td.employee-name-column {
    left: 50px;
  }
  .sticky-table tr.bg-light td.serial-no-column,
  .sticky-table tr.bg-light td.employee-name-column {
    background-color: #f8f9fa;
  }
  .sticky-table td {
    border: 1px solid #dee2e6;
    padding: 8px;
    text-align: center;
    vertical-align: middle;
  }
  .serial-no-column {
    width: 50px !important;
    max-width: 50px !important;
    min-width: 50px !important;
  }
  .employee-name-column {
    width: 150px !important;
    min-width: 150px !important;
  }
  .payment-column {
    width: 100px !important;
    min-width: 100px !important;
    max-width: 100px !important;
  }
  .payment-column .btn {
    padding: 4px 8px;
    font-size: 0.875rem;
    white-space: nowrap;
    width: 100%;
    box-sizing: border-box;
  }
  .status-ha-hp {
    background-color: #ffe6e6 !important;
  }
  .header-ha-hp {
    color: #dc3545 !important;
  }
  @media (max-width: 767.98px) {
    .table-responsive {
      width: 100%;
    }
    .serial-no-column {
      width: 40px !important;
      max-width: 40px !important;
      min-width: 40px !important;
    }
    .employee-name-column {
      width: 120px !important;
      min-width: 120px !important;
    }
    .payment-column {
      width: 80px !important;
      max-width: 80px !important;
      min-width: 80px !important;
    }
    .payment-column .btn {
      padding: 3px 6px;
      font-size: 0.75rem;
    }
    .sticky-table th.employee-name-column {
      left: 40px;
    }
    .sticky-table td.employee-name-column {
      left: 40px;
    }
    .sticky-table {
      table-layout: auto;
    }
  }
  @media (max-width: 576px) {
    .sticky-table th, .sticky-table td {
      font-size: 0.8rem;
      padding: 6px;
    }
    .serial-no-column {
      width: 30px !important;
      max-width: 30px !important;
      min-width: 30px !important;
    }
    .employee-name-column {
      width: 100px !important;
      min-width: 100px !important;
    }
    .payment-column {
      width: 70px !important;
      max-width: 70px !important;
      min-width: 70px !important;
    }
    .payment-column .btn {
      padding: 2px 4px;
      font-size: 0.7rem;
      line-height: 1.2;
    }
    .sticky-table th.employee-name-column {
      left: 30px;
    }
    .sticky-table td.employee-name-column {
      left: 30px;
    }
  }
  .pdf-content {
    font-family: 'Noto Sans Devanagari', 'Arial', sans-serif;
    font-size: 12px;
    width: 100%;
    padding: 20px;
    box-sizing: border-box;
  }
  .pdf-content h1 {
    font-size: 16px;
    margin-bottom: 10px;
  }
  .pdf-content h2 {
    font-size: 14px;
    margin: 10px 0;
  }
  .pdf-content table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  .pdf-content th, .pdf-content td {
    border: 1px solid #dee2e6;
    padding: 8px;
    text-align: center;
  }
  .pdf-content th {
    background-color: #343a40;
    color: white;
  }
  .pdf-content th.header-ha-hp {
    color: #dc3545 !important;
  }
  .pdf-content tr:nth-child(even) {
    background-color: #f8f9fa;
  }
  .pdf-content .badge {
    display: inline-block;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
  }
  .pdf-content .bg-success {
    background-color: #28a745;
    color: white;
  }
  .pdf-content .bg-danger {
    background-color: #dc3545;
    color: white;
  }
  .pdf-content .bg-warning {
    background-color: #ffc107;
    color: black;
  }
  .pdf-content .bg-secondary {
    background-color: #6c757d;
    color: white;
  }
`;

const WeeklyMonthlyPresentyPayroll = () => {
  const { t } = useTranslation("global");
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('');
  const [selectedWeekDay, setSelectedWeekDay] = useState('MONDAY');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const currentDate = new Date();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    return monthNames[currentDate.getMonth()];
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [weekDates, setWeekDates] = useState([]);
  const [monthlyWeeks, setMonthlyWeeks] = useState([]);
  const [hasFetchedData, setHasFetchedData] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const tableRef = useRef(null);
  const pdfContentRef = useRef(null);

  const showNotification = useCallback((type, message) => {
    setNotification({ show: true, type, message });
    if (type === 'success') {
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
    }
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setShowInstallButton(true);
      console.log('beforeinstallprompt event captured');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Handle app installation
  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
        setShowInstallButton(false);
      });
    } else {
      showNotification('warning', t('MSG.installPromptNotAvailable'));
    }
  };

  const reportTypes = [
    { value: 'weekly', label: t('LABELS.weeklyReport') },
    { value: 'monthly', label: t('LABELS.monthlyReport') }
  ];

  const weekDays = [
    { value: 'MONDAY', label: t('LABELS.monday') },
    { value: 'TUESDAY', label: t('LABELS.tuesday') },
    { value: 'WEDNESDAY', label: t('LABELS.wednesday') },
    { value: 'THURSDAY', label: t('LABELS.thursday') },
    { value: 'FRIDAY', label: t('LABELS.friday') },
    { value: 'SATURDAY', label: t('LABELS.saturday') },
    { value: 'SUNDAY', label: t('LABELS.sunday') }
  ];

  const months = [
    { value: 'January', label: t('LABELS.january') },
    { value: 'February', label: t('LABELS.february') },
    { value: 'March', label: t('LABELS.march') },
    { value: 'April', label: t('LABELS.april') },
    { value: 'May', label: t('LABELS.may') },
    { value: 'June', label: t('LABELS.june') },
    { value: 'July', label: t('LABELS.july') },
    { value: 'August', label: t('LABELS.august') },
    { value: 'September', label: t('LABELS.september') },
    { value: 'October', label: t('LABELS.october') },
    { value: 'November', label: t('LABELS.november') },
    { value: 'December', label: t('LABELS.december') }
  ];

  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear - 5; year <= currentYear + 1; year++) {
    years.push({ value: year.toString(), label: year.toString() });
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '-');
  };

  const getWeekDates = (startDate, selectedWeekDay) => {
    if (!startDate) return [];
    const dates = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  async function getWeekDay() {
    const result = await getAPICall('/api/weekStartDay');
    setSelectedWeekDay(result.start_of_week);
  }

  useEffect(() => {
    getWeekDay();
  }, []);

  const getWeekFromDate = (dateString, weekStartDay) => {
    if (!dateString || !weekStartDay) return { start: '', end: '' };
    const selectedDate = new Date(dateString);
    const dayOfWeek = selectedDate.getDay();

    const weekDayMap = {
      'SUNDAY': 0,
      'MONDAY': 1,
      'TUESDAY': 2,
      'WEDNESDAY': 3,
      'THURSDAY': 4,
      'FRIDAY': 5,
      'SATURDAY': 6
    };
    const targetDay = weekDayMap[weekStartDay];
    let daysToSubtract = (dayOfWeek - targetDay + 7) % 7;

    const weekStart = new Date(selectedDate);
    weekStart.setDate(selectedDate.getDate() - daysToSubtract);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0]
    };
  };

const getMonthDates = (monthStart, monthEnd) => {
  if (!monthStart || !monthEnd) return [];
  const dates = [];
  const start = new Date(monthStart);
  const end = new Date(monthEnd);

  // Use getTime() for more reliable comparison
  for (let date = new Date(start); date.getTime() <= end.getTime(); date.setDate(date.getDate() + 1)) {
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates;
};

  const getMonthlyWeeks = (monthStart, monthEnd, weekStartDay) => {
    if (!monthStart || !monthEnd || !weekStartDay) return [];
    const weeks = [];
    const startDate = new Date(monthStart);
    const endDate = new Date(monthEnd);

    const weekDayMap = {
      'SUNDAY': 0,
      'MONDAY': 1,
      'TUESDAY': 2,
      'WEDNESDAY': 3,
      'THURSDAY': 4,
      'FRIDAY': 5,
      'SATURDAY': 6
    };

    const targetDay = weekDayMap[weekStartDay];
    let currentWeekStart = new Date(startDate);
    const dayOfWeek = currentWeekStart.getDay();
    let daysToSubtract = (dayOfWeek - targetDay + 7) % 7;

    currentWeekStart.setDate(currentWeekStart.getDate() - daysToSubtract);

    while (currentWeekStart <= endDate) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);

      const weekDates = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(currentWeekStart.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        if (date >= startDate && date <= endDate) {
          weekDates.push(dateString);
        }
      }

      if (weekDates.length > 0) {
        weeks.push({
          start: weekDates[0],
          end: weekDates[weekDates.length - 1],
          dates: weekDates
        });
      }

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }
    return weeks;
  };

  const handleReportTypeChange = (e) => {
    const type = e.target.value;
    setReportType(type);
    setSelectedWeek('');
    setStartDate('');
    setEndDate('');

    if (type !== 'monthly') {
      setSelectedMonth('');
    } else if (!selectedMonth) {
      const currentDate = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
      setSelectedMonth(monthNames[currentDate.getMonth()]);
    }

    setEmployeeData([]);
    setWeekDates([]);
    setMonthlyWeeks([]);
    setHasFetchedData(false);
    setNotification({ show: false, type: '', message: '' });
  };

  const handleWeekDayChange = (e) => {
    const weekDay = e.target.value;
    setSelectedWeekDay(weekDay);
    setSelectedWeek('');
    setStartDate('');
    setEndDate('');
    setWeekDates([]);
    setNotification({ show: false, type: '', message: '' });
  };

  const handleWeekChange = (e) => {
    const selectedDate = e.target.value;
    if (!selectedWeekDay) {
      showNotification('warning', t('MSG.pleaseSelectWeekdayFirst'));
      return;
    }
    setNotification({ show: false, type: '', message: '' });
    setSelectedWeek(selectedDate);
    const weekRange = getWeekFromDate(selectedDate, selectedWeekDay);
    setStartDate(weekRange.start);
    setEndDate(weekRange.end);
    setWeekDates(getWeekDates(weekRange.start, selectedWeekDay));
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    setNotification({ show: false, type: '', message: '' });
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setNotification({ show: false, type: '', message: '' });
  };

  const handleGetEmployeeData = async () => {
    if (reportType === 'weekly') {
      if (!selectedWeek || !selectedWeekDay) {
        showNotification('warning', t('MSG.pleaseSelectWeekAndDate'));
        return;
      }
    } else if (reportType === 'monthly') {
      if (!selectedMonth || !selectedYear) {
        showNotification('warning', t('MSG.pleaseSelectMonthAndYear'));
        return;
      }
    } else {
      showNotification('warning', t('MSG.pleaseSelectReportType'));
      return;
    }

    setLoading(true);
    setNotification({ show: false, type: '', message: '' });

    try {
      let response;
      let weekStart, weekEnd;

      if (reportType === 'weekly') {
        response = await post('/api/weeklyPresenty', {
          date: selectedWeek,
          week_start_day: selectedWeekDay
        });

        if (response.data && response.data.week_start && response.data.week_end) {
          weekStart = response.data.week_start;
          weekEnd = response.data.week_end;
        } else {
          const weekRange = getWeekFromDate(selectedWeek, selectedWeekDay);
          weekStart = weekRange.start;
          weekEnd = weekRange.end;
        }

        setWeekDates(getWeekDates(weekStart, selectedWeekDay));
        setStartDate(weekStart);
        setEndDate(weekEnd);
      } else {
        response = await post('/api/monthlyPresenty', {
          month: selectedMonth,
          year: selectedYear
        });

        let monthStart, monthEnd;
        if (response.data && response.data.month_start && response.data.month_end) {
          monthStart = response.data.month_start;
          monthEnd = response.data.month_end;
        } else {
          const monthIndex = months.findIndex(m => m.value.toLowerCase() === selectedMonth.toLowerCase());
          const year = parseInt(selectedYear);
          monthStart = `${selectedYear}-${(monthIndex + 1).toString().padStart(2, '0')}-01`;
          // Get last day of the month properly
          const lastDay = new Date(year, monthIndex + 1, 0).getDate();
          monthEnd = `${selectedYear}-${(monthIndex + 1).toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
        }

        const monthDates = getMonthDates(monthStart, monthEnd);
        setWeekDates(monthDates);
        setStartDate(monthStart);
        setEndDate(monthEnd);
        const weeks = getMonthlyWeeks(monthStart, monthEnd, selectedWeekDay);
        setMonthlyWeeks(weeks);
      }

      const employees = response.data.data || response.data.employees || response.data;
      if (Array.isArray(employees) && employees.length > 0) {
        const validEmployees = employees.filter(employee => employee && typeof employee === 'object' && employee.employee_id);
        setEmployeeData(validEmployees);
        setHasFetchedData(true);
        if (validEmployees.length === 0) {
          showNotification('warning', t('MSG.noEmployeeDataAvailable'));
        } else {
          showNotification('success', t('MSG.employeeDataFetchedSuccess'));
        }
      } else {
        setEmployeeData([]);
        showNotification('warning', t('MSG.noEmployeeDataAvailable'));
      }
    } catch (err) {
      console.error('API Error:', err);
      showNotification('warning', `${t('MSG.errorConnectingToServer')}: ${err.message}`);
      setEmployeeData([]);
      setWeekDates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetchedData) {
      if (reportType === 'weekly' && selectedWeek && selectedWeekDay) {
        handleGetEmployeeData();
      } else if (reportType === 'monthly' && selectedMonth && selectedYear) {
        handleGetEmployeeData();
      }
    }
  }, [reportType, selectedWeek, selectedWeekDay, selectedMonth, selectedYear, hasFetchedData]);

  const calculateTotalDays = (attendance) => {
    if (!attendance) return 0;
    return Object.values(attendance).filter(day => day?.status === 'P' || day?.status === 'HP').length;
  };

  const calculateOvertimeHours = (attendance, overtimeType) => {
    if (!attendance) return 0;
    const type = overtimeType ? String(overtimeType).trim().toLowerCase() : 'not available';
    let totalOvertime = 0;

    if (type === 'fixed') {
      totalOvertime = Object.values(attendance).reduce((total, day) => {
        if (day?.status === 'H' && day?.holiday_overtime_hour != null && day?.holiday_overtime_hour !== 0) {
          return total + (day.holiday_overtime_hour > 0 ? 1 : -1);
        }
        return total + (day?.overtime_hours != null && day?.overtime_hours !== 0 ? (day.overtime_hours > 0 ? 1 : -1) : 0);
      }, 0);
    } else {
      totalOvertime = Object.values(attendance).reduce((total, day) => {
        if (day?.status === 'H') {
          return total + (day?.holiday_overtime_hour || 0);
        }
        return total + (day?.overtime_hours || 0);
      }, 0);
      totalOvertime = Math.round(totalOvertime);
    }
    return totalOvertime;
  };

  const calculateTotalAmount = (employee) => {
    if (!employee || !employee.attendance || !employee.payment_details) return 0;

    const { regular_day_payment = 0, half_day_payment = 0, holiday_payment = 0 } = employee.payment_details;
    const overtimeType = employee.overtime_type ? String(employee.overtime_type).trim().toLowerCase() : 'not available';
    const overtimeRate = employee.wage_overtime || 0;

    const totalRegularDays = calculateTotalDays(employee.attendance);
    const regularPayment = totalRegularDays * (employee.wage_hour || 0);

    let overtimePayment = 0;
    if (overtimeType === 'fixed') {
      const overtimeDays = calculateOvertimeHours(employee.attendance, overtimeType);
      overtimePayment = overtimeDays * overtimeRate;
    } else if (overtimeType === 'hourly') {
      const overtimeHours = calculateOvertimeHours(employee.attendance, overtimeType);
      overtimePayment = overtimeHours * overtimeRate;
    }

    return regularPayment + overtimePayment + half_day_payment + holiday_payment;
  };

  const getOvertimeDisplay = (employee, date) => {
    if (!employee || !employee.attendance) {
      return '-';
    }
    const attendance = employee.attendance[date];
    const overtimeType = employee.overtime_type ? String(employee.overtime_type).trim().toLowerCase() : 'not available';

    if (attendance?.status === 'H') {
      const holidayOvertimeHours = attendance?.holiday_overtime_hour != null ? attendance.holiday_overtime_hour : 0;
      if (overtimeType === 'hourly') {
        return holidayOvertimeHours !== 0 ? `${holidayOvertimeHours}h` : '-';
      } else if (overtimeType === 'fixed') {
        return holidayOvertimeHours !== 0 ? `${holidayOvertimeHours > 0 ? '1' : '-1'} D` : '-';
      }
    } else {
      const overtimeHours = attendance?.overtime_hours != null ? attendance.overtime_hours : 0;
      if (overtimeType === 'hourly') {
        return overtimeHours !== 0 ? `${overtimeHours}h` : '-';
      } else if (overtimeType === 'fixed') {
        return overtimeHours !== 0 ? `${overtimeHours > 0 ? '1' : '-1'} D` : '-';
      }
    }
    return '-';
  };

  const getOvertimeTypeLabel = (overtimeType) => {
    const type = overtimeType ? String(overtimeType).trim().toLowerCase() : 'not available';
    switch (type) {
      case 'hourly':
        return <span className="badge bg-primary">{t('LABELS.hourly')}</span>;
      case 'fixed':
        return <span className="badge bg-success">{t('LABELS.fixed')}</span>;
      case 'not available':
        return <span className="badge bg-secondary">{t('LABELS.na')}</span>;
      default:
        return <span className="badge bg-secondary">{t('LABELS.na')}</span>;
    }
  };

  const exportToPDF = () => {
    const element = pdfContentRef.current;
    const fileName = reportType === 'weekly'
      ? `weekly-presenty-${startDate}-to-${endDate}.pdf`
      : `monthly-presenty-${selectedMonth}-${selectedYear}.pdf`;

    const fontUrl = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;700&display=swap';
    const link = document.createElement('link');
    link.href = fontUrl;
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      document.head.removeChild(link);
      showNotification('success', t('MSG.pdfExportedSuccess'));
    });
  };

  const exportToCSV = () => {
    const headers = [
      t('LABELS.serialNo'),
      t('LABELS.employeeName'),
      ...weekDates.map(date => new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
      })),
      t('LABELS.totalDays'),
      t('LABELS.oTRate'),
      t('LABELS.overtimeHours'),
      t('LABELS.dayRate'),
      t('LABELS.holidayRate'),
      t('LABELS.halfDayRate'),
      t('LABELS.totalAmount')
    ];

    const csvData = [];

    const title = reportType === 'weekly'
      ? t('LABELS.weeklyPresentyPayrollChart')
      : t('LABELS.monthlyPresentyPayrollChart');
    csvData.push([title]);

    const dateRange = reportType === 'weekly'
      ? `${t('LABELS.week')}: ${formatDate(startDate)} ${t('LABELS.to')} ${formatDate(endDate)}`
      : `${t('LABELS.month')}: ${selectedMonth} ${selectedYear}`;
    csvData.push([dateRange]);

    csvData.push([]);

    csvData.push(headers);

    employeeData.forEach((employee, index) => {
      const mainRow = [
        index + 1,
        `${employee.employee_name || 'Unknown'} `,
        ...weekDates.map(date => {
          const attendance = employee.attendance && employee.attendance[date];
          if (!attendance) return '-';
          if (attendance.status === 'HA') return 'A';
          if (attendance.status === 'HP') return 'P';
          return attendance.status || '-';
        }),
        calculateTotalDays(employee.attendance),
        employee.wage_overtime || 0,
        calculateOvertimeHours(employee.attendance, employee.overtime_type),
        employee.wage_hour || 0,
        employee.holiday_day_rate || 0,
        employee.half_day_rate || 0,
        calculateTotalAmount(employee),
        '',
      ];
      csvData.push(mainRow);

      const overtimeRow = [
        '',
        `${t('LABELS.overTime')} (${employee.overtime_type ? employee.overtime_type : 'N/A'})`,
        ...weekDates.map(date => getOvertimeDisplay(employee, date)),
        '', '', '', '', '', '', '',
      ];
      csvData.push(overtimeRow);
    });

    const csvString = csvData.map(row =>
      row.map(cell => {
        let cellString = String(cell);
        if (cellString.includes(',') || cellString.includes('\n') || cellString.includes('"')) {
          cellString = `"${cellString.replace(/"/g, '""')}"`;
        }
        return cellString;
      }).join(',')
    ).join('\r\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);

      const fileName = reportType === 'weekly'
        ? `weekly-presenty-${startDate}-to-${endDate}.csv`
        : `monthly-presenty-${selectedMonth}-${selectedYear}.csv`;

      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    showNotification('success', t('MSG.csvExportedSuccess'));
  };

  const getDateRangeDisplay = () => {
    if (reportType === 'weekly' && startDate && endDate) {
      return `${formatDate(startDate)} ${t('LABELS.to')} ${formatDate(endDate)}`;
    } else if (reportType === 'monthly' && selectedMonth && selectedYear) {
      return `${selectedMonth} ${selectedYear}`;
    }
    return '';
  };

  const hasHaOrHpStatus = (date) => {
    return employeeData.some(employee => {
      const attendance = employee.attendance && employee.attendance[date];
      return attendance && (attendance.status === 'HA' || attendance.status === 'HP');
    });
  };

  if (loading && employeeData.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <CSpinner color="primary" />
      </div>
    );
  }

  return (
    <CContainer fluid>
      <style>{styles}</style>
      <CRow className="mb-2">
        <CCol>
          <CCard className="mb-2 shadow-sm">
            <CCardHeader style={{ backgroundColor: "#E6E6FA" }}>
              <strong>{t('LABELS.selectReportParameters')}</strong>
            </CCardHeader>

            {notification.show && (
              <CAlert
                color={notification.type}
                dismissible
                onClose={() => setNotification({ show: false, type: '', message: '' })}
              >
                {notification.message}
              </CAlert>
            )}

            <CCardBody>
              <CForm>
                <CRow className="mb-3">
                  <CCol md={4}>
                    <CFormLabel htmlFor="reportType">{t('LABELS.selectReportType')}</CFormLabel>
                    <CFormSelect
                      id="reportType"
                      value={reportType}
                      onChange={handleReportTypeChange}
                    >
                      <option value="">{t('LABELS.chooseReportType')}</option>
                      {reportTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                </CRow>

                {reportType === 'weekly' && (
                  <CRow className="mb-3">
                    <CCol md={4}>
                      <CFormLabel htmlFor="weekDay">{t('LABELS.selectWeekStartingDay')}</CFormLabel>
                      <CFormSelect
                        id="weekDay"
                        value={selectedWeekDay}
                        onChange={handleWeekDayChange}
                        disabled
                      >
                        {weekDays.map(day => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel htmlFor="weekPicker">{t('LABELS.selectAnyDateInWeek')}</CFormLabel>
                      <CFormInput
                        type="date"
                        id="weekPicker"
                        value={selectedWeek}
                        onChange={handleWeekChange}
                      />
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel htmlFor="weekRange">{t('LABELS.weekRange')}</CFormLabel>
                      <CFormInput
                        type="text"
                        id="weekRange"
                        value={startDate && endDate ? `${formatDate(startDate)} ${t('LABELS.to')} ${formatDate(endDate)}` : ''}
                        disabled
                        readOnly
                      />
                    </CCol>
                  </CRow>
                )}

                {reportType === 'monthly' && (
                  <CRow className="mb-3">
                    <CCol md={4}>
                      <CFormLabel htmlFor="monthSelect">{t('LABELS.selectMonth')}</CFormLabel>
                      <CFormSelect
                        id="monthSelect"
                        value={selectedMonth}
                        onChange={handleMonthChange}
                      >
                        <option value="">{t('LABELS.chooseMonth')}</option>
                        {months.map(month => (
                          <option key={month.value} value={month.value}>
                            {month.label}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                    <CCol md={4}>
                      <CFormLabel htmlFor="yearSelect">{t('LABELS.selectYear')}</CFormLabel>
                      <CFormSelect
                        id="yearSelect"
                        value={selectedYear}
                        onChange={handleYearChange}
                      >
                        {years.map(year => (
                          <option key={year.value} value={year.value}>
                            {year.label}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                  </CRow>
                )}

                <CRow>
                  <CCol className="d-flex gap-2">
                    <CButton
                      color="primary"
                      onClick={handleGetEmployeeData}
                      disabled={!reportType || loading}
                    >
                      {loading ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilCalendar} className="me-2" />}
                      {t('LABELS.getEmployeesData')}
                    </CButton>
                    {employeeData.length > 0 && (
                      <>
                        <CButton
                          color="success"
                          onClick={exportToPDF}
                          disabled={loading}
                          className="me-2"
                        >
                          <CIcon icon={cilCloudDownload} className="me-2" />
                          {t('LABELS.exportToPDF')}
                        </CButton>
                        <CButton
                          color="info"
                          onClick={exportToCSV}
                          disabled={loading}
                        >
                          <CIcon icon={cilSpreadsheet} className="me-2" />
                          {t('LABELS.exportToCSV')}
                        </CButton>
                      </>
                    )}
                    {/* {showInstallButton && (
                      <CButton
                        color="warning"
                        onClick={handleInstallClick}
                        disabled={loading}
                      >
                        <CIcon icon={cilPlus} className="me-2" />
                        {t('LABELS.installApp')}
                      </CButton>
                    )} */}
                  </CCol>
                </CRow>
              </CForm>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {employeeData.length > 0 && weekDates.length > 0 && (
        <>
          <CRow>
            <CCol>
              <CCard className="shadow-sm">
                <CCardHeader style={{ backgroundColor: "#E6E6FA" }} className="d-flex justify-content-between align-items-center flex-wrap">
                  <strong>{t('LABELS.employeeAttendancePayrollReport')}</strong>
                  <small className="text-muted">
                    {reportType === 'weekly' && `${t('LABELS.week')}: `}
                    {reportType === 'monthly' && `${t('LABELS.month')}: `}
                    {getDateRangeDisplay()}
                  </small>
                </CCardHeader>
                <CCardBody>
                  <div className="table-responsive">
                    <div className="table-container" ref={tableRef}>
                      <CTable className="sticky-table" striped bordered hover>
                        <CTableHead color="dark">
                          <CTableRow>
                            <CTableHeaderCell rowSpan="2" className="text-center align-middle serial-no-column">
                              {t('LABELS.serialNo')}
                            </CTableHeaderCell>
                            <CTableHeaderCell rowSpan="2" className="text-center align-middle employee-name-column">
                              {t('LABELS.employeeName')}
                            </CTableHeaderCell>
                            <CTableHeaderCell colSpan={weekDates.length} className="text-center">
                              {(reportType === 'weekly' ? t('LABELS.weekDays') : t('LABELS.monthDays'))}
                            </CTableHeaderCell>
                            <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                              {t('LABELS.totalDays')}
                            </CTableHeaderCell>
                            <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                              {t('LABELS.oTRate')}
                            </CTableHeaderCell>
                            <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                              {t('LABELS.overtimeHours')}
                            </CTableHeaderCell>
                            <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                              {t('LABELS.dayRate')}
                            </CTableHeaderCell>
                            <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                              {t('LABELS.holidayRate')}
                            </CTableHeaderCell>
                            <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                              {t('LABELS.halfDayRate')}
                            </CTableHeaderCell>
                            <CTableHeaderCell rowSpan="2" className="text-center align-middle">
                              {t('LABELS.totalAmount')}
                            </CTableHeaderCell>
                            <CTableHeaderCell rowSpan="2" className="text-center align-middle payment-column">
                              {t('LABELS.payment')}
                            </CTableHeaderCell>
                          </CTableRow>
                          <CTableRow>
                            {weekDates.map((date, index) => (
                              <CTableHeaderCell
                                key={index}
                                className={`text-center ${hasHaOrHpStatus(date) ? 'header-ha-hp' : ''}`}
                              >
                                {new Date(date).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                })}
                              </CTableHeaderCell>
                            ))}
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {employeeData.map((employee, index) => (
                            <React.Fragment key={employee.employee_id || index}>
                              <CTableRow>
                                <CTableDataCell className="text-center serial-no-column" rowSpan="2">{index + 1}</CTableDataCell>
                                <CTableDataCell className="employee-name-column">
                                  <div>{employee.employee_name || 'Unknown'}</div>
                                </CTableDataCell>
                                {weekDates.map((date, dateIndex) => {
                                  const attendance = employee.attendance && employee.attendance[date];
                                  const currentDate = new Date();
                                  const cellDate = new Date(date);
                                  const isFutureDate = cellDate > currentDate;
                                  let status = isFutureDate ? '-' : (attendance?.status || '-');
                                  if (status === 'HA') status = 'A';
                                  if (status === 'HP') status = 'P';
                                  const isHaOrHp = attendance?.status === 'HA' || attendance?.status === 'HP';
                                  return (
                                    <CTableDataCell
                                      key={dateIndex}
                                      className={`text-center ${isHaOrHp ? 'status-ha-hp' : ''}`}
                                    >
                                      <span className={`badge ${
                                        status === 'P' ? 'bg-success' :
                                        status === 'A' ? 'bg-danger' :
                                        status === 'HF' ? 'bg-warning' :
                                        status === 'H' ? 'bg-secondary' : 'bg-secondary'
                                      }`}>
                                        {status}
                                      </span>
                                    </CTableDataCell>
                                  );
                                })}
                                <CTableDataCell className="text-center" rowSpan="2">
                                  {calculateTotalDays(employee.attendance)}
                                </CTableDataCell>
                                <CTableDataCell className="text-center" rowSpan="2">
                                  ₹{employee.wage_overtime || 0}
                                </CTableDataCell>
                                <CTableDataCell className="text-center" rowSpan="2">
                                  {calculateOvertimeHours(employee.attendance, employee.overtime_type)}
                                </CTableDataCell>
                                <CTableDataCell className="text-center" rowSpan="2">
                                  ₹{employee.wage_hour || 0}
                                </CTableDataCell>
                                <CTableDataCell className="text-center" rowSpan="2">
                                  ₹{employee.holiday_day_rate || 0}
                                </CTableDataCell>
                                <CTableDataCell className="text-center" rowSpan="2">
                                  ₹{employee.half_day_rate || 0}
                                </CTableDataCell>
                                <CTableDataCell className="text-center font-weight-bold" rowSpan="2">
                                  ₹{calculateTotalAmount(employee)}
                                </CTableDataCell>
                                <CTableDataCell className="text-center payment-column" rowSpan="2">
                                  <CButton
                                    size="sm"
                                    color="primary"
                                    variant="outline"
                                    onClick={() => navigate(`/employees/workhistory/${employee.employee_id}`)}
                                  >
                                    <span className="d-flex align-items-center gap-1">
                                      <CIcon icon={cilCash} />
                                      {t('LABELS.payment')}
                                    </span>
                                  </CButton>
                                </CTableDataCell>
                              </CTableRow>
                              <CTableRow className="bg-light">
                                <CTableDataCell className="small text-muted employee-name-column">
                                  <span className="d-inline">
                                    {t('LABELS.overTime')}
                                  </span>
                                  <span className="ms-1 d-inline">
                                    {getOvertimeTypeLabel(employee.overtime_type)}
                                  </span>
                                </CTableDataCell>
                                {weekDates.map((date, dateIndex) => (
                                  <CTableDataCell key={dateIndex} className="text-center small text-muted">
                                    {getOvertimeDisplay(employee, date)}
                                  </CTableDataCell>
                                ))}
                              </CTableRow>
                            </React.Fragment>
                          ))}
                        </CTableBody>
                      </CTable>
                    </div>
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          <div style={{ display: 'none' }}>
            <div className="pdf-content" ref={pdfContentRef}>
              <h1>
                {reportType === 'weekly'
                  ? t('LABELS.weeklyPresentyPayrollChart')
                  : t('LABELS.monthlyPresentyPayrollChart')}
              </h1>
              <p>
                {reportType === 'weekly'
                  ? `${t('LABELS.week')}: ${formatDate(startDate)} ${t('LABELS.to')} ${formatDate(endDate)}`
                  : `${t('LABELS.month')}: ${selectedMonth} ${selectedYear}`}
              </p>
              {reportType === 'weekly' ? (
                <table>
                  <thead>
                    <tr>
                      <th>{t('LABELS.serialNo')}</th>
                      <th>{t('LABELS.employeeName')}</th>
                      {weekDates.map((date, index) => (
                        <th key={index} className={hasHaOrHpStatus(date) ? 'header-ha-hp' : ''}>
                          {new Date(date).toLocaleDateString('en-GB', { day: '2-digit' })}
                        </th>
                      ))}
                      <th>{t('LABELS.totalDays')}</th>
                      <th>{t('LABELS.oTRate')}</th>
                      <th>{t('LABELS.overtimeHours')}</th>
                      <th>{t('LABELS.dayRate')}</th>
                      <th>{t('LABELS.holidayRate')}</th>
                      <th>{t('LABELS.halfDayRate')}</th>
                      <th>{t('LABELS.totalAmount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeData.map((employee, index) => (
                      <React.Fragment key={employee.employee_id || index}>
                        <tr>
                          <td>{index + 1}</td>
                          <td>{employee.employee_name || 'Unknown'}</td>
                          {weekDates.map((date, dateIndex) => {
                            const attendance = employee.attendance && employee.attendance[date];
                            let status = attendance?.status || '-';
                            if (status === 'HA') status = 'A';
                            if (status === 'HP') status = 'P';
                            return (
                              <td key={dateIndex}>
                                <span className={`badge ${
                                  status === 'P' ? 'bg-success' :
                                  status === 'A' ? 'bg-danger' :
                                  status === 'HF' ? 'bg-warning' :
                                  status === 'H' ? 'bg-secondary' : 'bg-secondary'
                                }`}>
                                  {status}
                                </span>
                              </td>
                            );
                          })}
                          <td>{calculateTotalDays(employee.attendance)}</td>
                          <td>₹{employee.wage_overtime || 0}</td>
                          <td>{calculateOvertimeHours(employee.attendance, employee.overtime_type)}</td>
                          <td>₹{employee.wage_hour || 0}</td>
                          <td>₹{employee.holiday_day_rate || 0}</td>
                          <td>₹{employee.half_day_rate || 0}</td>
                          <td>₹{calculateTotalAmount(employee)}</td>
                        </tr>
                        <tr>
                          <td></td>
                          <td>
                          {t('LABELS.overTime')}&nbsp;
                          {employee.overtime_type === 'not_available'
                            ? t('LABELS.na')
                            : `(${t(employee.overtime_type === 'hourly' ? 'LABELS.hourly' : 'LABELS.fixed')})`}
                        </td>


                          {weekDates.map((date, dateIndex) => (
                            <td key={dateIndex}>{getOvertimeDisplay(employee, date)}</td>
                          ))}
                          <td colSpan="6"></td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              ) : (
                monthlyWeeks.map((week, weekIndex) => (
                  <React.Fragment key={weekIndex}>
                    <h2>{t('LABELS.week')} {weekIndex + 1}: {formatDate(week.start)} {t('LABELS.to')} {formatDate(week.end)}</h2>
                    <table>
                      <thead>
                        <tr>
                          <th>{t('LABELS.serialNo')}</th>
                          <th>{t('LABELS.employeeName')}</th>
                          {week.dates.map((date, index) => (
                            <th key={index} className={hasHaOrHpStatus(date) ? 'header-ha-hp' : ''}>
                              {new Date(date).toLocaleDateString('en-GB', { day: '2-digit' })}
                            </th>
                          ))}
                          <th>{t('LABELS.totalDays')}</th>
                          <th>{t('LABELS.oTRate')}</th>
                          <th>{t('LABELS.overtimeHours')}</th>
                          <th>{t('LABELS.dayRate')}</th>
                          <th>{t('LABELS.holidayRate')}</th>
                          <th>{t('LABELS.halfDayRate')}</th>
                          <th>{t('LABELS.totalAmount')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employeeData.map((employee, index) => (
                          <React.Fragment key={employee.employee_id || index}>
                            <tr>
                              <td>{index + 1}</td>
                              <td>{employee.employee_name || 'Unknown'} ({employee.overtime_type || 'N/A'})</td>
                              {week.dates.map((date, dateIndex) => {
                                const attendance = employee.attendance && employee.attendance[date];
                                let status = attendance?.status || '-';
                                if (status === 'HA') status = 'A';
                                if (status === 'HP') status = 'P';
                                return (
                                  <td key={dateIndex}>
                                    <span className={`badge ${
                                      status === 'P' ? 'bg-success' :
                                      status === 'A' ? 'bg-danger' :
                                      status === 'HF' ? 'bg-warning' :
                                      status === 'H' ? 'bg-secondary' : 'bg-secondary'
                                    }`}>
                                      {status}
                                    </span>
                                  </td>
                                );
                              })}
                              <td>{calculateTotalDays(employee.attendance)}</td>
                              <td>₹{employee.wage_overtime || 0}</td>
                              <td>{calculateOvertimeHours(employee.attendance, employee.overtime_type)}</td>
                              <td>₹{employee.wage_hour || 0}</td>
                              <td>₹{employee.holiday_day_rate || 0}</td>
                              <td>₹{employee.half_day_rate || 0}</td>
                              <td>₹{calculateTotalAmount(employee)}</td>
                            </tr>
                            <tr>
                              <td></td>
                              <td>{t('LABELS.overTime')} ({employee.overtime_type || 'N/A'})</td>
                              {week.dates.map((date, dateIndex) => (
                                <td key={dateIndex}>{getOvertimeDisplay(employee, date)}</td>
                              ))}
                              <td colSpan="6"></td>
                            </tr>
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </React.Fragment>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </CContainer>
  );
};

export default WeeklyMonthlyPresentyPayroll;
