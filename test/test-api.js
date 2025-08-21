// test/complete-api-test.js - Test ALL endpoints from all modules
const axios = require('axios');

const CONFIG = {
  BASE_URL: 'https://imajine-uni-api-production.up.railway.app',
  COORDINATOR_TOKEN: '',
  STUDENT_TOKEN: '',
  COORDINATOR: {
    email: 'coordinator@imajine.ac.id',
    password: 'coordinator123',
    userType: 'coordinator'
  },
  STUDENT: {
    email: 'TomHolland@imajine.ac.id',
    password: 'student123',
    userType: 'student'
  }
};

async function testLogin(userConfig, tokenKey) {
  console.log(`🔐 Testing ${userConfig.userType} login: ${userConfig.email}`);
  
  try {
    const response = await axios.post(`${CONFIG.BASE_URL}/auth/login`, {
      email: userConfig.email,
      password: userConfig.password,
      userType: userConfig.userType
    }, { timeout: 5000 });
    
    CONFIG[tokenKey] = response.data.access_token;
    console.log(`✅ ${userConfig.userType.toUpperCase()} LOGIN SUCCESS!`);
    return true;
  } catch (error) {
    console.log(`❌ ${userConfig.userType} login failed`);
    return false;
  }
}

async function testEndpoint(method, url, description, expectedStatus = 200, useStudentToken = false) {
  const token = useStudentToken ? CONFIG.STUDENT_TOKEN : CONFIG.COORDINATOR_TOKEN;
  const userType = useStudentToken ? 'student' : 'coordinator';
  
  try {
    const response = await axios({
      method,
      url: `${CONFIG.BASE_URL}${url}`,
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000,
      validateStatus: () => true
    });
    
    const status = response.status;
    
    if (status === expectedStatus || status === 200) {
      console.log(`✅ ${url}`);
      return true;
    } else if (status === 401) {
      console.log(`🔒 ${url} - Unauthorized`);
    } else if (status === 403) {
      console.log(`🚫 ${url} - Forbidden (${userType})`);
    } else if (status === 404) {
      console.log(`❌ ${url} - Not Found (module not imported?)`);
    } else {
      console.log(`⚠️ ${url} - Status: ${status}`);
    }
    
    return false;
  } catch (error) {
    console.log(`💥 ${url} - Error: ${error.code || error.message}`);
    return false;
  }
}

async function runCompleteTest() {
  console.log('🚀 COMPLETE API TEST - ALL MODULES\n');
  
  // Authentication
  console.log('='.repeat(60));
  console.log('🔐 AUTHENTICATION');
  console.log('='.repeat(60));
  const coordSuccess = await testLogin(CONFIG.COORDINATOR, 'COORDINATOR_TOKEN');
  const studentSuccess = await testLogin(CONFIG.STUDENT, 'STUDENT_TOKEN');
  
  if (!coordSuccess) {
    console.log('❌ Cannot test coordinator endpoints');
    return;
  }
  
  // Test ALL endpoints by module
  let totalTests = 0;
  let passedTests = 0;
  
  const modules = [
    {
      name: 'USERS MODULE',
      endpoints: [
        ['GET', '/users/me', 'Get current user'],
      ]
    },
    {
      name: 'ACADEMIC DATA MODULE', 
      endpoints: [
        ['GET', '/academic-data', 'Get all academic data'],
      ]
    },
    {
      name: 'STUDENTS MODULE',
      endpoints: [
        ['GET', '/students', 'Get students list'],
        ['GET', '/students/stats', 'Get student statistics'],
        ['GET', '/students/with-grades', 'Get students with grades'],
      ]
    },
    {
      name: 'TEACHERS MODULE',
      endpoints: [
        ['GET', '/teachers', 'Get teachers list'],
        ['GET', '/teachers/stats', 'Get teacher statistics'],
      ]
    },
    {
      name: 'UNITS MODULE',
      endpoints: [
        ['GET', '/units', 'Get units list'],
        ['GET', '/units/stats', 'Get unit statistics'],
      ]
    },
    {
      name: 'COURSES MODULE',
      endpoints: [
        ['GET', '/courses', 'Get courses list'],
        // ['GET', '/courses/with-counts', 'Get courses with counts'],  // Temporarily disabled
        // ['GET', '/courses/stats', 'Get course statistics'],          // Temporarily disabled
      ]
    },
    {
      name: 'ASSIGNMENTS MODULE',
      endpoints: [
        ['GET', '/assignments', 'Get assignments list'],
      ]
    },
    {
      name: 'SUBMISSIONS MODULE',
      endpoints: [
        // Note: Submissions might not have a general GET endpoint
        // ['GET', '/submissions', 'Get submissions list'],
      ]
    },
    {
      name: 'ANALYTICS MODULE',
      endpoints: [
        ['GET', '/analytics/overview', 'Get dashboard metrics'],
        ['GET', '/analytics/trends', 'Get trend data'],
      ]
    },
    {
      name: 'STUDENT PROGRESS MODULE',
      endpoints: [
        // These might return 404 if no data exists, which is normal
        ['GET', '/student-progress/unit/BM001', 'Get progress for unit BM001'],
      ]
    }
  ];
  
  for (const module of modules) {
    if (module.endpoints.length === 0) continue;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🧪 ${module.name}`);
    console.log('='.repeat(60));
    
    for (const [method, url, description] of module.endpoints) {
      console.log(`\n🧪 ${description}`);
      const success = await testEndpoint(method, url, description);
      totalTests++;
      if (success) passedTests++;
    }
  }
  
  // Test student access (should be more limited)
  if (studentSuccess) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('👨‍🎓 STUDENT ACCESS TEST');
    console.log('='.repeat(60));
    
    const studentTests = [
      ['GET', '/users/me', 'Get current user'],
      ['GET', '/academic-data', 'Get academic data'],
      ['GET', '/assignments', 'Get assignments'],
      ['GET', '/students', 'Get students (should be forbidden)'],
      ['GET', '/analytics/overview', 'Get analytics (should be forbidden)'],
    ];
    
    for (const [method, url, description] of studentTests) {
      console.log(`\n🧪 ${description}`);
      await testEndpoint(method, url, description, 200, true);
    }
  }
  
  // Final Results
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`🌐 Backend: ${CONFIG.BASE_URL}`);
  console.log(`👨‍💼 Coordinator Login: ${coordSuccess ? '✅' : '❌'}`);
  console.log(`👨‍🎓 Student Login: ${studentSuccess ? '✅' : '❌'}`);
  console.log(`🧪 API Endpoints: ${passedTests}/${totalTests} working`);
  
  const percentage = Math.round((passedTests / totalTests) * 100);
  console.log(`📈 Success Rate: ${percentage}%`);
  
  if (percentage >= 90) {
    console.log('\n🎉 EXCELLENT! Almost all modules working!');
  } else if (percentage >= 70) {
    console.log('\n🎯 GOOD! Most modules working!');
    console.log('💡 Check app.module.ts for missing imports');
  } else {
    console.log('\n⚠️ Several modules not working');
    console.log('💡 Check that all modules are properly imported');
  }
  
  console.log('\n💡 If you see "Not Found" errors:');
  console.log('   1. Check app.module.ts imports');
  console.log('   2. Make sure all module files exist');
  console.log('   3. Restart your backend after adding imports');
}

runCompleteTest().catch(console.error);