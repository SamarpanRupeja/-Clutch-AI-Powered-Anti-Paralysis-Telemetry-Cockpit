import dotenv from "dotenv";
dotenv.config();

async function test() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

  console.log("SID:", accountSid);
  console.log("Token:", authToken);
  console.log("Phone:", twilioPhone);

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      Body: 'Test alert',
      To: '+15104623513',
      From: twilioPhone || ''
    })
  });
  
  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Body:", text);
}
test();
