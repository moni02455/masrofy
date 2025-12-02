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
        const savedExpenses = localStorage.getItem('expenses');
        const savedCategories = localStorage.getItem('categories');
        const savedSettings = localStorage.getItem('settings');
        
        if (savedExpenses) this.expenses = JSON.parse(savedExpenses);
        if (savedCategories) this.categories = JSON.parse(savedCategories);
        if (savedSettings) this.settings = JSON.parse(savedSettings);
        
        if (this.settings.darkMode) {
            document.body.classList.add('dark');
        }
    }
    
    saveData() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        localStorage.setItem('categories', JSON.stringify(this.categories));
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }
    
    setupEventListeners() {
        // شاشة الترحيب
        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('welcome-screen').style.display = 'none';
            document.getElementById('app').classList.remove('hidden');
        });
        
        // إضافة مصروف سريع
        document.getElementById('quick-add-btn').addEventListener('click', () => {
            this.addQuickExpense();
        });
        
        // إضافة مصروف من الهيدر
        document.getElementById('add-expense-btn-header').addEventListener('click', () => {
            this.openExpenseModal();
        });
        
        // ربط تلغرام
        document.getElementById('telegram-btn').addEventListener('click', () => {
            this.openTelegramModal();
        });
        
        document.getElementById('connect-telegram-btn').addEventListener('click', () => {
            this.openTelegramModal();
        });
        
        // حفظ إعدادات تلغرام
        document.getElementById('save-telegram-btn').addEventListener('click', () => {
            this.saveTelegramSettings();
        });
        
        // قطع اتصال تلغرام
        document.getElementById('disconnect-telegram-btn').addEventListener('click', () => {
            this.disconnectTelegram();
        });
        
        // اختبار الاتصال
        document.getElementById('test-connection-btn').addEventListener('click', () => {
            this.testTelegramConnection();
        });
        
        // إغلاق النوافذ
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('[data-modal]').dataset.modal;
                this.closeModal(modal);
            });
        });
        
        // الوضع الداكن
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });
        
        // إضافة مصروف كامل
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExpense();
        });
        
        // تحديث السنة
        document.getElementById('current-year').textContent = new Date().getFullYear();
    }
    
    // ==================== إدارة المصروفات ====================
    
    addQuickExpense() {
        const amount = parseFloat(document.getElementById('quick-amount').value);
        const category = document.getElementById('quick-category').value;
        const notes = document.getElementById('quick-notes').value;
        
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
        
        document.getElementById('quick-amount').value = '';
        document.getElementById('quick-category').value = '';
        document.getElementById('quick-notes').value = '';
        
        this.showNotification('تم إضافة المصروف بنجاح', 'success');
    }
    
    openExpenseModal() {
        document.getElementById('expense-modal').classList.remove('hidden');
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
    }
    
    saveExpense() {
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('custom-category').value.trim() || 
                        document.querySelector('.category-btn.active')?.dataset.category;
        const date = document.getElementById('date').value;
        const notes = document.getElementById('notes').value;
        
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
        
        document.getElementById('total-expenses').textContent = `${total.toFixed(2)} د.ج`;
        document.getElementById('expenses-count').textContent = count;
        document.getElementById('categories-count').textContent = categoriesCount;
        document.getElementById('daily-average').textContent = `${dailyAverage.toFixed(2)} د.ج`;
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
        
        if (connected) {
            statusElement.innerHTML = '<i class="fab fa-telegram"></i><span>متصل</span>';
            statusElement.className = 'telegram-status connected';
            
            connectionStatus.innerHTML = '<i class="fas fa-circle"></i><span>متصل</span>';
            connectionStatus.className = 'connection-status connected';
            
            if (notice) notice.style.display = 'none';
            
            // تعبئة الحقول
            document.getElementById('bot-token').value = this.settings.telegram.botToken;
            document.getElementById('chat-id').value = this.settings.telegram.chatId;
        } else {
            statusElement.innerHTML = '<i class="fab fa-telegram"></i><span>غير متصل</span>';
            statusElement.className = 'telegram-status disconnected';
            
            connectionStatus.innerHTML = '<i class="fas fa-circle"></i><span>غير متصل</span>';
            connectionStatus.className = 'connection-status disconnected';
            
            if (notice) notice.style.display = 'block';
        }
    }
    
    openTelegramModal() {
        document.getElementById('telegram-modal').classList.remove('hidden');
        
        // تعبئة البيانات المحفوظة
        document.getElementById('bot-token').value = this.settings.telegram.botToken || '';
        document.getElementById('chat-id').value = this.settings.telegram.chatId || '';
    }
    
    async testTelegramConnection() {
        const botToken = document.getElementById('bot-token').value.trim();
        const chatId = document.getElementById('chat-id').value.trim();
        const testMessage = document.getElementById('test-message').value.trim();
        
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
                throw new Error('التوكن غير صالح');
            }
            
            // إرسال رسالة اختبار
            const sendResponse = await fetch(
                `https://api.telegram.org/bot${botToken}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: '✅ تم الاتصال بنجاح! يمكنك الآن إرسال المصروفات مثل: "صرفت 150 بطاطس"'
                    })
                }
            );
            
            const result = await sendResponse.json();
            
            if (result.ok) {
                this.showNotification('تم الاتصال بتلغرام بنجاح!', 'success');
                
                // حفظ الإعدادات مؤقتاً
                this.settings.telegram.botToken = botToken;
                this.settings.telegram.chatId = chatId;
                this.settings.telegram.connected = true;
                
                this.updateTelegramStatus(true);
            } else {
                throw new Error(result.description || 'فشل في إرسال الرسالة');
            }
        } catch (error) {
            console.error('خطأ في اختبار الاتصال:', error);
            this.showNotification(`فشل الاتصال: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    saveTelegramSettings() {
        const botToken = document.getElementById('bot-token').value.trim();
        const chatId = document.getElementById('chat-id').value.trim();
        
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
        this.settings.telegram = {
            botToken: '',
            chatId: '',
            connected: false
        };
        
        this.saveData();
        this.updateTelegramStatus(false);
        
        this.showNotification('تم قطع الاتصال بتلغرام', 'info');
    }
    
    // ==================== خدمات مساعدة ====================
    
    closeModal(modalName) {
        if (modalName === 'expense') {
            document.getElementById('expense-modal').classList.add('hidden');
            document.getElementById('expense-form').reset();
        } else if (modalName === 'telegram') {
            document.getElementById('telegram-modal').classList.add('hidden');
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
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }
}

// بدء التطبيق
document.addEventListener('DOMContentLoaded', () => {
    window.expenseTracker = new ExpenseTracker();
});
