/**
 * Folder Color Picker - Select folder color
 */

interface FolderColorPickerProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
}

const FOLDER_COLORS = [
  { name: 'Red', value: '#ef4444', icon: '🔴' },
  { name: 'Orange', value: '#f97316', icon: '🟠' },
  { name: 'Yellow', value: '#eab308', icon: '🟡' },
  { name: 'Green', value: '#22c55e', icon: '🟢' },
  { name: 'Blue', value: '#3b82f6', icon: '🔵' },
  { name: 'Purple', value: '#a855f7', icon: '🟣' },
  { name: 'Gray', value: '#6b7280', icon: '⚪' },
];

export function FolderColorPicker({ currentColor, onSelectColor }: FolderColorPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2 p-2">
      {FOLDER_COLORS.map((color) => (
        <button
          key={color.value}
          onClick={() => onSelectColor(color.value)}
          className={`p-2 rounded-lg transition-all ${
            currentColor === color.value
              ? 'bg-accent/20 ring-2 ring-accent'
              : 'hover:bg-surface2'
          }`}
          title={color.name}
        >
          <span className="text-2xl">{color.icon}</span>
        </button>
      ))}
    </div>
  );
}
