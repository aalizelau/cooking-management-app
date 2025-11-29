const fs = require('fs');
const path = require('path');

const ingredientsPath = '/Users/funlau/Documents/codes/experiments/ingredients_with_history.json';
const appContextPath = '/Users/funlau/Documents/codes/experiments/src/context/AppContext.jsx';

const ingredients = fs.readFileSync(ingredientsPath, 'utf8');
let appContext = fs.readFileSync(appContextPath, 'utf8');

// Find start and end of INITIAL_INGREDIENTS
const startMarker = 'const INITIAL_INGREDIENTS =';
const nextMarker = 'const INITIAL_RECIPES =';

const startIndex = appContext.indexOf(startMarker);
const nextIndex = appContext.indexOf(nextMarker, startIndex);

if (startIndex === -1 || nextIndex === -1) {
    console.error('Could not find markers');
    process.exit(1);
}

// Find the last ] before nextMarker
// We search backwards from nextIndex
const endIndex = appContext.lastIndexOf(']', nextIndex);

if (endIndex === -1) {
    console.error('Could not find end marker');
    process.exit(1);
}

// Find the semicolon after the ]
const semiColonIndex = appContext.indexOf(';', endIndex);

// Replace content
const newContent = appContext.substring(0, startIndex) +
    `const INITIAL_INGREDIENTS = ${ingredients};` +
    appContext.substring(semiColonIndex + 1);

fs.writeFileSync(appContextPath, newContent);
console.log('Updated AppContext.jsx');
