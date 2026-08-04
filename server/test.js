const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
}, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const token = json.token || json.data?.token;
      console.log('Register Res:', data);
      if (!token) return;
      
      const appReq = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/appointments',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token
        }
      }, resApp => {
        let dataApp = '';
        resApp.on('data', d => dataApp += d);
        resApp.on('end', () => console.log('Appointment:', resApp.statusCode, dataApp));
      });
      
      appReq.write(JSON.stringify({
        doctor_id: 'test_doc',
        appointment_date: '2023-10-10',
        appointment_time: '10:00',
        message: 'Test'
      }));
      appReq.end();
    } catch(e) {
      console.error('Error parsing:', e);
    }
  });
});

req.on('error', e => console.error(e));

req.write(JSON.stringify({
  email: 'test_user_' + Date.now() + '@example.com',
  password: 'password',
  role: 'patient',
  name: 'Test'
}));
req.end();
