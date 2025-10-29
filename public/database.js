// =================================
// 1. אובייקט בסיס הנתונים (DB)
// =================================
// זהו האובייקט המרכזי שיחזיק את כל המידע שלנו בזיכרון
let db = {
    users: [],
    warehouses: [],
    equipment: [],
    activities: []
};

// =================================
// 2. פונקציות ניהול DB
// =================================

/**
 * טוען את בסיס הנתונים מ-localStorage.
 * אם אין בסיס נתונים שמור, הוא יוצר מידע התחלתי.
 */
function loadDB() {
    const dbString = localStorage.getItem('myMobileSimulatorDB');
    if (dbString) {
        // אם מצאנו מידע שמור, נטען אותו
        db = JSON.parse(dbString);
        console.log("DB נטען מ-localStorage");
    } else {
        // אם זה משתמש חדש, ניצור מידע התחלתי (דמה)
        createInitialData();
        // ונשמור אותו מיד
        saveDB();
        console.log("נוצר DB התחלתי חדש ונשמר");
    }
}

/**
 * שומר את אובייקט ה-DB הנוכחי (מהזיכרון) לתוך localStorage.
 * יש לקרוא לפונקציה זו *בכל פעם* שמשנים מידע.
 */
function saveDB() {
    localStorage.setItem('myMobileSimulatorDB', JSON.stringify(db));
    console.log("השינויים ב-DB נשמרו ב-localStorage");
}

/**
 * יוצר את המידע ההתחלתי (Dummy Data) מאפס.
 * הפונקציה הזו נקראת רק בפעם הראשונה שהאפליקציה נטענת.
 * כל המידע כאן נלקח ישירות מה-HTML שאיחדנו.
 */
function createInitialData() {

    // --- יצירת משתמשים ---
    // זיהינו את כל האחראים והמשאילים מה-HTML
    db.users = [
        { id: "u-1", name: "מאור דורה", status: "active" },
        { id: "u-2", name: "יונתן כפיר", status: "active" },
        { id: "u-3", name: "עידו כהן", status: "active" },
        { id: "u-4", name: "אופק לוי", status: "active" }
    ];

    // --- יצירת מחסנים ---
    // זיהינו מחסן סנסורים ושיערנו שיש מחסנים נוספים
    db.warehouses = [
        { id: "w-1", name: "מחסן סנסורים" },
        { id: "w-2", name: "מחסן מנדים" },
        { id: "w-3", name: "מחסן כללי" } // עבור קסדות וערכות ע"ר
    ];

    // --- יצירת פריטי ציוד ---
    // זה הלב של ה-DB. כל פריט מקבל ID ייחודי
    // ומקשר למחסן (warehouseId) ומשתמש (managerUserId)
    db.equipment = [{
            id: "eq-101",
            name: "סנסור #101",
            managerUserId: "u-1", // מאור דורה
            lastCheckDate: "2025-09-15",
            status: "available", // כשיר
            warehouseId: "w-1", // מחסן סנסורים
            loanedToUserId: null
        },
        {
            id: "eq-102",
            name: "סנסור #102",
            managerUserId: "u-1", // מאור דורה (הנחה)
            lastCheckDate: "2025-10-20",
            status: "loaned", // הושאל
            warehouseId: "w-1",
            loanedToUserId: "u-3" // עידו כהן
        },
        {
            id: "eq-103",
            name: "סנסור #103",
            managerUserId: "u-1", // מאור דורה
            lastCheckDate: "2025-10-25",
            status: "broken", // לא כשיר
            warehouseId: "w-1",
            loanedToUserId: null
        },
        {
            id: "eq-201",
            name: "מנד #201",
            managerUserId: "u-2", // יונתן כפיר
            lastCheckDate: "2025-10-27",
            status: "charging", // בטעינה
            warehouseId: "w-2", // מחסן מנדים
            loanedToUserId: null
        },
        // --- פריטים נוספים שזוהו מעמוד הפעילויות ---
        {
            id: "eq-202",
            name: "מנד #202",
            managerUserId: "u-2", // יונתן כפיר
            lastCheckDate: "2025-10-01", // תאריך שרירותי
            status: "available",
            warehouseId: "w-2",
            loanedToUserId: null
        },
        {
            id: "eq-301",
            name: "ערכת ע\"ר #01",
            managerUserId: "u-4", // אופק לוי (הנחה)
            lastCheckDate: "2025-10-15",
            status: "available",
            warehouseId: "w-3", // מחסן כללי
            loanedToUserId: null
        },
        {
            id: "eq-302",
            name: "קסדה #007",
            managerUserId: "u-4",
            lastCheckDate: "2025-10-20",
            status: "available",
            warehouseId: "w-3",
            loanedToUserId: null
        }
    ];

    // --- יצירת פעילויות ---
    // הפעילויות מקשרות למשתמש אחראי (managerUserId)
    // ולרשימה של פריטי ציוד (equipmentIds)
    db.activities = [{
            id: "act-1",
            name: "קידוחים תוצאי צ'אפו",
            managerUserId: "u-2", // יונתן כפיר
            date: "2025-10-20",
            // רשימת ה-ID של הפריטים שזוהו ב-HTML כמשויכים לפעילות זו
            equipmentRequiredIds: ["eq-101", "eq-102", "eq-201", "eq-202", "eq-301", "eq-302"],
            // נוסיף כאן גם ID של סנסור חסר, למשל "eq-103" שהוא לא כשיר
            equipmentMissingIds: ["eq-103"]
        },
        {
            id: "act-2",
            name: "אימון אמצעים בלשב\"ייה",
            managerUserId: "u-4", // אופק לוי
            date: "2025-10-21",
            equipmentRequiredIds: [], // ה-HTML אמר 8/8 אבל לא פירט, נשאיר ריק
            equipmentMissingIds: []
        },
        {
            id: "act-3",
            name: "שילוחים תוצאי צ'אפו",
            managerUserId: "u-2", // יונתן כפיר (הנחה)
            date: "2025-10-29",
            equipmentRequiredIds: [],
            equipmentMissingIds: []
        }
    ];
}


