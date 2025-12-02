// التطبيق الرئيسي لنظام المصروفات
class ExpenseTracker {
    constructor() {
        this.expenses = [];
        this.categories = ['طعام', 'مواصلات', 'فواتير', 'تسوق', 'ترفيه', 'صحة', 'تعليم'];
        this.settings = {
            darkMode: false,
            monthlyBudget: 5000,
            budgetWarning: 80,
            notifications: true,
            currency: 'د.ج'
        };
        
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.editingExpenseId = null;
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.render();
        this.updateStats();
    }
    
    // تحميل البيانات من localStorage
    loadData() {
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
            this.settings = JSON.parse(savedSettings);
        }
        
        // تطبيق الوضع الداكن إذا كان مفعلاً
        if (this.settings.darkMode) {
            document.body.classList.add('dark');
            document.getElementById('dark-mode-toggle').checked = true;
        }
    }
    
    // حفظ البيانات في localStorage
    saveData() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        localStorage.setItem('categories', JSON.stringify(this.categories));
        localStorage.setItem('settings', JSON.stringify(this.settings));
    }
    
    // إعداد المستمعين للأحداث
    setupEventListeners() {
        // شاشة الترحيب
        document.getElementById('start-btn').addEventListener('click', () => {
            document.getElementById('welcome-screen').style.display = 'none';
            document.getElementById('app').classList.remove('hidden');
        });
        
        // الوضع الداكن
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });
        
        document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
            this.settings.darkMode = e.target.checked;
            document.body.classList.toggle('dark', e.target.checked);
            this.saveData();
        });
        
        // إضافة مصروف
        document.getElementById('add-expense-btn').addEventListener('click', () => {
            this.openExpenseModal();
        });
        
        document.getElementById('add-first-expense-btn').addEventListener('click', () => {
            this.openExpenseModal();
        });
        
        // حفظ المصروف
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveExpense();
        });
        
        // إغلاق النافذة
        document.getElementById('close-modal').addEventListener('click', () => {
            this.closeModal('expense');
        });
        
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('[data-modal]')?.dataset.modal || 'expense';
                this.closeModal(modal);
            });
        });
        
        // إلغاء
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeModal('expense');
        });
        
        // اختيار الفئة
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                document.getElementById('custom-category').value = '';
                this.selectCategory(category);
            });
        });
        
        // إضافة فئة جديدة
        document.getElementById('add-category-btn').addEventListener('click', () => {
            this.addNewCategory();
        });
        
        // البحث
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.filterExpenses();
        });
        
        // التصفية
        document.getElementById('category-filter').addEventListener('change', () => {
            this.filterExpenses();
        });
        
        document.getElementById('month-filter').addEventListener('change', () => {
            this.filterExpenses();
        });
        
        // الإعدادات
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.openSettingsModal();
        });
        
        // تبويبات الإعدادات
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSettingsTab(e.target.dataset.tab);
            });
        });
        
        // تعديل الميزانية
        document.getElementById('edit-budget-btn').addEventListener('click', () => {
            this.openSettingsModal();
            this.switchSettingsTab('budget');
        });
        
        // حفظ الميزانية
        document.getElementById('save-budget-btn').addEventListener('click', () => {
            this.saveBudget();
        });
        
        // تنبيه الميزانية
        document.getElementById('budget-warning').addEventListener('input', (e) => {
            document.getElementById('warning-percentage').textContent = `${e.target.value}%`;
        });
        
        // إدارة الفئات في الإعدادات
        document.getElementById('add-category-settings-btn').addEventListener('click', () => {
            this.addCategoryFromSettings();
        });
        
        // تصدير البيانات
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        // استيراد البيانات
        document.getElementById('import-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });
        
        document.getElementById('choose-file-btn').addEventListener('click', () => {
            document.getElementById('import-data-file').click();
        });
        
        document.getElementById('import-file').addEventListener('change', (e) => {
            this.importData(e);
        });
        
        document.getElementById('import-data-file').addEventListener('change', (e) => {
            this.importData(e);
        });
        
        // مسح البيانات
        document.getElementById('reset-data-btn').addEventListener('click', () => {
            if (confirm('هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
                this.resetData();
            }
        });
        
        // تحديث السنة الحالية
        document.getElementById('current-year').textContent = new Date().getFullYear();
    }
    
    // عرض واجهة التطبيق
    render() {
        this.renderCategories();
        this.renderExpenses();
        this.renderSettingsCategories();
        this.updateBudgetDisplay();
    }
    
    // عرض الفئات
    renderCategories() {
        const categoryFilter = document.getElementById('category-filter');
        categoryFilter.innerHTML = '<option value="all">جميع الفئات</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
    
    // عرض المصروفات
    renderExpenses() {
        this.renderRecentExpenses();
        this.renderAllExpenses();
        this.checkEmptyState();
    }
    
    // عرض المصروفات الحديثة
    renderRecentExpenses() {
        const container = document.getElementById('recent-expenses');
        const recentExpenses = this.getRecentExpenses(5);
        
        container.innerHTML = '';
        
        if (recentExpenses.length === 0) return;
        
        recentExpenses.forEach(expense => {
            const item = this.createExpenseElement(expense);
            container.appendChild(item);
        });
    }
    
    // عرض جميع المصروفات في الجدول
    renderAllExpenses() {
        const tbody = document.getElementById('expenses-table-body');
        tbody.innerHTML = '';
        
        const filteredExpenses = this.getFilteredExpenses();
        
        filteredExpenses.forEach(expense => {
            const row = this.createExpenseTableRow(expense);
            tbody.appendChild(row);
        });
    }
    
    // إنشاء عنصر مصروف
    createExpenseElement(expense) {
        const div = document.createElement('div');
        div.className = 'expense-item';
        div.style.borderRightColor = this.getCategoryColor(expense.category);
        
        const date = new Date(expense.date);
        const formattedDate = date.toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        div.innerHTML = `
            <div>
                <div class="expense-category">${expense.category}</div>
                <div class="expense-date">${formattedDate}</div>
                ${expense.notes ? `<div class="expense-notes">${expense.notes}</div>` : ''}
            </div>
            <div class="expense-amount">${expense.amount.toFixed(2)} ${this.settings.currency}</div>
        `;
        
        return div;
    }
    
    // إنشاء صف في جدول المصروفات
    createExpenseTableRow(expense) {
        const row = document.createElement('tr');
        
        const date = new Date(expense.date);
        const formattedDate = date.toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>
                <span class="category-badge" style="background: ${this.getCategoryColor(expense.category)}20; color: ${this.getCategoryColor(expense.category)}">
                    ${expense.category}
                </span>
            </td>
            <td class="expense-amount">${expense.amount.toFixed(2)} ${this.settings.currency}</td>
            <td>${expense.notes || '-'}</td>
            <td>
                <button class="btn btn-small edit-expense-btn" data-id="${expense.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-small btn-danger delete-expense-btn" data-id="${expense.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        // إضافة مستمعي الأحداث للأزرار
        row.querySelector('.edit-expense-btn').addEventListener('click', (e) => {
            this.editExpense(expense.id);
        });
        
        row.querySelector('.delete-expense-btn').addEventListener('click', (e) => {
            this.deleteExpense(expense.id);
        });
        
        return row;
    }
    
    // عرض الفئات في الإعدادات
    renderSettingsCategories() {
        const container = document.getElementById('settings-categories');
        container.innerHTML = '';
        
        this.categories.forEach(category => {
            const div = document.createElement('div');
            div.className = 'setting-item';
            div.innerHTML = `
                <div class="setting-info">
                    <h4>
                        <i class="fas fa-tag" style="color: ${this.getCategoryColor(category)}"></i>
                        ${category}
                    </h4>
                </div>
                <button class="btn btn-danger btn-small delete-category-btn" data-category="${category}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            div.querySelector('.delete-category-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteCategory(category);
            });
            
            container.appendChild(div);
        });
    }
    
    // تحديث الإحصائيات
    updateStats() {
        const monthlyExpenses = this.getMonthlyExpenses();
        const total = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const count = monthlyExpenses.length;
        const categoriesCount = new Set(monthlyExpenses.map(exp => exp.category)).size;
        const dailyAverage = count > 0 ? total / 30 : 0;
        
        document.getElementById('total-expenses').textContent = `${total.toFixed(2)} ${this.settings.currency}`;
        document.getElementById('expenses-count').textContent = count;
        document.getElementById('categories-count').textContent = categoriesCount;
        document.getElementById('daily-average').textContent = `${dailyAverage.toFixed(2)} ${this.settings.currency}`;
        
        this.updateCategoriesChart();
        this.updateBudgetDisplay();
    }
    
    // تحديث مخطط الفئات
    updateCategoriesChart() {
        const container = document.getElementById('categories-chart');
        const monthlyExpenses = this.getMonthlyExpenses();
        
        if (monthlyExpenses.length === 0) {
            container.innerHTML = '<p class="empty-message">لا توجد مصروفات هذا الشهر</p>';
            return;
        }
        
        // تجميع المصروفات حسب الفئة
        const categoryTotals = {};
        monthlyExpenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });
        
        const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
        
        container.innerHTML = '';
        
        Object.entries(categoryTotals)
            .sort(([, a], [, b]) => b - a)
            .forEach(([category, amount]) => {
                const percentage = total > 0 ? (amount / total) * 100 : 0;
                
                const div = document.createElement('div');
                div.className = 'category-item';
                div.innerHTML = `
                    <div class="category-name">
                        <i class="fas fa-circle" style="color: ${this.getCategoryColor(category)}"></i>
                        <span>${category}</span>
                    </div>
                    <div class="category-bar">
                        <div class="category-fill" style="width: ${percentage}%; background: ${this.getCategoryColor(category)}"></div>
                    </div>
                    <div class="category-amount">
                        ${amount.toFixed(2)} ${this.settings.currency}
                        <span class="category-percentage">(${percentage.toFixed(1)}%)</span>
                    </div>
                `;
                
                container.appendChild(div);
            });
    }
    
    // تحديث عرض الميزانية
    updateBudgetDisplay() {
        const monthlyExpenses = this.getMonthlyExpenses();
        const totalSpent = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const budget = this.settings.monthlyBudget;
        const remaining = Math.max(0, budget - totalSpent);
        const percentage = budget > 0 ? (totalSpent / budget) * 100 : 0;
        
        document.getElementById('budget-spent').textContent = `${totalSpent.toFixed(2)} ${this.settings.currency}`;
        document.getElementById('budget-total').textContent = `من ${budget.toFixed(2)} ${this.settings.currency}`;
        document.getElementById('budget-remaining').textContent = `${remaining.toFixed(2)} ${this.settings.currency} متبقي`;
        
        const progressFill = document.getElementById('budget-progress-fill');
        progressFill.style.width = `${Math.min(percentage, 100)}%`;
        
        // تغيير اللون بناءً على النسبة
        if (percentage >= 90) {
            progressFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        } else if (percentage >= 75) {
            progressFill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        } else {
            progressFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        }
        
        // تنبيه الميزانية
        if (this.settings.notifications && percentage >= this.settings.budgetWarning) {
            this.showNotification(
                percentage >= 90 
                    ? `⚠️ تجاوزت الميزانية الشهرية! (${percentage.toFixed(1)}%)`
                    : `⚠️ اقتربت من الحد الأقصى للميزانية! (${percentage.toFixed(1)}%)`,
                percentage >= 90 ? 'warning' : 'info'
            );
        }
    }
    
    // فتح نافذة المصروف
    openExpenseModal(expenseId = null) {
        const modal = document.getElementById('expense-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('expense-form');
        
        this.editingExpenseId = expenseId;
        
        if (expenseId) {
            // وضع التعديل
            title.textContent = 'تعديل المصروف';
            const expense = this.expenses.find(exp => exp.id === expenseId);
            
            if (expense) {
                document.getElementById('amount').value = expense.amount;
                document.getElementById('custom-category').value = expense.category;
                document.getElementById('date').value = expense.date.split('T')[0];
                document.getElementById('notes').value = expense.notes || '';
                
                // تحديد الفئة
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.category === expense.category);
                });
            }
        } else {
            // وضع الإضافة
            title.textContent = 'إضافة مصروف جديد';
            form.reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            
            // إلغاء تحديد جميع الفئات
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }
        
        modal.classList.remove('hidden');
    }
    
    // حفظ المصروف
    saveExpense() {
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('custom-category').value.trim();
        const date = document.getElementById('date').value;
        const notes = document.getElementById('notes').value.trim();
        
        if (!amount || amount <= 0) {
            this.showNotification('الرجاء إدخال مبلغ صحيح', 'error');
            return;
        }
        
        if (!category) {
            this.showNotification('الرجاء اختيار أو إدخال فئة', 'error');
            return;
        }
        
        // إضافة الفئة إذا كانت جديدة
        if (!this.categories.includes(category)) {
            this.categories.push(category);
            this.renderCategories();
            this.renderSettingsCategories();
        }
        
        if (this.editingExpenseId) {
            // تحديث المصروف
            const index = this.expenses.findIndex(exp => exp.id === this.editingExpenseId);
            if (index !== -1) {
                this.expenses[index] = {
                    ...this.expenses[index],
                    amount,
                    category,
                    date: new Date(date).toISOString(),
                    notes
                };
                this.showNotification('تم تحديث المصروف بنجاح', 'success');
            }
        } else {
            // إضافة مصروف جديد
            const newExpense = {
                id: Date.now(),
                amount,
                category,
                date: new Date(date).toISOString(),
                notes,
                createdAt: new Date().toISOString()
            };
            
            this.expenses.unshift(newExpense);
            this.showNotification('تم إضافة المصروف بنجاح', 'success');
        }
        
        this.saveData();
        this.render();
        this.updateStats();
        this.closeModal('expense');
    }
    
    // تعديل مصروف
    editExpense(id) {
        this.openExpenseModal(id);
    }
    
    // حذف مصروف
    deleteExpense(id) {
        if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
            this.expenses = this.expenses.filter(exp => exp.id !== id);
            this.saveData();
            this.render();
            this.updateStats();
            this.showNotification('تم حذف المصروف بنجاح', 'success');
        }
    }
    
    // حذف فئة
    deleteCategory(category) {
        if (confirm(`هل أنت متأكد من حذف فئة "${category}"؟\nسيتم حذف جميع المصروفات المرتبطة بهذه الفئة.`)) {
            // حذف المصروفات المرتبطة بالفئة
            this.expenses = this.expenses.filter(exp => exp.category !== category);
            
            // حذف الفئة من القائمة
            this.categories = this.categories.filter(cat => cat !== category);
            
            this.saveData();
            this.render();
            this.updateStats();
            this.showNotification('تم حذف الفئة وجميع مصروفاتها', 'success');
        }
    }
    
    // إغلاق النافذة
    closeModal(modalName) {
        if (modalName === 'expense') {
            document.getElementById('expense-modal').classList.add('hidden');
            this.editingExpenseId = null;
        } else if (modalName === 'settings') {
            document.getElementById('settings-modal').classList.add('hidden');
        }
    }
    
    // فتح نافذة الإعدادات
    openSettingsModal() {
        document.getElementById('settings-modal').classList.remove('hidden');
        this.switchSettingsTab('general');
        
        // تعيين قيم الإعدادات
        document.getElementById('monthly-budget').value = this.settings.monthlyBudget;
        document.getElementById('budget-warning').value = this.settings.budgetWarning;
        document.getElementById('warning-percentage').textContent = `${this.settings.budgetWarning}%`;
        document.getElementById('notifications-toggle').checked = this.settings.notifications;
    }
    
    // تبديل تبويبات الإعدادات
    switchSettingsTab(tabName) {
        // إخفاء جميع المحتويات
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // إلغاء تحديد جميع الأزرار
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // إظهار المحتوى المحدد
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // تحديد الزر المحدد
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }
    
    // حفظ الميزانية
    saveBudget() {
        const budget = parseFloat(document.getElementById('monthly-budget').value);
        const warning = parseInt(document.getElementById('budget-warning').value);
        const notifications = document.getElementById('notifications-toggle').checked;
        
        if (budget < 0) {
            this.showNotification('الميزانية يجب أن تكون قيمة موجبة', 'error');
            return;
        }
        
        this.settings.monthlyBudget = budget;
        this.settings.budgetWarning = warning;
        this.settings.notifications = notifications;
        
        this.saveData();
        this.updateStats();
        this.showNotification('تم حفظ الإعدادات بنجاح', 'success');
    }
    
    // إضافة فئة جديدة
    addNewCategory() {
        const input = document.getElementById('custom-category');
        const category = input.value.trim();
        
        if (category && !this.categories.includes(category)) {
            this.categories.push(category);
            this.renderCategories();
            this.renderSettingsCategories();
            input.value = '';
            this.showNotification('تم إضافة الفئة بنجاح', 'success');
        }
    }
    
    // إضافة فئة من الإعدادات
    addCategoryFromSettings() {
        const input = document.getElementById('new-category-input');
        const category = input.value.trim();
        
        if (category && !this.categories.includes(category)) {
            this.categories.push(category);
            this.renderCategories();
            this.renderSettingsCategories();
            input.value = '';
            this.showNotification('تم إضافة الفئة بنجاح', 'success');
        }
    }
    
    // اختيار الفئة
    selectCategory(category) {
        document.getElementById('custom-category').value = category;
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
    }
    
    // تبديل الوضع الداكن
    toggleDarkMode() {
        this.settings.darkMode = !this.settings.darkMode;
        document.body.classList.toggle('dark', this.settings.darkMode);
        document.getElementById('dark-mode-toggle').checked = this.settings.darkMode;
        this.saveData();
    }
    
    // تصدير البيانات
    exportData() {
        const data = {
            expenses: this.expenses,
            categories: this.categories,
            settings: this.settings,
            exportedAt: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `مصروفات_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.showNotification('تم تصدير البيانات بنجاح', 'success');
    }
    
    // استيراد البيانات
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.expenses && data.categories && data.settings) {
                    if (confirm('سيتم استبدال جميع البيانات الحالية. هل تريد المتابعة؟')) {
                        this.expenses = data.expenses;
                        this.categories = data.categories;
                        this.settings = data.settings;
                        
                        // تطبيق الإعدادات
                        document.body.classList.toggle('dark', this.settings.darkMode);
                        document.getElementById('dark-mode-toggle').checked = this.settings.darkMode;
                        
                        this.saveData();
                        this.render();
                        this.updateStats();
                        this.showNotification('تم استيراد البيانات بنجاح', 'success');
                    }
                } else {
                    this.showNotification('صيغة الملف غير صحيحة', 'error');
                }
            } catch (error) {
                console.error('خطأ في قراءة الملف:', error);
                this.showNotification('خطأ في قراءة الملف', 'error');
            }
            
            // إعادة تعيين حقل الملف
            event.target.value = '';
        };
        reader.readAsText(file);
    }
    
    // مسح جميع البيانات
    resetData() {
        if (confirm('هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
            this.expenses = [];
            this.categories = ['طعام', 'مواصلات', 'فواتير', 'تسوق', 'ترفيه', 'صحة', 'تعليم'];
            this.settings = {
                darkMode: false,
                monthlyBudget: 5000,
                budgetWarning: 80,
                notifications: true,
                currency: 'د.ج'
            };
            
            document.body.classList.remove('dark');
            
            localStorage.clear();
            this.render();
            this.updateStats();
            this.showNotification('تم مسح جميع البيانات بنجاح', 'success');
        }
    }
    
    // تصفية المصروفات
    filterExpenses() {
        this.renderAllExpenses();
    }
    
    // الحصول على المصروفات المصفاة
    getFilteredExpenses() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const monthFilter = document.getElementById('month-filter').value;
        
        return this.expenses.filter(expense => {
            // البحث
            if (searchTerm && !(
                expense.category.toLowerCase().includes(searchTerm) ||
                expense.amount.toString().includes(searchTerm) ||
                (expense.notes && expense.notes.toLowerCase().includes(searchTerm))
            )) {
                return false;
            }
            
            // التصفية بالفئة
            if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
                return false;
            }
            
            // التصفية بالشهر
            if (monthFilter !== 'all') {
                const expenseDate = new Date(expense.date);
                const currentDate = new Date();
                
                if (monthFilter === 'current') {
                    if (
                        expenseDate.getMonth() !== currentDate.getMonth() ||
                        expenseDate.getFullYear() !== currentDate.getFullYear()
                    ) {
                        return false;
                    }
                } else if (monthFilter === 'last') {
                    const lastMonth = new Date();
                    lastMonth.setMonth(lastMonth.getMonth() - 1);
                    
                    if (
                        expenseDate.getMonth() !== lastMonth.getMonth() ||
                        expenseDate.getFullYear() !== lastMonth.getFullYear()
                    ) {
                        return false;
                    }
                }
            }
            
            return true;
        });
    }
    
    // الحصول على المصروفات الشهرية
    getMonthlyExpenses() {
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return (
                expenseDate.getMonth() === this.currentMonth &&
                expenseDate.getFullYear() === this.currentYear
            );
        });
    }
    
    // الحصول على المصروفات الحديثة
    getRecentExpenses(limit = 5) {
        return [...this.expenses]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }
    
    // التحقق من حالة الفراغ
    checkEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const hasExpenses = this.expenses.length > 0;
        
        if (hasExpenses) {
            emptyState.classList.add('hidden');
        } else {
            emptyState.classList.remove('hidden');
        }
    }
    
    // الحصول على لون الفئة
    getCategoryColor(category) {
        const colors = [
            '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
        ];
        
        const index = this.categories.indexOf(category);
        return colors[index % colors.length] || colors[0];
    }
    
    // عرض الإشعارات
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const icon = document.getElementById('notification-icon');
        const messageEl = document.getElementById('notification-message');
        
        // تعيين الأيقونة
        let iconClass = '';
        switch (type) {
            case 'success':
                iconClass = 'fas fa-check-circle';
                break;
            case 'error':
                iconClass = 'fas fa-exclamation-circle';
                break;
            case 'warning':
                iconClass = 'fas fa-exclamation-triangle';
                break;
            default:
                iconClass = 'fas fa-info-circle';
        }
        
        icon.className = iconClass;
        messageEl.textContent = message;
        
        // إعداد الفئة
        notification.className = `notification ${type}`;
        notification.classList.remove('hidden');
        
        // إخفاء الإشعار بعد 3 ثوانٍ
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 3000);
    }
    
    // عرض التحميل
    showLoading(show) {
        const loading = document.getElementById('loading');
        if (show) {
            loading.classList.remove('hidden');
        } else {
            loading.classList.add('hidden');
        }
    }
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.expenseTracker = new ExpenseTracker();
});
