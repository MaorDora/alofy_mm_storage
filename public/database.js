// =================================
// 1. ייבוא פונקציות מ-Firebase
// =================================
// (זה נשאר כפי שהיה)
import { doc, setDoc, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// =================================
// 2. קבלת גישה ל-Database
// =================================
// !!! מחקנו את השורות שהיו כאן וגרמו לשגיאה !!!

// =================================
// 3. אובייקט בסיס הנתונים (DB) המקומי
// =================================
// !!! שינוי קריטי: הפכנו את 'db' ל-'window.db' !!!
// זה הופך אותו לגלובלי ופותר את השגיאה 'db is not defined'
window.db = {
    users: [],
    warehouses: [],
    equipment: [],
    activities: []
};

// =================================
// 4. פונקציית העלאה חדשה לענן!
// =================================
async function uploadInitialDataToFirebase() {
    // !!! שינוי קריטי: העברנו את בדיקת החיבור לכאן !!!
    // עכשיו הבדיקה תרוץ רק כשנקרא לפונקציה, ולא מיד
    const firestoreDB = window.dbInstance;
    if (!firestoreDB) {
        console.error("לא ניתן להעלות, אין חיבור ל-Firestore. האם window.dbInstance הוגדר ב-HTML?");
        return;
    }

    console.log("מתחיל העלאת נתונים ראשוניים לענן...");
    alert("מתחיל בהעלאת הנתונים הראשוניים ל-Firebase. חכה להודעת 'סיום'.");

    // 1. נייצר את אובייקט ה-DB המקומי עם המידע ההתחלתי
    createInitialData(); // זו הפונקציה הישנה שלך

    try {
        // 2. העלאת משתמשים
        console.log("מעלה משתמשים...");
        // !!! שינינו ל-window.db !!!
        for (const user of window.db.users) {
            const docRef = doc(firestoreDB, "users", user.id);
            const { id, ...dataToSave } = user;
            await setDoc(docRef, dataToSave);
        }

        // 3. העלאת מחסנים
        console.log("מעלה מחסנים...");
        // !!! שינינו ל-window.db !!!
        for (const warehouse of window.db.warehouses) {
            const docRef = doc(firestoreDB, "warehouses", warehouse.id);
            const { id, ...dataToSave } = warehouse;
            await setDoc(docRef, dataToSave);
        }

        // 4. העלאת ציוד
        console.log("מעלה ציוד...");
        // !!! שינינו ל-window.db !!!
        for (const item of window.db.equipment) {
            const docRef = doc(firestoreDB, "equipment", item.id);
            const { id, ...dataToSave } = item;
            await setDoc(docRef, dataToSave);
        }

        // 5. העלאת פעילויות
        console.log("מעלה פעילויות...");
        // !!! שינינו ל-window.db !!!
        for (const activity of window.db.activities) {
            const docRef = doc(firestoreDB, "activities", activity.id);
            const { id, ...dataToSave } = activity;
            await setDoc(docRef, dataToSave);
        }

        console.log("כל הנתונים הראשוניים הועלו בהצלחה!");
        alert("סיימנו! כל הנתונים הראשוניים נמצאים עכשיו ב-Firebase.");

    } catch (error) {
        console.error("שגיאה קריטית במהלך העלאת הנתונים:", error);
        alert("אירעה שגיאה. בדוק את ה-Console (F12) לפרטים.");
    }
}


// =================================
// 5. כל הפונקציות הקיימות שלך (עודכנו לעבוד עם window.db)
// =================================

function loadDB() {
    const dbString = localStorage.getItem('myMobileSimulatorDB');
    if (dbString) {
        window.db = JSON.parse(dbString); // !!! שימוש ב-window.db
        console.log("DB נטען מ-localStorage");
    } else {
        createInitialData();
        saveDB();
        console.log("נוצר DB התחלתי חדש ונשמר");
    }
}

function saveDB() {
    localStorage.setItem('myMobileSimulatorDB', JSON.stringify(window.db)); // !!! שימוש ב-window.db
    console.log("השינויים ב-DB נשמרו ב-localStorage");
}

function createInitialData() {
    // !!! שימוש ב-window.db !!!
    window.db.users = [
        { id: "u-1", name: "מאור דורה", status: "active" },
        { id: "u-2", name: "יונתן כפיר", status: "active" },
        { id: "u-3", name: "עידו כהן", status: "active" },
        { id: "u-4", name: "אופק לוי", status: "active" }
    ];
    window.db.warehouses = [
        { id: "w-1", name: "מחסן סנסורים" },
        { id: "w-2", name: "מחסן מנדים" },
        { id: "w-3", name: "מחסן כללי" }
    ];
    window.db.equipment = [{
            id: "eq-101",
            name: "סנסור #101",
            managerUserId: "u-1",
            lastCheckDate: "2025-09-15",
            status: "available",
            warehouseId: "w-1",
            loanedToUserId: null
        },
        {
            id: "eq-102",
            name: "סנסור #102",
            managerUserId: "u-1",
            lastCheckDate: "2025-10-20",
            status: "loaned",
            warehouseId: "w-1",
            loanedToUserId: "u-3"
        },
        {
            id: "eq-103",
            name: "סנסור #103",
            managerUserId: "u-1",
            lastCheckDate: "2025-10-25",
            status: "broken",
            warehouseId: "w-1",
            loanedToUserId: null
        },
        {
            id: "eq-201",
            name: "מנד #201",
            managerUserId: "u-2",
            lastCheckDate: "2025-10-27",
            status: "charging",
            warehouseId: "w-2",
            loanedToUserId: null
        },
        {
            id: "eq-202",
            name: "מנד #202",
            managerUserId: "u-2",
            lastCheckDate: "2025-10-01",
            status: "available",
            warehouseId: "w-2",
            loanedToUserId: null
        },
        {
            id: "eq-301",
            name: "ערכת ע\"ר #01",
            managerUserId: "u-4",
            lastCheckDate: "2025-10-15",
            status: "available",
            warehouseId: "w-3",
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
    window.db.activities = [{
            id: "act-1",
            name: "קידוחים תוצאי צ'אפו",
            managerUserId: "u-2",
            date: "2025-10-20",
            equipmentRequiredIds: ["eq-101", "eq-102", "eq-201", "eq-202", "eq-301", "eq-302"],
            equipmentMissingIds: ["eq-103"]
        },
        {
            id: "act-2",
            name: "אימון אמצעים בלשב\"ייה",
            managerUserId: "u-4",
            date: "2025-10-21",
            equipmentRequiredIds: [],
            equipmentMissingIds: []
        },
        {
            id: "act-3",
            name: "שילוחים תוצאי צ'אפו",
            managerUserId: "u-2",
            date: "2025-10-29",
            equipmentRequiredIds: [],
            equipmentMissingIds: []
        }
    ];
}

function getEquipmentForWarehouse(warehouseId) {
    return window.db.equipment.filter(item => item.warehouseId === warehouseId); // !!! שימוש ב-window.db
}

function getUserById(userId) {
    if (!userId) return null;
    return window.db.users.find(user => user.id === userId); // !!! שימוש ב-window.db
}

function getEquipmentById(equipmentId) {
    if (!equipmentId) return null;
    return window.db.equipment.find(item => item.id === equipmentId); // !!! שימוש ב-window.db
}

function updateEquipmentStatus(equipmentId, newStatus) {
    const item = getEquipmentById(equipmentId);
    if (item) {
        item.status = newStatus;
        if (newStatus !== 'loaned') {
            item.loanedToUserId = null;
        }
        console.log(`סטטוס של ${equipmentId} עודכן ל-${newStatus}`);
    } else {
        console.error(`לא נמצא פריט עם ID: ${equipmentId}`);
    }
}

function updateEquipmentItem(equipmentId, newData) {
    const item = getEquipmentById(equipmentId);
    if (!item) {
        console.error(`לא נמצא פריט לעדכון עם ID: ${equipmentId}`);
        return false;
    }
    item.name = newData.name;
    item.managerUserId = newData.managerUserId;
    item.lastCheckDate = newData.lastCheckDate;
    item.status = newData.status;
    item.warehouseId = newData.warehouseId;
    if (newData.status !== 'loaned') {
        item.loanedToUserId = null;
    }
    console.log(`פריט ${equipmentId} עודכן בהצלחה.`);
    return true;
}

function getActivityById(activityId) {
    if (!activityId) return null;
    return window.db.activities.find(act => act.id === activityId); // !!! שימוש ב-window.db
}

function getWarehouseById(warehouseId) {
    if (!warehouseId) return null;
    return window.db.warehouses.find(w => w.id === warehouseId); // !!! שימוש ב-window.db
}

function updateActivityEquipment(activityId, newEquipmentIds) {
    const activity = getActivityById(activityId);
    if (!activity) {
        console.error("לא נמצאה פעילות לעדכון:", activityId);
        return;
    }
    activity.equipmentRequiredIds = [];
    activity.equipmentMissingIds = [];
    newEquipmentIds.forEach(itemId => {
        const item = getEquipmentById(itemId);
        if (item) {
            if (item.status === 'available' || item.status === 'charging') {
                activity.equipmentRequiredIds.push(item.id);
            } else {
                activity.equipmentMissingIds.push(item.id);
            }
        }
    });
    console.log(`פעילות ${activityId} עודכנה עם ${activity.equipmentRequiredIds.length} פריטים כשירים ו-${activity.equipmentMissingIds.length} פערים.`);
    saveDB();
}


// =================================
// 6. ייצוא הפונקציות לחלון הגלובלי
// =================================
// (זה נשאר כפי שהיה)
window.loadDB = loadDB;
window.saveDB = saveDB;
window.createInitialData = createInitialData;
window.getEquipmentForWarehouse = getEquipmentForWarehouse;
window.getUserById = getUserById;
window.getEquipmentById = getEquipmentById;
window.updateEquipmentStatus = updateEquipmentStatus;
window.updateEquipmentItem = updateEquipmentItem;
window.getActivityById = getActivityById;
window.getWarehouseById = getWarehouseById;
window.updateActivityEquipment = updateActivityEquipment;
window.uploadInitialDataToFirebase = uploadInitialDataToFirebase;