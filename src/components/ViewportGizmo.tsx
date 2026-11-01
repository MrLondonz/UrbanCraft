import React from 'react';

interface ViewportGizmoProps {
  angleH: number; // horizontal azimuth angle in radians
  angleV: number; // vertical elevation angle in radians
}

export const ViewportGizmo: React.FC<ViewportGizmoProps> = ({ angleH, angleV }) => {
  const size = 64;
  const cx = size / 2;
  const cy = size / 2;
  const axisLen = 22;

  // Project 3D vector (x, y, z) into 2D screen coordinates based on camera angles
  const project = (x: number, y: number, z: number) => {
    // Rotation around Y axis by -angleH
    const x1 = x * Math.cos(-angleH) - z * Math.sin(-angleH);
    const z1 = x * Math.sin(-angleH) + z * Math.cos(-angleH);
    // Rotation around X axis by angleV
    const y2 = y * Math.cos(angleV) - z1 * Math.sin(angleV);
    return {
      px: cx + x1 * axisLen,
      py: cy - y2 * axisLen,
    };
  };

  const origin = { px: cx, py: cy };
  const ptX = project(1, 0, 0); // X axis (Red)
  const ptY = project(0, 1, 0); // Y axis (Green)
  const ptZ = project(0, 0, 1); // Z axis (Blue)

  return (
    <div className="absolute bottom-4 left-4 pointer-events-none select-none z-20">
      <svg width={size} height={size} className="drop-shadow-md">
        {/* Origin point */}
        <circle cx={origin.px} cy={origin.py} r="2.5" fill="#94a3b8" />

        {/* X Axis - Red */}
        <line
          x1={origin.px}
          y1={origin.py}
          x2={ptX.px}
          y2={ptX.py}
          stroke="#ef4444"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <text
          x={ptX.px + (ptX.px - origin.px) * 0.25}
          y={ptX.py + (ptX.py - origin.py) * 0.25 + 3}
          fill="#ef4444"
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          X
        </text>

        {/* Y Axis - Green */}
        <line
          x1={origin.px}
          y1={origin.py}
          x2={ptY.px}
          y2={ptY.py}
          stroke="#22c55e"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <text
          x={ptY.px + (ptY.px - origin.px) * 0.25}
          y={ptY.py + (ptY.py - origin.py) * 0.25 + 3}
          fill="#22c55e"
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          Y
        </text>

        {/* Z Axis - Blue */}
        <line
          x1={origin.px}
          y1={origin.py}
          x2={ptZ.px}
          y2={ptZ.py}
          stroke="#3b82f6"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <text
          x={ptZ.px + (ptZ.px - origin.px) * 0.25}
          y={ptZ.py + (ptZ.py - origin.py) * 0.25 + 3}
          fill="#3b82f6"
          fontSize="10"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          Z
        </text>
      </svg>
    </div>
  );
};
