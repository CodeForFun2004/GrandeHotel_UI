import React, { useState } from 'react';
import { Button, Box, Typography, Card, CardContent, Alert } from '@mui/material';

const ApiDebugComponent = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testApiConnection = async () => {
    setIsLoading(true);
    const results: any = {};

    try {
      // Test 1: Basic API connection
      const response = await fetch('http://localhost:1000/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      results.healthCheck = {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      };

      if (response.ok) {
        const data = await response.json();
        results.healthCheck.data = data;
      }
    } catch (error) {
      results.healthCheck = {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'connection_error'
      };
    }

    try {
      // Test 2: Google OAuth endpoint
      const googleResponse = await fetch('http://localhost:1000/api/auth/google', {
        method: 'GET',
        redirect: 'manual', // Prevent automatic redirect
      });
      
      results.googleOAuth = {
        status: googleResponse.status,
        ok: googleResponse.ok,
        statusText: googleResponse.statusText,
        type: googleResponse.type
      };
    } catch (error) {
      results.googleOAuth = {
        error: error instanceof Error ? error.message : 'Unknown error',
        type: 'connection_error'
      };
    }

    try {
      // Test 3: Environment variables
      results.environment = {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        NODE_ENV: import.meta.env.NODE_ENV,
        MODE: import.meta.env.MODE
      };
    } catch (error) {
      results.environment = {
        error: 'Failed to read environment variables'
      };
    }

    setTestResults(results);
    setIsLoading(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        API Debug Tool
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            API Connection Test
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            This tool will test your API connection and help diagnose login issues.
          </Typography>
          
          <Button 
            variant="contained" 
            onClick={testApiConnection}
            disabled={isLoading}
            sx={{ mb: 2 }}
          >
            {isLoading ? 'Testing...' : 'Test API Connection'}
          </Button>

          {testResults && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Test Results:
              </Typography>
              
              {testResults.healthCheck && (
                <Alert 
                  severity={testResults.healthCheck.ok ? 'success' : 'error'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle2">
                    Health Check: {testResults.healthCheck.ok ? 'PASSED' : 'FAILED'}
                  </Typography>
                  <Typography variant="body2">
                    Status: {testResults.healthCheck.status} {testResults.healthCheck.statusText}
                  </Typography>
                  {testResults.healthCheck.error && (
                    <Typography variant="body2" color="error">
                      Error: {testResults.healthCheck.error}
                    </Typography>
                  )}
                </Alert>
              )}

              {testResults.googleOAuth && (
                <Alert 
                  severity={testResults.googleOAuth.ok ? 'success' : 'warning'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle2">
                    Google OAuth: {testResults.googleOAuth.ok ? 'ENDPOINT AVAILABLE' : 'ENDPOINT ISSUE'}
                  </Typography>
                  <Typography variant="body2">
                    Status: {testResults.googleOAuth.status} {testResults.googleOAuth.statusText}
                  </Typography>
                  {testResults.googleOAuth.error && (
                    <Typography variant="body2" color="error">
                      Error: {testResults.googleOAuth.error}
                    </Typography>
                  )}
                </Alert>
              )}

              <Typography variant="subtitle2" gutterBottom>
                Environment Variables:
              </Typography>
              <pre style={{ 
                backgroundColor: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '4px',
                fontSize: '12px',
                overflow: 'auto'
              }}>
                {JSON.stringify(testResults.environment, null, 2)}
              </pre>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Troubleshooting Steps:
          </Typography>
          <ol>
            <li>Make sure your backend server is running on port 1000</li>
            <li>Check if the API endpoints are accessible</li>
            <li>Verify environment variables are set correctly</li>
            <li>Check browser console for any CORS errors</li>
            <li>Ensure Google OAuth is properly configured on the backend</li>
          </ol>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApiDebugComponent;
