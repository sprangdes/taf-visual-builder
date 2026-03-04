export type WeatherTrendType = "FM" | "TEMPO" | "BECMG";

export interface Wind {
  dir: number;
  speed: number;
  gust: number | null;
}

export interface CloudLayer {
  id: string;
  amount: string;
  height: number;
  cb?: boolean;
  tcu?: boolean;
}

export interface WeatherState {
  wind: Wind;
  visibility: number;
  weather: string[];
  clouds: CloudLayer[];
  enabledBlocks?: {
    wind?: boolean;
    vis?: boolean;
    clouds?: boolean;
  };
}

export interface TAFChange {
  type: WeatherTrendType;
  from: string;
  to: string;
  state: WeatherState;
}

export interface BaseForecast {
  state: WeatherState;
  from: string;
  to: string;
}

export interface TAF {
  station: string;
  issueTime: string;
  base: WeatherState;
  changes: TAFChange[];
}

export interface ChangeEditorProps {
  change: TAFChange | BaseForecast | null;
  onUpdate: (updated: TAFChange | BaseForecast) => void;
  showActionButtons?: boolean;
  onDelete?: () => void;
  onChangeType?: (type: WeatherTrendType) => void;
}

export interface TimelineProps {
  changes: TAFChange[];
  onSelectRange: (start: number, end: number) => void;
  onSelectChange: (index: number) => void;
  startHour: number;
  isDark?: boolean;
}

export interface IssueTimeInputProps {
  value: string;
  onChange: (value: string) => void;
}

export interface CloudDeleteButtonProps {
  onClick: () => void;
}

export interface ChangeDeleteButtonProps {
  onClick: () => void;
  setShowTooltip: (v: boolean) => void;
  showTooltip: boolean;
}

export interface TooltipPos {
  top: number;
  left: number;
}

export interface TypeButtonProps {
  showActionButtons: boolean;
  onChangeType?: (type: WeatherTrendType) => void;
  change: TAFChange | BaseForecast;
}

export type EditableBlockKey = "wind" | "vis" | "clouds";
