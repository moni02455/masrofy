import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wallet, TrendingDown, Calendar, Tag, Mic, Settings, Trash2, Edit2, Save,
  X, Plus, BarChart3, Download, Upload, Filter, Search, Moon, Sun,
  ChevronLeft, ChevronRight, Bell, LogOut, CreditCard, PieChart,
  DollarSign, TrendingUp, Home, User, Shield, Wifi, WifiOff
} from 'lucide-react';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [telegramToken, setTelegramToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'info' });
  const [budgetLimit, setBudgetLimit] = useState(5000);
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [darkMode, setDarkMode] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualAmount, setManualAmount] = useState('');
  const [manualCategory, setManualCategory] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [categories, setCategories] = useState(['طعام', 'مواصلات', 'فواتير', 'تسوق', 'ترفيه', 'صحة', 'تعليم']);
  const [activeTab, setActiveTab] = useState('overview');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [showTutorial, setShowTutorial] = useState(true);
  
  const pollInterval = useRef(null);
  const fileInputRef = useRef(null);

  // بيانات تجريبية للتطوير
  const sampleExpenses = [
    { id: 1, amount: 150, category: 'طعام', date: new Date(Date.now() - 86400000).toISOString(), source: 'manual', notes: 'وجبة غداء' },
    { id: 2, amount: 500, category: 'فواتير', date: new Date(Date.now() - 172800000).toISOString(), source: 'manual', notes: 'كهرباء' },
    { id: 3, amount: 200, category: 'مواصلات', date: new Date(Date.now() - 259200000).toISOString(), source: 'manual', notes: 'تاكسي' },
    { id: 4, amount: 1000, category: 'تسوق', date: new Date(Date.now() - 345600000).toISOString(), source: 'manual', notes: 'ملابس' },
    { id: 5, amount: 300, category: 'ترفيه', date: new Date(Date.now() - 432000000).toISOString(), source: 'manual', notes: 'سينما' },
  ];

  // إظهار الإشعارات
  const showNotification = useCallback((message, type = 'info') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'info' }), 3000);
  }, []);

  // تحميل البيانات من localStorage
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // تحميل البيانات من localStorage
      const savedExpenses = localStorage.getItem('expenses');
      const savedToken = localStorage.getItem('telegram_token');
      const savedChatId = localStorage.getItem('chat_id');
      const savedBudget = localStorage.getItem('budget_limit');
      const savedCategories = localStorage.getItem('categories');
      const savedTheme = localStorage.getItem('theme');
      const savedTutorial = localStorage.getItem('tutorial_shown');
      
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      } else {
        // استخدام بيانات تجريبية لأول مرة
        setExpenses(sampleExpenses);
        localStorage.setItem('expenses', JSON.stringify(sampleExpenses));
      }
      
      if (savedToken) {
        setTelegramToken(savedToken);
        setIsConfigured(true);
        setConnectionStatus('connected');
      }
      
      if (savedChatId) setChatId(savedChatId);
      if (savedBudget) setBudgetLimit(parseFloat(savedBudget));
      if (savedCategories) setCategories(JSON.parse(savedCategories));
      if (savedTheme === 'dark') setDarkMode(true);
      if (savedTutorial) setShowTutorial(false);
      
    } catch (error) {
      console.error('خطأ في تحميل البيانات:', error);
      showNotification('حدث خطأ في تحميل البيانات', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showNotification]);

  // حفظ البيانات في localStorage
  const saveToStorage = useCallback((key, value) => {
    try {
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('خطأ في حفظ البيانات:', error);
      showNotification('حدث خطأ في حفظ البيانات', 'error');
    }
  }, [showNotification]);

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    loadData();
  }, [loadData]);

  // تطبيق وضع الداكن/الفاتح
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveToStorage('theme', darkMode ? 'dark' : 'light');
  }, [darkMode, saveToStorage]);

  // حساب الإحصائيات
  const calculateStats = useCallback(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyExpenses = expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    });
    
    const dailyAverage = monthlyExpenses.length > 0 
      ? monthlyExpenses.reduce((sum, e) => sum + e.amount, 0) / monthlyExpenses.length 
      : 0;
    
    const highestExpense = expenses.length > 0 ? Math.max(...expenses.map(e => e.amount)) : 0;
    
    const categoryBreakdown = monthlyExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] || 0) + e.amount;
      return acc;
    }, {});
    
    const sortedCategories = Object.entries(categoryBreakdown)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
    
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      dailyAverage,
      highestExpense,
      monthlyTotal: monthlyExpenses.reduce((sum, e) => sum + e.amount, 0),
      categoryBreakdown: sortedCategories,
      totalExpenses,
      monthlyCount: monthlyExpenses.length,
      totalCount: expenses.length
    };
  }, [expenses]);

  const stats = calculateStats();

  // تصفية المصروفات
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = searchTerm === '' || 
      expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.amount.toString().includes(searchTerm) ||
      (expense.notes && expense.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || 
      expense.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  // استخراج المصروف من النص
  const extractExpenseFromText = useCallback((text) => {
    const patterns = [
      /صرفت?\s+(\d+(?:\.\d+)?)\s+(.+?)(?:\s+لـ)?(?:\s+(.+))?$/i,
      /دفعت?\s+(\d+(?:\.\d+)?)\s+(.+?)(?:\s+لـ)?(?:\s+(.+))?$/i,
      /اشتريت?\s+ب?(\d+(?:\.\d+)?)\s+(.+?)(?:\s+لـ)?(?:\s+(.+))?$/i,
      /(\d+(?:\.\d+)?)\s+دينار\s+(.+?)(?:\s+لـ)?(?:\s+(.+))?$/i,
      /(\d+(?:\.\d+)?)\s+د\.ج\s+(.+?)(?:\s+لـ)?(?:\s+(.+))?$/i,
      /(\d+(?:\.\d+)?)\s+(.+?)(?:\s+لـ)?(?:\s+(.+))?$/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1]);
        let category = match[2].trim();
        const notes = match[3] ? match[3].trim() : '';
        
        category = category.replace(/دينار|د\.ج|جنيه|ريال|درهم|على|في|من/gi, '').trim();
        
        if (amount > 0 && category) {
          return { amount, category, notes };
        }
      }
    }
    
    return null;
  }, []);

  // معالجة رسائل تلغرام
  const processTelegramMessage = useCallback(async (text) => {
    try {
      const expense = extractExpenseFromText(text);
      
      if (expense) {
        const newExpense = {
          id: Date.now(),
          amount: expense.amount,
          category: expense.category,
          date: new Date().toISOString(),
          source: 'telegram',
          notes: expense.notes
        };
        
        const updatedExpenses = [newExpense, ...expenses];
        setExpenses(updatedExpenses);
        saveToStorage('expenses', updatedExpenses);
        
        // إضافة فئة جديدة إذا كانت غير موجودة
        if (!categories.includes(expense.category)) {
          const newCategories = [...categories, expense.category];
          setCategories(newCategories);
          saveToStorage('categories', newCategories);
        }
        
        showNotification(`تم إضافة مصروف جديد: ${expense.amount} د.ج - ${expense.category}`, 'success');
        return true;
      }
      return false;
    } catch (error) {
      console.error('خطأ في معالجة الرسالة:', error);
      showNotification('حدث خطأ في معالجة الرسالة', 'error');
      return false;
    }
  }, [expenses, categories, extractExpenseFromText, showNotification, saveToStorage]);

  // بدء الاتصال بتلغرام
  const connectTelegram = useCallback(async () => {
    if (!telegramToken || !chatId) {
      showNotification('الرجاء إدخال التوكن ومعرف المحادثة', 'error');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // حفظ الإعدادات
      saveToStorage('telegram_token', telegramToken);
      saveToStorage('chat_id', chatId);
      
      setIsConfigured(true);
      setConnectionStatus('connected');
      setShowSettings(false);
      
      showNotification('تم الاتصال بتلغرام بنجاح!', 'success');
      
      // بدء استقبال الرسائل (محاكاة)
      setIsListening(true);
      setTimeout(() => setIsListening(false), 3000);
      
    } catch (error) {
      console.error('خطأ في الاتصال بتلغرام:', error);
      showNotification('حدث خطأ في الاتصال بتلغرام', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [telegramToken, chatId, showNotification, saveToStorage]);

  // قطع الاتصال بتلغرام
  const disconnectTelegram = useCallback(() => {
    localStorage.removeItem('telegram_token');
    localStorage.removeItem('chat_id');
    setTelegramToken('');
    setChatId('');
    setIsConfigured(false);
    setConnectionStatus('disconnected');
    showNotification('تم قطع الاتصال بتلغرام', 'info');
  }, [showNotification]);

  // إضافة مصروف يدوي
  const addManualExpense = useCallback(() => {
    if (!manualAmount || !manualCategory) {
      showNotification('الرجاء إدخال المبلغ والفئة', 'error');
      return;
    }
    
    try {
      const amount = parseFloat(manualAmount);
      if (isNaN(amount) || amount <= 0) {
        showNotification('المبلغ غير صالح', 'error');
        return;
      }
      
      const newExpense = {
        id: Date.now(),
        amount,
        category: manualCategory,
        date: new Date().toISOString(),
        source: 'manual',
        notes: manualNotes
      };
      
      const updatedExpenses = [newExpense, ...expenses];
      setExpenses(updatedExpenses);
      saveToStorage('expenses', updatedExpenses);
      
      // إضافة فئة جديدة إذا كانت غير موجودة
      if (!categories.includes(manualCategory)) {
        const newCategories = [...categories, manualCategory];
        setCategories(newCategories);
        saveToStorage('categories', newCategories);
      }
      
      showNotification('تم إضافة المصروف بنجاح', 'success');
      setManualAmount('');
      setManualCategory('');
      setManualNotes('');
      setShowAddManual(false);
      
    } catch (error) {
      console.error('خطأ في إضافة المصروف:', error);
      showNotification('حدث خطأ في إضافة المصروف', 'error');
    }
  }, [manualAmount, manualCategory, manualNotes, expenses, categories, showNotification, saveToStorage]);

  // حذف مصروف
  const deleteExpense = useCallback((id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveToStorage('expenses', updated);
    showNotification('تم حذف المصروف بنجاح', 'success');
  }, [expenses, showNotification, saveToStorage]);

  // بدء تعديل مصروف
  const startEdit = useCallback((expense) => {
    setEditingId(expense.id);
    setEditAmount(expense.amount.toString());
    setEditCategory(expense.category);
    setEditNotes(expense.notes || '');
  }, []);

  // حفظ التعديل
  const saveEdit = useCallback(() => {
    const updated = expenses.map(e => 
      e.id === editingId 
        ? { ...e, 
            amount: parseFloat(editAmount) || 0, 
            category: editCategory,
            notes: editNotes 
          }
        : e
    );
    setExpenses(updated);
    saveToStorage('expenses', updated);
    setEditingId(null);
    showNotification('تم تحديث المصروف بنجاح', 'success');
  }, [editingId, editAmount, editCategory, editNotes, expenses, showNotification, saveToStorage]);

  // إلغاء التعديل
  const cancelEdit = useCallback(() => {
    setEditingId(null);
  }, []);

  // تصدير البيانات
  const exportData = useCallback(() => {
    try {
      const dataStr = JSON.stringify(expenses, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `مصروفات_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      showNotification('تم تصدير البيانات بنجاح', 'success');
    } catch (error) {
      console.error('خطأ في تصدير البيانات:', error);
      showNotification('حدث خطأ في تصدير البيانات', 'error');
    }
  }, [expenses, showNotification]);

  // استيراد البيانات
  const importData = useCallback((event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          if (Array.isArray(importedData)) {
            const updatedExpenses = [...importedData, ...expenses];
            setExpenses(updatedExpenses);
            saveToStorage('expenses', updatedExpenses);
            showNotification('تم استيراد البيانات بنجاح', 'success');
          } else {
            showNotification('صيغة الملف غير صحيحة', 'error');
          }
        } catch (error) {
          console.error('خطأ في قراءة الملف:', error);
          showNotification('خطأ في قراءة الملف', 'error');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('خطأ في استيراد البيانات:', error);
      showNotification('حدث خطأ في استيراد البيانات', 'error');
    }
  }, [expenses, showNotification, saveToStorage]);

  // مسح جميع البيانات
  const resetData = useCallback(() => {
    if (!window.confirm('هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    
    try {
      setExpenses([]);
      saveToStorage('expenses', []);
      showNotification('تم مسح جميع البيانات بنجاح', 'success');
    } catch (error) {
      console.error('خطأ في مسح البيانات:', error);
      showNotification('حدث خطأ في مسح البيانات', 'error');
    }
  }, [showNotification, saveToStorage]);

  // إضافة فئة جديدة
  const addCategory = useCallback((category) => {
    if (!category.trim() || categories.includes(category.trim())) return;
    
    const newCategories = [...categories, category.trim()];
    setCategories(newCategories);
    saveToStorage('categories', newCategories);
    showNotification('تم إضافة الفئة بنجاح', 'success');
  }, [categories, showNotification, saveToStorage]);

  // حذف فئة
  const removeCategory = useCallback((category) => {
    const newCategories = categories.filter(c => c !== category);
    setCategories(newCategories);
    saveToStorage('categories', newCategories);
    showNotification('تم حذف الفئة بنجاح', 'success');
  }, [categories, showNotification, saveToStorage]);

  // تغيير وضع الداكن/الفاتح
  const toggleDarkMode = useCallback(() => {
    setDarkMode(!darkMode);
  }, [darkMode]);

  // إغلاق التعليمات
  const closeTutorial = useCallback(() => {
    setShowTutorial(false);
    saveToStorage('tutorial_shown', 'true');
  }, [saveToStorage]);

  // حساب الميزانية المتبقية
  const remainingBudget = budgetLimit - stats.monthlyTotal;
  const budgetPercentage = budgetLimit > 0 ? (stats.monthlyTotal / budgetLimit) * 100 : 0;

  // عرض حالة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''} bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300`}>
      {/* الإشعارات */}
      {notification.show && (
        <div className={`notification notification-${notification.type} animate-slide-in`}>
          {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {notification.type === 'error' && <XCircle className="w-5 h-5" />}
          {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
          {notification.type === 'info' && <Info className="w-5 h-5" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* التعليمات للمرة الأولى */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">مرحباً بك في نظام المصروفات الذكي! 🎉</h2>
                <button onClick={closeTutorial} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">✨ المميزات الرئيسية:</h3>
                  <ul className="text-blue-800 dark:text-blue-200 space-y-2">
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>تتبع المصروفات بشكل يومي</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>الاتصال بتلغرام لإضافة مصروفات صوتية</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>تقارير وتحليلات مفصلة</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>ميزانية شهرية مع تنبيهات</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>تصدير واستيراد البيانات</span>
                    </li>
                  </ul>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-4">
                    <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">📱 إضافة مصروفات:</h4>
                    <p className="text-green-800 dark:text-green-200 text-sm">
                      استخدم زر "+ إضافة مصروف" أو اتصل بتلغرام وأرسل رسالة مثل: "صرفت 150 بطاطس"
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/30 rounded-xl p-4">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">📊 التقارير:</h4>
                    <p className="text-purple-800 dark:text-purple-200 text-sm">
                      تابع إحصائياتك الشهرية وتوزيع المصروفات على الفئات المختلفة
                    </p>
                  </div>
                </div>
                
                <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-xl p-4">
                  <h4 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">🔧 الإعدادات:</h4>
                  <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                    اضبط الميزانية الشهرية، أضف فئات جديدة، وغير الوضع الداكن/الفاتح من أيقونة الإعدادات
                  </p>
                </div>
                
                <button
                  onClick={closeTutorial}
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 transition"
                >
                  بدء الاستخدام
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* الهيدر */}
        <header className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6 fade-in">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  نظام المصروفات الذكي
                </h1>
                <p className="text-gray-600 dark:text-gray-300">إدارة وتتبع مصروفاتك في مكان واحد</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={toggleDarkMode}
                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                title={darkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <button
                onClick={() => setShowAddManual(true)}
                className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition flex items-center gap-2"
                title="إضافة مصروف"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden md:inline">إضافة مصروف</span>
              </button>
              
              <button
                onClick={exportData}
                className="p-3 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800 transition flex items-center gap-2"
                title="تصدير البيانات"
              >
                <Download className="w-5 h-5" />
                <span className="hidden md:inline">تصدير</span>
              </button>
              
              <label className="p-3 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-xl hover:bg-green-200 dark:hover:bg-green-800 transition flex items-center gap-2 cursor-pointer"
                     title="استيراد البيانات">
                <Upload className="w-5 h-5" />
                <span className="hidden md:inline">استيراد</span>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={importData} 
                  className="hidden" 
                  ref={fileInputRef}
                />
              </label>
              
              <button
                onClick={() => setShowSettings(true)}
                className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                title="الإعدادات"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* حالة الاتصال */}
          <div className="mt-6 flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
              connectionStatus === 'connected' 
                ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400' 
                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
            }`}>
              {connectionStatus === 'connected' ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm font-medium">متصل بتلغرام</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">غير متصل بتلغرام</span>
                </>
              )}
            </div>
            
            {isListening && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                <Mic className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">جاري الاستماع...</span>
              </div>
            )}
          </div>
          
          {/* شريط البحث والتصفية */}
          <div className="mt-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="ابحث عن مصروف..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input w-full pr-12"
              />
              <Search className="absolute right-4 top-3.5 w-5 h-5 text-gray-400" />
            </div>
            
            <div className="flex gap-4">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="input"
              >
                <option value="all">جميع الفئات</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <select
                value={activeMonth}
                onChange={(e) => setActiveMonth(parseInt(e.target.value))}
                className="input"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>
                    {new Date(0, i).toLocaleString('ar-DZ', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* التبويبات */}
          <div className="mt-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex space-x-4">
              {['overview', 'expenses', 'analytics', 'budget'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-4 font-medium text-sm border-b-2 transition ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab === 'overview' && 'نظرة عامة'}
                  {tab === 'expenses' && 'المصروفات'}
                  {tab === 'analytics' && 'تحليلات'}
                  {tab === 'budget' && 'الميزانية'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* المحتوى حسب التبويب */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* بطاقات الإحصائيات */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <TrendingDown className="w-6 h-6 text-red-500 dark:text-red-400" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">إجمالي المصروفات</span>
                </div>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.monthlyTotal.toFixed(2)} د.ج</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">هذا الشهر</p>
              </div>
              
              <div className="card hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-500 dark:text-blue-400" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">المتوسط اليومي</span>
                </div>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.dailyAverage.toFixed(2)} د.ج</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{stats.monthlyCount} مصروف</p>
              </div>
              
              <div className="card hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Tag className="w-6 h-6 text-purple-500 dark:text-purple-400" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">أعلى مصروف</span>
                </div>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{stats.highestExpense.toFixed(2)} د.ج</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">أعلى مبلغ تم إنفاقه</p>
              </div>
              
              <div className="card hover:shadow-xl transition-all duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-green-500 dark:text-green-400" />
                  </div>
                  <span className="text-gray-600 dark:text-gray-300">الميزانية المتبقية</span>
                </div>
                <p className="text-3xl font-bold text-gray-800 dark:text-white">{Math.max(0, remainingBudget).toFixed(2)} د.ج</p>
                <div className="mt-2">
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${
                        budgetPercentage > 90 ? 'bg-red-500' :
                        budgetPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-left">
                    {Math.round(budgetPercentage)}% من الميزانية
                  </p>
                </div>
              </div>
            </div>

            {/* فئات المصروفات */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="card h-full">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    توزيع المصروفات حسب الفئة
                  </h2>
                  <div className="space-y-4">
                    {stats.categoryBreakdown.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400 text-center py-8">لا توجد مصروفات هذا الشهر</p>
                    ) : (
                      stats.categoryBreakdown.map(({ category, total }) => {
                        const percentage = stats.monthlyTotal > 0 ? (total / stats.monthlyTotal) * 100 : 0;
                        return (
                          <div key={category} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-gray-700 dark:text-gray-300">{category}</span>
                              <span className="font-bold text-gray-800 dark:text-white">{total.toFixed(2)} د.ج</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className="progress-fill bg-gradient-to-r from-indigo-500 to-purple-500"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-left">
                              {percentage.toFixed(1)}% من إجمالي المصروفات
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* إرشادات سريعة */}
                <div className="card">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3">💡 كيفية إضافة مصروف:</h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                      <span>اضغط على زر "+ إضافة مصروف"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                      <span>أو اتصل بتلغرام وأرسل:</span>
                    </li>
                    <li className="pr-4">
                      <code className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-lg text-sm block mt-1">
                        صرفت 150 بطاطس
                      </code>
                    </li>
                  </ul>
                </div>
                
                {/* آخر المصروفات */}
                <div className="card">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-3">آخر المصروفات</h3>
                  <div className="space-y-3">
                    {expenses.slice(0, 3).map(expense => (
                      <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">{expense.category}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(expense.date).toLocaleDateString('ar-DZ', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        <span className="font-bold text-gray-800 dark:text-white">{expense.amount.toFixed(2)} د.ج</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                سجل المصروفات
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({filteredExpenses.length} مصروف)
                </span>
              </h2>
              
              <div className="flex gap-2">
                <button
                  onClick={resetData}
                  className="px-4 py-2 text-sm bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition"
                >
                  مسح الكل
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 font-semibold">الفئة</th>
                    <th className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 font-semibold">المبلغ</th>
                    <th className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 font-semibold">التاريخ</th>
                    <th className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 font-semibold">الملاحظات</th>
                    <th className="py-3 px-4 text-right text-gray-600 dark:text-gray-400 font-semibold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-12 text-center">
                        <div className="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                          <Wallet className="w-full h-full opacity-50" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">لا توجد مصروفات بعد</p>
                        <button
                          onClick={() => setShowAddManual(true)}
                          className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition"
                        >
                          أضف مصروفك الأول
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(expense => (
                      <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        {editingId === expense.id ? (
                          <>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                                className="input w-full"
                                list="categories-list-edit"
                              />
                              <datalist id="categories-list-edit">
                                {categories.map(cat => (
                                  <option key={cat} value={cat} />
                                ))}
                              </datalist>
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                className="input w-full"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="datetime-local"
                                value={new Date(expense.date).toISOString().slice(0, 16)}
                                onChange={(e) => {
                                  const updated = expenses.map(e => 
                                    e.id === expense.id 
                                      ? { ...e, date: new Date(e.target.value).toISOString() }
                                      : e
                                  );
                                  setExpenses(updated);
                                }}
                                className="input w-full"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="input w-full"
                                placeholder="أضف ملاحظات"
                              />
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={saveEdit}
                                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/50 rounded-lg"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700 dark:text-gray-300">{expense.category}</span>
                                {expense.source === 'telegram' && (
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full">
                                    تلغرام
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-gray-800 dark:text-white">{expense.amount.toFixed(2)} د.ج</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-600 dark:text-gray-300">
                                {new Date(expense.date).toLocaleDateString('ar-DZ', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-gray-500 dark:text-gray-400 text-sm">{expense.notes || '-'}</span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEdit(expense)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg"
                                  title="تعديل"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteExpense(expense.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg"
                                  title="حذف"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredExpenses.length > 10 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  عرض {Math.min(10, filteredExpenses.length)} من {filteredExpenses.length} مصروف
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* تحليل شهري */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">📈 تحليل المصروفات الشهري</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">المصروفات حسب الأشهر</h3>
                  <div className="space-y-4">
                    {Array.from({ length: 6 }, (_, i) => {
                      const month = new Date();
                      month.setMonth(month.getMonth() - i);
                      const monthExpenses = expenses.filter(exp => {
                        const expDate = new Date(exp.date);
                        return expDate.getMonth() === month.getMonth() && 
                               expDate.getFullYear() === month.getFullYear();
                      });
                      const total = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
                      
                      return (
                        <div key={i} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">
                              {month.toLocaleDateString('ar-DZ', { month: 'long', year: 'numeric' })}
                            </span>
                            <span className="font-bold text-gray-800 dark:text-white">{total.toFixed(2)} د.ج</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-fill bg-gradient-to-r from-blue-500 to-purple-500"
                              style={{ width: `${(total / (stats.monthlyTotal * 2)) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    }).reverse()}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">إحصائيات عامة</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-300">إجمالي المصروفات</span>
                      <span className="font-bold text-gray-800 dark:text-white">{stats.totalExpenses.toFixed(2)} د.ج</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-300">عدد المصروفات</span>
                      <span className="font-bold text-gray-800 dark:text-white">{stats.totalCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-300">أعلى مصروف</span>
                      <span className="font-bold text-gray-800 dark:text-white">{stats.highestExpense.toFixed(2)} د.ج</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-300">متوسط المصروف</span>
                      <span className="font-bold text-gray-800 dark:text-white">
                        {stats.totalCount > 0 ? (stats.totalExpenses / stats.totalCount).toFixed(2) : '0.00'} د.ج
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* تحليل الفئات */}
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">📊 تحليل الفئات</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {stats.categoryBreakdown.slice(0, 4).map(({ category, total }) => {
                  const percentage = stats.monthlyTotal > 0 ? (total / stats.monthlyTotal) * 100 : 0;
                  return (
                    <div key={category} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{category}</h3>
                        <span className="font-bold text-gray-800 dark:text-white">{total.toFixed(2)} د.ج</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-left">
                        {percentage.toFixed(1)}% من مصروفات الشهر
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'budget' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">💰 إدارة الميزانية</h2>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white">
                  <h3 className="font-semibold mb-2">الميزانية الشهرية</h3>
                  <p className="text-3xl font-bold">{budgetLimit.toFixed(2)} د.ج</p>
                  <p className="text-sm opacity-90 mt-2">الحد الأقصى للإنفاق الشهري</p>
                </div>
                
                <div className="p-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl text-white">
                  <h3 className="font-semibold mb-2">المصروفات الفعلية</h3>
                  <p className="text-3xl font-bold">{stats.monthlyTotal.toFixed(2)} د.ج</p>
                  <p className="text-sm opacity-90 mt-2">{stats.monthlyCount} مصروف هذا الشهر</p>
                </div>
                
                <div className={`p-6 rounded-xl text-white ${
                  remainingBudget >= 0 
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500' 
                    : 'bg-gradient-to-r from-red-500 to-pink-500'
                }`}>
                  <h3 className="font-semibold mb-2">الميزانية المتبقية</h3>
                  <p className="text-3xl font-bold">{remainingBudget.toFixed(2)} د.ج</p>
                  <p className="text-sm opacity-90 mt-2">
                    {remainingBudget >= 0 ? 'متبقي' : 'تجاوز بمقدان'} {Math.abs(remainingBudget).toFixed(2)} د.ج
                  </p>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">تقدم الميزانية</h3>
                <div className="relative">
                  <div className="progress-bar h-6 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        budgetPercentage > 90 ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                        budgetPercentage > 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                        'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}
                      style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">0%</span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {Math.round(budgetPercentage)}%
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">100%</span>
                  </div>
                </div>
                
                {budgetPercentage >= 80 && (
                  <div className={`mt-4 p-4 rounded-lg ${
                    budgetPercentage >= 90 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200' 
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      <span className="font-semibold">تنبيه!</span>
                    </div>
                    <p className="mt-1 text-sm">
                      {budgetPercentage >= 90 
                        ? 'تجاوزت الميزانية الشهرية! قم بمراجعة مصروفاتك.' 
                        : 'اقتربت من الحد الأقصى للميزانية الشهرية.'}
                    </p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">تعديل الميزانية</h3>
                <div className="flex gap-4">
                  <input
                    type="number"
                    value={budgetLimit}
                    onChange={(e) => {
                      setBudgetLimit(parseFloat(e.target.value) || 0);
                      saveToStorage('budget_limit', e.target.value);
                    }}
                    className="input flex-1"
                    placeholder="أدخل الميزانية الشهرية"
                  />
                  <button
                    onClick={() => {
                      saveToStorage('budget_limit', budgetLimit.toString());
                      showNotification('تم تحديث الميزانية بنجاح', 'success');
                    }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    تحديث
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* نافذة إضافة مصروف يدوي */}
      {showAddManual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">إضافة مصروف جديد</h3>
                <button
                  onClick={() => setShowAddManual(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المبلغ (د.ج)
                  </label>
                  <input
                    type="number"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="input w-full"
                    placeholder="أدخل المبلغ"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الفئة
                  </label>
                  <div className="flex gap-2 mb-2 flex-wrap">
                    {categories.slice(0, 6).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setManualCategory(cat)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition ${
                          manualCategory === cat
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="input w-full"
                    placeholder="أدخل فئة جديدة أو اختر من الأعلى"
                    list="categories-suggestions"
                  />
                  <datalist id="categories-suggestions">
                    {categories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ملاحظات (اختياري)
                  </label>
                  <textarea
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    className="input w-full resize-none"
                    rows="3"
                    placeholder="أضف ملاحظات عن المصروف..."
                  />
                </div>
              </div>
              
              <div className="mt-8 flex gap-3">
                <button
                  onClick={() => setShowAddManual(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  إلغاء
                </button>
                <button
                  onClick={addManualExpense}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  حفظ المصروف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* نافذة الإعدادات */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl my-8">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">الإعدادات</h2>
                <button 
                  onClick={() => setShowSettings(false)} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-8">
                {/* إعدادات تلغرام */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">
                    إعدادات تلغرام
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Telegram Bot Token
                      </label>
                      <input
                        type="password"
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        placeholder="أدخل توكن البوت"
                        className="input w-full font-mono"
                        dir="ltr"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        احصل على التوكن من @BotFather في تلغرام
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Chat ID
                      </label>
                      <input
                        type="text"
                        value={chatId}
                        onChange={(e) => setChatId(e.target.value)}
                        placeholder="أدخل معرف المحادثة"
                        className="input w-full"
                        dir="ltr"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        احصل على المعرف من @userinfobot في تلغرام
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">📝 مثال للاستخدام:</h4>
                      <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                        <p>1. أرسل رسالة نصية للبوت:</p>
                        <code className="block bg-blue-100 dark:bg-blue-800 px-3 py-2 rounded-lg mt-1">
                          صرفت 150 بطاطس
                        </code>
                        <p>2. أو:</p>
                        <code className="block bg-blue-100 dark:bg-blue-800 px-3 py-2 rounded-lg mt-1">
                          دفعت 500 فواتير كهرباء
                        </code>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={connectTelegram}
                        disabled={!telegramToken || !chatId}
                        className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isConfigured ? 'تحديث الاتصال' : 'الاتصال بتلغرام'}
                      </button>
                      
                      {isConfigured && (
                        <button
                          onClick={disconnectTelegram}
                          className="px-6 py-3 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        >
                          قطع الاتصال
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* إدارة الفئات */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">
                    إدارة الفئات
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      {categories.map((category) => (
                        <div key={category} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          <span className="text-gray-700 dark:text-gray-300">{category}</span>
                          <button
                            onClick={() => removeCategory(category)}
                            className="text-red-500 hover:text-red-700 transition"
                            title="حذف الفئة"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        id="new-category"
                        placeholder="أدخل فئة جديدة"
                        className="input flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && e.target.value.trim()) {
                            addCategory(e.target.value.trim());
                            e.target.value = '';
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById('new-category');
                          if (input.value.trim()) {
                            addCategory(input.value.trim());
                            input.value = '';
                          }
                        }}
                        className="px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                      >
                        إضافة
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* إعدادات عامة */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">
                    إعدادات عامة
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">الوضع الداكن</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">تغيير مظهر التطبيق</p>
                      </div>
                      <button
                        onClick={toggleDarkMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                          darkMode ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            darkMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300">إظهار التعليمات</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">عرض شاشة الترحيب عند الدخول</p>
                      </div>
                      <button
                        onClick={() => {
                          setShowTutorial(true);
                          localStorage.removeItem('tutorial_shown');
                        }}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                      >
                        عرض
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* إجراءات النظام */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 pb-2 border-b dark:border-gray-700">
                    إجراءات النظام
                  </h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={exportData}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-blue-500" />
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">تصدير البيانات</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">حفظ جميع المصروفات كملف JSON</p>
                        </div>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Upload className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium text-gray-700 dark:text-gray-300">استيراد البيانات</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">تحميل مصروفات من ملف JSON</p>
                        </div>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    
                    <button
                      onClick={resetData}
                      className="w-full flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                    >
                      <div className="flex items-center gap-3">
                        <Trash2 className="w-5 h-5 text-red-500" />
                        <div>
                          <p className="font-medium text-red-600 dark:text-red-400">مسح جميع البيانات</p>
                          <p className="text-sm text-red-500 dark:text-red-400">حذف جميع المصروفات والإعدادات</p>
                        </div>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* الفوتر */}
      <footer className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm pb-6">
        <p>نظام تتبع المصروفات الذكي © {new Date().getFullYear()} | تم التطوير باستخدام React</p>
        <p className="mt-1">جميع البيانات محفوظة محلياً على جهازك</p>
      </footer>
    </div>
  );
};

// مكونات إضافية من lucide-react
const CheckCircle = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const XCircle = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const AlertTriangle = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const Info = (props) => (
  <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

export default ExpenseTracker;
