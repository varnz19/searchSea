import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runProfileAndSettingsTests() {
  console.log('🧪 Starting SearchSea Profile, Settings & Activity History Verification Tests...\n');

  // 1. Register test investigator
  const testUser = {
    email: `prof_hastings_${Date.now()}@cambridge.ac.uk`,
    password: 'OriginalPassword2026!',
    name: 'Prof. Alistair Hastings'
  };

  console.log('▶ [1/6] Registering test investigator session...');
  const regRes = await axios.post(`${API_BASE}/auth/register`, testUser);
  const token = regRes.data.token;
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };
  console.log(`  Registered & Authenticated: ${testUser.email}\n`);

  // 2. Fetch Initial Profile & Settings
  console.log('▶ [2/6] Fetching initial Profile, Defaults & Lifetime Analytics...');
  const profileRes1 = await axios.get(`${API_BASE}/user/profile`, authHeader);
  console.log('  Initial Profile:', {
    name: profileRes1.data.profile.name,
    email: profileRes1.data.profile.email,
    username: profileRes1.data.profile.username
  });
  console.log('  Initial Methodological Settings:', profileRes1.data.settings);
  console.log('  Initial Lifetime Analytics:', profileRes1.data.analytics);
  console.log('  ✅ Initial profile retrieval verified.\n');

  // 3. Update Investigator Identity
  console.log('▶ [3/6] Updating Investigator Profile (Username, Institution, Discipline, ORCID)...');
  const updateProfilePayload = {
    username: `hastings_${Date.now().toString().slice(-4)}`,
    institution: 'University of Cambridge, Department of Applied Mathematics and Theoretical Physics',
    discipline: 'Empirical Bayesian Modeling, Quantitative Behavioral Science',
    orcidId: '0000-0003-4921-9921',
    bio: 'Pioneers automated statistical validation frameworks and multiple-comparisons family-wise error rate control.'
  };

  const updateProfileRes = await axios.put(`${API_BASE}/user/profile`, updateProfilePayload, authHeader);
  console.log('  Profile Update Result:', updateProfileRes.data.message);
  console.log('  Saved Profile:', updateProfileRes.data.profile);
  console.log('  ✅ Investigator identity update verified.\n');

  // 4. Update Methodological Settings
  console.log('▶ [4/6] Updating Methodological Defaults (Alpha, FDR Correction, Quality Cutoffs)...');
  const updateSettingsPayload = {
    defaultAlpha: 0.01,
    defaultCorrectionMethod: 'benjamini_hochberg',
    speederDurationCutoffSeconds: 20,
    straightlineStdThreshold: 0.30,
    reportingNotationStyle: 'clinical'
  };

  const updateSettingsRes = await axios.put(`${API_BASE}/user/settings`, updateSettingsPayload, authHeader);
  console.log('  Settings Update Result:', updateSettingsRes.data.message);
  console.log('  Saved Settings:', updateSettingsRes.data.settings);
  if (updateSettingsRes.data.settings.defaultAlpha !== 0.01 || updateSettingsRes.data.settings.defaultCorrectionMethod !== 'benjamini_hochberg') {
    throw new Error('Settings update failed to persist custom parameters');
  }
  console.log('  ✅ Methodological settings persistence verified.\n');

  // 5. Change Password
  console.log('▶ [5/6] Testing Password Modification & Credential Verification...');
  // Attempt with invalid current password
  try {
    await axios.put(`${API_BASE}/user/password`, {
      currentPassword: 'WrongOldPassword123!',
      newPassword: 'BrandNewSecurePassword2026!'
    }, authHeader);
    throw new Error('Expected 401 on incorrect current password');
  } catch (err: any) {
    if (err.response?.status === 401) {
      console.log(`  Correctly rejected bad current password: "${err.response.data.error}"`);
    } else {
      throw err;
    }
  }

  // Update with valid password
  const changePasswordRes = await axios.put(`${API_BASE}/user/password`, {
    currentPassword: testUser.password,
    newPassword: 'BrandNewSecurePassword2026!'
  }, authHeader);
  console.log('  Password Change Result:', changePasswordRes.data.message);

  // Verify login with new password
  const newLoginRes = await axios.post(`${API_BASE}/auth/login`, {
    email: testUser.email,
    password: 'BrandNewSecurePassword2026!'
  });
  console.log('  Login with new password succeeded:', newLoginRes.data.user.email);
  console.log('  ✅ Password lifecycle verified.\n');

  // 6. Activity Timeline & Portfolio Export
  console.log('▶ [6/6] Verifying Historical Activity Timeline & Portfolio JSON Export...');
  const activityRes = await axios.get(`${API_BASE}/user/activity`, authHeader);
  console.log(`  Recorded Activity Events (${activityRes.data.length}):`);
  activityRes.data.slice(0, 4).forEach((act: any) => {
    console.log(`    - [${act.action}] ${act.details} (${new Date(act.createdAt).toLocaleTimeString()})`);
  });

  const exportRes = await axios.get(`${API_BASE}/user/export`, authHeader);
  console.log('  Portfolio Export Metadata:', exportRes.data.exportMetadata);
  console.log(`  Exported Studies Count: ${exportRes.data.portfolio.totalStudies}`);
  if (!exportRes.data.exportMetadata || !exportRes.data.portfolio) {
    throw new Error('Export payload missing structure');
  }
  console.log('  ✅ Portfolio export and action timeline verified.\n');

  console.log('🎉 ALL PROFILE, SETTINGS & ACTIVITY TESTS PASSED WITH 100% SUCCESS!');
}

runProfileAndSettingsTests().catch((err) => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
