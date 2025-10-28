/* =================================
משתנים גלובליים
=================================
*/
let currentPageId = 'screen-home'; // עמוד הבית הוא ברירת המחדל
let currentItemElement = null; // ישמש את מודאל הסטטוס
let activeSwipeElement = null; // ישמש למעקב אחרי פריט פתוח


// ... (משתנים גלובליים של לוגיקת החלקה - ללא שינוי)
let startX = 0,
    currentX = 0,
    isDragging = false,
    targetElement = null,
    swipeThreshold = 80,
    isSwiped = false;

// משתנים שיחזיקו את האלמנטים מה-DOM
let statusModal, statusOverlay;
let quickAddModal, quickAddOverlay;
let resolveGapModal, resolveGapOverlay;
let warehouseDetailsList;
let currentActivityIdForEdit = null; // ישמש לעדכון ציוד בפעילות    


/* =================================
פונקציות ניווט (ללא שינוי)
=================================
*/
function showPage(pageId, title) {
    if (pageId === currentPageId && document.getElementById(pageId).classList.contains('active')) return;
    const currentPage = document.getElementById(currentPageId);
    const nextPage = document.getElementById(pageId);
    if (pageId === 'screen-warehouse-details' && title) {
        document.getElementById('warehouse-title').innerText = title;
    }
    if (pageId === 'screen-activity-details' && title) {
        document.getElementById('activity-title').innerText = title;
    }
    if (pageId === 'screen-edit-item' && title) {
        console.log("עובר לעמוד עריכה עם כותרת:", title);
    }
    if (currentPage) currentPage.classList.remove('active');
    if (nextPage) nextPage.classList.add('active');
    currentPageId = pageId;
    updateNavActive(pageId);
}

function updateNavActive(pageId) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    let activeNavItem = null;
    if (pageId.includes('home')) {
        activeNavItem = document.querySelector('.nav-item:nth-child(1)');
    } else if (pageId.includes('activities') || pageId.includes('add-activity')) {
        activeNavItem = document.querySelector('.nav-item:nth-child(2)');
    } else if (pageId.includes('warehouses') || pageId.includes('item') || pageId.includes('report-issue')) {
        activeNavItem = document.querySelector('.nav-item:nth-child(3)');
    }
    if (activeNavItem) activeNavItem.classList.add('active');
}


/* =================================
פונקציות מודאלים (ללא שינוי)
=================================
*/

function openQuickAddModal() {
    quickAddModal.classList.add('active');
    quickAddOverlay.classList.add('active');
}

function closeQuickAddModal() {
    quickAddModal.classList.remove('active');
    quickAddOverlay.classList.remove('active');
}

function openStatusModal(element, itemName, currentStatus, itemId) {
    currentItemElement = element;
    currentItemElement.dataset.id = itemId;
    const secondaryInfoEl = currentItemElement.querySelector('.equipment-secondary-info');
    if (secondaryInfoEl) {
        currentItemElement.dataset.originalInfo = secondaryInfoEl.innerText;
    }
    document.getElementById('modal-item-name').innerText = 'שנה סטטוס עבור: ' + itemName;
    statusModal.classList.add('active');
    statusOverlay.classList.add('active');
}

function closeStatusModal() {
    statusModal.classList.remove('active');
    statusOverlay.classList.remove('active');
}

function changeStatus(newStatusClass, newStatusText) {
    if (!currentItemElement) return;
    const itemId = currentItemElement.dataset.id;
    if (!itemId) {
        console.error("לא נמצא ID לפריט!");
        return;
    }
    const newStatus = newStatusClass.replace('status-', '');
    updateEquipmentStatus(itemId, newStatus);

    if (newStatus === 'loaned') {
        const item = getEquipmentById(itemId);
        // TODO: להוסיף פופאפ ששואל למי להשאיל
        item.loanedToUserId = "u-3"; // השאלה לעידו כהן לצורך הדגמה
    }
    saveDB();
    const item = getEquipmentById(itemId);
    renderWarehouseDetails(item.warehouseId);
    closeStatusModal();
}

function editItemDetails() {
    if (!currentItemElement) return;
    const itemId = currentItemElement.dataset.id;
    const item = getEquipmentById(itemId);
    if (!item) {
        console.error("לא ניתן לערוך. לא נמצא פריט עם ID:", itemId);
        return;
    }
    closeStatusModal();
    // קריאה לפונקציה חדשה שמכינה את טופס העריכה
    prepareAndShowEditItemPage(item);
}

function openResolveGapModal(itemName) {
    document.getElementById('resolve-gap-title').innerText = 'טיפול בפער: ' + itemName + ' (1 חסר)';
    resolveGapModal.classList.add('active');
    resolveGapOverlay.classList.add('active');
}

function closeResolveGapModal() {
    resolveGapModal.classList.remove('active');
    resolveGapOverlay.classList.remove('active');
}


/* =================================
פונקציות רינדור (ללא שינוי)
=================================
*/

