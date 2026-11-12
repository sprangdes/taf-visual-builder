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

export type EditableBlockKey = "wind" | "vis" | "clouds";

export interface IssueTimeInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
}
