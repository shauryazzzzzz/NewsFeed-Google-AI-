const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSesHAf2i4cSydOiMSszcwC1sRz7yh6tiyVSQqbgAtnczqjqlwNhuw4nM-yjCeYL4OHNQkUq1y2K0t6/pub?output=csv&single=true&gid=55465862";
const res = await fetch(url);
console.log(res.status);
console.log(await res.text());