function generateEquipmentItemHTML(item) {
    const manager = getUserById(item.managerUserId);
    const checkDate = new Date(item.lastCheckDate).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });
    let secondaryInfo = `אחראי: ${manager?.name || 'לא ידוע'} • ווידוא: ${checkDate}`;
    let secondaryInfoStyle = "";
    if (item.status === 'loaned') {
        const loanedToUser = getUserById(item.loanedToUserId);
        secondaryInfo = `הושאל ל: ${loanedToUser?.name || 'לא ידוע'} • עד: 29/10/25`;
        secondaryInfoStyle = `style="color: var(--status-orange);"`;
    }
    const statusMap = {
        'available': { text: 'כשיר', class: 'status-available' },
        'charging': { text: 'בטעינה', class: 'status-charging' },
        'broken': { text: 'לא כשיר', class: 'status-broken' },
        'repair': { text: 'בתיקון', class: 'status-repair' },
        'loaned': { text: 'הושאל', class: 'status-loaned' }
    };
    const statusInfo = statusMap[item.status] || { text: 'לא ידוע', class: 'status-grey' };

    return `
        <div class="swipe-container" data-id="${item.id}" data-status="${item.status}" data-validate-date="${item.lastCheckDate}">
            <div class="swipe-action-left">
                בצע ווידוא
            </div>
            <div class="equipment-item-content">
                <div class="equipment-details">
                    <div class="equipment-name">${item.name}</div>
                    <div class="equipment-secondary-info" ${secondaryInfoStyle}>${secondaryInfo}</div>
                </div>
                <div class="equipment-status ${statusInfo.class}">
                    <span class="status-dot"></span>
                    <span>${statusInfo.text}</span>
                </div>
            </div>
        </div>
    `;
}

function renderWarehouseDetails(warehouseId) {
    const listContainer = document.querySelector('#screen-warehouse-details .equipment-list');
    if (!listContainer) return;
    const items = getEquipmentForWarehouse(warehouseId);
    if (items.length === 0) {
        listContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">אין פריטים במחסן זה.</p>`;
        return;
    }
    let htmlContent = "";
    items.forEach(item => {
        htmlContent += generateEquipmentItemHTML(item);
    });
    listContainer.innerHTML = htmlContent;
}

function renderWarehouseList() {
    const listContainer = document.querySelector('#screen-warehouses-list .container');
    if (!listContainer) return;
    listContainer.innerHTML = "";
    db.warehouses.forEach(warehouse => {
        const items = getEquipmentForWarehouse(warehouse.id);
        const totalItems = items.length;
        const availableItems = items.filter(i => i.status === 'available').length;
        let statusClass = 'status-green';
        if (totalItems > 0 && (availableItems / totalItems) < 0.5) {
            statusClass = 'status-red';
        }
        const cardHTML = `
            <div class="warehouse-card" data-id="${warehouse.id}" data-title="${warehouse.name}">
                <div>
                    <h3 class="warehouse-card-title">${warehouse.name}</h3>
                    <div class="warehouse-card-status ${statusClass}">${availableItems}/${totalItems} פריטים כשירים</div>
                </div>
                <span class="chevron">&#9664;</span>
            </div>
        `;
        listContainer.innerHTML += cardHTML;
    });
}

function renderActivityList() {
    const listContainer = document.querySelector('#screen-activities-list .container');
    if (!listContainer) return;
    listContainer.innerHTML = "";
    db.activities.forEach(activity => {
        const manager = getUserById(activity.managerUserId);
        const date = new Date(activity.date).toLocaleDateString('he-IL', { day: '2-digit', month: 'short', year: 'numeric' });
        const total = activity.equipmentRequiredIds.length + activity.equipmentMissingIds.length;
        const available = activity.equipmentRequiredIds.length;
        const statusClass = (available < total) ? 'status-red' : 'status-green';
        const statusText = (available < total) ? `${available}/${total} פריטים כשירים <span class="status-dot"></span>` : `${available}/${total} פריטים כשירים`;
        const cardHTML = `
            <div class="activity-card" data-id="${activity.id}" data-title="${activity.name}">
                <div class="activity-card-header">
                    <div>
                        <h3 class="activity-card-title">${activity.name}</h3>
                        <div class="activity-card-date">תאריך: ${date}</div>
                        <div class="activity-card-person">אחראי: ${manager?.name || 'לא ידוע'}</div>
                    </div>
                </div>
                <div class="activity-card-footer">
                    <div class="activity-card-status ${statusClass}">${statusText}</div>
                    <button type="button" class="btn-action">נהל ציוד &rarr;</button>
                </div>
            </div>
        `;
        listContainer.innerHTML += cardHTML;
    });
}

/**
 * מרנדר את עמוד פרטי הפעילות עם נתונים מה-DB
 * (גרסה משודרגת שבודקת סטטוס עדכני של פריטים)
 * @param {string} activityId - ה-ID של הפעילות לטעינה
 */
