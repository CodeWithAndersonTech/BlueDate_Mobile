import React from 'react';
import Svg, {
  Circle,
  Line,
  Path,
  Polygon,
  Polyline,
  Rect,
} from 'react-native-svg';
import { useTheme } from '../theme';

/**
 * Lightweight, dependency-free icon set built on react-native-svg. Using SVG
 * primitives (instead of an icon font) keeps the icons crisp, tintable and
 * avoids any native font-linking setup on iOS/Android. Icons follow the Feather
 * stroke style on a 24x24 grid.
 */
export type IconName =
  | 'home'
  | 'map-pin'
  | 'users'
  | 'user'
  | 'crown'
  | 'search'
  | 'settings'
  | 'bell'
  | 'heart'
  | 'message'
  | 'plus'
  | 'check'
  | 'close'
  | 'eye'
  | 'eye-off'
  | 'mail'
  | 'phone'
  | 'lock'
  | 'edit'
  | 'camera'
  | 'logout'
  | 'moon'
  | 'sun'
  | 'shield'
  | 'help'
  | 'star'
  | 'sparkles'
  | 'chevron-left'
  | 'chevron-right'
  | 'chevron-down'
  | 'arrow-left'
  | 'sliders'
  | 'filter'
  | 'more'
  | 'user-plus'
  | 'user-check'
  | 'clock'
  | 'send'
  | 'zap'
  | 'palette'
  | 'bookmark'
  | 'globe';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Render the icon as a solid filled shape where supported. */
  filled?: boolean;
}

const FILLABLE: IconName[] = ['heart', 'star', 'zap', 'crown', 'bell'];

export function Icon({ name, size = 24, color, strokeWidth = 2, filled = false }: IconProps) {
  const theme = useTheme();
  const stroke = color ?? theme.colors.text;
  const useFill = filled && FILLABLE.includes(name);
  const fill = useFill ? stroke : 'none';
  const strokeColor = useFill && name !== 'crown' ? stroke : stroke;

  const common = {
    stroke: strokeColor,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill,
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {renderIcon(name, common)}
    </Svg>
  );
}

type CommonProps = {
  stroke: string;
  strokeWidth: number;
  strokeLinecap: 'round';
  strokeLinejoin: 'round';
  fill: string;
};

