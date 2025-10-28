// Test SMS API directly
const testSMSAPI = async () => {
  console.log('🧪 Testing SMS API directly...');
  
  // Test XML request format
  const testXML = `<?xml version="1.0" encoding="UTF-8"?>
<message>
  <login>superapp</login>
  <pwd>83fb772ee0799a422cce18ffd5f497b9</pwd>
  <id>test-${Date.now()}</id>
  <sender>bat-bat.kg</sender>
  <text>1234</text>
  <phones>
    <phone>+996555123456</phone>
  </phones>
</message>`;

  console.log('📋 Test XML:', testXML);
  
  try {
    const response = await fetch('https://smspro.nikita.kg/api/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml; charset=UTF-8',
        'Accept': 'application/xml',
      },
      body: testXML,
    });
    
    const responseText = await response.text();
    console.log('📥 Response status:', response.status);
    console.log('📥 Response text:', responseText);
    
    if (response.ok) {
      console.log('✅ SMS API работает!');
    } else {
      console.log('❌ SMS API ошибка:', response.status);
    }
  } catch (error) {
    console.error('❌ Network error:', error);
  }
};

// Run test
testSMSAPI();