function renderActivityDetails(activityId) {
    const activity = getActivityById(activityId);
    if (!activity) {
        console.error("לא נמצאה פעילות עם ID:", activityId);
        return;
    }

    // "שתילת" ה-ID על המסך כדי שכפתור "ערוך" ימצא אותו
    document.getElementById('screen-activity-details').dataset.activityId = activityId;

    // 1. מצא את האלמנטים ב-DOM
    const statusTitleEl = document.getElementById('activity-status-title');
    const missingListEl = document.getElementById('activity-missing-list');
    const assignedListEl = document.getElementById('activity-assigned-list');

    // 2. נקה תוכן קודם
    missingListEl.innerHTML = "";
    assignedListEl.innerHTML = "";

    // --- הלוגיקה החדשה ---
    // 3. אנו בונים רשימות חדשות על בסיס הסטטוס העדכני
    const finalAssignedIds = [];
    const finalMissingIds = []; // פריטים שהתקלקלו + פריטים שהיו חסרים
    const statusMap = {
        'broken': 'לא כשיר',
        'repair': 'בתיקון',
        'loaned': 'הושאל'
    };

    // 4. בדוק את כל הפריטים ש"אמורים" להיות כשירים
    activity.equipmentRequiredIds.forEach(itemId => {
        const item = getEquipmentById(itemId);
        if (item) {
            // האם הפריט עדיין כשיר?
            if (item.status === 'available' || item.status === 'charging') {
                finalAssignedIds.push(item);
            } else {
                // הפריט התקלקל! הוסף אותו לרשימת החסרים
                finalMissingIds.push(item);
            }
        }
    });

    // 5. הוסף את הפריטים ש"כבר" היו חסרים
    activity.equipmentMissingIds.forEach(itemId => {
        const item = getEquipmentById(itemId);
        if (item) {
            finalMissingIds.push(item);
        }
    });
    // --- סוף הלוגיקה החדשה ---


    // 6. עדכן כותרת סטטוס (לפי הרשימות החדשות)
    const totalAssigned = finalAssignedIds.length;
    const totalMissing = finalMissingIds.length;
    const totalItems = totalAssigned + totalMissing;
    statusTitleEl.innerText = `סטטוס בד"ח (${totalAssigned}/${totalItems})`;

    // 7. רנדר פריטים חסרים (finalMissingIds)
    if (totalMissing > 0) {
        finalMissingIds.forEach(item => {
            const itemStatusText = statusMap[item.status] || item.status;
            const itemHtml = `
                <div class="status-item missing" onclick="openResolveGapModal('${item.name}')">
                    <span class="status-item-icon icon-red">&times;</span>
                    <div class="status-item-details">
                        <div class="status-item-title">${item.name} (נדרש)</div>
                        <div class="status-item-subtitle">סטטוס נוכחי: ${itemStatusText}. לחץ לטיפול...</div>
                    </div>
                </div>
            `;
            missingListEl.innerHTML += itemHtml;
        });
    }

    // 8. רנדר פריטים כשירים ומשוריינים (finalAssignedIds)
    if (totalAssigned === 0) {
        assignedListEl.innerHTML = `<p style="color: var(--text-secondary); padding: 10px 0; text-align: center;">לא שוריין ציוד לפעילות זו.</p>`;
    } else {
        finalAssignedIds.forEach(item => {
            const itemHtml = `
                <div class="status-item assigned">
                    <span class="status-item-icon icon-green">&#10003;</span>
                    <div class="status-item-details">
                        <div class="status-item-title">${item.name}</div>
                        <div class="status-item-subtitle">(כשיר, שוריין)</div>
                    </div>
                </div>
            `;
            assignedListEl.innerHTML += itemHtml;
        });
    }
}
/* =================================
פונקציות טפסים (חדש)
=================================
*/
/**
 * מרנדר את רשימת בחירת הציוד למסך עריכת פעילות
 */
function renderEquipmentSelectionList() {
    if (!currentActivityIdForEdit) {
        console.error("לא נבחרה פעילות לעריכה");
        return;
    }

    const activity = getActivityById(currentActivityIdForEdit);
    if (!activity) {
        console.error("לא נמצאה פעילות עם ID:", currentActivityIdForEdit);
        return;
    }

    const listContainer = document.getElementById('equipment-selection-list-container');
    listContainer.innerHTML = ""; // נקה תוכן קודם

    // קבל את כל הציוד הקיים במערכת
    const allEquipment = db.equipment;

    if (allEquipment.length === 0) {
        listContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">לא נמצא ציוד במערכת.</p>`;
        return;
    }

    allEquipment.forEach(item => {
        const warehouse = getWarehouseById(item.warehouseId);
        const warehouseName = warehouse ? warehouse.name : "לא משויך";

        // בדוק אם הפריט כבר משויך לפעילות
        const isChecked = activity.equipmentRequiredIds.includes(item.id);

        // בדוק אם ניתן לבחור את הפריט (רק 'כשיר' או 'בטעינה' ניתנים לבחירה)
        const isSelectable = (item.status === 'available' || item.status === 'charging');

        // קבע סטטוסים ל-CSS
        const isDisabled = !isSelectable;
        const disabledClass = isDisabled ? 'disabled' : '';
        const checkedAttr = isChecked ? 'checked' : '';
        const disabledAttr = isDisabled ? 'disabled' : '';

        // קבל את הסטטוס להצגה (כמו ב-generateEquipmentItemHTML)
        const statusMap = {
            'available': { text: 'כשיר', class: 'status-available' },
            'charging': { text: 'בטעינה', class: 'status-charging' },
            'broken': { text: 'לא כשיר', class: 'status-broken' },
            'repair': { text: 'בתיקון', class: 'status-repair' },
            'loaned': { text: 'הושאל', class: 'status-loaned' }
        };
        const statusInfo = statusMap[item.status] || { text: 'לא ידוע', class: 'status-grey' };

        // בניית ה-HTML
        const itemHtml = `
            <div class="equipment-select-item ${disabledClass}" data-item-id="${item.id}">
                <div class="equipment-item-content">
                    <div class="equipment-details">
                        <div class="equipment-name">${item.name}</div>
                        <div class="equipment-secondary-info">מחסן: ${warehouseName}</div>
                    </div>
                    <div class="equipment-status ${statusInfo.class}">
                        <span class="status-dot"></span>
                        <span>${statusInfo.text}</span>
                    </div>
                </div>
                <div class="equipment-select-checkbox">
                    <input type="checkbox" id="item-select-${item.id}" ${checkedAttr} ${disabledAttr}>
                    <label for="item-select-${item.id}"></label>
                </div>
            </div>
        `;
        listContainer.innerHTML += itemHtml;
    });
}
/**
 * מסנן את רשימת הציוד במסך העריכה לפי טקסט חיפוש
 */
