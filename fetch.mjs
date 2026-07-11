async function run() {
  const url = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSesHAf2i4cSydOiMSszcwC1sRz7yh6tiyVSQqbgAtnczqjqlwNhuw4nM-yjCeYL4OHNQkUq1y2K0t6/pubhtml';
  console.log('Fetching:', url);
  const res = await fetch(url);
  const htmlText = await res.text();
  console.log('Includes Sorry?', htmlText.includes('Sorry'));
  console.log('Includes does not exist?', htmlText.includes('does not exist'));
  console.log('Includes 404?', htmlText.includes('404'));
  console.log('Includes error?', htmlText.toLowerCase().includes('error'));
  console.log('Includes Google Sheets?', htmlText.includes('Google'));
  
  // Print some lines containing "error" or similar
  const lines = htmlText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes('error') || lines[i].includes('Sorry')) {
      console.log(`Line ${i}:`, lines[i].substring(0, 150));
    }
  }
}
run();
