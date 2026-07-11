async function test() {
  const r = await fetch("https://api.openf1.org/v1/meetings?year=2024");
  const data = await r.json();
  console.log("Returned:", data.length);
  if (data.length > 0) {
    console.log("First:", data[0].year, data[0].meeting_key, data[0].meeting_name);
    console.log("Last:", data[data.length - 1].year, data[data.length - 1].meeting_key, data[data.length - 1].meeting_name);
  }
}
test();
