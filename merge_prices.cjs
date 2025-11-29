const fs = require('fs');
const path = require('path');

const ingredientsPath = '/Users/funlau/Documents/codes/experiments/ingredients.json';
const csvPath = '/Users/funlau/Documents/codes/experiments/src/Price and Location 2a227a9ed3da8059af98dc3bfccabf4e_all.csv';

const ingredients = JSON.parse(fs.readFileSync(ingredientsPath, 'utf8'));
const csvData = fs.readFileSync(csvPath, 'utf8');

const lines = csvData.split('\n').slice(1); // Skip header

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

lines.forEach(line => {
    if (!line.trim()) return;

    const cols = parseLine(line);
    // 0: Name (empty)
    // 1: Ingredients (Name + Link)
    // 2: Location Type (Store)
    // 3: Price

    const ingredientRaw = cols[1]?.trim();
    const store = cols[2]?.trim();
    const price = cols[3]?.trim();

    if (!ingredientRaw || !store || !price) return;

    // Extract name
    const match = ingredientRaw.match(/^(.*?) \((https:\/\/.*?)\)$/);
    let name = ingredientRaw;

    if (match) {
        name = match[1].trim();
    }

    // Find ingredient
    const ingredient = ingredients.find(i => i.name === name);

    if (ingredient) {
        // Add to history
        // Check if entry already exists to avoid duplicates if run multiple times (though this is a one-off script)
        const exists = ingredient.history.some(h => h.location === store && h.price === price);
        if (!exists) {
            ingredient.history.push({
                date: new Date().toISOString().split('T')[0], // Use today's date
                price: price,
                store: store, // Store name (e.g. Metro, T&T)
                location: ingredient.defaultLocation // Storage location (e.g. Fridge)
            });
        }
    }
});

console.log(JSON.stringify(ingredients, null, 4));
