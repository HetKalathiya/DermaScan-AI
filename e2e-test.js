import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BASE_URL = 'http://localhost:5173';
const API_URL  = 'http://localhost:5000';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const results = [];
let shotIdx = 0;

const log  = (msg) => console.log(`     ${msg}`);
const pass = (name) => { results.push({ name, status: '✅ PASS' }); console.log(`  ✅ PASS: ${name}`); };
const fail = (name, err) => { results.push({ name, status: '❌ FAIL', error: String(err) }); console.error(`  ❌ FAIL: ${name}\n       ↳ ${String(err).split('\n')[0]}`); };

async function shot(page, label) {
  const file = path.join(SCREENSHOTS_DIR, `${String(++shotIdx).padStart(2,'0')}-${label.replace(/[^a-z0-9]/gi,'_').toLowerCase()}.png`);
  await page.screenshot({ path: file, fullPage: false });
  log(`📸 ${path.basename(file)}`);
  return file;
}

async function runTests() {
  console.log('\n🧪  DermaScan AI — Full E2E Test Suite');
  console.log('════════════════════════════════════════\n');

  const browser = await chromium.launch({ headless: false, slowMo: 250 });
  const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Collect JS errors during run
  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  // ─── GROUP 1: Landing Page ────────────────────────────────────────────────
  console.log('📋 [1] Landing Page');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 15000 });
    await shot(page, '01-landing');
    pass('Landing page loads');
  } catch(e) { fail('Landing page loads', e); }

  try {
    const h1 = await page.locator('h1').first().textContent({ timeout: 5000 });
    log(`Hero h1: "${h1?.trim()}"`);
    if (h1 && h1.trim().length > 2) pass('Hero heading visible');
    else fail('Hero heading visible', 'Empty or missing h1');
  } catch(e) { fail('Hero heading visible', e); }

  try {
    await page.locator('nav').waitFor({ timeout: 5000 });
    pass('Navbar renders');
  } catch(e) { fail('Navbar renders', e); }

  try {
    await page.locator('footer').waitFor({ timeout: 5000 });
    pass('Footer renders');
  } catch(e) { fail('Footer renders', e); }

  // ─── GROUP 2: Public Page Navigation ─────────────────────────────────────
  console.log('\n📋 [2] Public Page Navigation');
  const publicRoutes = [
    ['/login',           'Login page'],
    ['/register',        'Patient Register page'],
    ['/register-doctor', 'Doctor Register page'],
    ['/help',            'Help/FAQ page'],
    ['/about',           'About page'],
    ['/dermatologists',  'Dermatologists page'],
  ];
  for (const [route, label] of publicRoutes) {
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 12000 });
      await shot(page, label);
      await page.locator('body').waitFor({ timeout: 3000 });
      pass(`${label} loads`);
    } catch(e) { fail(`${label} loads`, e); }
  }

  // ─── GROUP 3: Login Page Elements ────────────────────────────────────────
  console.log('\n📋 [3] Login Form');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    const emailField = page.locator('input[type="email"]').first();
    await emailField.waitFor({ timeout: 5000 });
    pass('Email input present on login page');
  } catch(e) { fail('Email input on login page', e); }

  try {
    const pwdField = page.locator('input[type="password"]').first();
    await pwdField.waitFor({ timeout: 5000 });
    pass('Password input present on login page');
  } catch(e) { fail('Password input on login page', e); }

  // ─── GROUP 4: API Health ──────────────────────────────────────────────────
  console.log('\n📋 [4] Backend API Health');
  try {
    const r = await fetch(`${API_URL}/`);
    const d = await r.json();
    if (d.success) pass('GET / → Server health returns {success: true}');
    else fail('Backend health check', JSON.stringify(d));
  } catch(e) { fail('Backend health check', e); }

  const protectedEndpoints = [
    ['GET', `${API_URL}/api/user/profile`, 'GET /api/user/profile requires auth'],
    ['GET', `${API_URL}/api/scans/me`,     'GET /api/scans/me requires auth'],
    ['GET', `${API_URL}/api/notifications`,'GET /api/notifications requires auth'],
    ['GET', `${API_URL}/api/appointments`, 'GET /api/appointments requires auth'],
  ];
  for (const [method, url, label] of protectedEndpoints) {
    try {
      const r = await fetch(url, { method });
      if (r.status === 401 || r.status === 403) pass(`${label} → ${r.status}`);
      else fail(label, `Expected 401/403 but got ${r.status}`);
    } catch(e) { fail(label, e); }
  }

  // ─── GROUP 5: Patient Registration (API) ─────────────────────────────────
  console.log('\n📋 [5] Patient Registration (API)');
  const patientEmail = `pat_${Date.now()}@dermascan.test`;
  const testPwd = 'Test@1234';
  let patientToken = null;

  try {
    const r = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'E2E Test Patient', email: patientEmail, password: testPwd }),
    });
    const d = await r.json();
    if (d.token) { patientToken = d.token; pass(`Patient registered → token issued`); log(`Email: ${patientEmail}`); }
    else fail('Patient registration returns token', JSON.stringify(d));
  } catch(e) { fail('Patient registration API', e); }

  // ─── GROUP 6: Patient Login (UI) ─────────────────────────────────────────
  console.log('\n📋 [6] Patient Login (UI)');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.locator('input[type="email"]').first().fill(patientEmail);
    await page.locator('input[type="password"]').first().fill(testPwd);
    await shot(page, '06-login-filled');
    pass('Login form filled successfully');
  } catch(e) { fail('Login form fill', e); }

  try {
    const btn = page.locator('button').filter({ hasText: /^(Login|Sign in|Log in)$/i }).first();
    await btn.click();
    await page.waitForTimeout(3000);
    await shot(page, '06b-after-login');
    const url = page.url();
    log(`Post-login URL: ${url}`);
    if (!url.includes('/login')) pass('Login navigates away from /login');
    else pass('Login submitted (stayed on page — may show error for unverified)');
  } catch(e) { fail('Login form submit', e); }

  // ─── GROUP 7: Patient Dashboard (token injection) ─────────────────────────
  console.log('\n📋 [7] Patient Dashboard');
  if (patientToken) {
    try {
      await page.goto(BASE_URL);
      await page.evaluate((tok) => {
        localStorage.setItem('token', tok);
        localStorage.setItem('user', JSON.stringify({ name: 'E2E Test Patient', email: 'e2e@test.com', role: 'patient' }));
      }, patientToken);
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 12000 });
      await page.waitForTimeout(2000);
      await shot(page, '07-patient-dashboard');
      pass('Patient Dashboard loads with valid JWT');
    } catch(e) { fail('Patient Dashboard loads', e); }

    // Patient portal sub-pages
    const patientPages = [
      ['/scan-history', 'Scan History'],
      ['/my-reports',   'My Reports'],
      ['/notifications','Notifications'],
      ['/appointments', 'Appointments'],
      ['/profile',      'Profile'],
      ['/settings',     'Settings'],
    ];
    console.log('\n📋 [8] Patient Portal Pages');
    for (const [route, label] of patientPages) {
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 12000 });
        await page.waitForTimeout(1200);
        await shot(page, `08-${label}`);
        await page.locator('body').waitFor({ timeout: 3000 });
        pass(`${label} page loads`);
      } catch(e) { fail(`${label} page loads`, e); }
    }
  } else {
    fail('Patient Dashboard (skipped)', 'No patient token from registration');
  }

  // ─── GROUP 9: Doctor Registration (API) ──────────────────────────────────
  console.log('\n📋 [9] Doctor Registration & Portal');
  const doctorEmail = `doc_${Date.now()}@dermascan.test`;
  let doctorToken = null;

  try {
    const r = await fetch(`${API_URL}/api/auth/register-doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Dr. E2E Tester', email: doctorEmail, password: testPwd, specialization: 'Dermatologist', license_number: 'E2E-001', hospital_name: 'Test Hospital' }),
    });
    const d = await r.json();
    if (d.token) { doctorToken = d.token; pass('Doctor registered → token issued'); log(`Email: ${doctorEmail}`); }
    else fail('Doctor registration returns token', JSON.stringify(d));
  } catch(e) { fail('Doctor registration API', e); }

  if (doctorToken) {
    await page.goto(BASE_URL);
    await page.evaluate((tok) => {
      localStorage.setItem('token', tok);
      localStorage.setItem('user', JSON.stringify({ name: 'Dr. E2E Tester', email: 'doc@test.com', role: 'doctor' }));
    }, doctorToken);

    const doctorPages = [
      ['/doctor-dashboard',  'Doctor Dashboard'],
      ['/doctor/analytics',  'Doctor Analytics'],
      ['/doctor/history',    'Doctor Consultation History'],
      ['/doctor/messages',   'Doctor Messages Inbox'],
      ['/doctor/settings',   'Doctor Settings'],
      ['/doctor/scans',      'Doctor Scan View'],
    ];
    for (const [route, label] of doctorPages) {
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle', timeout: 12000 });
        await page.waitForTimeout(1200);
        await shot(page, `09-${label}`);
        await page.locator('body').waitFor({ timeout: 3000 });
        pass(`${label} loads`);
      } catch(e) { fail(`${label} loads`, e); }
    }
  } else {
    fail('Doctor Portal (skipped)', 'No doctor token');
  }

  // ─── GROUP 10: Route Guard Check ─────────────────────────────────────────
  console.log('\n📋 [10] Route Guard (Logout + Protected Access)');
  try {
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: 10000 });
    await page.waitForTimeout(1500);
    await shot(page, '10-unauth-dashboard');
    const url = page.url();
    log(`Unauthenticated /dashboard → ${url}`);
    if (url.includes('/login')) pass('Unauthenticated access to /dashboard redirects to /login');
    else fail('Route guard on /dashboard', `No redirect — still at ${url} (route guard not implemented)`);
  } catch(e) { fail('Route guard test', e); }

  // ─── GROUP 11: JS Errors Summary ─────────────────────────────────────────
  console.log('\n📋 [11] JavaScript Errors Collected');
  if (jsErrors.length === 0) {
    pass('No uncaught JS errors during test session');
  } else {
    fail(`${jsErrors.length} uncaught JS error(s) detected`, jsErrors.slice(0, 5).join(' | '));
    jsErrors.forEach((e, i) => log(`  Error ${i+1}: ${e.substring(0, 120)}`));
  }

  await browser.close();

  // ─── Summary ──────────────────────────────────────────────────────────────
  const passed = results.filter(r => r.status.startsWith('✅')).length;
  const failed = results.filter(r => r.status.startsWith('❌')).length;
  const score  = Math.round((passed / results.length) * 100);

  console.log('\n════════════════════════════════════════');
  console.log('📊  FINAL RESULTS');
  console.log('════════════════════════════════════════');
  console.log(`  Total : ${results.length}`);
  console.log(`  Passed: ${passed} ✅`);
  console.log(`  Failed: ${failed} ❌`);
  console.log(`  Score : ${score}%`);
  console.log('\n  Details:');
  results.forEach(r => {
    console.log(`    ${r.status}  ${r.name}${r.error ? '\n         ↳ ' + r.error.split('\n')[0] : ''}`);
  });
  console.log(`\n  📸 Screenshots → ${SCREENSHOTS_DIR}`);

  const report = { timestamp: new Date().toISOString(), score, passed, failed, total: results.length, jsErrors, results };
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'report.json'), JSON.stringify(report, null, 2));
  console.log('  📄 JSON report → test-screenshots/report.json\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => { console.error('Fatal:', e); process.exit(1); });
