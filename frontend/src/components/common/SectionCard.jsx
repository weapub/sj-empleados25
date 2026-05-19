import React from 'react';
import { Paper, Box, Typography, Divider } from '@mui/material';

const SectionCard = ({ title, icon = null, headerRight = null, children, accentColor, sx = {} }) => (
  <Paper
    variant="outlined"
    sx={{
      borderRadius: 3.5,
      overflow: 'hidden',
      borderColor: 'divider',
      boxShadow: '0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.05)',
      ...sx,
    }}
  >
    {(title || icon || headerRight) && (
      <>
        <Box
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: 1.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            ...(accentColor ? { borderTop: `3px solid ${accentColor}` } : {}),
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {icon && (
              <Box sx={{ color: accentColor || 'primary.main', display: 'flex', alignItems: 'center' }}>
                {icon}
              </Box>
            )}
            {title && (
              <Typography variant="h6" fontWeight={600} fontSize="1rem">
                {title}
              </Typography>
            )}
          </Box>
          {headerRight && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {headerRight}
            </Box>
          )}
        </Box>
        <Divider />
      </>
    )}
    <Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
  </Paper>
);

export default SectionCard;
