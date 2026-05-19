import React from 'react';
import { Box, Typography, Link as MuiLink } from '@mui/material';

const Footer = () => (
  <Box
    component="footer"
    sx={{
      py: 1.5,
      px: 3,
      textAlign: 'center',
      bgcolor: 'background.paper',
      borderTop: '1px solid',
      borderColor: 'divider',
      mt: 'auto',
    }}
  >
    <Typography variant="caption" color="text.secondary">
      Desarrollado por{' '}
      <MuiLink
        href="https://wa.me/5493704602028"
        target="_blank"
        rel="noopener noreferrer"
        underline="hover"
        color="primary"
        title="Contactar a Iván García por WhatsApp"
      >
        Iván García
      </MuiLink>
      {' '}— <strong>Wea#dev</strong> · Formosa, Argentina
    </Typography>
  </Box>
);

export default Footer;