function filterEquipmentList() {
    const searchTerm = document.getElementById('equipment-search-input').value.toLowerCase();
    const items = document.querySelectorAll('#equipment-selection-list-container .equipment-select-item');
    const noResultsEl = document.getElementById('equipment-list-no-results');

    let itemsVisible = 0;

    items.forEach(item => {
        // בדוק גם את שם הפריט וגם את המידע המשני (מחסן)
        const name = item.querySelector('.equipment-name').innerText.toLowerCase();
        const info = item.querySelector('.equipment-secondary-info').innerText.toLowerCase();

        const isMatch = (name.includes(searchTerm) || info.includes(searchTerm));

        item.classList.toggle('item-hidden', !isMatch);

        if (isMatch) {
            itemsVisible++;
        }
    });

    // הצג הודעת "אין תוצאות" אם שום דבר לא תואם
    if (itemsVisible === 0 && items.length > 0) {
        noResultsEl.style.display = 'block';
    } else {
        noResultsEl.style.display = 'none';
    }
}
/**
 * ממלא את תיבות הבחירה בטופס הוספת פריט
 */
function populateAddItemForm() {
    const warehouseSelect = document.getElementById('item-warehouse-select');
    const managerSelect = document.getElementById('item-manager-select');

    // נקה אפשרויות קיימות (שמור את האפשרות הראשונה)
    warehouseSelect.innerHTML = '<option value="">בחר מחסן...</option>';
    managerSelect.innerHTML = '<option value="">בחר אחראי...</option>';

    db.warehouses.forEach(w => {
        warehouseSelect.innerHTML += `<option value="${w.id}">${w.name}</option>`;
    });
    db.users.forEach(u => {
        managerSelect.innerHTML += `<option value="${u.id}">${u.name}</option>`;
    });
}

/**
 * ממלא את תיבות הבחירה בטופס הוספת פעילות
 */
function populateAddActivityForm() {
    const managerSelect = document.getElementById('activity-manager-select');
    managerSelect.innerHTML = '<option value="">בחר אחראי...</option>';
    db.users.forEach(u => {
        managerSelect.innerHTML += `<option value="${u.id}">${u.name}</option>`;
    });
}

// --- פונקציות מעטפת להכנה והצגה ---
/**
 * מכין ומציג את עמוד הוספת הפריט
 */

/**
 * מכין ומציג את עמוד הוספת הפעילות
 */
function prepareAndShowAddItemPage() {
    // 1. אכלס את רשימות הבחירה
    populateAddItemForm();

    // 2. נקה את הטופס וודא שהוא במצב "הוספה"
    const form = document.getElementById('add-item-form');
    form.reset(); // נקה את כל השדות
    form.dataset.editId = ""; // נקה ID עריכה

    // 3. אפס את הכותרת וכפתור השמירה
    document.getElementById('add-item-title').innerText = 'הוסף פריט חדש';
    document.getElementById('add-item-submit-btn').innerText = 'שמור פריט';

    // 4. סגור את המודאל והצג את העמוד
    closeQuickAddModal();
    showPage('screen-add-item', 'הוסף פריט חדש');
}
// --- פונקציות מעטפת להכנה והצגה ---

/**
 * מכין ומציג את עמוד הוספת הפעילות
 */
function prepareAndShowAddActivityPage() {
    // 1. אכלס את רשימת האחראים
    populateAddActivityForm();

    // 2. איפוס טופס הפעילות (למקרה שנשאר מידע)
    const form = document.getElementById('add-activity-form');
    if (form) {
        form.reset();
    }

    // 3. סגור את המודאל והצג את העמוד
    closeQuickAddModal();
    showPage('screen-add-activity', 'הוסף פעילות חדשה');
}
/**
 * מכין ומציג את עמוד הוספת הפריט במצב "עריכה"
 * @param {Object} item - אובייקט הפריט לעריכה
 */
function prepareAndShowEditItemPage(item) {
    // 1. אכלס את רשימות הבחירה (כמו בטופס חדש)
    populateAddItemForm();

    // 2. מלא את שדות הטופס עם המידע הקיים
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-warehouse-select').value = item.warehouseId;
    document.getElementById('item-manager-select').value = item.managerUserId;
    document.getElementById('item-status-select').value = item.status;
    document.getElementById('item-check-date').value = item.lastCheckDate;

    // 3. שנה את הכותרת וכפתור השמירה
    document.getElementById('add-item-title').innerText = 'עריכת פריט';
    document.getElementById('add-item-submit-btn').innerText = 'עדכן פריט';

    // 4. שמור את ה-ID של הפריט הנערך על הטופס
    document.getElementById('add-item-form').dataset.editId = item.id;

    // 5. הצג את העמוד
    showPage('screen-add-item', 'עריכת פריט: ' + item.name);
}
/* =================================
מטפלי אירועים (Event Handlers) - חדש
=================================
*/

