// نظام المصروفات مع ربط تلغرام
class ExpenseTracker {
    constructor() {
        this.expenses = [];
        this.categories = ['طعام', 'مواصلات', 'فواتير', 'تسوق', 'ترفيه'];
        this.settings = {
            darkMode: false,
            monthlyBudget: 5000,
            budgetWarning: 80,
            notifications: true,
            autoProcess: true,
            telegram: {
                botToken: '',
                chatId: '',
                connected: false,
                lastUpdateId: 0
            },
            currency: 'د.ج'
        };
        
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.editingExpenseId = null;
        this.pollingInterval = null;
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.render();
        this.updateStats();
        this.checkTelegramConnection();
        this.setupTelegramPolling();
    }
    
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
            const loadedSettings = JSON.parse(savedSettings);
            this.settings = { ...this.settings, ...loadedSettings };
            
            // دمج إعدادات تلغرام القديمة مع الجديدة
            if (loadedSettings.telegram) {
                this.settings.telegram = { 
                    ...this.settings.telegram, 
                    ...loadedSettings.telegram 
                };
            }
        }
        
        if (this.settings.darkMode) {
            document.body.classList.add('dark');
            document.getElementById('dark-mode-toggle').checked = true;
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
        
        // الوضع الداكن
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });
        
        document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
            this.settings.darkMode = e.target.checked;
            document.body.classList.toggle('dark', e.target.checked);
            this.saveData();
        });
        
        // التلغرام
        document.getElementById('telegram-btn').addEventListener('click', () => {
            this.openTelegramModal();
        });
        
        document.getElementById('connect-telegram-btn').addEventListener('click', () => {
            this.openTelegramModal();
        });
        
        document.getElementById('connect-first-telegram-btn').addEventListener('click', () => {
            this.openTelegramModal();
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
        
        // إغلاق النوافذ
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('[data-modal]')?.dataset.modal || 'expense';
                this.closeModal(modal);
            });
        });
        
        document.getElementById('cancel-btn').addEventListener('click', () => {
            this.closeModal('expense');
        });
        
        // اختيار الفئة
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                document.getElementById('custom-category').value = category;
                this.selectCategory(category);
            });
        });
        
        // إضافة فئة جديدة
        document.getElementById('add-category-btn').addEventListener('click', () => {
            this.addNewCategory();
        });
        
        // البحث والتصفية
        document.getElementById('search-input').addEventListener('input', () => {
            this.filterExpenses();
        });
        
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
        
        document.getElementById('open-telegram-settings').addEventListener('click', () => {
            this.openTelegramModal();
        });
        
        // تبويبات الإعدادات
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSettingsTab(e.target.dataset.tab);
            });
        });
        
        // إعدادات تلغرام
        document.getElementById('send-test-btn').addEventListener('click', () => {
            this.sendTestMessage();
        });
        
        document.getElementById('test-connection-btn').addEventListener('click', () => {
            this.testTelegramConnection();
        });
        
        document.getElementById('save-telegram-btn').addEventListener('click', () => {
            this.saveTelegramSettings();
        });
        
        document.getElementById('disconnect-telegram-btn').addEventListener('click', () => {
            this.disconnectTelegram();
        });
        
        // إعدادات الميزانية
        document.getElementById('edit-budget-btn').addEventListener('click', () => {
            this.openSettingsModal();
            this.switchSettingsTab('budget');
        });
        
        document.getElementById('save-budget-btn').addEventListener('click', () => {
            this.saveBudget();
        });
        
        document.getElementById('budget-warning').addEventListener('input', (e) => {
            document.getElementById('warning-percentage').textContent = `${e.target.value}%`;
        });
        
        // إدارة الفئات
        document.getElementById('add-category-settings-btn').addEventListener('click', () => {
            this.addCategoryFromSettings();
        });
        
        // التصدير والاستيراد
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('export-data-btn').addEventListener('click', () => {
            this.exportData();
        });
        
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
        
        // نسخ كود السيرفر
        document.getElementById('copy-server-code').addEventListener('click', () => {
            this.copyServerCode();
        });
        
        // تقرير المشاكل
        document.getElementById('report-issue-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.openIssueModal();
        });
        
        document.getElementById('telegram-help-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.openTelegramModal();
        });
        
        // إرسال تقرير المشكلة
        document.getElementById('issue-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitIssueReport();
        });
        
        // تحديث السنة
        document.getElementById('current-year').textContent = new Date().getFullYear();
    }
    
    // ==================== التلغرام ====================
    
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
            
            // تعبئة الحقول في نافذة التلغرام
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
    
    setupTelegramPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        if (this.checkTelegramConnection() && this.settings.autoProcess) {
            // استطلاع رسائل التلغرام كل 5 ثوانٍ
            this.pollingInterval = setInterval(() => {
                this.pollTelegramMessages();
            }, 5000);
        }
    }
    
    async pollTelegramMessages() {
        if (!this.checkTelegramConnection()) return;
        
        try {
            const response = await fetch(
                `https://api.telegram.org/bot${this.settings.telegram.botToken}/getUpdates?offset=${this.settings.telegram.lastUpdateId + 1}&timeout=2`
            );
            
            if (!response.ok) {
                throw new Error('فشل في الاتصال بخادم تلغرام');
            }
            
            const data = await response.json();
            
            if (data.ok && data.result.length > 0) {
                for (const update of data.result) {
                    this.settings.telegram.lastUpdateId = update.update_id;
                    
                    if (update.message && update.message.chat.id.toString() === this.settings.telegram.chatId) {
                        await this.processTelegramMessage(update.message);
                    }
                }
                
                this.saveData();
            }
        } catch (error) {
            console.error('خطأ في استقبال رسائل تلغرام:', error);
            this.showNotification('فقد الاتصال بخادم تلغرام', 'error');
            this.updateTelegramStatus(false);
        }
    }
    
    async processTelegramMessage(message) {
        const text = message.text;
        
        if (!text) return;
        
        // تجاهل الأوامر التي تبدأ بشرطة مائلة
        if (text.startsWith('/')) {
            await this.handleTelegramCommand(text, message.chat.id);
            return;
        }
        
        // محاولة استخراج المصروف من النص
        const expenseData = this.extractExpenseFromText(text);
        
        if (expenseData) {
            const newExpense = {
                id: Date.now(),
                amount: expenseData.amount,
                category: expenseData.category,
                date: new Date().toISOString(),
                notes: expenseData.notes || '',
                source: 'telegram',
                messageId: message.message_id
            };
            
            this.expenses.unshift(newExpense);
            
            // إضافة فئة جديدة إذا كانت غير موجودة
            if (!this.categories.includes(expenseData.category)) {
                this.categories.push(expenseData.category);
                this.renderCategories();
            }
            
            this.saveData();
            this.render();
            this.updateStats();
            
            // إرسال تأكيد للمستخدم
            await this.sendTelegramMessage(
                message.chat.id,
                `✅ تم تسجيل المصروف:\n💰 المبلغ: ${expenseData.amount} د.ج\n📦 الفئة: ${expenseData.category}\n📅 التاريخ: ${new Date().toLocaleDateString('ar-DZ')}\n\n📊 إجمالي المصروفات الشهرية: ${this.getMonthlyTotal().toFixed(2)} د.ج`
            );
            
            this.showNotification(`تم إضافة مصروف من تلغرام: ${expenseData.amount} د.ج`, 'success');
        } else {
            // طلب توضيح من المستخدم
            await this.sendTelegramMessage(
                message.chat.id,
                '❌ لم أتمكن من فهم المصروف. الرجاء استخدام الصيغة:\n"صرفت [المبلغ] [الفئة]"\nمثال: صرفت 150 بطاطس'
            );
        }
    }
    
    async handleTelegramCommand(command, chatId) {
        const monthlyExpenses = this.getMonthlyExpenses();
        const total = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const categories = [...new Set(monthlyExpenses.map(exp => exp.category))];
        
        let response = '';
        
        switch (command.toLowerCase()) {
            case '/start':
                response = `👋 مرحباً! أنا بوت نظام المصروفات الذكي.\n\nيمكنك إضافة مصروفات عن طريق إرسال:\n"صرفت 150 بطاطس"\n"دفعت 500 فواتير"\n\nالأوامر المتاحة:\n/total - إجمالي المصروفات\n/categories - الفئات\n/month - مصروفات الشهر\n/help - المساعدة`;
                break;
                
            case '/total':
                response = `💰 إجمالي المصروفات: ${total.toFixed(2)} د.ج\n\n📅 هذا الشهر: ${monthlyExpenses.length} مصروف`;
                break;
                
            case '/categories':
                response = `📊 الفئات المستخدمة:\n\n${categories.map(cat => `• ${cat}`).join('\n') || 'لا توجد فئات بعد'}`;
                break;
                
            case '/month':
                const topCategories = monthlyExpenses
                    .reduce((acc, exp) => {
                        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
                        return acc;
                    }, {});
                
                const topList = Object.entries(topCategories)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([cat, amount]) => `• ${cat}: ${amount.toFixed(2)} د.ج`)
                    .join('\n');
                
                response = `📈 مصروفات الشهر الحالي:\n\n${topList || 'لا توجد مصروفات بعد'}\n\n💰 الإجمالي: ${total.toFixed(2)} د.ج`;
                break;
                
            case '/help':
                response = `📖 **أوامر البوت:**\n\n` +
                          `/start - بدء الاستخدام\n` +
                          `/total - إجمالي المصروفات\n` +
                          `/categories - عرض الفئات\n` +
                          `/month - مصروفات الشهر\n` +
                          `/help - هذه الرسالة\n\n` +
                          `**إضافة مصروف:**\n` +
                          `"صرفت 150 بطاطس"\n` +
                          `"دفعت 500 فواتير"\n` +
                          `"اشتريت 250 خبز"`;
                break;
                
            default:
                response = '⚠️ الأمر غير معروف. استخدم /help لعرض الأوامر المتاحة.';
        }
        
        await this.sendTelegramMessage(chatId, response);
    }
    
    extractExpenseFromText(text) {
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
                
                // تنظيف الفئة من الكلمات الشائعة
                category = category.replace(/دينار|د\.ج|جنيه|ريال|درهم|على|في|من|لـ|الى|إلى/gi, '').trim();
                
                if (amount > 0 && category) {
                    return { amount, category, notes };
                }
            }
        }
        
        return null;
    }
    
    async sendTelegramMessage(chatId, text) {
        if (!this.checkTelegramConnection()) return;
        
        try {
            const response = await fetch(
                `https://api.telegram.org/bot${this.settings.telegram.botToken}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: text,
                        parse_mode: 'HTML'
                    })
                }
            );
            
            return await response.json();
        } catch (error) {
            console.error('خطأ في إرسال رسالة تلغرام:', error);
        }
    }
    
    async testTelegramConnection() {
        const botToken = document.getElementById('bot-token').value.trim();
        const chatId = document.getElementById('chat-id').value.trim();
        
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
            await this.sendTelegramMessage(chatId, '✅ تم الاتصال بنجاح! يمكنك الآن إرسال المصروفات.');
            
            this.showNotification('تم الاتصال بتلغرام بنجاح!', 'success');
            
            // حفظ الإعدادات مؤقتاً
            this.settings.telegram.botToken = botToken;
            this.settings.telegram.chatId = chatId;
            this.settings.telegram.connected = true;
            
            this.updateTelegramStatus(true);
            
        } catch (error) {
            console.error('خطأ في اختبار الاتصال:', error);
            this.showNotification(`فشل الاتصال: ${error.message}`, 'error');
        } finally {
            this.showLoading(false);
        }
    }
    
    async sendTestMessage() {
        const chatId = document.getElementById('chat-id').value.trim();
        const message = document.getElementById('test-message').value.trim();
        
        if (!chatId || !message) {
            this.showNotification('الرجاء إدخال معرف المحادثة والرسالة', 'error');
            return;
        }
        
        if (!this.settings.telegram.connected) {
            this.showNotification('الرجاء الاتصال بتلغرام أولاً', 'error');
            return;
        }
        
        this.showLoading(true);
        
        try {
            const result = await this.sendTelegramMessage(chatId, message);
            
            if (result.ok) {
                this.showNotification('تم إرسال الرسالة بنجاح', 'success');
                
                // معالجة الرسالة كأنها مصروف جديد
                const expenseData = this.extractExpenseFromText(message);
                if (expenseData) {
                    this.showNotification(`سيتم إضافة المصروف: ${expenseData.amount} د.ج - ${expenseData.category}`, 'info');
                }
            } else {
                throw new Error(result.description || 'فشل في إرسال الرسالة');
            }
        } catch (error) {
            console.error('خطأ في إرسال رسالة الاختبار:', error);
            this.showNotification(`فشل إرسال الرسالة: ${error.message}`, 'error');
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
        this.setupTelegramPolling();
        
        this.showNotification('تم حفظ إعدادات تلغرام بنجاح', 'success');
        this.closeModal('telegram');
    }
    
    disconnectTelegram() {
        this.settings.telegram = {
            botToken: '',
            chatId: '',
            connected: false,
            lastUpdateId: 0
        };
        
        this.saveData();
        this.updateTelegramStatus(false);
        
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        
        this.showNotification('تم قطع الاتصال بتلغرام', 'info');
    }
    
    copyServerCode() {
        const serverCode = `
// server.js - خادم Node.js لتلغرام
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// استبدل هذه المتغيرات بمتغيراتك
const BOT_TOKEN = 'YOUR_BOT_TOKEN';
const WEB_APP_URL = 'https://your-app-url.com';

app.post('/telegram-webhook', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (message && message.text) {
            // إرسال البيانات لتطبيق الويب
            await axios.post(\`\${WEB_APP_URL}/api/telegram-message\`, {
                text: message.text,
                chatId: message.chat.id,
                messageId: message.message_id
            });
        }
        
        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error');
    }
});

app.listen(PORT, () => {
    console.log(\`Server running on port \${PORT}\`);
});
        `.trim();
        
        navigator.clipboard.writeText(serverCode).then(() => {
            this.showNotification('تم نسخ كود السيرفر إلى الحافظة', 'success');
        }).catch(() => {
            this.showNotification('فشل نسخ الكود، حاول مرة أخرى', 'error');
        });
    }
    
    // ==================== الوظائف الأساسية ====================
    
    render() {
        this.renderCategories();
        this.renderExpenses();
        this.renderSettingsCategories();
        this.updateBudgetDisplay();
    }
    
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
    
    renderExpenses() {
        this.renderRecentExpenses();
        this.renderAllExpenses();
        this.checkEmptyState();
    }
    
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
    
    renderAllExpenses() {
        const tbody = document.getElementById('expenses-table-body');
        tbody.innerHTML = '';
        
        const filteredExpenses = this.getFilteredExpenses();
        
        filteredExpenses.forEach(expense => {
            const row = this.createExpenseTableRow(expense);
            tbody.appendChild(row);
        });
    }
    
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
        
        const sourceBadge = expense.source === 'telegram' 
            ? '<span class="expense-source telegram"><i class="fab fa-telegram"></i> تلغرام</span>'
            : '<span class="expense-source manual"><i class="fas fa-user"></i> يدوي</span>';
        
        div.innerHTML = `
            <div>
                <div class="expense-category">${expense.category} ${sourceBadge}</div>
                <div class="expense-date">${formattedDate}</div>
                ${expense.notes ? `<div class="expense-notes">${expense.notes}</div>` : ''}
            </div>
            <div class="expense-amount">${expense.amount.toFixed(2)} ${this.settings.currency}</div>
        `;
        
        return div;
    }
    
    createExpenseTableRow(expense) {
        const row = document.createElement('tr');
        
        const date = new Date(expense.date);
        const formattedDate = date.toLocaleDateString('ar-DZ', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const sourceBadge = expense.source === 'telegram' 
            ? '<span class="expense-source telegram"><i class="fab fa-telegram"></i> تلغرام</span>'
            : '<span class="expense-source manual"><i class="fas fa-user"></i> يدوي</span>';
        
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td>${sourceBadge}</td>
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
        
        row.querySelector('.edit-expense-btn').addEventListener('click', (e) => {
            this.editExpense(expense.id);
        });
        
        row.querySelector('.delete-expense-btn').addEventListener('click', (e) => {
            this.deleteExpense(expense.id);
        });
        
        return row;
    }
    
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
    
    updateCategoriesChart() {
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
        
        if (percentage >= 90) {
            progressFill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
        } else if (percentage >= 75) {
            progressFill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        } else {
            progressFill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        }
        
        if (this.settings.notifications && percentage >= this.settings.budgetWarning) {
            this.showNotification(
                percentage >= 90 
                    ? `⚠️ تجاوزت الميزانية الشهرية! (${percentage.toFixed(1)}%)`
                    : `⚠️ اقتربت من الحد الأقصى للميزانية! (${percentage.toFixed(1)}%)`,
                percentage >= 90 ? 'warning' : 'info'
            );
        }
    }
    
    openExpenseModal(expenseId = null) {
        const modal = document.getElementById('expense-modal');
        const title = document.getElementById('modal-title');
        const form = document.getElementById('expense-form');
        
        this.editingExpenseId = expenseId;
        
        if (expenseId) {
            title.textContent = 'تعديل المصروف';
            const expense = this.expenses.find(exp => exp.id === expenseId);
            
            if (expense) {
                document.getElementById('amount').value = expense.amount;
                document.getElementById('custom-category').value = expense.category;
                document.getElementById('date').value = expense.date.split('T')[0];
                document.getElementById('notes').value = expense.notes || '';
                
                document.querySelectorAll('.category-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.category === expense.category);
                });
            }
        } else {
            title.textContent = 'إضافة مصروف جديد';
            form.reset();
            document.getElementById('date').value = new Date().toISOString().split('T')[0];
            
            document.querySelectorAll('.category-btn').forEach(btn => {
                btn.classList.remove('active');
            });
        }
        
        modal.classList.remove('hidden');
    }
    
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
        
        if (!this.categories.includes(category)) {
            this.categories.push(category);
            this.renderCategories();
            this.renderSettingsCategories();
        }
        
        if (this.editingExpenseId) {
            const index = this.expenses.findIndex(exp => exp.id === this.editingExpenseId);
            if (index !== -1) {
                this.expenses[index] = {
                    ...this.expenses[index],
                    amount,
                    category,
                    date: new Date(date).toISOString(),
                    notes,
                    source: 'manual'
                };
                this.showNotification('تم تحديث المصروف بنجاح', 'success');
            }
        } else {
            const newExpense = {
                id: Date.now(),
                amount,
                category,
                date: new Date(date).toISOString(),
                notes,
                source: 'manual',
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
    
    editExpense(id) {
        this.openExpenseModal(id);
    }
    
    deleteExpense(id) {
        if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
            this.expenses = this.expenses.filter(exp => exp.id !== id);
            this.saveData();
            this.render();
            this.updateStats();
            this.showNotification('تم حذف المصروف بنجاح', 'success');
        }
    }
    
    deleteCategory(category) {
        if (confirm(`هل أنت متأكد من حذف فئة "${category}"؟\nسيتم حذف جميع المصروفات المرتبطة بهذه الفئة.`)) {
            this.expenses = this.expenses.filter(exp => exp.category !== category);
            this.categories = this.categories.filter(cat => cat !== category);
            
            this.saveData();
            this.render();
            this.updateStats();
            this.showNotification('تم حذف الفئة وجميع مصروفاتها', 'success');
        }
    }
    
    closeModal(modalName) {
        if (modalName === 'expense') {
            document.getElementById('expense-modal').classList.add('hidden');
            this.editingExpenseId = null;
        } else if (modalName === 'telegram') {
            document.getElementById('telegram-modal').classList.add('hidden');
        } else if (modalName === 'settings') {
            document.getElementById('settings-modal').classList.add('hidden');
        } else if (modalName === 'issue') {
            document.getElementById('issue-modal').classList.add('hidden');
        }
    }
    
    openTelegramModal() {
        document.getElementById('telegram-modal').classList.remove('hidden');
        
        // تعبئة البيانات المحفوظة
        document.getElementById('bot-token').value = this.settings.telegram.botToken || '';
        document.getElementById('chat-id').value = this.settings.telegram.chatId || '';
    }
    
    openSettingsModal() {
        document.getElementById('settings-modal').classList.remove('hidden');
        this.switchSettingsTab('general');
        
        document.getElementById('monthly-budget').value = this.settings.monthlyBudget;
        document.getElementById('budget-warning').value = this.settings.budgetWarning;
        document.getElementById('warning-percentage').textContent = `${this.settings.budgetWarning}%`;
        document.getElementById('notifications-toggle').checked = this.settings.notifications;
        document.getElementById('auto-process-toggle').checked = this.settings.autoProcess;
    }
    
    switchSettingsTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }
    
    saveBudget() {
        const budget = parseFloat(document.getElementById('monthly-budget').value);
        const warning = parseInt(document.getElementById('budget-warning').value);
        const notifications = document.getElementById('notifications-toggle').checked;
        const autoProcess = document.getElementById('auto-process-toggle').checked;
        
        if (budget < 0) {
            this.showNotification('الميزانية يجب أن تكون قيمة موجبة', 'error');
            return;
        }
        
        this.settings.monthlyBudget = budget;
        this.settings.budgetWarning = warning;
        this.settings.notifications = notifications;
        this.settings.autoProcess = autoProcess;
        
        this.saveData();
        this.updateStats();
        
        if (autoProcess !== this.settings.autoProcess) {
            this.setupTelegramPolling();
        }
        
        this.showNotification('تم حفظ الإعدادات بنجاح', 'success');
    }
    
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
    
    selectCategory(category) {
        document.getElementById('custom-category').value = category;
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
    }
    
    toggleDarkMode() {
        this.settings.darkMode = !this.settings.darkMode;
        document.body.classList.toggle('dark', this.settings.darkMode);
        document.getElementById('dark-mode-toggle').checked = this.settings.darkMode;
        this.saveData();
    }
    
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
                        
                        // دمج الإعدادات القديمة مع الجديدة
                        if (data.settings.telegram) {
                            this.settings.telegram = { ...this.settings.telegram, ...data.settings.telegram };
                        }
                        
                        // الحفاظ على الإعدادات الأخرى
                        this.settings.darkMode = data.settings.darkMode || this.settings.darkMode;
                        this.settings.monthlyBudget = data.settings.monthlyBudget || this.settings.monthlyBudget;
                        this.settings.budgetWarning = data.settings.budgetWarning || this.settings.budgetWarning;
                        this.settings.notifications = data.settings.notifications !== undefined ? data.settings.notifications : this.settings.notifications;
                        
                        document.body.classList.toggle('dark', this.settings.darkMode);
                        document.getElementById('dark-mode-toggle').checked = this.settings.darkMode;
                        
                        this.saveData();
                        this.render();
                        this.updateStats();
                        this.checkTelegramConnection();
                        this.setupTelegramPolling();
                        
                        this.showNotification('تم استيراد البيانات بنجاح', 'success');
                    }
                } else {
                    this.showNotification('صيغة الملف غير صحيحة', 'error');
                }
            } catch (error) {
                console.error('خطأ في قراءة الملف:', error);
                this.showNotification('خطأ في قراءة الملف', 'error');
            }
            
            event.target.value = '';
        };
        reader.readAsText(file);
    }
    
    resetData() {
        if (confirm('هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء.')) {
            this.expenses = [];
            this.categories = ['طعام', 'مواصلات', 'فواتير', 'تسوق', 'ترفيه'];
            this.settings = {
                darkMode: false,
                monthlyBudget: 5000,
                budgetWarning: 80,
                notifications: true,
                autoProcess: true,
                telegram: {
                    botToken: '',
                    chatId: '',
                    connected: false,
                    lastUpdateId: 0
                },
                currency: 'د.ج'
            };
            
            document.body.classList.remove('dark');
            
            localStorage.clear();
            this.render();
            this.updateStats();
            this.checkTelegramConnection();
            this.showNotification('تم مسح جميع البيانات بنجاح', 'success');
        }
    }
    
    filterExpenses() {
        this.renderAllExpenses();
    }
    
    getFilteredExpenses() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        const monthFilter = document.getElementById('month-filter').value;
        
        return this.expenses.filter(expense => {
            if (searchTerm && !(
                expense.category.toLowerCase().includes(searchTerm) ||
                expense.amount.toString().includes(searchTerm) ||
                (expense.notes && expense.notes.toLowerCase().includes(searchTerm)) ||
                expense.source.includes(searchTerm)
            )) {
                return false;
            }
            
            if (categoryFilter !== 'all' && expense.category !== categoryFilter) {
                return false;
            }
            
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
    
    getMonthlyExpenses() {
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return (
                expenseDate.getMonth() === this.currentMonth &&
                expenseDate.getFullYear() === this.currentYear
            );
        });
    }
    
    getMonthlyTotal() {
        return this.getMonthlyExpenses().reduce((sum, exp) => sum + exp.amount, 0);
    }
    
    getRecentExpenses(limit = 5) {
        return [...this.expenses]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, limit);
    }
    
    checkEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const hasExpenses = this.expenses.length > 0;
        
        if (hasExpenses) {
            emptyState.classList.add('hidden');
        } else {
            emptyState.classList.remove('hidden');
        }
    }
    
    getCategoryColor(category) {
        const colors = [
            '#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
            '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'
        ];
        
        const index = this.categories.indexOf(category);
        return colors[index % colors.length] || colors[0];
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
            case 'warning':
                iconClass = 'fas fa-exclamation-triangle';
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
    
    openIssueModal() {
        document.getElementById('issue-modal').classList.remove('hidden');
    }
    
    submitIssueReport() {
        const issueType = document.getElementById('issue-type').value;
        const description = document.getElementById('issue-description').value.trim();
        
        if (!description) {
            this.showNotification('الرجاء وصف المشكلة', 'error');
            return;
        }
        
        // في تطبيق حقيقي، هنا يتم إرسال التقرير للخادم
        // لكننا سنقوم بمحاكاة الإرسال فقط
        
        const issueData = {
            type: issueType,
            description: description,
            timestamp: new Date().toISOString(),
            settings: {
                telegramConnected: this.settings.telegram.connected,
                expensesCount: this.expenses.length,
                categoriesCount: this.categories.length
            }
        };
        
        console.log('تم الإبلاغ عن المشكلة:', issueData);
        
        this.showNotification('شكراً على الإبلاغ، سنقوم بمعالجة المشكلة', 'success');
        this.closeModal('issue');
        
        // مسح النموذج
        document.getElementById('issue-form').reset();
    }
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    window.expenseTracker = new ExpenseTracker();
});