// =================================
// 3. פונקציות עזר (Helpers)
// =================================
// פונקציות אלו יעזרו לנו לשלוף מידע מה-DB בקלות
// נוכל להשתמש בהן בקובץ script.js

/**
 * מחזיר את כל פריטי הציוד המשויכים למחסן ספציפי
 * @param {string} warehouseId - ה-ID של המחסן
 * @returns {Array} - רשימה של אובייקטי ציוד
 */
function getEquipmentForWarehouse(warehouseId) {
    // סנן את רשימת הציוד והחזר רק פריטים שה-warehouseId שלהם תואם
    return db.equipment.filter(item => item.warehouseId === warehouseId);
}

/**
 * מחזיר אובייקט משתמש לפי ה-ID שלו
 * @param {string} userId - ה-ID של המשתמש
 * @returns {Object} - אובייקט המשתמש
 */
function getUserById(userId) {
    if (!userId) return null; // אם ה-ID ריק, תחזיר כלום
    return db.users.find(user => user.id === userId);
}

/**
 * מחזיר אובייקט ציוד לפי ה-ID שלו
 * @param {string} equipmentId - ה-ID של הפריט
 * @returns {Object} - אובייקט הציוד
 */
function getEquipmentById(equipmentId) {
    if (!equipmentId) return null;
    return db.equipment.find(item => item.id === equipmentId);
}

/**
 * מעדכן סטטוס של פריט ציוד ספציפי ב-DB
 * @param {string} equipmentId - ה-ID של הפריט לעדכון
 * @param {string} newStatus - הסטטוס החדש (למשל "available", "broken")
 */
function updateEquipmentStatus(equipmentId, newStatus) {
    const item = getEquipmentById(equipmentId);
    if (item) {
        item.status = newStatus;

        // אם הסטטוס הוא לא "הושאל", ננקה את השדה של המשאיל
        if (newStatus !== 'loaned') {
            item.loanedToUserId = null;
        }

        console.log(`סטטוס של ${equipmentId} עודכן ל-${newStatus}`);
    } else {
        console.error(`לא נמצא פריט עם ID: ${equipmentId}`);
    }
}
/**
 * מעדכן פריט ציוד קיים עם נתונים חדשים מהטופס
 @param {string} equipmentId - ה-ID של הפריט לעדכון
 @param {Object} newData - אובייקט עם השדות החדשים לעדכון
 */
function updateEquipmentItem(equipmentId, newData) {
    const item = getEquipmentById(equipmentId);
    if (!item) {
        console.error(`לא נמצא פריט לעדכון עם ID: ${equipmentId}`);
        return false;
    }

    // עדכן את כל השדות שהתקבלו מהטופס
    item.name = newData.name;
    item.managerUserId = newData.managerUserId;
    item.lastCheckDate = newData.lastCheckDate;
    item.status = newData.status;
    item.warehouseId = newData.warehouseId;

    // אנו שומרים על המידע למי הושאל הפריט, אם הוא הושאל
    if (newData.status !== 'loaned') {
        item.loanedToUserId = null;
    }

    console.log(`פריט ${equipmentId} עודכן בהצלחה.`);
    return true;
}
/**
 * מחזיר אובייקט פעילות לפי ה-ID שלה
 * @param {string} activityId - ה-ID של הפעילות
 * @returns {Object} - אובייקט הפעילות
 */
function getActivityById(activityId) {
    if (!activityId) return null;
    return db.activities.find(act => act.id === activityId);
}
/**
 * מחזיר אובייקט מחסן לפי ה-ID שלו
 * @param {string} warehouseId - ה-ID של המחסן
 * @returns {Object} - אובייקט המחסן
 */
function getWarehouseById(warehouseId) {
    if (!warehouseId) return null;
    return db.warehouses.find(w => w.id === warehouseId);
}
/**
 * מעדכן את רשימת הציוד המשויך לפעילות
 * @param {string} activityId - ה-ID של הפעילות לעדכון
 * @param {Array<string>} newEquipmentIds - רשימת ה-ID המלאה של הציוד שנבחר
 */
function updateActivityEquipment(activityId, newEquipmentIds) {
    const activity = getActivityById(activityId);
    if (!activity) {
        console.error("לא נמצאה פעילות לעדכון:", activityId);
        return;
    }

    // נאתחל מחדש את שתי הרשימות בפעילות
    activity.equipmentRequiredIds = [];
    activity.equipmentMissingIds = [];

    // נעבור על כל ה-ID-ים שנבחרו
    newEquipmentIds.forEach(itemId => {
        const item = getEquipmentById(itemId);
        if (item) {
            // נמיין את הפריטים לפי הלוגיקה
            // רק פריטים כשירים או בטעינה ייכנסו לרשימת ה"כשירים"
            if (item.status === 'available' || item.status === 'charging') {
                activity.equipmentRequiredIds.push(item.id);
            } else {
                // כל פריט אחר (שלא היה אמור להיבחר) ייכנס לרשימת ה"חסרים"
                activity.equipmentMissingIds.push(item.id);
            }
        }
    });

    console.log(`פעילות ${activityId} עודכנה עם ${activity.equipmentRequiredIds.length} פריטים כשירים ו-${activity.equipmentMissingIds.length} פערים.`);
    saveDB(); // נשמור את השינויים ב-DB
}