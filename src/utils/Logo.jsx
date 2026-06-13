import React from "react";

const GraduateStarLogo = ({
  size = 800,
  bgColor,
  borderColor = "#0b2c5d",
  borderWidth = 24,
  starColor = "#f7a600",
  primaryColor = "#0b2c5d",
  bookColor = "#0b2c5d",
  tasselColor = "#f7a600",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 800 800"
      xmlns="http://www.w3.org/2000/svg"
    >
      {bgColor && <rect width="100%" height="100%" fill={bgColor} />}

      <circle
        cx="400"
        cy="400"
        r="360"
        fill="none"
        stroke={borderColor}
        strokeWidth={borderWidth}
      />

      <polygon
        points="400,230 480,380 640,400 510,510 550,670 400,585 250,670 290,510 160,400 320,380"
        fill={starColor}
      />

      <ellipse cx="350" cy="445" rx="20" ry="32" fill={primaryColor} />
      <ellipse cx="450" cy="445" rx="20" ry="32" fill={primaryColor} />

      <path
        d="M350 510 Q400 560 450 510"
        stroke={primaryColor}
        strokeWidth="18"
        fill="none"
        strokeLinecap="round"
      />

      <path
        d="M285 520 Q400 490 515 520 L515 640 Q400 610 285 640 Z"
        fill="white"
      />

      <path
        d="M305 535 Q400 510 495 535 L495 625 Q400 600 305 625 Z"
        fill={bookColor}
      />

      <line
        x1="400"
        y1="535"
        x2="400"
        y2="625"
        stroke="white"
        strokeWidth="6"
      />

      <circle cx="270" cy="600" r="38" fill={starColor} />
      <circle cx="530" cy="600" r="38" fill={starColor} />

      <polygon
        points="250,220 400,170 550,220 400,275"
        fill={primaryColor}
      />

      <path
        d="M320 275 Q400 310 480 275 L470 355 Q400 380 330 355 Z"
        fill={primaryColor}
      />

      <line
        x1="550"
        y1="220"
        x2="550"
        y2="315"
        stroke={tasselColor}
        strokeWidth="8"
        strokeLinecap="round"
      />

      <circle cx="550" cy="330" r="14" fill={tasselColor} />

      <path
        d="M535 345 Q550 390 565 345"
        stroke={tasselColor}
        strokeWidth="10"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
};

export default GraduateStarLogo;