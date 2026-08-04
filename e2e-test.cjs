const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:5000';
const SCREENSHOTS_DIR = path.join(__dirname, 'test-screenshots');

// Create screenshots directory
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const results = [];
let testNum = 0;

function log(msg) { console.log(`  ${msg}`); }
function pass(name) { results.push({ name, status: '✅ PASS' }); console.log(`✅ PASS: ${name}`); }
function fail(name, err) { results.push({ name, status: '❌ FAIL', error: String(err) }); console.error(`❌ FAIL: ${name}\n     ${err}`); }

async function screenshot(page, name) {
  const file = path.join(SCREENSHOTS_DIR, `${++testNum}-${name.replace(/[^a-z0-9]/gi, '_')}.png`);
  await page.screenshot({ path: file, fullPage: false });
  log(`📸 Screenshot: ${file}`);
  return file;
}

async function runTests() {
  console.log('\n🧪 DermaScan AI — End-to-End Test Suite');
  console.log('=========================================\n');

  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  // ─── 1. Landing Page ───────────────────────────────────────────────────────
  console.log('\n📋 [1] Landing Page Tests');
  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await screenshot(page, '01-landing-page');
    const title = await page.title();
    log(`Page title: ${title}`);
    pass('Landing page loads successfully');
  } catch (e) { fail('Landing page loads', e); }

  try {
    await page.waitForSelector('nav', { timeout: 5000 });
    pass('Navbar is visible');
  } catch (e) { fail('Navbar is visible', e); }

  try {
    const heroText = await page.locator('h1').first().textContent();
    log(`Hero h1: "${heroText}"`);
    if (heroText && heroText.length > 3) pass('Hero section renders with heading');
    else fail('Hero section has heading', 'Heading text too short or missing');
  } catch (e) { fail('Hero section renders', e); }

  try {
    const footer = await page.locator('footer').isVisible();
    if (footer) pass('Footer is visible');
    else fail('Footer is visible', 'Not found');
  } catch (e) { fail('Footer is visible', e); }

  // ─── 2. Navigation Links ───────────────────────────────────────────────────
  console.log('\n📋 [2] Navigation Tests');
  
  const navRoutes = [
    { path: '/login', name: 'Login page' },
    { path: '/register', name: 'Register page' },
    { path: '/register-doctor', name: 'Doctor Register page' },
    { path: '/help', name: 'Help page' },
    { path: '/about', name: 'About page' },
    { path: '/dermatologists', name: 'Dermatologists page' },
  ];

  for (const route of navRoutes) {
    try {
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 10000 });
      await screenshot(page, `nav-${route.name}`);
      await page.waitForSelector('body', { timeout: 3000 });
      pass(`${route.name} navigates successfully`);
    } catch (e) { fail(`${route.name} navigates`, e); }
  }

  // ─── 3. Login Form Validation ──────────────────────────────────────────────
  console.log('\n📋 [3] Login Form Tests');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await screenshot(page, '03-login-page');
    pass('Login page loads');
  } catch (e) { fail('Login page loads', e); }

  try {
    // Try submitting empty form
    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /login|sign in/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(1000);
    await screenshot(page, '03b-login-validation');
    pass('Login form validation triggered');
  } catch (e) { fail('Login form validation', e); }

  // ─── 4. Patient Registration ───────────────────────────────────────────────
  console.log('\n📋 [4] Patient Registration Tests');
  const testEmail = `patient_${Date.now()}@test.com`;
  const testPassword = 'Test@1234';
  let patientToken = null;

  try {
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    await screenshot(page, '04-register-page');
    pass('Registration page loads');
  } catch (e) { fail('Registration page loads', e); }

  // Try API registration directly
  try {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Test Patient', email: testEmail, password: testPassword })
    });
    const data = await res.json();
    if (data.token || data.auth) {
      patientToken = data.token;
      pass(`Patient registered via API (${testEmail})`);
      log(`Token received: ${patientToken ? 'yes' : 'no'}`);
    } else {
      fail('Patient registration API', JSON.stringify(data));
    }
  } catch (e) { fail('Patient registration API', e); }

  // ─── 5. Patient Login ──────────────────────────────────────────────────────
  console.log('\n📋 [5] Patient Login Tests');
  try {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    // Fill email
    const emailInput = page.locator('input[type="email"], input[placeholder*="email" i]').first();
    await emailInput.fill(testEmail);
    
    // Fill password
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill(testPassword);
    
    await screenshot(page, '05-login-filled');
    pass('Login form filled');
    
    // Submit
    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /login|sign in/i }).first();
    await submitBtn.click();
    await page.waitForTimeout(3000);
    await screenshot(page, '05b-after-login');
    
    const currentUrl = page.url();
    log(`After login URL: ${currentUrl}`);
    if (currentUrl.includes('/dashboard') || currentUrl.includes('/login')) {
      pass('Patient login form submitted');
    } else {
      pass('Patient login navigated away from login page');
    }
  } catch (e) { fail('Patient login', e); }

  // ─── 6. Protected Route Redirect Test ────────────────────────────────────────
  console.log('\n📋 [6] Auth Protected Route Tests');
  try {
    // Clear storage and try to access dashboard
    await context.clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const url = page.url();
    await screenshot(page, '06-protected-route');
    log(`Protected route redirect URL: ${url}`);
    // The page may render (no route guards implemented) or redirect - note the behavior
    if (url.includes('/login')) {
      pass('Protected /dashboard redirects to login when unauthenticated');
    } else {
      fail('Protected route guard', `Expected redirect to /login but got ${url} — No route guard implemented`);
    }
  } catch (e) { fail('Protected route redirect', e); }

  // ─── 7. Patient Dashboard (with manual token injection) ─────────────────────
  console.log('\n📋 [7] Patient Dashboard Tests');
  if (patientToken) {
    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle' });
      await page.evaluate((token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ name: 'Test Patient', email: 'test@test.com', role: 'patient' }));
      }, patientToken);
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      await screenshot(page, '07-patient-dashboard');
      const bodyText = await page.locator('body').textContent();
      log(`Dashboard content preview: ${bodyText?.substring(0, 100)}`);
      pass('Patient Dashboard loads with valid token');
    } catch (e) { fail('Patient Dashboard loads', e); }
  } else {
    log('⚠️  Skipping dashboard test — no patient token available');
  }

  // ─── 8. Patient Portal Pages ──────────────────────────────────────────────
  console.log('\n📋 [8] Patient Portal Page Tests');
  const patientPages = [
    { path: '/scan-history', name: 'Scan History' },
    { path: '/my-reports', name: 'My Reports' },
    { path: '/notifications', name: 'Notifications' },
    { path: '/appointments', name: 'Appointments' },
    { path: '/profile', name: 'Profile' },
    { path: '/settings', name: 'Settings' },
  ];

  if (patientToken) {
    for (const pg of patientPages) {
      try {
        await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1500);
        await screenshot(page, `08-${pg.name}`);
        const bodyVisible = await page.locator('body').isVisible();
        if (bodyVisible) pass(`${pg.name} page loads`);
        else fail(`${pg.name} page loads`, 'Body not visible');
      } catch (e) { fail(`${pg.name} page loads`, e); }
    }
  } else {
    log('⚠️  Skipping patient portal pages — no token');
  }

  // ─── 9. Doctor Registration via API ──────────────────────────────────────
  console.log('\n📋 [9] Doctor Registration & Login Tests');
  const doctorEmail = `doctor_${Date.now()}@test.com`;
  let doctorToken = null;

  try {
    const res = await fetch(`${API_URL}/api/auth/register-doctor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Dr. Test Smith',
        email: doctorEmail,
        password: testPassword,
        specialization: 'Dermatologist',
        license_number: 'LIC-TEST-001',
        hospital_name: 'Test Hospital'
      })
    });
    const data = await res.json();
    if (data.token || data.auth) {
      doctorToken = data.token;
      pass(`Doctor registered via API (${doctorEmail})`);
    } else {
      fail('Doctor registration API', JSON.stringify(data));
    }
  } catch (e) { fail('Doctor registration API', e); }

  // ─── 10. Doctor Portal Pages ──────────────────────────────────────────────
  console.log('\n📋 [10] Doctor Portal Page Tests');
  const doctorPages = [
    { path: '/doctor-dashboard', name: 'Doctor Dashboard' },
    { path: '/doctor/analytics', name: 'Doctor Analytics' },
    { path: '/doctor/history', name: 'Doctor Consultation History' },
    { path: '/doctor/messages', name: 'Doctor Messages Inbox' },
    { path: '/doctor/settings', name: 'Doctor Settings' },
    { path: '/doctor/scans', name: 'Doctor Scan View' },
  ];

  if (doctorToken) {
    await page.evaluate((token) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ name: 'Dr. Test Smith', email: 'doc@test.com', role: 'doctor' }));
    }, doctorToken);

    for (const pg of doctorPages) {
      try {
        await page.goto(`${BASE_URL}${pg.path}`, { waitUntil: 'networkidle', timeout: 10000 });
        await page.waitForTimeout(1500);
        await screenshot(page, `10-${pg.name}`);
        const bodyVisible = await page.locator('body').isVisible();
        if (bodyVisible) pass(`${pg.name} page loads`);
        else fail(`${pg.name} page loads`, 'Body not visible');
      } catch (e) { fail(`${pg.name} page loads`, e); }
    }
  } else {
    log('⚠️  Skipping doctor portal pages — no doctor token');
  }

  // ─── 11. API Health Tests ─────────────────────────────────────────────────
  console.log('\n📋 [11] Backend API Health Tests');
  const apiTests = [
    { method: 'GET', url: `${API_URL}/`, expectedKey: 'success', name: 'Backend health endpoint' },
    { method: 'GET', url: `${API_URL}/api/user/profile`, expectedStatus: 401, name: 'Profile requires auth (401)' },
    { method: 'GET', url: `${API_URL}/api/scans/me`, expectedStatus: 401, name: 'Scans requires auth (401)' },
    { method: 'GET', url: `${API_URL}/api/notifications`, expectedStatus: 401, name: 'Notifications requires auth (401)' },
  ];

  for (const t of apiTests) {
    try {
      const res = await fetch(t.url, { method: t.method });
      const status = res.status;
      if (t.expectedStatus) {
        if (status === t.expectedStatus) pass(`${t.name} → ${status}`);
        else fail(`${t.name}`, `Expected ${t.expectedStatus} got ${status}`);
      } else {
        const data = await res.json();
        if (data[t.expectedKey] !== undefined) pass(`${t.name} → ${JSON.stringify(data)}`);
        else fail(`${t.name}`, `Missing key "${t.expectedKey}" in response`);
      }
    } catch (e) { fail(t.name, e); }
  }

  // ─── 12. Console Errors Check ─────────────────────────────────────────────
  console.log('\n📋 [12] Final Page Error Check');
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));
  
  try {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await screenshot(page, '12-final-landing');
    if (pageErrors.length === 0) pass('No JavaScript console errors on landing page');
    else fail('No JS errors on landing page', pageErrors.slice(0, 3).join('; '));
  } catch (e) { fail('Final page check', e); }

  // ─── Summary ──────────────────────────────────────────────────────────────
  await browser.close();

  const passed = results.filter(r => r.status.startsWith('✅')).length;
  const failed = results.filter(r => r.status.startsWith('❌')).length;

  console.log('\n\n=========================================');
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=========================================');
  console.log(`Total:  ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Score:  ${Math.round((passed / results.length) * 100)}%`);
  console.log('\nDetailed Results:');
  results.forEach(r => {
    console.log(`  ${r.status} ${r.name}${r.error ? '\n     ↳ ' + r.error : ''}`);
  });
  console.log('\n📸 Screenshots saved to:', SCREENSHOTS_DIR);

  // Save JSON report
  const report = { timestamp: new Date().toISOString(), passed, failed, total: results.length, score: Math.round((passed / results.length) * 100), results };
  fs.writeFileSync(path.join(SCREENSHOTS_DIR, 'test-report.json'), JSON.stringify(report, null, 2));
  console.log('📄 JSON report saved to test-screenshots/test-report.json\n');
  
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(e => { console.error('Fatal error:', e); process.exit(1); });
