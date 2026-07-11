async function test() {
  try {
    const res = await fetch("https://api.openf1.org/v1/meetings?year=2024");
    if (!res.ok) {
      console.log("Upstream failed:", res.status, res.statusText);
      return;
    }
    const data = await res.json();
    console.log("Upstream OK, returned", data.length, "items.");
  } catch (e) {
    console.error("Error fetching upstream:", e.message);
  }
}

test();
