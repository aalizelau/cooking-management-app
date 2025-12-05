
// Simulate different times of day
const checkDate = (dateStr, label) => {
    const d = new Date(dateStr);
    console.log(`\n--- ${label} ---`);
    console.log(`Local Time: ${d.toString()}`);

    // OLD LOGIC (Problematic)
    const oldFormat = d.toISOString().split('T')[0];
    console.log(`Old Logic (toISOString): ${oldFormat}`);

    // NEW LOGIC (Fix)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const newFormat = `${year}-${month}-${day}`;
    console.log(`New Logic (Local):       ${newFormat}`);

    return { oldFormat, newFormat };
};

// Test Case 1: Morning
const morning = new Date();
morning.setHours(8, 0, 0, 0);
checkDate(morning, "Morning (8:00 AM)");

// Test Case 2: Late Night (might be next day in UTC if timezone is negative like PST)
const lateNight = new Date();
lateNight.setHours(23, 0, 0, 0);
checkDate(lateNight, "Late Night (11:00 PM)");

// Test Case 3: Early Morning (might be previous day in UTC if timezone is positive)
const earlyMorning = new Date();
earlyMorning.setHours(1, 0, 0, 0);
checkDate(earlyMorning, "Early Morning (1:00 AM)");
