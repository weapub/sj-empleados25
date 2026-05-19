import React from 'react';
import { Grid, Card, CardContent, Box, Typography, Chip, Skeleton } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { Link } from 'react-router-dom';

const MetricCardAlt = ({
  title, value, icon, color = '#3B82F6',
  loading = false, error = false, delta, to = null, onClick,
}) => {
  const theme = useTheme();
  const isDown     = typeof delta === 'string' && delta.trim().startsWith('-');
  const deltaColor = isDown ? theme.palette.error.main   : theme.palette.success.main;
  const deltaBg    = isDown ? alpha(theme.palette.error.main, 0.12) : alpha(theme.palette.success.main, 0.12);

  const card = (
    <Card
      onClick={onClick}
      sx={{
        height: '100%',
        cursor: (to || onClick) ? 'pointer' : 'default',
        borderRadius: 3.5,
        border: '1px solid',
        borderColor: 'divider',
        borderLeft: `4px solid ${color}`,
        bgcolor: alpha(color, 0.04),
        boxShadow: 'none',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': (to || onClick) ? {
          transform: 'translateY(-3px)',
          boxShadow: `0 8px 28px ${alpha(color, 0.22)}`,
        } : {},
      }}
    >
      {/* Watermark icon */}
      <Box sx={{
        position: 'absolute', right: -10, top: '50%',
        transform: 'translateY(-50%)',
        color, opacity: 0.07, lineHeight: 0, pointerEvents: 'none',
      }}>
        {icon && React.cloneElement(icon, { sx: { fontSize: 90 } })}
      </Box>

      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
          <Box sx={{
            width: 46, height: 46, borderRadius: 2.5, flexShrink: 0,
            bgcolor: alpha(color, 0.15), color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {icon}
          </Box>
          {delta && !loading && !error && (
            <Chip
              label={`${isDown ? '▼' : '▲'} ${delta}`}
              size="small"
              sx={{
                height: 22, fontSize: '0.7rem', fontWeight: 700,
                bgcolor: deltaBg, color: deltaColor,
                border: `1px solid ${alpha(deltaColor, 0.3)}`,
              }}
            />
          )}
        </Box>

        {loading ? (
          <>
            <Skeleton variant="text" width="55%" height={52} sx={{ mb: 0.25 }} />
            <Skeleton variant="text" width="75%" height={16} />
          </>
        ) : (
          <>
            <Typography variant="h3" sx={{
              fontWeight: 800, letterSpacing: '-0.03em',
              color: 'text.primary', lineHeight: 1, mb: 0.5,
            }}>
              {error ? '—' : value}
            </Typography>
            <Typography variant="caption" sx={{
              color: 'text.secondary', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block',
            }}>
              {title}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Grid xs={12} sm={6} lg={3}>
      {to
        ? <Link to={to} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>{card}</Link>
        : card}
    </Grid>
  );
};

export default MetricCardAlt;
