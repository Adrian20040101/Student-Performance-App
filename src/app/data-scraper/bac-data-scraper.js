const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const URL = 'https://static.bacalaureat.edu.ro/2024/rapoarte/rezultate/alfabetic/index.html';
  console.log('Loading', URL);
  await page.goto(URL, { waitUntil: 'load' });

  const ctx = await (async () => {
    try {
      await page.waitForSelector('#mainTable', { timeout: 3000 });
      return page;
    } catch {}
    for (const fr of page.frames()) {
      try {
        await fr.waitForSelector('#mainTable', { timeout: 3000 });
        return fr;
      } catch {}
    }
    return null;
  })();

  if (!ctx) {
    console.error('#mainTable not found');
    await browser.close();
    process.exit(1);
  }

  const all = [];
  const debugSamples = [];
  const wantDebugSamples = 3;

  await ctx.waitForSelector('#mainTable');

  while (true) {
    console.log('Scraping current page...');

    const batch = await ctx.$$eval('#mainTable tbody tr', (rows) => {
      const cleanTxt = (el) => {
        if (!el) return '';
        const scripts = el.querySelectorAll('script');
        scripts.forEach(s => s.remove());
        return (el.textContent || '').replace(/\u00a0/g, '').trim();
      };

      const isCompetencyStr = (s) => /^[ABC][12](?:-[ABC][12]){4}$/.test(s);
      const isUtilizator = (s) => /^Utilizator/i.test(s);
      const isLimbaLabel = (s) => /^LIMBA\s+/i.test(s);
      const isRezultat = (s) => /(REUSIT|RESPINS|ADMIS|NEPREZENTAT|NEPROMOVAT|PROMOVAT)/i.test(s);
      const toRez = (s) => (s.match(/REUSIT|RESPINS|ADMIS|NEPREZENTAT|NEPROMOVAT|PROMOVAT/i) || [''])[0].toUpperCase();
      const toNum = (s) => s.replace(',', '.');
      const isGrade = (s) => /^-?\d+(?:[.,]\d+)?$/.test(s) || s === '-2';
      const mval = (s) => {
        const m = (s || '').match(/-?\d+(?:[.,]\d+)?/);
        return m ? toNum(m[0]) : '';
      };

      const trsFiltered = Array.from(rows).filter(tr => tr.querySelectorAll('td').length);
      const out = [];

      for (let i = 0; i < trsFiltered.length - 1; i += 2) {
        const r1 = trsFiltered[i];
        const r2 = trsFiltered[i + 1];

        const c1 = Array.from(r1.cells).map(cleanTxt);
        const c2 = Array.from(r2.cells).map(cleanTxt);

        const rawCode = c1[1] || '';
        const codMatch = rawCode.match(/[A-Z]{1,2}\d{5,}/);
        if (!codMatch) continue;
        const codCandidat = codMatch[0];

        const medieIdx    = c1.length - 2;
        const rezultatIdx = c1.length - 1;
        const medie       = mval(c1[medieIdx] || '');
        const rezultat    = toRez(c1[rezultatIdx] || '');
        const romanaCompetente = c1[9] || '';

        const r1RomNums = [c1[10], c1[11], c1[12]];
        const r1RomAllNumeric = r1RomNums.every(x => x !== undefined && (isGrade(x) || x === ''));
        const r1RomHasAny = r1RomNums.some(x => !!x && isGrade(x));
        let romanaScris, romanaContestatie, romanaFinala;

        if (r1RomAllNumeric && r1RomHasAny) {
          [romanaScris, romanaContestatie, romanaFinala] = r1RomNums;
        } else {
          romanaScris       = c2[1] || '';
          romanaContestatie = c2[2] || '';
          romanaFinala      = c2[3] || '';
        }

        const maternaDisciplineCandidate = c1[13] || '';
        const hasMaterna = !!maternaDisciplineCandidate && isLimbaLabel(maternaDisciplineCandidate);

        let limbaModerna = '';
        let limbaModernaCompetente = '';
        let lmIdx = -1;
        for (let idx = 0; idx < c1.length; idx++) {
          if (isLimbaLabel(c1[idx])) {
            if (hasMaterna && idx === 13) continue; 
            limbaModerna = c1[idx];
            lmIdx = idx;
            for (let j = idx + 1; j < c1.length; j++) {
              if (isCompetencyStr(c1[j])) {
                limbaModernaCompetente = c1[j];
                break;
              }
            }
            break;
          }
        }

        let maternaCompetente = '';
        if (hasMaterna && lmIdx > 13) {
          for (let j = 14; j < lmIdx; j++) {
            const v = c1[j];
            if (!v) continue;
            if (isLimbaLabel(v) || isRezultat(v)) continue;
            maternaCompetente = v;
            break;
          }
        }

        let competenteDigitale = '';
        for (let idx = c1.length - 3; idx >= 0; idx--) {
          if (isUtilizator(c1[idx])) {
            competenteDigitale = c1[idx];
            break;
          }
        }

        const takeTriplet = (base) => ({
          scris: c2[base] || '',
          contestatie: c2[base + 1] || '',
          finala: c2[base + 2] || ''
        });

        let maternaTrip = { scris: '', contestatie: '', finala: '' };
        let obligTrip   = { scris: '', contestatie: '', finala: '' };
        let alegTrip    = { scris: '', contestatie: '', finala: '' };

        if (hasMaterna) {
          maternaTrip = takeTriplet(1);
          obligTrip   = takeTriplet(4);
          alegTrip    = takeTriplet(7);
        } else {
          obligTrip = takeTriplet(4);
          alegTrip  = takeTriplet(7);
        }

        const startIdx = lmIdx >= 0 ? lmIdx + 1 : 0;
        const isSubject = s =>
          s &&
          s === s.toUpperCase() &&
          s.length > 5 &&
          !isLimbaLabel(s) &&
          !isCompetencyStr(s) &&
          !isUtilizator(s) &&
          !isRezultat(s);

        const subjects = [];
        for (let idx = startIdx; idx < c1.length; idx++) {
          if (isSubject(c1[idx])) subjects.push(c1[idx]);
          if (subjects.length === 2) break;
        }

        const obligDisc = subjects[0] || '';
        const alegDisc  = subjects[1] || '';

        const materna = hasMaterna ? {
          disciplina: maternaDisciplineCandidate,
          competente: maternaCompetente,
          scris:       maternaTrip.scris,
          contestatie: maternaTrip.contestatie,
          finala:      maternaTrip.finala
        } : { disciplina:'', competente:'', scris:'', contestatie:'', finala:'' };

        const result = {
          codCandidat,
          scoala: c1[4] || '',
          judet: c1[5] || '',
          promotieAnterioara: c1[6] || '',
          formaInvatamant: c1[7] || '',
          specializare: c1[8] || '',
          romana: {
            competente: romanaCompetente,
            scris: romanaScris,
            contestatie: romanaContestatie,
            finala: romanaFinala
          },
          medie,
          rezultat,
          materna,
          limbaModerna,
          limbaModernaCompetente,
          probaObligatorie: {
            disciplina: obligDisc,
            nota: obligTrip.scris,
            contestatie: obligTrip.contestatie,
            finala: obligTrip.finala
          },
          probaAlegere: {
            disciplina: alegDisc,
            nota: alegTrip.scris,
            contestatie: alegTrip.contestatie,
            finala: alegTrip.finala
          },
          competenteDigitale
        };

        out.push(result);
      }

      return out;
    });

    all.push(...batch);

    const nextLink = await ctx.$('table[title="Pagina urmatoare"] a');
    if (!nextLink) break;

    const nextUrl = await nextLink.evaluate(a => a.href);
    console.log('Navigating to next page:', nextUrl);

    await ctx.goto(nextUrl, { waitUntil: 'load' });
    await ctx.waitForSelector('#mainTable');
    await new Promise(r => setTimeout(r, 120));
  }

  fs.writeFileSync('bac_results_2024.json', JSON.stringify(all, null, 2));
  console.log(`\n${all.length} candidates saved to bac_results_2024.json`);
  await browser.close();
})();
