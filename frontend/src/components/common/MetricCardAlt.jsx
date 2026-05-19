import React from 'react';
import { Grid, Card, CardContent, Box, Typography, Chip, Skeleton } from '@mui/material';
import { Link } from 'react-router-dom';

const MetricCardAlt = ({
  title,
  value,
  icon,
  color = '#3B82F6',
  loading = false,
  error = false,
  delta,
  to = null,
  onClick,
}) => {
  const isDown = typeof delta === 'string' && delta.trim().startsWith('-');

  const inner = (
    <Card
      onClick={onClick}
      aria-busy={loading}
      sx={{
        height: '100%',
        cursor: (to || onClick) ? 'pointer' : 'default',
        borderTop: `4px solid ${color}`,
        transition: 'box-shadow 0.22s ease, transform 0.22s ease',
        '&:hover': (to || onClick) ? {
          boxShadow: `0 6px 24px ${color}28, 0 2px 8px rgba(15,23,42,0.07)`,
          transform: 'translateY(-3px)',
        } : {},
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
        {/* Icon row + delta */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: `${color}18`,
              color,
              flexShrink: 0,
            }}
          >
            {icon && React.cloneElement(icon, { size: 20 })}
          </Box>

          {delta && !loading && !error && (
            <Chip
              label={`${isDown ? '▼' : '▲'} ${delta}`}
              size="small"
              sx={{
                height: 22,
                fontSize: '0.7rem',
                fontWeight: 700,
                bgcolor: isDown ? '#FEE2E2' : '#DCFCE7',
                color:   isDown ? '#B91C1C'  : '#15803D',
                border:  `1px solid ${isDown ? '#FECACA' : '#BBF7D0'}`,
              }}
            />
          )}
        </Box>

        {/* Value */}
        {loading ? (
          <>
            <Skeleton variant="text" width="55%" height={44} sx={{ mb: 0.25 }} />
            <Skeleton variant="text" width="75%" height={18} />
          </>
        ) : (
          <>
            <Typography
              variant="h4"
              sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary', lineHeight: 1.1, mb: 0.5 }}
            >
              {error ? '—' : value}
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em' }}
            >
              {title}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Grid item xs={6} md={6} lg={3}>
      {to ? (
        <Link to={to} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
          {inner}
        </Link>
      ) : inner}
    </Grid>
  );
};

export default MetricCardAlt;
