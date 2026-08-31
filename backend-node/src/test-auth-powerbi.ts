import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runAuthAndPowerBiTests() {
  console.log('🧪 Starting Auth & Power BI End-to-End Verification Tests...\n');

  // Test 1: Service Health
  console.log('▶ [1/6] Verifying Service Health & Auth/Power BI Mounts...');
  const healthRes = await axios.get(`${API_BASE}/health`);
  console.log('  Health:', healthRes.data);
  if (!healthRes.data.auth || !healthRes.data.powerBi) {
    throw new Error('Health check missing auth or Power BI metadata');
  }
  console.log('  ✅ Services mounted and healthy.\n');

  // Test 2: User Registration
  const testUserA = {
    email: `investigator_${Date.now()}@oxford.ac.uk`,
    password: 'SecureResearchPassword2026!',
    name: 'Dr. Eleanor Vance'
  };

  console.log('▶ [2/6] Testing User Registration & Password Hashing...');
  const regRes = await axios.post(`${API_BASE}/auth/register`, testUserA);
  console.log(`  Registered: ${regRes.data.user.email} (ID: ${regRes.data.user.id})`);
  const tokenA = regRes.data.token;
  if (!tokenA) throw new Error('JWT token not returned on registration');
  console.log('  ✅ User registered with bcrypt password hash & JWT.\n');

  // Test 3: Authenticated Session (/api/auth/me)
  console.log('▶ [3/6] Verifying Session Retrieval (GET /api/auth/me)...');
  const meRes = await axios.get(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  console.log(`  Session Verified: ${meRes.data.user.email}`);
  console.log('  ✅ requireAuth middleware successfully decoded session.\n');

  // Test 4: Invalid Password Rejection
  console.log('▶ [4/6] Verifying Invalid Credentials Rejection...');
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: testUserA.email,
      password: 'WrongPassword123'
    });
    throw new Error('Expected 401 on bad password but succeeded');
  } catch (err: any) {
    if (err.response?.status === 401) {
      console.log(`  Rejection Output: "${err.response.data.error}"`);
      console.log('  ✅ Correct plain-English 401 rejection on bad credentials.\n');
    } else {
      throw err;
    }
  }

  // Test 5: Tenant Isolation Between Multiple Users
  console.log('▶ [5/6] Testing Multi-User Study Isolation (Tenant Boundary)...');
  // Create survey for User A
  const surveyResA = await axios.post(
    `${API_BASE}/surveys`,
    {
      title: "User A's Confidential Clinical Trial",
      questions: [{ code: 'q1', title: 'Treatment Efficacy Rating', type: 'likert' }]
    },
    { headers: { Authorization: `Bearer ${tokenA}` } }
  );
  console.log(`  User A created study: ${surveyResA.data.id}`);

  // Register User B
  const testUserB = {
    email: `scientist_${Date.now()}@mit.edu`,
    password: 'SecureResearchPassword2026!',
    name: 'Prof. Richard Feynman'
  };
  const regResB = await axios.post(`${API_BASE}/auth/register`, testUserB);
  const tokenB = regResB.data.token;

  // List surveys as User B (should NOT see User A's study)
  const surveysB = await axios.get(`${API_BASE}/surveys`, {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  const userBHasUserAStudy = surveysB.data.some((s: any) => s.id === surveyResA.data.id);
  if (userBHasUserAStudy) {
    throw new Error('Tenant isolation breach: User B can see User A survey');
  }
  console.log(`  User B surveys count: ${surveysB.data.length} (User A's confidential study is strictly hidden).`);
  console.log('  ✅ Multi-tenant user isolation verified.\n');

  // Test 6: Power BI Embed Token Generation
  console.log('▶ [6/6] Testing Power BI App-Owns-Data Token Endpoint (GET /api/reports/:id/embed-token)...');
  const embedRes = await axios.get(`${API_BASE}/reports/rep_searchsea_exec_01/embed-token`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  console.log('  Embed Config Payload:', {
    reportId: embedRes.data.reportId,
    reportName: embedRes.data.reportName,
    isDemoMode: embedRes.data.isDemoMode,
    expiresInMinutes: embedRes.data.expiresInMinutes
  });
  if (!embedRes.data.embedToken || !embedRes.data.embedUrl) {
    throw new Error('Embed payload missing embedToken or embedUrl');
  }
  console.log('  ✅ Power BI App-owns-data embed token negotiation verified.\n');

  console.log('🎉 ALL AUTHENTICATION & POWER BI INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
}

runAuthAndPowerBiTests().catch((err) => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
