const fs = require('fs');
const path = require('path');
const { zodiacOrder, planetOrder } = require('./constants');

const baseDir = path.resolve(__dirname, 'interpretations/ro');

// Template for the interpretation file
const interpretationTemplate = `module.exports = {
  interpretation: "Loc pt interpretare"
};`;

// Function to create directory if it doesn't exist
function createDirIfNotExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Function to create file if it doesn't exist
function createFileIfNotExists(filePath, content) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
    console.log(`Created file: ${filePath}`);
  }

  if (fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, interpretationTemplate);
    console.log(`Updated file: ${filePath}`);
  }
}

// Create the base directory structure
createDirIfNotExists(baseDir);

// Loop through planets
planetOrder.forEach(planet => {
  const planetDir = path.join(baseDir, planet);
  createDirIfNotExists(planetDir);

  // Loop through zodiac signs
  zodiacOrder.forEach(sign => {
    const signDir = path.join(planetDir, sign);
    createDirIfNotExists(signDir);

    // Create house files 1-12
    for (let house = 1; house <= 12; house++) {
      const houseFile = path.join(signDir, `House ${house}.js`);
      createFileIfNotExists(houseFile, interpretationTemplate);
    }
  });
});

console.log('Directory structure creation completed!');