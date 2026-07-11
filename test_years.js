async function fetchYears() {
  const res = await fetch("https://api.openf1.org/v1/meetings");
  const data = await res.json();
  const years = [...new Set(data.map(m => m.year))];
  console.log("Supported Years:", years);
}
fetchYears();