/**
 * מטפל בשליחת טופס הוספת פריט
 */
/**
 * מטפל בשליחת טופס הוספת/עריכת פריט
 */
function handleAddItemSubmit(event) {
    event.preventDefault(); // מנע שליחה רגילה
    const form = event.target;
    const editId = form.dataset.editId; // בדוק אם אנחנו במצב עריכה

    // 1. קרא נתונים מהטופס
    const name = document.getElementById('item-name').value;
    const warehouseId = document.getElementById('item-warehouse-select').value;
    const managerUserId = document.getElementById('item-manager-select').value;
    const status = document.getElementById('item-status-select').value;
    const lastCheckDate = document.getElementById('item-check-date').value;

    // 2. ולידציה בסיסית
    if (!name || !warehouseId || !managerUserId || !status || !lastCheckDate) {
        alert("אנא מלא את כל השדות.");
        return;
    }

    // 3. צור אובייקט נתונים
    const itemData = {
        name: name,
        managerUserId: managerUserId,
        lastCheckDate: lastCheckDate,
        status: status,
        warehouseId: warehouseId
    };

    if (editId) {
        // --- מצב עריכה ---

        // 4א. קרא לפונקציית העדכון החדשה ב-database.js
        updateEquipmentItem(editId, itemData);
        saveDB(); // שמור שינויים

        // 5א. חיווי, רענון, ניווט
        alert("הפריט עודכן בהצלחה!");
        form.reset(); // נקה את הטופס
        form.dataset.editId = ""; // נקה מצב עריכה

        // רענן את הרשימות הרלוונטיות
        renderWarehouseList(); // רענון ספירת פריטים כללית
        renderWarehouseDetails(itemData.warehouseId); // רענון המסך ממנו באנו

        // נווט חזרה למסך פרטי המחסן
        const warehouse = db.warehouses.find(w => w.id === itemData.warehouseId);
        const warehouseTitle = warehouse ? warehouse.name : "פרטי מחסן";
        showPage('screen-warehouse-details', warehouseTitle);

    } else {
        // --- מצב הוספה (הלוגיקה הקיימת) ---

        // 4ב. צור ID חדש והוסף שדות חסרים
        itemData.id = 'eq-' + Date.now(); // ID ייחודי פשוט
        itemData.loanedToUserId = null;

        // 5ב. הוסף ל-DB ושמור
        db.equipment.push(itemData);
        saveDB();

        // 6ב. חיווי, רענון, ניווט
        alert("פריט חדש נוסף בהצלחה!");
        form.reset(); // נקה את הטופס
        renderWarehouseList(); // רענן את רשימת המחסנים
        showPage('screen-warehouses-list');
    }
}
/**
 * מטפל בשליחת טופס הוספת פעילות
 */
function handleAddActivitySubmit(event) {
    event.preventDefault();

    // 1. קרא נתונים
    const name = document.getElementById('activity-name').value;
    const managerUserId = document.getElementById('activity-manager-select').value;
    const date = document.getElementById('activity-date').value;

    // 2. ולידציה
    if (!name || !managerUserId || !date) {
        alert("אנא מלא את כל השדות.");
        return;
    }

    // 3. צור אובייקט
    const newActivity = {
        id: 'act-' + Date.now(),
        name: name,
        managerUserId: managerUserId,
        date: date,
        equipmentRequiredIds: [], // מתחיל ריק, אפשר להוסיף לוגיקה לבחירה
        equipmentMissingIds: []
    };

    // 4. הוסף ל-DB ושמור
    db.activities.push(newActivity);
    saveDB();

    // 5. חיווי, רענון, ניווט
    alert("פעילות חדשה נוספה בהצלחה!");
    event.target.reset();
    renderActivityList(); // רענן את רשימת הפעילויות
    showPage('screen-activities-list');
}
/**
 * מטפל בשמירת השינויים במסך עריכת ציוד לפעילות
 */
function handleSaveActivityEquipment() {
    if (!currentActivityIdForEdit) {
        console.error("שגיאה: אין פעילות במצב עריכה.");
        return;
    }

    // 1. אסוף את כל ה-ID של הפריטים שסומנו
    const selectedIds = [];
    const checkboxes = document.querySelectorAll('#equipment-selection-list-container input[type="checkbox"]:checked');
    checkboxes.forEach(cb => {
        // הפריט נשמר ב-data-item-id על האלמנט האבא
        const itemId = cb.closest('.equipment-select-item').dataset.itemId;
        if (itemId) {
            selectedIds.push(itemId);
        }
    });

    // 2. קרא לפונקציית העדכון ב-database
    // הפונקציה הזו תמיין מחדש ל"כשירים" ו"חסרים" ותשמור
    updateActivityEquipment(currentActivityIdForEdit, selectedIds);

    // 3. עדכן את ה-UI
    alert("השינויים נשמרו בהצלחה!");

    // 4. רענן את העמודים הרלוונטיים
    renderActivityDetails(currentActivityIdForEdit); // רענן את מסך הפרטים
    renderActivityList(); // רענן את רשימת הפעילויות (לעדכון ספירה)

    // 5. נווט חזרה למסך פרטי הפעילות
    showPage('screen-activity-details');

    // 6. נקה את המשתנה הגלובלי
    currentActivityIdForEdit = null;
}

/* =================================
לוגיקה ספציפית (ללא שינוי)
=================================
*/

