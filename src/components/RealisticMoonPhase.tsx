import React from 'react';

interface RealisticMoonPhaseProps {
  fraction: number; // 0.0 to 1.0 (0 = محاق, 0.2 = هلال, 0.5 = تربيع, 0.8 = أحدب, 1.0 = بدر)
  size?: number; // pixel diameter
  className?: string;
  showGlow?: boolean;
  title?: string;
}

export const RealisticMoonPhase: React.FC<RealisticMoonPhaseProps> = ({
  fraction,
  size = 28,
  className = '',
  showGlow = true,
  title
}) => {
  // Clamp fraction between 0.02 (faint sliver) and 1.0
  const clamped = Math.max(0.02, Math.min(1.0, fraction));
  const isFullMoon = clamped >= 0.96;
  const isCrescent = clamped < 0.35;

  const R = 44; // Radius of moon sphere
  const cx = 50;
  const cy = 50;

  // Calculate terminator path for Waxing Moon (illuminated on the right)
  let illuminatedPath = '';
  if (!isFullMoon) {
    const rx = Math.max(0.1, R * Math.abs(2 * clamped - 1));
    const topY = cy - R;
    const botY = cy + R;

    if (clamped < 0.5) {
      // Crescent: Outer circular arc rightwards (sweep 1), inner elliptical terminator arc inwards (sweep 0)
      illuminatedPath = `M ${cx} ${topY} A ${R} ${R} 0 0 1 ${cx} ${botY} A ${rx} ${R} 0 0 0 ${cx} ${topY} Z`;
    } else if (Math.abs(clamped - 0.5) < 0.01) {
      // Half Moon / First Quarter
      illuminatedPath = `M ${cx} ${topY} A ${R} ${R} 0 0 1 ${cx} ${botY} L ${cx} ${topY} Z`;
    } else {
      // Gibbous: Outer circular arc rightwards (sweep 1), inner elliptical terminator arc bulging leftwards (sweep 1)
      illuminatedPath = `M ${cx} ${topY} A ${R} ${R} 0 0 1 ${cx} ${botY} A ${rx} ${R} 0 0 1 ${cx} ${topY} Z`;
    }
  }

  const uniqueId = React.useId().replace(/:/g, '_');

  return (
    <div 
      className={`inline-flex items-center justify-center relative select-none ${className}`}
      style={{ width: size, height: size }}
      title={title || `اكتمال القمر: ${Math.round(clamped * 100)}%`}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        className="overflow-visible"
      >
        <defs>
          {/* Base Moon Texture Clip */}
          <clipPath id={`moonClip_${uniqueId}`}>
            <circle cx={cx} cy={cy} r={R} />
          </clipPath>

          {/* Golden Silver Luminous Gradient for Lit Area */}
          <radialGradient id={`moonLitGrad_${uniqueId}`} cx="65%" cy="40%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#fef08a" />
            <stop offset="85%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#d97706" />
          </radialGradient>

          {/* Full Moon Radial Aura */}
          <radialGradient id={`fullAura_${uniqueId}`} cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#fef08a" stopOpacity="0.7" />
            <stop offset="85%" stopColor="#fde047" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>

          {/* Dark Surface Background Gradient */}
          <radialGradient id={`darkSphere_${uniqueId}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Subtle Crater Shading */}
          <radialGradient id={`craterGrad_${uniqueId}`} cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.04" />
          </radialGradient>
        </defs>

        {/* Ambient Glow behind the Moon */}
        {showGlow && (
          <circle
            cx={cx}
            cy={cy}
            r={isFullMoon ? 52 : isCrescent ? 46 : 48}
            fill={isFullMoon ? `url(#fullAura_${uniqueId})` : '#fef08a'}
            opacity={isFullMoon ? 0.9 : 0.25}
            className={isFullMoon ? 'animate-pulse' : ''}
          />
        )}

        {/* Group with Sphere Clip */}
        <g clipPath={`url(#moonClip_${uniqueId})`}>
          {/* Dark unlit portion of the moon sphere */}
          <circle
            cx={cx}
            cy={cy}
            r={R}
            fill={`url(#darkSphere_${uniqueId})`}
            stroke="#334155"
            strokeWidth="1.5"
          />

          {/* Faint Dark Lunar Maria (craters on dark side) */}
          <circle cx="40" cy="38" r="9" fill="#000000" opacity="0.25" />
          <circle cx="34" cy="58" r="11" fill="#000000" opacity="0.2" />
          <circle cx="62" cy="62" r="8" fill="#000000" opacity="0.22" />

          {/* Illuminated Phase Area */}
          {isFullMoon ? (
            <circle
              cx={cx}
              cy={cy}
              r={R}
              fill={`url(#moonLitGrad_${uniqueId})`}
            />
          ) : (
            <path
              d={illuminatedPath}
              fill={`url(#moonLitGrad_${uniqueId})`}
            />
          )}

          {/* Delicate Realistic Crater Overlays (Luna Maria on lit side) */}
          <g opacity={isFullMoon ? 0.22 : 0.18}>
            <circle cx="58" cy="38" r="8" fill={`url(#craterGrad_${uniqueId})`} />
            <circle cx="68" cy="48" r="6.5" fill={`url(#craterGrad_${uniqueId})`} />
            <circle cx="56" cy="64" r="10" fill={`url(#craterGrad_${uniqueId})`} />
            <circle cx="44" cy="46" r="7" fill={`url(#craterGrad_${uniqueId})`} />
            <circle cx="72" cy="32" r="4.5" fill={`url(#craterGrad_${uniqueId})`} />
            <circle cx="52" cy="24" r="5" fill={`url(#craterGrad_${uniqueId})`} />
          </g>

          {/* Subtle specular rim light */}
          <circle
            cx={cx}
            cy={cy}
            r={R - 0.75}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.35"
          />
        </g>

        {/* Outer Rim Ring */}
        <circle
          cx={cx}
          cy={cy}
          r={R}
          fill="none"
          stroke={isFullMoon ? '#fde047' : '#64748b'}
          strokeWidth={isFullMoon ? '1.5' : '1'}
          opacity={isFullMoon ? 0.8 : 0.5}
        />
      </svg>
    </div>
  );
};
