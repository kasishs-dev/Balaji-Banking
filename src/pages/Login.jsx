import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Login = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/');
    } else {
      setError('Invalid admin password. Hint: try admin123');
    }
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
      <Card sx={{ maxWidth: 400, width: '100%', mt: 10 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom align="center" sx={{ color: 'primary.main', fontWeight: 700 }}>
            Admin Login
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Enter the admin password to unlock write access.
          </Typography>
          
          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Password"
              type="password"
              variant="outlined"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
            />
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <Button 
              fullWidth 
              variant="contained" 
              color="primary" 
              type="submit"
              size="large"
            >
              Login
            </Button>
          </form>
          
          <Button 
            fullWidth 
            variant="text" 
            sx={{ mt: 2 }}
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
