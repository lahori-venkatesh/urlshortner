const API_URL = 'https://urlshortner-1-hpyu.onrender.com/api';

async function wakeUpBackend() {
    console.log('🚀 Attempting to wake up backend service...');
    console.log('Backend URL:', API_URL);
    
    try {
        console.log('⏳ Sending wake-up request (this may take 30-60 seconds)...');
        
        const startTime = Date.now();
        const response = await fetch(`${API_URL}/actuator/health`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Backend-Wake-Up-Script'
            }
        });
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        console.log(`⏱️  Response received in ${duration.toFixed(2)} seconds`);
        console.log('📊 Status:', response.status);
        
        if (response.ok) {
            const data = await response.text();
            console.log('✅ Backend is now awake!');
            console.log('📋 Health check response:', data);
            
            // Test authentication endpoint
            console.log('\n🔐 Testing authentication endpoint...');
            const authResponse = await fetch(`${API_URL}/v1/auth/users`, {
                method: 'GET'
            });
            console.log('🔐 Auth endpoint status:', authResponse.status);
            
            if (authResponse.status === 200) {
                console.log('✅ Authentication endpoints are working!');
            } else if (authResponse.status === 401) {
                console.log('✅ Authentication endpoints are working (401 expected for unauthorized access)');
            } else {
                console.log('⚠️  Authentication endpoints may have issues');
            }
            
        } else {
            console.log('❌ Backend responded but with error status:', response.status);
            const errorText = await response.text();
            console.log('Error details:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Failed to wake up backend:', error.message);
        
        if (error.message.includes('fetch')) {
            console.log('💡 This might be a network issue or the service is still starting up.');
            console.log('💡 Try running this script again in a few minutes.');
        }
    }
}

// Run the wake up function
wakeUpBackend();