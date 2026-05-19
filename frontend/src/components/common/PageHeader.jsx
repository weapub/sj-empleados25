import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';

const PageHeader = ({ icon = null, title, subtitle = '', actions = null, accentColor = '#3B82F6', sx = {} }) => (
  <Box
    sx={{
      mb: 3,
      display: 'flex',
      alignItems: { xs: 'flex-start', sm: 'center' },
      justifyContent: 'space-between',
      gap: 2,
      flexWrap: 'wrap',
      ...sx,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {icon && (
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: accentColor,
            boxShadow: `0 4px 14px ${accentColor}45`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Avatar>
      )}
      <Box>
        <Typography variant="h4" fontWeight={700} letterSpacing="-0.02em" lineHeight={1.2}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>

    {actions && (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {actions}
      </Box>
    )}
  </Box>
);

export default PageHeader;