// --- סינון (פילטרים) ---
function filterItems(filterType, clickedChip) {
    document.querySelectorAll('.filter-chips .chip').forEach(chip => chip.classList.remove('active'));
    clickedChip.classList.add('active');
    const items = document.querySelectorAll('#screen-warehouse-details .swipe-container');
    const today = new Date();
    const validationThreshold = new Date(new Date().setDate(today.getDate() - 30));
    items.forEach(item => {
        let show = false;
        const status = item.dataset.status;
        switch (filterType) {
            case 'all':
                show = true;
                break;
            case 'validate':
                const validateDate = new Date(item.dataset.validateDate);
                if (validateDate < validationThreshold) { show = true; }
                break;
            case 'broken':
                if (status === 'broken' || status === 'repair') { show = true; }
                break;
            case 'loaned':
                if (status === 'loaned') { show = true; }
                break;
        }
        item.classList.toggle('item-hidden', !show);
    });
}

// --- ביצוע ווידוא (שונה) ---
function validateItem(button) {
    const itemContainer = button.closest('.swipe-container');
    const infoEl = itemContainer.querySelector('.equipment-secondary-info');
    const itemId = itemContainer.dataset.id;
    const item = getEquipmentById(itemId);
    if (!item) return;

    item.lastCheckDate = new Date().toISOString().split('T')[0];
    saveDB();

    const today = new Date(item.lastCheckDate).toLocaleDateString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
    // 1. נסה להביא את המשתמש
    const manager = getUserById(item.managerUserId);

    // 2. בדוק אם המשתמש קיים. אם כן, השתמש בשם. אם לא, השתמש ב-'אחראי'.
    const responsible = manager ? manager.name : 'אחראי';
    infoEl.innerText = `${responsible} • ווידוא: ${today}`;
    itemContainer.dataset.validateDate = item.lastCheckDate;

    const content = itemContainer.querySelector('.equipment-item-content');
    content.style.backgroundColor = '#444';
    setTimeout(() => {
        content.style.backgroundColor = 'var(--card-bg-color)';
    }, 300);

    closeSwipeItem(content);
}

// --- לוגיקת החלקה (Swipe) (ללא שינוי) ---
function onSwipeStart(e) {
    targetElement = e.target.closest('.equipment-item-content');
    if (!targetElement) return;
    if (activeSwipeElement && activeSwipeElement !== targetElement) {
        closeSwipeItem(activeSwipeElement);
    }
    startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    isDragging = true;
    isSwiped = false;
    targetElement.style.transition = 'none';
    if (targetElement.previousElementSibling) {
        targetElement.previousElementSibling.style.transition = 'none';
    }
}

function onSwipeMove(e) {
    if (!isDragging || !targetElement) return;
    currentX = e.type === 'touchmove' ? e.touches[0].clientX : e.clientX;
    let diffX = currentX - startX;
    if (diffX < 0) diffX = 0;
    if (diffX > 120) diffX = 120;
    targetElement.style.transform = `translateX(${diffX}px)`;
    if (targetElement.previousElementSibling) {
        targetElement.previousElementSibling.style.transform = `translateX(${diffX - 100}px)`;
    }
    isSwiped = true;
}

function onSwipeEnd(e) {
    if (!isDragging || !targetElement) return;
    isDragging = false;
    let diffX = currentX - startX;
    targetElement.style.transition = 'transform 0.3s ease';
    if (targetElement.previousElementSibling) {
        targetElement.previousElementSibling.style.transition = 'transform 0.3s ease';
    }
    if (diffX > swipeThreshold) {
        targetElement.style.transform = 'translateX(100px)';
        if (targetElement.previousElementSibling) {
            targetElement.previousElementSibling.style.transform = 'translateX(0)';
        }
        activeSwipeElement = targetElement;
    } else {
        closeSwipeItem(targetElement);
        if (diffX < 10) isSwiped = false;
    }
    startX = 0;
    currentX = 0;
    targetElement = null;
}

function closeSwipeItem(element) {
    if (!element) return;
    element.style.transform = 'translateX(0)';
    if (element.previousElementSibling) {
        element.previousElementSibling.style.transform = 'translateX(-100px)';
    }
    if (activeSwipeElement === element) {
        activeSwipeElement = null;
    }
}


