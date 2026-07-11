async function test() {
  const res = await fetch("https://api.openf1.org/v1/drivers?driver_number=12");
  const data = await res.json();
  console.log(data);
}
test();
