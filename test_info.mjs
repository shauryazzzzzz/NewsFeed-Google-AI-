const url = 'http://localhost:3000/api/public-sheet-info?spreadsheetId=e/2PACX-1vSesHAf2i4cSydOiMSszcwC1sRz7yh6tiyVSQqbgAtnczqjqlwNhuw4nM-yjCeYL4OHNQkUq1y2K0t6';
const res = await fetch(url);
console.log(res.status);
const text = await res.text();
console.log(text);
