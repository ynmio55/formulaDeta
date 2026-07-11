async function test() {
  const res = await fetch("https://api.openf1.org/v1/championship_drivers?meeting_key=latest");
  const data = await res.json();
  console.log(data);
}
test();