/* =================================
אתחול האפליקציה (שונה)
=================================
*/
document.addEventListener("DOMContentLoaded", () => {

    // **חדש**: טען את בסיס הנתונים מ-localStorage
    loadDB();

    // 1. אתחול משתני אלמנטים
    statusModal = document.getElementById('status-modal');
    statusOverlay = document.getElementById('status-modal-overlay');
    quickAddModal = document.getElementById('quick-add-modal');
    quickAddOverlay = document.getElementById('quick-add-modal-overlay');
    resolveGapModal = document.getElementById('resolve-gap-modal');
    resolveGapOverlay = document.getElementById('resolve-gap-modal-overlay');
    warehouseDetailsList = document.getElementById('screen-warehouse-details');

    // 2. הגדרת העמוד ההתחלתי
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    const homePage = document.getElementById(currentPageId);
    if (homePage) {
        homePage.classList.add('active');
    }
    updateNavActive(currentPageId);

    // 3. מילוי תוכן דינמי (מודאל הוספה מהירה) - **שונה**
    if (quickAddModal) {
        // **שינינו את ה-onclick לפונקציות ההכנה החדשות**
        quickAddModal.innerHTML = `
        <div class="modal-options">
            <div onclick="prepareAndShowAddActivityPage()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                הוסף פעילות חדשה
            </div>
            <div onclick="prepareAndShowAddItemPage()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 16.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zM3 16.5c.83 0 1.5.67 1.5 1.5S3.83 19.5 3 19.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zM20 6l-1.97-2H5.97L4 6H1v11h2.06c.05-.8.36-1.52.84-2.11-.8-.3-1.4-1.01-1.4-1.89 0-1.1.9-2 2-2s2 .9 2 2c0 .88-.6 1.59-1.4 1.89.48.59.79 1.31.84 2.11H17.5c.05-.8.36-1.52.84-2.11-.8-.3-1.4-1.01-1.4-1.89 0-1.1.9-2 2-2s2 .9 2 2c0 .88-.6 1.59-1.4 1.89.48.59.79 1.31.84 2.11H23V6h-3zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM5.14 8h13.72l.96-1H4.18l.96 1z"/></svg> 
                הוסף פריט ציוד חדש
            </div>
        </div>
        <button class="btn-cancel" onclick="closeQuickAddModal()">ביטול</button>`;
    }

    // **חדש**: הוספת מאזינים לטפסים החדשים
    const addItemForm = document.getElementById('add-item-form');
    if (addItemForm) {
        addItemForm.addEventListener('submit', handleAddItemSubmit);
    }

    const addActivityForm = document.getElementById('add-activity-form');
    if (addActivityForm) {
        addActivityForm.addEventListener('submit', handleAddActivitySubmit);
    }

    // 4. הוספת מאזיני אירועים (Swipe)
    if (warehouseDetailsList) {
        warehouseDetailsList.addEventListener('mousedown', onSwipeStart);
        warehouseDetailsList.addEventListener('mousemove', onSwipeMove);
        warehouseDetailsList.addEventListener('mouseup', onSwipeEnd);
        warehouseDetailsList.addEventListener('mouseleave', onSwipeEnd);
        warehouseDetailsList.addEventListener('touchstart', onSwipeStart);
        warehouseDetailsList.addEventListener('touchmove', onSwipeMove);
        warehouseDetailsList.addEventListener('touchend', onSwipeEnd);

        warehouseDetailsList.addEventListener('click', function(e) {
            if (isSwiped) {
                e.preventDefault();
                e.stopPropagation();
                isSwiped = false;
                return;
            }
            const validateButton = e.target.closest('.swipe-action-left');
            if (validateButton) {
                validateItem(validateButton);
                return;
            }
            const itemContent = e.target.closest('.equipment-item-content');
            if (itemContent) {
                const container = itemContent.closest('.swipe-container');
                const itemId = container.dataset.id;
                const status = container.dataset.status;
                const name = container.querySelector('.equipment-name').innerText;
                openStatusModal(container, name, status, itemId);
            }
        }, true);
    }

    // 5. קישור ידני של פונקציות גלובליות לאלמנטים
    setupGlobalEventListeners();

    // 6. רנדור תוכן דינמי בפעם הראשונה
    renderWarehouseList();
    renderActivityList();
    // TODO: להוסיף פונקציה renderHomePage()

    console.log("אפליקציה אותחלה בהצלחה עם DB וטפסים!");
});


/**
 * פונקציית עזר שמרכזת את כל מאזיני האירועים
 * (שונתה כדי לטפל ברשימות דינמיות וכפתורי חזור חדשים)
 */
