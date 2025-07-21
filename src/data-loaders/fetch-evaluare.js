const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Lista abrevieri județe (vezi https://static.evaluare.edu.ro/2024/rezultate/)
const judete = [
  'AB', 'AR', 'AG', 'BC', 'BH', 'BN', 'BR', 'BT', 'BV', 'BZ',
  'CS', 'CL', 'CJ', 'CT', 'CV', 'DB', 'DJ', 'GL', 'GR', 'GJ',
  'HR', 'HD', 'IL', 'IS', 'IF', 'MM', 'MH', 'MS', 'NT', 'OT',
  'PH', 'SM', 'SJ', 'SB', 'SV', 'TR', 'TM', 'TL', 'VS', 'VL', 'VN', 'B'
];

const baseUrl = 'https://static.evaluare.edu.ro/2024/rezultate';
const outputDir = path.join(__dirname, 'cache');

async function fetchJudete() {
  await fs.ensureDir(outputDir);

  const allCandidates = [];

  for (const jud of judete) {
    const url = `${baseUrl}/${jud}/data/candidate.json`;

    try {
      const response = await axios.get(url);
      const data = response.data;

      console.log(`✅ ${jud}: ${data.length} candidați`);
      allCandidates.push(...data.map(entry => ({ ...entry, judet: jud })));

      const filePath = path.join(outputDir, `${jud}.json`);
      await fs.writeJson(filePath, data, { spaces: 2 });
    } catch (err) {
      console.warn(`❌ Eroare la ${jud}: ${err.message}`);
    }
  }

  // Salvează un fișier combinat (opțional)
  const combinedPath = path.join(outputDir, 'combined.json');
  await fs.writeJson(combinedPath, allCandidates, { spaces: 2 });

  console.log(`\n🎉 Salvat total ${allCandidates.length} candidați în "combined.json"`);
}

fetchJudete();
