const listUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesHAf2i4cSydOiMSszcwC1sRz7yh6tiyVSQqbgAtnczqjqlwNhuw4nM-yjCeYL4OHNQkUq1y2K0t6/pub?output=csv";
const res = await fetch(listUrl);
console.log(res.status);
