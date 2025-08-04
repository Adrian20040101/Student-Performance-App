const fs = require('fs');
const https = require('https');
const path = require('path');

const years = [2022, 2023, 2024];
const baseUrl = 'https://ionutb.github.io/simulare-evaluare2025/candidates';

const outputDir = __dirname;

function downloadAndSave(year) {
  const url = `${baseUrl}${year}.json`;
  const filePath = path.join(outputDir, `candidates${year}.json`);

  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error(`Failed to fetch ${year}: HTTP ${res.statusCode}`);
      res.resume();
      return;
    }

    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      fs.writeFile(filePath, data, (err) => {
        if (err) {
          console.error(`Error writing ${filePath}`, err);
        } else {
          console.log(`Saved: ${filePath}`);
        }
      });
    });
  }).on('error', (err) => {
    console.error(`Request failed for ${year}`, err);
  });
}

years.forEach(downloadAndSave);
