// =================================
// 1. ייבוא פונקציות מ-Firebase
// =================================
import { doc, setDoc, collection, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// =================================
// 2. אובייקט בסיס הנתונים (DB) המקומי
// =================================
// זה עדיין המטמון (cache) המקומי שלנו
window.db = {
    users: [],
    warehouses: [],
    equipment: [],
    activities: []
};

// =================================
// 3. פונקציית העלאה (נשארת למקרה שנצטרך)
// =================================
async function uploadInitialDataToFirebase() {
    const firestoreDB = window.dbInstance;
    if (!firestoreDB) {
        console.error("לא ניתן להעלות, אין חיבור ל-Firestore.");
        return;
    }
    console.log("מתחיל העלאת נתונים ראשוניים לענן...");
    alert("מתחיל בהעלאת הנתונים הראשוניים ל-Firebase. חכה להודעת 'סיום'.");
    createInitialData();
    try {
        console.log("מעלה משתמשים...");
        for (const user of window.db.users) {
            const docRef = doc(firestoreDB, "users", user.id);
            const { id, ...dataToSave } = user;
            await setDoc(docRef, dataToSave);
        }
        console.log("מעלה מחסנים...");
        for (const warehouse of window.db.warehouses) {
            const docRef = doc(firestoreDB, "warehouses", warehouse.id);
            const { id, ...dataToSave } = warehouse;
            await setDoc(docRef, dataToSave);
        }
        console.log("מעלה ציוד...");
        for (const item of window.db.equipment) {
            const docRef = doc(firestoreDB, "equipment", item.id);
            const { id, ...dataToSave } = item;
            await setDoc(docRef, dataToSave);
        }
        console.log("מעלה פעילויות...");
        for (const activity of window.db.activities) {
            const docRef = doc(firestoreDB, "activities", activity.id);
            const { id, ...dataToSave } = activity;
            await setDoc(docRef, dataToSave);
        }
        console.log("כל הנתונים הראשוניים הועלו בהצלחה!");
        alert("סיימנו! כל הנתונים הראשוניים נמצאים עכשיו ב-Firebase.");
    } catch (error) {
        console.error("שגיאה קריטית במהלך העלאת הנתונים:", error);
    }
}

// =================================
// 4. פונקציית טעינה מהענן (מהשלב הקודם)
// =================================
async function loadDbFromFirebase() {
    console.log("מתחיל טעינת נתונים מ-Firestore...");
    const firestoreDB = window.dbInstance;
    if (!firestoreDB) {
        console.error("טעינה נכשלה, אין חיבור ל-Firestore.");
        return;
    }
    try {
        window.db = { users: [], warehouses: [], equipment: [], activities: [] };
        const usersSnapshot = await getDocs(collection(firestoreDB, "users"));
        usersSnapshot.forEach(doc => window.db.users.push({ id: doc.id, ...doc.data() }));
        const warehousesSnapshot = await getDocs(collection(firestoreDB, "warehouses"));
        warehousesSnapshot.forEach(doc => window.db.warehouses.push({ id: doc.id, ...doc.data() }));
        const equipmentSnapshot = await getDocs(collection(firestoreDB, "equipment"));
        equipmentSnapshot.forEach(doc => window.db.equipment.push({ id: doc.id, ...doc.data() }));
        const activitiesSnapshot = await getDocs(collection(firestoreDB, "activities"));
        activitiesSnapshot.forEach(doc => window.db.activities.push({ id: doc.id, ...doc.data() }));
        console.log("טעינת נתונים מהענן הושלמה!", window.db);
    } catch (error) {
        console.error("שגיאה קריטית בטעינת נתונים מהענן:", error);
    }
}


// =================================
// 5. פונקציות "עזרה" (Helpers) - ללא שינוי
// =================================
// הפונקציות האלה רק קוראות מהזיכרון המקומי (window.db)
// הן לא צריכות להשתנות
function getEquipmentForWarehouse(warehouseId) {
    return window.db.equipment.filter(item => item.warehouseId === warehouseId);
}

function getUserById(userId) {
    if (!userId) return null;
    return window.db.users.find(user => user.id === userId);
}

function getEquipmentById(equipmentId) {
    if (!equipmentId) return null;
    return window.db.equipment.find(item => item.id === equipmentId);
}

function getActivityById(activityId) {
    if (!activityId) return null;
    return window.db.activities.find(act => act.id === activityId);
}

function getWarehouseById(warehouseId) {
    if (!warehouseId) return null;
    return window.db.warehouses.find(w => w.id === warehouseId);
}

// =================================
// 6. פונקציות "כתיבה" משודרגות (!!! שינויים חשובים כאן !!!)
// =================================
// כל פונקציה שמשנה מידע הפכה ל-async ושומרת בענן

/**
 * מעדכן סטטוס של פריט ציוד (מקומי + ענן)
 */
async function updateEquipmentStatus(equipmentId, newStatus) {
    const item = getEquipmentById(equipmentId);
    if (!item) {
        console.error(`לא נמצא פריט עם ID: ${equipmentId}`);
        return;
    }

    // 1. עדכון מקומי (כדי שה-UI יגיב מהר)
    item.status = newStatus;
    const updateData = { status: newStatus };

    if (newStatus !== 'loaned') {
        item.loanedToUserId = null;
        updateData.loanedToUserId = null; // נוסיף את זה גם לעדכון בענן
    } else {
        // אם הסטטוס הוא "הושאל", נשמור גם את ה-ID של המשאיל
        // (הלוגיקה הזו נמצאת ב-java.js, אז נצטרך לעדכן גם שם)
        if (item.loanedToUserId) {
            updateData.loanedToUserId = item.loanedToUserId;
        }
    }

    console.log(`סטטוס מקומי של ${equipmentId} עודכן ל-${newStatus}`);

    // 2. עדכון בענן (ברקע)
    try {
        const docRef = doc(window.dbInstance, "equipment", equipmentId);
        await updateDoc(docRef, updateData);
        console.log(`סטטוס ענן של ${equipmentId} עודכן בהצלחה.`);
    } catch (error) {
        console.error("שגיאה בעדכון סטטוס בענן:", error);
    }
}

/**
 * מעדכן פריט ציוד קיים (מקומי + ענן)
 */
async function updateEquipmentItem(equipmentId, newData) {
    const item = getEquipmentById(equipmentId);
    if (!item) {
        console.error(`לא נמצא פריט לעדכון עם ID: ${equipmentId}`);
        return false;
    }

    // 1. עדכון מקומי
    item.name = newData.name;
    item.managerUserId = newData.managerUserId;
    item.lastCheckDate = newData.lastCheckDate;
    item.status = newData.status;
    item.warehouseId = newData.warehouseId;
    if (newData.status !== 'loaned') {
        item.loanedToUserId = null;
    }
    console.log(`פריט מקומי ${equipmentId} עודכן.`);

    // 2. עדכון בענן
    // ניצור אובייקט נקי לעדכון (בלי ה-loanedToUserId אם לא צריך)
    const dataToUpdate = {...newData };
    if (newData.status !== 'loaned') {
        dataToUpdate.loanedToUserId = null;
    }

    try {
        const docRef = doc(window.dbInstance, "equipment", equipmentId);
        await updateDoc(docRef, dataToUpdate);
        console.log(`פריט ענן ${equipmentId} עודכן בהצלחה.`);
        return true;
    } catch (error) {
        console.error("שגיאה בעדכון פריט בענן:", error);
        return false;
    }
}

/**
 * מעדכן את רשימת הציוד המשויך לפעילות (מקומי + ענן)
 */
async function updateActivityEquipment(activityId, newEquipmentIds) {
    const activity = getActivityById(activityId);
    if (!activity) {
        console.error("לא נמצאה פעילות לעדכון:", activityId);
        return;
    }

    // 1. עדכון מקומי (לוגיקה קיימת)
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
    console.log(`פעילות מקומית ${activityId} עודכנה.`);

    // 2. עדכון בענן
    try {
        const docRef = doc(window.dbInstance, "activities", activityId);
        await updateDoc(docRef, {
            equipmentRequiredIds: activity.equipmentRequiredIds,
            equipmentMissingIds: activity.equipmentMissingIds
        });
        console.log(`פעילות ענן ${activityId} עודכנה בהצלחה.`);
    } catch (error) {
        console.error("שגיאה בעדכון פעילות בענן:", error);
    }
}

// =================================
// 7. פונקציות "יצירה" חדשות (!!! חדש !!!)
// =================================
// פונקציות אלו יוסיפו פריטים חדשים (מקומי + ענן)

/**
 * מוסיף פריט ציוד חדש (מקומי + ענן)
 */
async function addNewEquipment(itemData) {
    if (!itemData.id) {
        itemData.id = 'eq-' + Date.now(); // יצירת ID אם חסר
    }

    // 1. הוספה מקומית
    window.db.equipment.push(itemData);
    console.log(`פריט חדש ${itemData.id} נוסף מקומית.`);

    // 2. הוספה לענן
    try {
        // נשתמש ב-setDoc כדי לכפות את ה-ID שיצרנו
        const docRef = doc(window.dbInstance, "equipment", itemData.id);
        const { id, ...dataToSave } = itemData; // שמירת האובייקט ללא ה-ID
        await setDoc(docRef, dataToSave);
        console.log(`פריט חדש ${itemData.id} נוסף לענן.`);
    } catch (error) {
        console.error("שגיאה בהוספת פריט חדש לענן:", error);
    }
}

/**
 * מוסיף פעילות חדשה (מקומי + ענן)
 */
async function addNewActivity(activityData) {
    if (!activityData.id) {
        activityData.id = 'act-' + Date.now(); // יצירת ID אם חסר
    }

    // 1. הוספה מקומית
    window.db.activities.push(activityData);
    console.log(`פעילות חדשה ${activityData.id} נוספה מקומית.`);

    // 2. הוספה לענן
    try {
        const docRef = doc(window.dbInstance, "activities", activityData.id);
        const { id, ...dataToSave } = activityData;
        await setDoc(docRef, dataToSave);
        console.log(`פעילות חדשה ${activityData.id} נוספה לענן.`);
    } catch (error) {
        console.error("שגיאה בהוספת פעילות חדשה לענן:", error);
    }
}


// =================================
// 8. ייצוא הפונקציות לחלון הגלובלי
// =================================
// מחקנו את loadDB ו-saveDB הישנים
// הוספנו את הפונקציות החדשות

// פונקציות טעינה והעלאה
window.loadDbFromFirebase = loadDbFromFirebase;
window.uploadInitialDataToFirebase = uploadInitialDataToFirebase;
window.createInitialData = createInitialData; // עדיין בשימוש של upload

// פונקציות "קריאה"
window.getEquipmentForWarehouse = getEquipmentForWarehouse;
window.getUserById = getUserById;
window.getEquipmentById = getEquipmentById;
window.getActivityById = getActivityById;
window.getWarehouseById = getWarehouseById;

// פונקציות "כתיבה" (שדרוג וחדשות)
window.updateEquipmentStatus = updateEquipmentStatus;
window.updateEquipmentItem = updateEquipmentItem;
window.updateActivityEquipment = updateActivityEquipment;
window.addNewEquipment = addNewEquipment;
window.addNewActivity = addNewActivity;