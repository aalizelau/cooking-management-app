const fs = require('fs');
const path = require('path');

const csvPath = '/Users/funlau/Documents/codes/experiments/src/Price and Location 2a227a9ed3da8059af98dc3bfccabf4e_all.csv';

fs.readFile(csvPath, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }

    const lines = data.split('\n');
    // Skip header
    const dataLines = lines.slice(1);

    const comparisons = {};

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

    dataLines.forEach(line => {
        if (!line.trim()) return;

        const cols = parseLine(line);
        // 0: Name (empty)
        // 1: Ingredients (Name + Link)
        // 2: Location Type (Store)
        // 3: Price

        const ingredientRaw = cols[1]?.trim();
        const store = cols[2]?.trim();
        const price = cols[3]?.trim();

        if (!ingredientRaw) return;

        // Extract name and link
        // Format: "Name (https://...)"
        const match = ingredientRaw.match(/^(.*?) \((https:\/\/.*?)\)$/);
        let name = ingredientRaw;
        let link = '';

        if (match) {
            name = match[1].trim();
            link = match[2].trim();
        }

        if (!comparisons[name]) {
            comparisons[name] = [];
        }

        if (store && price) {
            comparisons[name].push({
                store,
                price,
                link
            });
        }
    });

    console.log(JSON.stringify(comparisons, null, 4));
});
