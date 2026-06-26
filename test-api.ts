async function run() {
  const res = await fetch('http://localhost:3000/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskTitle: 'Test', urgencyScore: 90, phoneNumber: '+12345678901', emailAddress: '' })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
