async function run() {
  const url = 'http://localhost:3000/api/public-sheet-news?spreadsheetId=wrong_id&date=2026-06-21';
  const res = await fetch(url);
  console.log(res.status);
  const text = await res.text();
  console.log(text.slice(0, 500));
}
run();
