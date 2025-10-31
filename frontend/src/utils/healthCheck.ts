export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${process.env.REACT_APP_API_URL}/actuator/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

export const wakeUpBackend = async (): Promise<void> => {
  try {
    console.log('Attempting to wake up backend service...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    // Try to hit a simple endpoint to wake up the service
    await fetch(`${process.env.REACT_APP_API_URL}/actuator/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    console.log('Backend wake up request sent');
  } catch (error) {
    console.error('Failed to wake up backend:', error);
  }
};