function renderIcon(name: IconName, p: CommonProps): React.ReactNode {
  switch (name) {
    case 'home':
      return (
        <>
          <Path {...p} d="M3 9.5l9-7 9 7V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <Path {...p} d="M9 22V12h6v10" />
        </>
      );
    case 'map-pin':
      return (
        <>
          <Path {...p} d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <Circle {...p} cx={12} cy={10} r={3} />
        </>
      );
    case 'users':
      return (
        <>
          <Path {...p} d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <Circle {...p} cx={9} cy={7} r={4} />
          <Path {...p} d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <Path {...p} d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      );
    case 'user':
      return (
        <>
          <Path {...p} d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle {...p} cx={12} cy={7} r={4} />
        </>
      );
    case 'crown':
      return (
        <>
          <Path {...p} d="M3 17l-1-9 6 4 4-8 4 8 6-4-1 9z" />
          <Line {...p} x1={3} y1={21} x2={21} y2={21} />
        </>
      );
    case 'search':
      return (
        <>
          <Circle {...p} cx={11} cy={11} r={8} />
          <Line {...p} x1={21} y1={21} x2={16.65} y2={16.65} />
        </>
      );
    case 'settings':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={3} />
          <Path
            {...p}
            d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
          />
        </>
      );
    case 'bell':
      return (
        <>
          <Path {...p} d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <Path {...p} fill="none" d="M13.73 21a2 2 0 0 1-3.46 0" />
        </>
      );
    case 'heart':
      return (
        <Path
          {...p}
          d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        />
      );
    case 'message':
      return (
        <Path
          {...p}
          d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"
        />
      );
    case 'plus':
      return (
        <>
          <Line {...p} x1={12} y1={5} x2={12} y2={19} />
          <Line {...p} x1={5} y1={12} x2={19} y2={12} />
        </>
      );
    case 'check':
      return <Polyline {...p} points="20 6 9 17 4 12" />;
    case 'close':
      return (
        <>
          <Line {...p} x1={18} y1={6} x2={6} y2={18} />
          <Line {...p} x1={6} y1={6} x2={18} y2={18} />
        </>
      );
    case 'eye':
      return (
        <>
          <Path {...p} d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <Circle {...p} cx={12} cy={12} r={3} />
        </>
      );
    case 'eye-off':
      return (
        <>
          <Path
            {...p}
            d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
          />
          <Line {...p} x1={1} y1={1} x2={23} y2={23} />
        </>
      );
    case 'mail':
      return (
        <>
          <Rect {...p} x={2} y={4} width={20} height={16} rx={2} />
          <Polyline {...p} points="22 6 12 13 2 6" />
        </>
      );
    case 'phone':
      return (
        <Path
          {...p}
          d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
        />
      );
    case 'lock':
      return (
        <>
          <Rect {...p} x={3} y={11} width={18} height={11} rx={2} />
          <Path {...p} d="M7 11V7a5 5 0 0 1 10 0v4" />
        </>
      );
    case 'edit':
      return (
        <>
          <Path {...p} d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <Path {...p} d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" />
        </>
      );
    case 'camera':
      return (
        <>
          <Path
            {...p}
            d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
          />
          <Circle {...p} cx={12} cy={13} r={4} />
        </>
      );
    case 'logout':
      return (
        <>
          <Path {...p} d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <Polyline {...p} points="16 17 21 12 16 7" />
          <Line {...p} x1={21} y1={12} x2={9} y2={12} />
        </>
      );
    case 'moon':
      return <Path {...p} d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />;
    case 'sun':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={5} />
          <Line {...p} x1={12} y1={1} x2={12} y2={3} />
          <Line {...p} x1={12} y1={21} x2={12} y2={23} />
          <Line {...p} x1={4.22} y1={4.22} x2={5.64} y2={5.64} />
          <Line {...p} x1={18.36} y1={18.36} x2={19.78} y2={19.78} />
          <Line {...p} x1={1} y1={12} x2={3} y2={12} />
          <Line {...p} x1={21} y1={12} x2={23} y2={12} />
          <Line {...p} x1={4.22} y1={19.78} x2={5.64} y2={18.36} />
          <Line {...p} x1={18.36} y1={5.64} x2={19.78} y2={4.22} />
        </>
      );
    case 'shield':
      return <Path {...p} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />;
    case 'help':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={10} />
          <Path {...p} d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <Line {...p} x1={12} y1={17} x2={12.01} y2={17} />
        </>
      );
    case 'star':
      return (
        <Polygon
          {...p}
          points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"
        />
      );
    case 'sparkles':
      return (
        <>
          <Path {...p} d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6z" />
          <Path {...p} d="M19 14l.7 1.8L21.5 16.5 19.7 17.2 19 19l-.7-1.8L16.5 16.5l1.8-.7z" />
        </>
      );
    case 'chevron-left':
      return <Polyline {...p} points="15 18 9 12 15 6" />;
    case 'chevron-right':
      return <Polyline {...p} points="9 18 15 12 9 6" />;
    case 'chevron-down':
      return <Polyline {...p} points="6 9 12 15 18 9" />;
    case 'arrow-left':
      return (
        <>
          <Line {...p} x1={19} y1={12} x2={5} y2={12} />
          <Polyline {...p} points="12 19 5 12 12 5" />
        </>
      );
    case 'sliders':
      return (
        <>
          <Line {...p} x1={4} y1={21} x2={4} y2={14} />
          <Line {...p} x1={4} y1={10} x2={4} y2={3} />
          <Line {...p} x1={12} y1={21} x2={12} y2={12} />
          <Line {...p} x1={12} y1={8} x2={12} y2={3} />
          <Line {...p} x1={20} y1={21} x2={20} y2={16} />
          <Line {...p} x1={20} y1={12} x2={20} y2={3} />
          <Line {...p} x1={1} y1={14} x2={7} y2={14} />
          <Line {...p} x1={9} y1={8} x2={15} y2={8} />
          <Line {...p} x1={17} y1={16} x2={23} y2={16} />
        </>
      );
    case 'filter':
      return <Polygon {...p} points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />;
    case 'more':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={1.6} fill={p.stroke} />
          <Circle {...p} cx={19} cy={12} r={1.6} fill={p.stroke} />
          <Circle {...p} cx={5} cy={12} r={1.6} fill={p.stroke} />
        </>
      );
    case 'user-plus':
      return (
        <>
          <Path {...p} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <Circle {...p} cx={9} cy={7} r={4} />
          <Line {...p} x1={20} y1={8} x2={20} y2={14} />
          <Line {...p} x1={23} y1={11} x2={17} y2={11} />
        </>
      );
    case 'user-check':
      return (
        <>
          <Path {...p} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <Circle {...p} cx={9} cy={7} r={4} />
          <Polyline {...p} points="17 11 19 13 23 9" />
        </>
      );
    case 'clock':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={10} />
          <Polyline {...p} points="12 6 12 12 16 14" />
        </>
      );
    case 'send':
      return (
        <>
          <Line {...p} x1={22} y1={2} x2={11} y2={13} />
          <Polygon {...p} points="22 2 15 22 11 13 2 9 22 2" />
        </>
      );
    case 'zap':
      return <Polygon {...p} points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />;
    case 'palette':
      return (
        <>
          <Path
            {...p}
            d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-.9-.5-1.3-.3-.3-.5-.7-.5-1.2 0-1.1.9-2 2-2h2.4A4.6 4.6 0 0 0 22 10.8C22 5.9 17.5 2 12 2z"
          />
          <Circle cx={7.5} cy={10.5} r={1.2} fill={p.stroke} stroke={p.stroke} />
          <Circle cx={12} cy={7.5} r={1.2} fill={p.stroke} stroke={p.stroke} />
          <Circle cx={16.5} cy={10.5} r={1.2} fill={p.stroke} stroke={p.stroke} />
        </>
      );
    case 'bookmark':
      return <Path {...p} d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />;
    case 'globe':
      return (
        <>
          <Circle {...p} cx={12} cy={12} r={10} />
          <Line {...p} x1={2} y1={12} x2={22} y2={12} />
          <Path {...p} d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </>
      );
    default:
      return null;
  }
}

export default Icon;
