import React from 'react';
import { Box, Typography, Divider, Container } from '@mui/material';

const Footer = () => {
  return (
    <Box component="footer" sx={{ mt: 'auto', pt: 4, pb: 3 }}>
      <Divider sx={{ borderColor: 'rgba(0,0,0,0.06)', mb: 3 }} />
      <Container maxWidth="lg">
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 1.5,
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
            © {new Date().getFullYear()} Balaji Hanuman Banking. All rights reserved.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, color: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.85rem' } }}>
            Developed by Shubham Bagthaliya
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
