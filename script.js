// نظام المصروفات الذكي مع تلغرام
class ExpenseTracker {
    constructor() {
        this.expenses = [];
        this.categories = ['طعام', 'مواصلات', 'فواتير', 'تسوق', 'ترفيه'];
        this.settings = {
            darkMode: false,
            monthlyBudget: 5000,
            telegram: {
                botToken: '',
                chatId: '',
                connected: false
            }
        };
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.render();
        this.updateStats();
        this.checkTelegramConnection();
    }
    
    loadData() {
        try {
            const savedExpenses = localStorage.getItem('expenses');
            const savedCategories = localStorage.getItem('categories');
            const savedSettings = localStorage.getItem('settings');
            
            if (savedExpenses) {
                this.expenses = JSON.parse(savedExpenses);
            }
            
            if (savedCategories) {
                this.categories = JSON.parse(savedCategories);
            }
            
            if (savedSettings) {
                const parsedSettings = JSON.parse(savedSettings);
                this.settings = { ...this.settings, ...parsedSettings };
            }
            
            // تطبيق الوضع الداكن
            if (this.settings.darkMode) {
                document.body.classList.add('dark');
            }
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
        }
    }
    
    saveData() {
        try {
            localStorage.setItem('expenses', JSON.stringify(this.expenses));
            localStorage.setItem('categories', JSON.stringify(this.categories));
            localStorage.setItem('settings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
        }
    }
    
    setupEventListeners() {
        // تأخير التنفيذ حتى يكون DOM جاهزاً
        setTimeout(() => {
            // شاشة الترحيب
            const startBtn = document.getElementById('start-btn');
            if (startBtn) {
                startBtn.addEventListener('click', () => {
                    document.getElementById('welcome-screen').style.display = 'none';
                    document.getElementById('app').classList.remove('hidden');
                });
            }
            
            // إضافة مصروف سريع
            const quickAddBtn = document.getElementById('quick-add-btn');
            if (quickAddBtn) {
                quickAddBtn.addEventListener('click', () => {
                    this.addQuickExpense();
                });
            }
            
            // إضافة مصروف من الهيدر
            const addExpenseBtn = document.getElementById('add-expense-btn-header');
            if (addExpenseBtn) {
                addExpenseBtn.addEventListener('click', () => {
                    this.openExpenseModal();
                });
            }
            
            // ربط تلغرام
            const telegramBtn = document.getElementById('telegram-btn');
            if (telegramBtn) {
                telegramBtn.addEventListener('click', () => {
                    this.openTelegramModal();
                });
            }
            
            const connectTelegramBtn = document.getElementById('connect-telegram-btn');
            if (connectTelegramBtn) {
                connectTelegramBtn.addEventListener('click', () => {
                    this.openTelegramModal();
                });
            }
            
            // حفظ إعدادات تلغرام
            const saveTelegramBtn = document.getElementById('save-telegram-btn');
            if (saveTelegramBtn) {
                saveTelegramBtn.addEventListener('click', () => {
                    this.saveTelegramSettings();
                });
            }
            
            // قطع اتصال تلغرام
            const disconnectTelegramBtn = document.getElementById('disconnect-telegram-btn');
            if (disconnectTelegramBtn) {
                disconnectTelegramBtn.addEventListener('click', () => {
                    this.disconnectTelegram();
                });
            }
            
            // اختبار الاتصال
            const testConnectionBtn = document.getElementById('test-connection-btn');
            if (testConnectionBtn) {
                testConnectionBtn.addEventListener('click', () => {
                    this.testTelegramConnection();
                });
            }
            
            // إغلاق النوافذ
            document.querySelectorAll('.close-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const modal = e.target.closest('[data-modal]');
                    if (modal) {
                        const modalName = modal.dataset.modal;
                        this.closeModal(modalName);
                    }
                });
            });
            
            // الوضع الداكن
            const themeToggle = document.getElementById('theme-toggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    this.toggleDarkMode();
                });
            }
            
            // إضافة مصروف كامل
            const expenseForm = document.getElementById('expense-form');
            if (expenseForm) {
                expenseForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveExpense();
                });
            }
            
            // تحديث السنة
            const currentYear = document.getElementById('current-year');
            if (currentYear) {
                currentYear.textContent = new Date().getFullYear();
            }
            
            // اختيار الفئات
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const category = e.target.dataset.category;
                    document.getElementById('custom-category').value = category;
                    
                    // إضافة تأثير التحديد
                    document.querySelectorAll('.category-btn').forEach(b => {
                        b.classList.remove('active');
                    });
                    e.target.classList.add('active');
                });
            });
            
            // اختبار اتصال عند الضغط على Enter في حقول تلغرام
            const botTokenInput = document.getElementById('bot-token');
            const chatIdInput = document.getElementById('chat-id');
            
            if (botTokenInput && chatIdInput) {
                const handleEnterKey = (e) => {
                    if (e.key === 'Enter') {
                        this.testTelegramConnection();
                    }
                };
                
                botTokenInput.addEventListener('keypress', handleEnterKey);
                chatIdInput.addEventListener('keypress', handleEnterKey);
            }
            
        }, 100); // تأخير 100ms للتأكد من تحميل DOM
    }
    
    // ==================== إدارة المصروفات ====================
    
    addQuickExpense() {
        const amountInput = document.getElementById('quick-amount');
        const categorySelect = document.getElementById('quick-category');
        const notesInput = document.getElementById('quick-notes');
        
        if (!amountInput || !categorySelect) return;
        
        const amount = parseFloat(amountInput.value);
        const category = categorySelect.value;
        const notes = notesInput ? notesInput.value : '';
        
        if (!amount || amount <= 0) {
            this.showNotification('الرجاء إدخال مبلغ صحيح', 'error');
            return;
        }
        
        if (!category) {
            this.showNotification('الرجاء اختيار فئة', 'error');
            return;
        }
        
        const newExpense = {
            id: Date.now(),
            amount,
            category,
            date: new Date().toISOString(),
            notes,
            source: 'manual'
        };
        
        this.expenses.unshift(newExpense);
        this.saveData();
        this.render();
        this.updateStats();
        
        amountInput.value = '';
        categorySelect.value = '';
        if (notesInput) notesInput.value = '';
        
        this.showNotification('تم إضافة المصروف بنجاح', 'success');
    }
    
    openExpenseModal() {
        const modal = document.getElementById('expense-modal');
        if (modal) {
            modal.classList.remove('hidden');
            const dateInput = document.getElementById('date');
            if (dateInput) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
            
            // إلغاء تحديد أي فئة
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }
    }
    
    saveExpense() {
        const amountInput = document.getElementById('amount');
        const categoryInput = document.getElementById('custom-category');
        const dateInput = document.getElementById('date');
        const notesInput = document.getElementById('notes');
        
        if (!amountInput || !dateInput) return;
        
        const amount = parseFloat(amountInput.value);
        let category = categoryInput ? categoryInput.value.trim() : '';
        
        // إذا كان حقل الفئة فارغاً، تحقق من الأزرار المحددة
        if (!category) {
            const activeBtn = document.querySelector('.category-btn.active');
            if (activeBtn) {
                category = activeBtn.dataset.category;
            }
        }
        
        const date = dateInput.value;
        const notes = notesInput ? notesInput.value : '';
        
        if (!amount || amount <= 0) {
            this.showNotification('الرجاء إدخال مبلغ صحيح', 'error');
            return;
        }
        
        if (!category) {
            this.showNotification('الرجاء إدخال أو اختيار فئة', 'error');
            return;
        }
        
        // إضافة الفئة إذا كانت جديدة
        if (!this.categories.includes(category)) {
            this.categories.push(category);
        }
        
        const newExpense = {
            id: Date.now(),
            amount,
            category,
            date: new Date(date).toISOString(),
            notes,
            source: 'manual'
        };
        
        this.expenses.unshift(newExpense);
        this.saveData();
        this.render();
        this.updateStats();
        this.closeModal('expense');
        
        this.showNotification('تم إضافة المصروف بنجاح', 'success');
    }
    
    render() {
        this.renderRecentExpenses();
        this.renderCategoriesChart();
    }
    
    renderRecentExpenses() {
        const container = document.getElementById('recent-expenses');
        if (!container) return;
        
        const recentExpenses = this.getRecentExpenses(5);
        
        if (recentExpenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-wallet"></i>
                    <p>لا توجد مصروفات بعد</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        recentExpenses.forEach(expense => {
            const date = new Date(expense.date);
            const formattedDate = date.toLocaleDateString('ar-DZ', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            
            const sourceIcon = expense.source === 'telegram' 
                ? '<i class="fab fa-telegram"></i>' 
                : '<i class="fas fa-user"></i>';
            
            html += `
                <div class="expense-item" style="border-right-color: ${this.getCategoryColor(expense.category)}">
                    <div>
                        <div class="expense-category">
                            ${expense.category} 
                            <span style="font-size: 0.75rem; opacity: 0.7">${sourceIcon}</span>
                        </div>
                        <div class="expense-date">${formattedDate}</div>
                        ${expense.notes ? `<div style="font-size: 0.875rem; color: var(--gray-600); margin-top: 4px;">${expense.notes}</div>` : ''}
                    </div>
                    <div class="expense-amount">${expense.amount.toFixed(2)} د.ج</div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    renderCategoriesChart() {
        const container = document.getElementById('categories-chart');
        if (!container) return;
        
        const monthlyExpenses = this.getMonthlyExpenses();
        
        if (monthlyExpenses.length === 0) {
            container.innerHTML = '<p class="empty-message">لا توجد مصروفات هذا الشهر</p>';
            return;
        }
        
        const categoryTotals = {};
        monthlyExpenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });
        
        const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
        
        let html = '';
        Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .forEach(([category, amount]) => {
                const percentage = total > 0 ? (amount / total) * 100 : 0;
                
                html += `
                    <div style="margin-bottom: 16px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                            <span style="font-weight: 600; color: ${this.getCategoryColor(category)}">
                                ${category}
                            </span>
                            <span style="font-weight: 600;">${amount.toFixed(2)} د.ج</span>
                        </div>
                        <div style="height: 8px; background: var(--gray-200); border-radius: 4px; overflow: hidden;">
                            <div style="height: 100%; width: ${percentage}%; background: ${this.getCategoryColor(category)}; border-radius: 4px;"></div>
                        </div>
                        <div style="font-size: 0.75rem; color: var(--gray-500); margin-top: 4px; text-align: left;">
                            ${percentage.toFixed(1)}%
                        </div>
                    </div>
                `;
            });
        
        container.innerHTML = html;
    }
    
    updateStats() {
        const monthlyExpenses = this.getMonthlyExpenses();
        const total = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const count = monthlyExpenses.length;
        const categoriesCount = new Set(monthlyExpenses.map(exp => exp.category)).size;
        const dailyAverage = count > 0 ? total / 30 : 0;
        
        const totalEl = document.getElementById('total-expenses');
        const countEl = document.getElementById('expenses-count');
        const categoriesEl = document.getElementById('categories-count');
        const averageEl = document.getElementById('daily-average');
        
        if (totalEl) totalEl.textContent = `${total.toFixed(2)} د.ج`;
        if (countEl) countEl.textContent = count;
        if (categoriesEl) categoriesEl.textContent = categoriesCount;
        if (averageEl) averageEl.textContent = `${dailyAverage.toFixed(2)} د.ج`;
    }
    
    getMonthlyExpenses() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return (
                expenseDate.getMonth() === currentMonth &&
                expenseDate.getFullYear() === currentYear
            );
        });
    }
    
    getRecentExpenses(limit = 5) {
        return [...this.expenses]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }
    
    getCategoryColor(category) {
        const colors = [
            '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
        ];
        
        const index = this.categories.indexOf(category);
        return colors[index % colors.length] || colors[0];
    }
    
    // ==================== تلغرام ====================
    
    checkTelegramConnection() {
        const isConnected = this.settings.telegram.connected && 
                          this.settings.telegram.botToken && 
                          this.settings.telegram.chatId;
        
        this.updateTelegramStatus(isConnected);
        return isConnected;
    }
    
    updateTelegramStatus(connected) {
        const statusElement = document.getElementById('telegram-status');
        const connectionStatus = document.getElementById('connection-status');
        const notice = document.getElementById('telegram-notice');
        
        if (statusElement) {
            if (connected) {
                statusElement.innerHTML = '<i class="fab fa-telegram"></i><span>متصل</span>';
                statusElement.className = 'telegram-status connected';
            } else {
                statusElement.innerHTML = '<i class="fab fa-telegram"></i><span>غير متصل</span>';
                statusElement.className = 'telegram-status disconnected';
            }
        }
        
        if (connectionStatus) {
            if (connected) {
                connectionStatus.innerHTML = '<i class="fas fa-circle"></i><span>متصل</span>';
                connectionStatus.className = 'connection-status connected';
            } else {
                connectionStatus.innerHTML = '<i class="fas fa-circle"></i><span>غير متصل</span>';
                connectionStatus.className = 'connection-status disconnected';
            }
        }
        
        if (notice) {
            notice.style.display = connected ? 'none' : 'block';
        }
        
        // تعبئة الحقول في النافذة
        const botTokenInput = document.getElementById('bot-token');
        const chatIdInput = document.getElementById('chat-id');
        
        if (botTokenInput && chatIdInput && connected) {
            botTokenInput.value = this.settings.telegram.botToken;
            chatIdInput.value = this.settings.telegram.chatId;
        }
    }
    
    openTelegramModal() {
        const modal = document.getElementById('telegram-modal');
        if (modal) {
            modal.classList.remove('hidden');
            
            // تعبئة البيانات المحفوظة
            const botTokenInput = document.getElementById('bot-token');
            const chatIdInput = document.getElementById('chat-id');
            
            if (botTokenInput) {
                botTokenInput.value = this.settings.telegram.botToken || '';
            }
            
            if (chatIdInput) {
                chatIdInput.value = this.settings.telegram.chatId || '';
            }
        }
    }
    
    async testTelegramConnection() {
        const botTokenInput = document.getElementById('bot-token');
        const chatIdInput = document.getElementById('chat-id');
        const testMessageInput = document.getElementById('test-message');
        
        if (!botTokenInput || !chatIdInput) return;
        
        const botToken = botTokenInput.value.trim();
        const chatId = chatIdInput.value.trim();
        const testMessage = testMessageInput ? testMessageInput.value.trim() : 'صرفت 150 بطاطس';
        
        if (!botToken || !chatId) {
            this.showNotification('الرجاء إدخال التوكن ومعرف المحادثة', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            // اختبار التوكن
            const testResponse = await fetch(
                `https://api.telegram.org/bot${botToken}/getMe`
            );
            
            if (!testResponse.ok) {
                throw new Error('التوكن غير صالح أو انتهت صلاحيته');
            }
            
            // إرسال رسالة اختبار
            const sendResponse = await fetch(
                `https://api.telegram.org/bot${botToken}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: '✅ تم الاتصال بنجاح!\n\nيمكنك الآن إرسال المصروفات مثل:\n• صرفت 150 بطاطس\n• دفعت 500 فواتير\n• مواصلات 300 دينار'
                    })
                }
            );
            
            const result = await sendResponse.json();
            
            if (result.ok) {
                this.showNotification('تم الاتصال بتلغرام بنجاح!', 'success');
                
                // حفظ الإعدادات مؤقتاً للعرض
                this.settings.telegram.botToken = botToken;
                this.settings.telegram.chatId = chatId;
                this.settings.telegram.connected = true;
                
                this.updateTelegramStatus(true);
            } else {
                throw new Error(result.description || 'فشل في إرسال الرسالة');
            }
        } catch (error) {
            console.error('خطأ في اختبار الاتصال:', error);
            let errorMessage = error.message;
            
            if (errorMessage.includes('Forbidden')) {
                errorMessage = 'البوت غير قادر على إرسال رسائل لهذا المستخدم. تأكد من أنك أرسلت /start للبوت أولاً.';
            } else if (errorMessage.includes('chat not found')) {
                errorMessage = 'المحادثة غير موجودة. تأكد من صحة Chat ID وأنك بدأت محادثة مع البوت.';
            }
            
            this.showNotification(`فشل الاتصال: ${errorMessage}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    saveTelegramSettings() {
        const botTokenInput = document.getElementById('bot-token');
        const chatIdInput = document.getElementById('chat-id');
        
        if (!botTokenInput || !chatIdInput) return;
        
        const botToken = botTokenInput.value.trim();
        const chatId = chatIdInput.value.trim();
        
        if (!botToken || !chatId) {
            this.showNotification('الرجاء إدخال التوكن ومعرف المحادثة', 'error');
            return;
        }
        
        this.settings.telegram.botToken = botToken;
        this.settings.telegram.chatId = chatId;
        this.settings.telegram.connected = true;
        
        this.saveData();
        this.updateTelegramStatus(true);
        
        this.showNotification('تم حفظ إعدادات تلغرام بنجاح', 'success');
        this.closeModal('telegram');
    }
    
    disconnectTelegram() {
        if (confirm('هل أنت متأكد من قطع الاتصال بتلغرام؟')) {
            this.settings.telegram = {
                botToken: '',
                chatId: '',
                connected: false
            };
            
            this.saveData();
            this.updateTelegramStatus(false);
            
            this.showNotification('تم قطع الاتصال بتلغرام', 'info');
        }
    }
    
    // ==================== خدمات مساعدة ====================
    
    closeModal(modalName) {
        let modal;
        
        if (modalName === 'expense') {
            modal = document.getElementById('expense-modal');
            const form = document.getElementById('expense-form');
            if (form) form.reset();
        } else if (modalName === 'telegram') {
            modal = document.getElementById('telegram-modal');
        }
        
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    toggleDarkMode() {
        this.settings.darkMode = !this.settings.darkMode;
        document.body.classList.toggle('dark', this.settings.darkMode);
        this.saveData();
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = document.getElementById('notification-icon');
        const messageEl = document.getElementById('notification-message');
        
        if (!notification || !icon || !messageEl) return;
        
        let iconClass = '';
        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle';
                break;
            case 'error':
                iconClass = 'fas fa-exclamation-circle';
                break;
            default:
                iconClass = 'fas fa-info-circle';
        }
        
        icon.className = iconClass;
        messageEl.textContent = message;
        
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
    
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (loading) {
            if (show) {
                loading.classList.remove('hidden');
            } else {
                loading.classList.add('hidden');
            }
        }
    }
}

// بدء التطبيق بعد تحميل الصفحة بالكامل
window.addEventListener('DOMContentLoaded', () => {
    window.expenseTracker = new ExpenseTracker();
});
