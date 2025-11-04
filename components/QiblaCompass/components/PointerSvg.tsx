import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface PointerSvgProps {
  color: string;
  width?: number;
  height?: number;
}

/**
 * Pointer drawn as an SVG path with a sharp tip at top and semicircular bulbous bottom.
 * The top apex points to the target; bottom is a wide semicircle.
 */
export const PointerSvg: React.FC<PointerSvgProps> = ({ color, width = 40, height = 90 }) => {
  const w = width;
  const h = height;
  const cx = w / 2;
  
  // Create a pointer with sharp tip at top and semicircular bulbous bottom
  // Start at top center, curve out to wide bottom, semicircle back, curve to top
  const tipY = 0;
  const bulbRadius = w / 2; // semicircle radius equals half width for full bulbous shape
  const bulbCenterY = h - bulbRadius; // center of semicircle
  
  // Path: start at tip, line to left edge of bulb, arc around bottom, line back to tip
  const d = `M ${cx} ${tipY} L ${0} ${bulbCenterY} A ${bulbRadius} ${bulbRadius} 0 0 0 ${w} ${bulbCenterY} L ${cx} ${tipY} Z`;
  
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Path d={d} fill={color} />
    </Svg>
  );
};

export default PointerSvg;
