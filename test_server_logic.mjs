const sheetName = "2026-06-21";
const idStr = "e/2PACX-1vSesHAf2i4cSydOiMSszcwC1sRz7yh6tiyVSQqbgAtnczqjqlwNhuw4nM-yjCeYL4OHNQkUq1y2K0t6";
const infoUrl = `https://docs.google.com/spreadsheets/d/${idStr}/pubhtml`;
const infoRes = await fetch(infoUrl);
const html = await infoRes.text();
let gid = '';

const jsonRegex = /{uid:\s*'([^']+)',\s*name:\s*['"]([^'"]+)['"]/g;
let jsonMatch;
while ((jsonMatch = jsonRegex.exec(html)) !== null) {
  if (jsonMatch[2] === sheetName) {
    gid = jsonMatch[1];
    break;
  }
}
if (!gid) {
  const gidRegex = new RegExp(`name:\\s*['"]${String(sheetName)}['"][^}]*gid:\\s*['"](\\d+)['"]`);
  const gm = html.match(gidRegex);
  if (gm) gid = gm[1];
}
console.log("Found gid:", gid);
