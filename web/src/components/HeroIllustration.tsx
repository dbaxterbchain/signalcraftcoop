import { Box } from '@mui/material';

export default function HeroIllustration() {
  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: 520,
        mx: 'auto',
        aspectRatio: '4 / 3',
        borderRadius: 4,
        border: '1px solid rgba(234,244,255,0.2)',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
        boxShadow: '0 30px 80px rgba(10,42,67,0.4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 640 480"
        sx={{ width: '100%', height: '100%' }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="signalGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#52B9FF" />
            <stop offset="60%" stopColor="#1677C8" />
            <stop offset="100%" stopColor="#0A2A43" />
          </linearGradient>
          <radialGradient id="pulse" cx="25%" cy="20%" r="60%">
            <stop offset="0%" stopColor="#EAF4FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#52B9FF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="screenGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#EAF4FF" />
          </linearGradient>
        </defs>
        <rect width="640" height="480" fill="url(#pulse)" />
        <g opacity="0.95">
          <rect x="70" y="90" width="220" height="130" rx="20" fill="#FFFFFF" />
          <rect x="90" y="112" width="140" height="12" rx="6" fill="#0A2A43" opacity="0.14" />
          <rect x="90" y="136" width="170" height="10" rx="5" fill="#0A2A43" opacity="0.18" />
          <rect x="90" y="156" width="120" height="10" rx="5" fill="#0A2A43" opacity="0.18" />
          <rect x="90" y="176" width="90" height="10" rx="5" fill="#1677C8" opacity="0.7" />
        </g>
        <g opacity="0.98">
          <rect x="320" y="70" width="230" height="340" rx="30" fill="#0E1116" />
          <rect x="340" y="110" width="190" height="250" rx="20" fill="url(#screenGlow)" />
          <rect x="360" y="130" width="150" height="14" rx="7" fill="#1677C8" />
          <rect x="360" y="154" width="120" height="10" rx="5" fill="#0A2A43" opacity="0.25" />
          <rect x="360" y="174" width="150" height="10" rx="5" fill="#0A2A43" opacity="0.25" />
          <rect x="360" y="194" width="90" height="10" rx="5" fill="#0A2A43" opacity="0.25" />
          <rect x="360" y="230" width="110" height="26" rx="13" fill="url(#signalGradient)" />
          <circle cx="435" cy="95" r="4" fill="#C5D6E5" opacity="0.7" />
        </g>
        <g opacity="0.95">
          <rect x="90" y="280" width="120" height="120" rx="18" fill="#FFFFFF" />
          <rect x="105" y="295" width="90" height="90" rx="12" fill="#EAF4FF" />
          <path
            d="M135 315 h30 a18 18 0 0 1 0 36 h-30"
            fill="none"
            stroke="#1677C8"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="150" cy="365" r="10" fill="url(#signalGradient)" />
        </g>
        <g opacity="0.9">
          <path
            d="M210 330 C260 300, 300 285, 340 290"
            fill="none"
            stroke="#52B9FF"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M215 355 C270 330, 310 325, 360 330"
            fill="none"
            stroke="#1677C8"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </Box>
    </Box>
  );
}
