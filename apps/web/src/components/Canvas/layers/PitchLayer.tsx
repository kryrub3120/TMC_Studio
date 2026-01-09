/**
 * PitchLayer - Static pitch background layer
 * 
 * NO store access - receives all data via props
 */

import { memo } from 'react';
import { Layer } from 'react-konva';
import type { PitchConfig, PitchSettings } from '@tmc/core';
import { Pitch } from '@tmc/board';

export interface PitchLayerProps {
  config: PitchConfig;
  pitchSettings: PitchSettings;
  gridVisible: boolean;
}

export const PitchLayer = memo<PitchLayerProps>(({ config, pitchSettings, gridVisible }) => {
  return (
    <Layer>
      <Pitch config={config} pitchSettings={pitchSettings} gridVisible={gridVisible} />
    </Layer>
  );
});

PitchLayer.displayName = 'PitchLayer';
