const fs = require('fs');
const path = require('path');

const csvPath = '/Users/funlau/Documents/codes/experiments/src/ExportBlock-e52f4cc2-f6b5-41e3-9c00-bfd535a4a040-Part-1/Ingredients 2a227a9ed3da8084bbdce8a8528306af_all.csv';

const getEmoji = (name) => {
    if (name.includes('雞') || name.includes('鷄') || name.includes('翅') || name.includes('腿')) return '🍗';
    if (name.includes('蛋')) return '🥚';
    if (name.includes('牛')) return '🥩';
    if (name.includes('豬') || name.includes('肉') || name.includes('排') || name.includes('扒') || name.includes('烟肉')) return '🥓';
    if (name.includes('魚') || name.includes('三文魚') || name.includes('鱸魚') || name.includes('鰻魚') || name.includes('Tuna')) return '🐟';
    if (name.includes('蝦')) return '🦐';
    if (name.includes('蟹')) return '🦀';
    if (name.includes('菜') || name.includes('豆') || name.includes('筍') || name.includes('瓜')) return '🥬';
    if (name.includes('菇')) return '🍄';
    if (name.includes('茄')) return '🍅';
    if (name.includes('椒')) return '🫑';
    if (name.includes('蒜') || name.includes('葱') || name.includes('洋葱')) return '🧄';
    if (name.includes('米') || name.includes('飯')) return '🍚';
    if (name.includes('麵') || name.includes('粉') || name.includes('意麵') || name.includes('Udon') || name.includes('Pasta')) return '🍜';
    if (name.includes('麵包') || name.includes('Toast')) return '🍞';
    if (name.includes('奶') || name.includes('Cream') || name.includes('Yogurt') || name.includes('乳酪')) return '🥛';
    if (name.includes('油')) return '🫒';
    if (name.includes('糖')) return '🍬';
    if (name.includes('鹽')) return '🧂';
    if (name.includes('醬') || name.includes('Source') || name.includes('Sauce') || name.includes('Pesto')) return '🥫';
    if (name.includes('果') || name.includes('莓') || name.includes('蕉') || name.includes('桃') || name.includes('李') || name.includes('柑') || name.includes('橘') || name.includes('柚') || name.includes('Apple') || name.includes('Lemon')) return '🍎';
    if (name.includes('薯') || name.includes('Potato')) return '🥔';
    if (name.includes('粟米') || name.includes('玉米')) return '🌽';
    if (name.includes('芝士') || name.includes('Cheese')) return '🧀';
    if (name.includes('餃')) return '🥟';
    if (name.includes('腸')) return '🌭';
    if (name.includes('餅') || name.includes('Cookie') || name.includes('Chip') || name.includes('脆')) return '🍪';
    if (name.includes('糕') || name.includes('點') || name.includes('包') || name.includes('Pie') || name.includes('Cake')) return '🧁';
    if (name.includes('冰') || name.includes('雪糕') || name.includes('Ice Cream')) return '🍦';
    if (name.includes('酒')) return '🍷';
    if (name.includes('汁') || name.includes('飲') || name.includes('Juice') || name.includes('Tea')) return '🧃';
    if (name.includes('堅果') || name.includes('Nut') || name.includes('Almond')) return '🥜';
    if (name.includes('巧克力') || name.includes('朱古力') || name.includes('Chocolate')) return '🍫';
    if (name.includes('貝') || name.includes('蛤') || name.includes('蠔')) return '🦪';
    return '';
};

const mapCategory = (cat) => {
    const map = {
        '水果': '水果',
        '原材料': '原材料',
        '調味料': '調味料',
        '零食': '零食',
        '半成品': '半成品'
    };
    return map[cat] || '無食材類型';
};

const mapLocation = (status) => {
    if (['冷藏', '急凍', '常溫'].includes(status)) return status;
    return '常溫';
};

const mapStockStatus = (status) => {
    if (['冷藏', '急凍', '常溫'].includes(status)) return 'In Stock';
    return 'Out of Stock';
};

fs.readFile(csvPath, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    const lines = data.split('\n');
    const headers = lines[0].split(',');

    // Helper to handle CSV parsing properly (handling quotes)
    const parseLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    };

    const ingredients = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const cols = parseLine(lines[i]);
        // Columns based on header:
        // 0: Name
        // 6: Status (used for Location/Stock)
        // 12: 食材類型 (Category)

        const name = cols[0]?.trim();
        if (!name) continue;

        const status = cols[6]?.trim();
        const categoryRaw = cols[12]?.trim(); // Assuming it's the last column based on viewing file

        // Note: The CSV view showed 13 columns. 
        // 0: Name, ... 6: Status, ... 12: 食材類型
        // Let's verify column index 12 is indeed category.
        // Line 1: ...,過期日子,食材類型
        // Yes, it looks like the last one.

        // However, simple split by comma might fail if there are commas in quotes.
        // My parseLine handles that.

        const category = mapCategory(categoryRaw);
        const location = mapLocation(status);
        const stockStatus = mapStockStatus(status);
        const emoji = getEmoji(name);

        ingredients.push({
            id: (i + 100).toString(), // Start IDs from 100 to avoid conflict with existing mocks if any
            name: name,
            category: category,
            emoji: emoji,
            stockStatus: stockStatus,
            location: location,
            defaultLocation: location,
            history: []
        });
    }

    console.log(JSON.stringify(ingredients, null, 4));
});
