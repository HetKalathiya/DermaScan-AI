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
      if (!token) {
        console.log('No token', data);
        return;
      }
      
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
      
      // Send a fake base64 image (valid format)
      appReq.write(JSON.stringify({
        doctor_id: 'test_doc',
        appointment_date: '2023-10-10',
        appointment_time: '10:00',
        message: 'Test with image',
        image_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
      }));
      appReq.end();
    } catch(e) {
      console.error(e);
    }
  });
});

req.write(JSON.stringify({
  email: 'test_image_' + Date.now() + '@example.com',
  password: 'password',
  role: 'patient',
  name: 'Test'
}));
req.end();
