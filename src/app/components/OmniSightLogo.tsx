interface OmniSightLogoProps {
  size?: number;
  color?: string;
}

export function OmniSightLogo({ size = 32, color = "#0284c7" }: OmniSightLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="omnisight-lens-clip">
          <circle cx="19" cy="19" r="12" />
        </clipPath>
      </defs>

      {/* ── 렌즈 외곽 원 ── */}
      <circle
        cx="19"
        cy="19"
        r="13.5"
        stroke={color}
        strokeWidth="2.6"
        fill="white"
        fillOpacity="0.06"
      />

      {/* ── 렌즈 내부: 페이지 콘텐츠 줄 (클리핑) ── */}
      <g clipPath="url(#omnisight-lens-clip)">
        {/* 첫 번째 줄 (짧음 - 제목처럼) */}
        <line
          x1="10"
          y1="13"
          x2="25"
          y2="13"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.35"
        />
        {/* 두 번째 줄 (긴 줄) */}
        <line
          x1="8"
          y1="17.5"
          x2="30"
          y2="17.5"
          stroke={color}
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.25"
        />
        {/* 세 번째 줄 - 스캔 하이라이트 (강조) */}
        <rect
          x="8"
          y="21"
          width="22"
          height="2.4"
          rx="1.2"
          fill={color}
          opacity="0.18"
        />
        <line
          x1="8"
          y1="22.2"
          x2="30"
          y2="22.2"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.75"
        />
        {/* 네 번째 줄 (짧음) */}
        <line
          x1="8"
          y1="26.5"
          x2="22"
          y2="26.5"
          stroke={color}
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.22"
        />
      </g>

      {/* ── 스캔 커서: 렌즈 가장자리의 작은 포인터 ── */}
      <circle
        cx="30"
        cy="22.2"
        r="1.8"
        fill={color}
        opacity="0.9"
      />

      {/* ── 손잡이 ── */}
      <line
        x1="29"
        y1="29"
        x2="42"
        y2="42"
        stroke={color}
        strokeWidth="3.4"
        strokeLinecap="round"
      />

      {/* ── 손잡이 하이라이트 (입체감) ── */}
      <line
        x1="29"
        y1="29"
        x2="38"
        y2="38"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.3"
      />
    </svg>
  );
}