// test/full-api-test.js - Complete API test with your actual data
const axios = require('axios');

const TEST_COORDINATOR = {
  email: 'coordinator@imajine.ac.id',
  password: 'coordinator123' 
};

const COMMON_PORTS = [3000, 3001, 8000, 5000, 4000];
let BASE_URL = '';
let authToken = '';

async function findBackendPort() {
  console.log('🔍 Finding your backend...');
  
  for (const port of COMMON_PORTS) {
    try {
      const response = await axios.get(`http://localhost:${port}`, { 
        timeout: 2000,
        validateStatus: () => true 
      });
      
      console.log(`✅ Found backend on port ${port}!`);
      BASE_URL = `http://localhost:${port}`;
      return true;
    } catch (error) {
      console.log(`   ❌ Port ${port} - not responding`);
    }
  }
  
  console.log('❌ Backend not found. Make sure it\'s running: npm run start:dev');
  return false;
}

async function testLogin() {
  console.log('\n🔐 Testing login with your coordinator...');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_COORDINATOR, {
      timeout: 5000
    });
    
    authToken = response.data.access_token;
    console.log('✅ Login successful!');
    console.log(`   User: ${response.data.user.email}`);
    console.log(`   Role: ${response.data.user.role}`);
    return true;
    
  } catch (error) {
    console.log('❌ Login failed:', error.response?.data?.message || error.message);
    console.log('💡 Try different passwords:');
    return false;
  }
}

async function testEndpoint(method, url, description) {
  try {
    const response = await axios({
      method,
      url: `${BASE_URL}${url}`,
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: 10000,
      validateStatus: () => true
    });
    
    const status = response.status;
    const data = response.data;
    
    if (status === 200) {
      console.log(`✅ ${url} - Working!`);
      
      // Show useful info about the response
      if (Array.isArray(data)) {
        console.log(`   📊 Returned ${data.length} items`);
      } else if (data && typeof data === 'object') {
        if (data.data && data.total !== undefined) {
          console.log(`   📊 Paginated: ${data.data.length} items, total: ${data.total}`);
        } else {
          const keys = Object.keys(data);
          console.log(`   📊 Object with keys: ${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''}`);
        }
      }
      
    } else if (status === 401) {
      console.log(`🔒 ${url} - Unauthorized (auth issue)`);
    } else if (status === 403) {
      console.log(`🚫 ${url} - Forbidden (wrong role)`);
    } else if (status === 404) {
      console.log(`❌ ${url} - Not Found (endpoint missing)`);
    } else {
      console.log(`⚠️ ${url} - Status: ${status}`);
    }
    
    return status === 200;
    
  } catch (error) {
    console.log(`💥 ${url} - Error: ${error.message}`);
    return false;
  }
}

async function runFullTest() {
  console.log('🚀 Testing your complete API with real data!\n');
  console.log('📋 Database contains:');
  console.log('   👥 11 users (1 coordinator, 10 students)');
  console.log('   📚 2 courses, 📖 4 units, 📋 8 assignments\n');
  
  // Step 1: Find backend
  const backendFound = await findBackendPort();
  if (!backendFound) return;
  
  // Step 2: Test login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('\n⚠️ Cannot test endpoints without authentication');
    return;
  }
  
  // Step 3: Test all your new endpoints
  console.log('\n🧪 Testing all API endpoints...');
  console.log('-'.repeat(40));
  
  const endpoints = [
    // Core data
    ['GET', '/academic-data', 'Academic reference data'],
    
    // Students module
    ['GET', '/students', 'Students list (paginated)'],
    ['GET', '/students/stats', 'Student statistics'],
    ['GET', '/students/with-grades', 'Students with grade info'],
    
    // Teachers module  
    ['GET', '/teachers', 'Teachers list'],
    ['GET', '/teachers/stats', 'Teacher statistics'],
    
    // Units module
    ['GET', '/units', 'Units list'],
    ['GET', '/units/stats', 'Unit statistics'],
    
    // Courses module
    ['GET', '/courses', 'Courses list'],
    ['GET', '/courses/with-counts', 'Courses with counts'],
    ['GET', '/courses/stats', 'Course statistics'],
    
    // Analytics module
    ['GET', '/analytics/overview', 'Dashboard metrics'],
    ['GET', '/analytics/trends', 'Trend data'],
    
    // Student Progress module
    ['GET', '/student-progress/unit/BM001', 'Progress for unit (may not exist)'],
    
    // Assignments (existing)
    ['GET', '/assignments', 'Assignments list'],
    
    // Users (existing)
    ['GET', '/users/me', 'Current user info']
  ];
  
  let successCount = 0;
  
  for (const [method, url, description] of endpoints) {
    console.log(`\n🧪 ${description}`);
    const success = await testEndpoint(method, url, description);
    if (success) successCount++;
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`🌐 Backend URL: ${BASE_URL}`);
  console.log(`🔐 Authentication: ${loginSuccess ? '✅' : '❌'}`);
  console.log(`🧪 Working endpoints: ${successCount}/${endpoints.length}`);
  
  if (successCount === endpoints.length) {
    console.log('\n🎉 PERFECT! All your API endpoints are working!');
    console.log('💡 Your backend is ready for frontend integration');
  } else if (successCount > endpoints.length * 0.7) {
    console.log('\n🎯 GOOD! Most endpoints working');
    console.log('💡 A few endpoints might need module imports in app.module.ts');
  } else {
    console.log('\n⚠️ Some issues found');
    console.log('💡 Check that all modules are imported in app.module.ts');
  }
}

runFullTest();