function setupGlobalEventListeners() {

    // --- ניווט תחתון (ללא שינוי) ---
    const navItems = document.querySelectorAll('.nav-item');
    if (navItems.length === 3) {
        navItems[0].onclick = () => showPage('screen-home');
        navItems[1].onclick = () => showPage('screen-activities-list');
        navItems[2].onclick = () => showPage('screen-warehouses-list');
    }

    // --- כפתור צף (ללא שינוי) ---
    const fab = document.querySelector('.fab');
    if (fab) fab.onclick = openQuickAddModal;
    const saveActivityEquipmentBtn = document.getElementById('save-activity-equipment-btn');
    if (saveActivityEquipmentBtn) {
        saveActivityEquipmentBtn.onclick = handleSaveActivityEquipment;
    }
    // --- מודאלים (כפתורי סגירה וביטול - ללא שינוי) ---
    if (statusOverlay) statusOverlay.onclick = closeStatusModal;
    if (quickAddOverlay) quickAddOverlay.onclick = closeQuickAddModal;
    if (resolveGapOverlay) resolveGapOverlay.onclick = closeResolveGapModal;
    const cancelButtons = document.querySelectorAll('.btn-cancel');
    cancelButtons.forEach(btn => {
        const modal = btn.closest('.modal-container');
        if (modal) {
            if (modal.id === 'status-modal') btn.onclick = closeStatusModal;
            if (modal.id === 'quick-add-modal') btn.onclick = closeQuickAddModal;
            if (modal.id === 'resolve-gap-modal') btn.onclick = closeResolveGapModal;
        }
    });
    // --- מאזיני חיפוש ופילטור במסך עריכת ציוד ---
    const searchInput = document.getElementById('equipment-search-input');
    if (searchInput) {
        // הפעל את הפונקציה בכל פעם שהמשתמש מקליד
        searchInput.addEventListener('input', filterEquipmentList);
    }

    const filterBtn = document.getElementById('equipment-filter-btn');
    if (filterBtn) {
        filterBtn.onclick = () => {
            // TODO: להטמיע לוגיקת פילטור (דורש מודאל)
            alert("לוגיקת פילטור תוטמע כאן בהמשך.");
        };
    }
    // --- כפתורי "חזור" (עודכן) ---
    document.querySelectorAll('.back-button').forEach(btn => {
        const page = btn.closest('.page');
        if (page) {
            if (page.id === 'screen-warehouse-details') {
                btn.onclick = () => showPage('screen-warehouses-list');
            }
            if (page.id === 'screen-activity-details') {
                btn.onclick = () => showPage('screen-activities-list');
            }
            // **חדש**: כפתורי חזור לטפסים
            if (page.id === 'screen-add-item') {
                // החלטנו שזה מחזיר לרשימת המחסנים
                btn.onclick = () => showPage('screen-warehouses-list');
            }
            if (page.id === 'screen-add-activity') {
                // מחזיר לרשימת הפעילויות
                btn.onclick = () => showPage('screen-activities-list');
            }
            // --- הוסף את הבלוק הזה ---
            if (page.id === 'screen-edit-activity-equipment') {
                // זה מחזיר למסך פרטי הפעילות
                btn.onclick = () => showPage('screen-activity-details');
            }
            // ------------------------
        }
    });

    // *** האזנה לרשימות דינמיות (Event Delegation) ***
    // --- האזנה לכפתור עריכת ציוד בפעילות ---
    const editActivityBtn = document.getElementById('edit-activity-equipment-btn');
    if (editActivityBtn) {
        editActivityBtn.onclick = () => {
            // 1. קרא את ה-ID של הפעילות מהאלמנט של המסך
            const activityId = document.getElementById('screen-activity-details').dataset.activityId;
            if (!activityId) {
                alert("שגיאה: לא ניתן לזהות את הפעילות הנבחרת.");
                return;
            }

            // 2. שמור אותו במשתנה הגלובלי
            currentActivityIdForEdit = activityId;

            // 3. קרא את שם הפעילות לכותרת
            const activity = getActivityById(activityId);
            const activityName = activity ? activity.name : "פעילות";

            // 4. קרא לפונקציה שמרנדרת את הרשימה
            renderEquipmentSelectionList();

            // 5. עכשיו נווט למסך העריכה עם הכותרת הנכונה
            showPage('screen-edit-activity-equipment', `עריכת ציוד (${activityName})`);
        };
    }
    // --- האזנה לקליקים על רשימת המחסנים ---
    const warehouseListPage = document.getElementById('screen-warehouses-list');
    if (warehouseListPage) {
        warehouseListPage.addEventListener('click', (e) => {
            const card = e.target.closest('.warehouse-card');
            if (card) {
                const warehouseId = card.dataset.id;
                const warehouseTitle = card.dataset.title;
                renderWarehouseDetails(warehouseId);
                showPage('screen-warehouse-details', warehouseTitle);
            }
        });
    }

    // --- האזנה לקליקים על רשימת הפעילויות ---
    const activityListPage = document.getElementById('screen-activities-list');
    if (activityListPage) {
        activityListPage.addEventListener('click', (e) => {
            const card = e.target.closest('.activity-card');
            if (card) {
                const activityId = card.dataset.id;
                const activityTitle = card.dataset.title;

                // --- זה החלק שנוסף ---
                renderActivityDetails(activityId);
                // ---------------------

                showPage('screen-activity-details', activityTitle);
            }
        });
    }

    // --- כפתורי פילטר (צ'יפים) (ללא שינוי) ---
    const chips = document.querySelectorAll('.filter-chips .chip');
    chips.forEach(chip => {
        if (chip.innerText.includes('הכל')) chip.onclick = () => filterItems('all', chip);
        if (chip.innerText.includes('ווידוא')) chip.onclick = () => filterItems('validate', chip);
        if (chip.innerText.includes('לא כשיר')) chip.onclick = () => filterItems('broken', chip);
        if (chip.innerText.includes('הושאל')) chip.onclick = () => filterItems('loaned', chip);
    });

    // --- מודאל סטטוס (כפתורים פנימיים - ללא שינוי) ---
    const statusOptions = document.querySelectorAll('#status-modal .modal-options div');
    if (statusOptions.length) {
        statusOptions[0].onclick = () => changeStatus('status-available', 'כשיר');
        statusOptions[1].onclick = () => changeStatus('status-charging', 'בטעינה');
        statusOptions[2].onclick = () => changeStatus('status-loaned', 'הושאל');
        statusOptions[3].onclick = () => changeStatus('status-repair', 'בתיקון');
        statusOptions[4].onclick = () => changeStatus('status-broken', 'לא כשיר');
    }
    const editDetailsBtn = document.querySelector('.btn-edit-details');
    if (editDetailsBtn) editDetailsBtn.onclick = editItemDetails;

    // --- מודאל טיפול בפער (כפתורים פנימיים - ללא שינוי) ---
    const gapOptions = document.querySelectorAll('#resolve-gap-modal .modal-options div');
    if (gapOptions.length) {
        gapOptions[0].onclick = () => alert('פותח רשימת סנסורים כשירים לשיבוץ...');
        gapOptions[1].onclick = () => alert('הדרישה עודכנה.');
        gapOptions[2].onclick = () => alert('הפער אושר.');
    }
}