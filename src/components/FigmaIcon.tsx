import React, { useId, useMemo } from 'react';
import { SvgXml } from 'react-native-svg';
import { figmaSvg, FigmaSvgName } from '../assets/figma/svgXml';

export type { FigmaSvgName };

type Props = {
  name: FigmaSvgName;
  size: number;
  /** Recolors baked Figma fills/strokes. Leave unset to keep design colors. */
  color?: string;
};

function uniquify(xml: string, ns: string): string {
  return xml
    .replace(/id="([^"]+)"/g, `id="${ns}_$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${ns}_$1)`);
}

function recolor(xml: string, color: string): string {
  return xml
    .replace(/stroke="#[0-9A-Fa-f]{3,8}"/g, `stroke="${color}"`)
    .replace(/fill="#[0-9A-Fa-f]{3,8}"/g, `fill="${color}"`)
    .replace(/stroke="white"/gi, `stroke="${color}"`)
    .replace(/fill="white"/gi, `fill="${color}"`)
    .replace(/stroke-opacity="0\.5"/g, 'stroke-opacity="1"');
}

export function FigmaIcon({ name, size, color }: Props) {
  const ns = useId().replace(/:/g, '');
  const xml = useMemo(() => {
    const source = figmaSvg[name];
    if (!source) {
      return '<svg width="1" height="1" xmlns="http://www.w3.org/2000/svg"/>';
    }
    const raw = uniquify(source, ns);
    return color ? recolor(raw, color) : raw;
  }, [name, color, ns]);

  return <SvgXml xml={xml} width={size} height={size} />;
}
