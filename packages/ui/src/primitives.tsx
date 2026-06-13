/**
 * Shared form primitives for TMC Studio UI.
 *
 * Single source of truth for the small controls that were previously
 * copy-pasted across SettingsModal and RightInspector (toggles, slider rows,
 * collapsible sections, etc). Everything is built on the semantic design
 * tokens (surface / surface2 / text / muted / accent / border) so it themes
 * correctly in both light and dark mode.
 */

import React, { useState } from 'react';

/* ─── Toggle ─────────────────────────────────────────────────────────── */

export interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  /** Optional accessible label (use when there is no adjacent <label>). */
  ariaLabel?: string;
  size?: 'sm' | 'md';
}

/** The one true toggle. Replaces ~9 hand-rolled switch implementations. */
export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
  size = 'md',
}) => {
  const dims =
    size === 'sm'
      ? { w: 'w-9', h: 'h-5', knob: 'w-4 h-4', on: 'translate-x-4', off: 'translate-x-0.5' }
      : { w: 'w-10', h: 'h-6', knob: 'w-5 h-5', on: 'translate-x-4', off: 'translate-x-0.5' };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onChange}
      className={`relative ${dims.w} ${dims.h} rounded-full transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-accent/50 ${
        checked ? 'bg-accent' : 'bg-surface2 border border-border'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`absolute top-0.5 ${dims.knob} rounded-full bg-white shadow transition-transform ${
          checked ? dims.on : dims.off
        }`}
      />
    </button>
  );
};

/* ─── SettingRow ─────────────────────────────────────────────────────── */

export interface SettingRowProps {
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned control (toggle, segmented control, button…). */
  control?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

/** Label + optional description on the left, a control on the right. */
export const SettingRow: React.FC<SettingRowProps> = ({
  label,
  description,
  control,
  disabled = false,
  className = '',
}) => (
  <div className={`flex items-center justify-between gap-3 py-2.5 ${className}`}>
    <div className={disabled ? 'opacity-50' : ''}>
      <p className="text-sm font-medium text-text">{label}</p>
      {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
    </div>
    {control}
  </div>
);

/* ─── Section (collapsible) ──────────────────────────────────────────── */

export interface SectionProps {
  title: React.ReactNode;
  /** Start collapsed. Defaults to expanded. */
  defaultOpen?: boolean;
  /** When false the section cannot be collapsed (static header). */
  collapsible?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}

/** Grouped, optionally collapsible block of settings. */
export const Section: React.FC<SectionProps> = ({
  title,
  defaultOpen = true,
  collapsible = true,
  right,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = collapsible ? open : true;

  return (
    <div className="border-t border-border first:border-t-0">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => collapsible && setOpen((v) => !v)}
          aria-expanded={isOpen}
          className={`flex items-center gap-1.5 py-2.5 text-sm font-medium text-text ${
            collapsible ? 'cursor-pointer' : 'cursor-default'
          }`}
        >
          {collapsible && (
            <svg
              className={`w-3.5 h-3.5 text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          )}
          {title}
        </button>
        {right}
      </div>
      {isOpen && <div className="pb-3">{children}</div>}
    </div>
  );
};

/* ─── Field (labelled input wrapper) ─────────────────────────────────── */

export interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, hint, children, className = '' }) => (
  <div className={className}>
    {label && <label className="block text-xs font-medium text-muted mb-1.5">{label}</label>}
    {children}
    {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
  </div>
);

/** Shared text/number input styling. */
export const inputClass =
  'w-full px-3 py-2 rounded-md bg-surface2 border border-border text-sm text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors';

/* ─── Slider (labelled range with live value) ────────────────────────── */

export interface SliderProps {
  label: React.ReactNode;
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  /** Format the readout (e.g. v => `${v}%`). */
  format?: (v: number) => string;
  onChange: (value: number) => void;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  disabled = false,
  format,
  onChange,
}) => (
  <div className={disabled ? 'opacity-50' : ''}>
    <div className="flex items-center justify-between mb-1">
      <label className="text-xs font-medium text-muted">{label}</label>
      <span className="text-xs text-accent tabular-nums">{format ? format(value) : value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`w-full h-1.5 rounded-full bg-surface2 appearance-none accent-accent ${
        disabled ? 'cursor-not-allowed' : 'cursor-pointer'
      }`}
    />
  </div>
);

/* ─── ColorSwatch / ColorSwatchRow ───────────────────────────────────── */

export interface ColorSwatchRowProps {
  colors: string[];
  value?: string;
  onChange: (color: string) => void;
  size?: number;
}

/** Row of selectable color swatches. */
export const ColorSwatchRow: React.FC<ColorSwatchRowProps> = ({
  colors,
  value,
  onChange,
  size = 24,
}) => (
  <div className="flex flex-wrap gap-2">
    {colors.map((c) => {
      const selected = value?.toLowerCase() === c.toLowerCase();
      return (
        <button
          key={c}
          type="button"
          aria-label={`Color ${c}`}
          aria-pressed={selected}
          onClick={() => onChange(c)}
          style={{ width: size, height: size, backgroundColor: c }}
          className={`rounded-md border border-border transition-transform hover:scale-105 ${
            selected ? 'ring-2 ring-accent ring-offset-1 ring-offset-surface' : ''
          }`}
        />
      );
    })}
  </div>
);

/* ─── SegmentedControl ───────────────────────────────────────────────── */

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="flex p-0.5 rounded-lg bg-surface2 border border-border"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              active ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
