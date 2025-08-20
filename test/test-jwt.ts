import axios from 'axios';

// Configure for your environment
const BASE_URL = process.env.API_URL || 'http://localhost:3000';

interface TestCredentials {
  email: string;
  password: string;
  userType: 'student' | 'coordinator';
}

class SecurityTester {
  private baseURL: string;
  
  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async testJWTSecurity() {
    console.log('🔐 Testing JWT Security Implementation...\n');

    // Test both user types to verify role-based access
    const testUsers: TestCredentials[] = [
      {
        email: 'coordinator@imajine.ac.id',   // ← FROM YOUR test-api.js
        password: 'coordinator123',           // ← FROM YOUR test-api.js
        userType: 'coordinator'
      },
      {
        email: 'TomHolland@imajine.ac.id',    // ← FROM YOUR test-api.js
        password: 'student123',               // ← FROM YOUR test-api.js
        userType: 'student'
      }
    ];

    for (const testUser of testUsers) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔑 Testing: ${testUser.email} as ${testUser.userType.toUpperCase()}`);
      console.log(`${'='.repeat(60)}`);

      try {
        // Test 1: Login
        console.log('1️⃣ Testing Login...');
        const loginResponse = await this.testLogin(testUser);
        console.log('✅ Login successful');
        console.log(`   Access token length: ${loginResponse.access_token.length}`);
        console.log(`   User Type: ${loginResponse.userType}`);

        // Test 2: Access user profile
        console.log('\n2️⃣ Testing Profile Access...');
        const userResponse = await this.testProtectedRoute(loginResponse.access_token);
        console.log('✅ Profile access successful');
        console.log(`   User: ${userResponse.user.email}`);
        console.log(`   Role: ${userResponse.user.role}`);

        // Test 3: Test role-based access
        console.log('\n3️⃣ Testing Role-Based Access...');
        await this.testRoleBasedAccess(loginResponse.access_token, testUser.userType);

        // Test 4: Test invalid token (only for first user)
        if (testUser.userType === 'coordinator') {
          console.log('\n4️⃣ Testing Invalid Token Handling...');
          await this.testInvalidToken();
          console.log('✅ Invalid token properly rejected');
        }

      } catch (error) {
        console.error(`❌ ${testUser.userType} tests failed:`, error.message);
        
        if (error.message.includes('Invalid credentials')) {
          console.log('💡 Possible fixes:');
          console.log(`   1. Check if ${testUser.email} exists in your database`);
          console.log(`   2. Verify the password is correct`);
          console.log(`   3. Make sure the user has the correct role (${testUser.userType.toUpperCase()})`);
          console.log('   4. Run: node test/test-database.js to check your users');
        }
      }
    }

    console.log('\n🎉 Security tests completed!');
  }

  private async testLogin(credentials: TestCredentials) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, credentials);
      
      if (!response.data.access_token) {
        throw new Error('Missing access token in login response');
      }
      
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error(`Invalid credentials for ${credentials.email}`);
      }
      throw new Error(`Login failed: ${error.response?.data?.message || error.message}`);
    }
  }

  private async testProtectedRoute(accessToken: string) {
    try {
      const response = await axios.get(`${this.baseURL}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      if (!response.data.user || !response.data.user.id) {
        throw new Error('Invalid user data returned - missing user.id');
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Protected route failed: ${error.response?.data?.message || error.message}`);
    }
  }

  private async testRoleBasedAccess(accessToken: string, userType: string) {
    const endpoints = [
      { 
        url: '/academic-data', 
        method: 'GET',
        description: 'Academic Data',
        allowedRoles: ['coordinator', 'student']
      },
      { 
        url: '/teachers/stats', 
        method: 'GET',
        description: 'Teacher Statistics',
        allowedRoles: ['coordinator']  // Only coordinators
      },
      { 
        url: '/students/stats', 
        method: 'GET',
        description: 'Student Statistics',
        allowedRoles: ['coordinator']  // Only coordinators
      }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios({
          method: endpoint.method.toLowerCase(),
          url: `${this.baseURL}${endpoint.url}`,
          headers: { Authorization: `Bearer ${accessToken}` },
          validateStatus: () => true // Don't throw on 4xx/5xx
        });

        const shouldHaveAccess = endpoint.allowedRoles.includes(userType);
        
        if (shouldHaveAccess && response.status === 200) {
          console.log(`   ✅ ${endpoint.description}: Access granted (expected)`);
        } else if (!shouldHaveAccess && response.status === 403) {
          console.log(`   🚫 ${endpoint.description}: Access denied (expected)`);
        } else if (!shouldHaveAccess && response.status === 200) {
          console.log(`   ⚠️  ${endpoint.description}: Unexpected access granted!`);
        } else if (shouldHaveAccess && response.status === 403) {
          console.log(`   ❌ ${endpoint.description}: Access denied (unexpected)`);
        } else {
          console.log(`   ⚡ ${endpoint.description}: Status ${response.status}`);
        }
        
      } catch (error) {
        console.log(`   💥 ${endpoint.description}: Error - ${error.message}`);
      }
    }
  }

  private async testInvalidToken() {
    try {
      await axios.get(`${this.baseURL}/users/me`, {
        headers: { Authorization: 'Bearer invalid_token_here' }
      });
      throw new Error('Invalid token was accepted (security issue!)');
    } catch (error) {
      if (error.response?.status === 401) {
        return; // Expected behavior
      }
      throw new Error(`Unexpected error: ${error.message}`);
    }
  }

  async testEnvironmentSecurity() {
    console.log('🔧 Testing Environment Security...\n');
    
    try {
      const response = await axios.get(`${this.baseURL}/health`, { timeout: 3000 });
      console.log('✅ Health endpoint available');
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        console.log('❌ Cannot connect to server - check if it\'s running');
        process.exit(1);
      } else {
        console.log('ℹ️ Health endpoint not available (this is fine)');
      }
    }
  }
}

// Run tests
async function runSecurityTests() {
  const tester = new SecurityTester(BASE_URL);
  
  console.log(`🔍 Testing API at: ${BASE_URL}\n`);
  console.log('📝 This will test both user roles:');
  console.log('   👨‍💼 Coordinator: Full access to admin features');
  console.log('   👨‍🎓 Student: Limited access to student features\n');
  
  await tester.testEnvironmentSecurity();
  await tester.testJWTSecurity();
}

// Execute if run directly
if (require.main === module) {
  runSecurityTests().catch(console.error);
}

export { SecurityTester };