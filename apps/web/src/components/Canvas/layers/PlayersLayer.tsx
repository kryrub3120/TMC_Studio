/**
 * PlayersLayer - Renders players, ball, equipment, text
 */

import { memo } from 'react';
import { Layer } from 'react-konva';
import type { BoardElement, PitchConfig, TeamSettings } from '@tmc/core';
import { isPlayerElement, isBallElement, isEquipmentElement, isTextElement } from '@tmc/core';
import { PlayerNode, BallNode, EquipmentNode, TextNode } from '@tmc/board';

export interface PlayersLayerProps {
  elements: BoardElement[];
  selectedIds: string[];
  pitchConfig: PitchConfig;
  teamSettings: TeamSettings;
  layerVisibility: {
    homePlayers: boolean;
    awayPlayers: boolean;
    ball: boolean;
    equipment: boolean;
    text: boolean;
  };
  hiddenByGroup: Set<string>;
  isPlaying: boolean;
  onSelect?: (id: string, addToSelection: boolean) => void;
  onDragEnd?: (id: string, newPos: { x: number; y: number }) => void;
  onDragStart?: (id: string) => boolean;
  onPlayerQuickEdit?: (id: string) => void;
}

export const PlayersLayer = memo<PlayersLayerProps>(({
  elements,
  selectedIds,
  pitchConfig,
  teamSettings,
  layerVisibility,
  hiddenByGroup,
  isPlaying,
  onSelect,
  onDragEnd,
  onDragStart,
  onPlayerQuickEdit,
}) => {
  const players = elements
    .filter(isPlayerElement)
    .filter((p) => !hiddenByGroup.has(p.id))
    .filter((p) =>
      (p.team === 'home' && layerVisibility.homePlayers) ||
      (p.team === 'away' && layerVisibility.awayPlayers)
    );
  const balls = layerVisibility.ball ? elements.filter(isBallElement).filter((b) => !hiddenByGroup.has(b.id)) : [];
  const equipment = layerVisibility.equipment ? elements.filter(isEquipmentElement) : [];
  const texts = layerVisibility.text ? elements.filter(isTextElement) : [];
  
  return (
    <Layer>
      {players.map((player) => (
        <PlayerNode
          key={player.id}
          player={player}
          pitchConfig={pitchConfig}
          teamSettings={teamSettings}
          isSelected={!isPlaying && selectedIds.includes(player.id)}
          onSelect={isPlaying ? () => {} : (onSelect || (() => {}))}
          onDragEnd={isPlaying ? () => {} : (onDragEnd || (() => {}))}
          onDragStart={isPlaying ? () => false : (onDragStart || (() => false))}
          onQuickEditNumber={isPlaying ? undefined : onPlayerQuickEdit}
        />
      ))}
      {balls.map((ball) => {
        const handleBallDragEnd = (id: string, position: { x: number; y: number }) => {
          onDragEnd?.(id, position);
        };
        return (
          <BallNode
            key={ball.id}
            ball={ball}
            pitchConfig={pitchConfig}
            isSelected={!isPlaying && selectedIds.includes(ball.id)}
            onSelect={isPlaying ? () => {} : (onSelect || (() => {}))}
            onDragEnd={isPlaying ? () => {} : handleBallDragEnd}
          />
        );
      })}
      {equipment.map((eq) => {
        const handleDragEnd = (id: string, x: number, y: number) => {
          onDragEnd?.(id, { x, y });
        };
        return (
          <EquipmentNode
            key={eq.id}
            equipment={eq}
            pitchConfig={pitchConfig}
            isSelected={!isPlaying && selectedIds.includes(eq.id)}
            onSelect={isPlaying ? () => {} : (onSelect || (() => {}))}
            onDragEnd={isPlaying ? () => {} : handleDragEnd}
          />
        );
      })}
      {texts.map((text) => {
        const handleDragEnd = (id: string, x: number, y: number) => {
          onDragEnd?.(id, { x, y });
        };
        return (
          <TextNode
            key={text.id}
            text={text}
            pitchConfig={pitchConfig}
            isSelected={!isPlaying && selectedIds.includes(text.id)}
            onSelect={isPlaying ? () => {} : (onSelect || (() => {}))}
            onDragEnd={isPlaying ? () => {} : handleDragEnd}
          />
        );
      })}
    </Layer>
  );
});

PlayersLayer.displayName = 'PlayersLayer';
