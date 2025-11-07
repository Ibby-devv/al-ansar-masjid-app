import React from 'react';
import Svg, { G, Path } from 'react-native-svg';

interface PointerSvgProps {
  color: string;
  width?: number;
  height?: number;
}

/**
 * Water drop shaped pointer pointing upward toward Qibla.
 * Based on the Qibla-Pointer.svg design.
 */
export const PointerSvg: React.FC<PointerSvgProps> = ({ color, width = 40, height = 90 }) => {
  // Original SVG viewBox: 0 0 37.607 37.607
  // We'll scale it to fit the provided dimensions and center it
  const originalWidth = 37.607;
  const originalHeight = 37.607;
  
  return (
    <Svg width={width} height={height} viewBox={`0 0 ${originalWidth} ${originalHeight}`}>
      <G transform="translate(-2, 0)">
        <G transform="matrix(0.41163074,0,0,0.62825287,12.857834,7.5493606)">
          <Path
            d="m 31.833,24.579 c 0,7.187 -5.846,13.028 -13.029,13.028 C 11.621,37.607 5.775,31.764 5.775,24.579 5.775,18.342 14.88,3.962 16.707,1.142 17.167,0.43 17.957,0 18.806,0 c 0.849,0 1.638,0.43 2.099,1.142 1.823,2.82 10.928,17.2 10.928,23.437 z"
            fill={color}
          />
        </G>
      </G>
    </Svg>
  );
};

export default PointerSvg;
