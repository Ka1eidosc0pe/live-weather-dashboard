export interface City {
  id: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  animated: boolean;
  sort: number;
}

export interface HourlyPoint {
  time: string; // local ISO, e.g. 2026-11-02T18:00
  temp: number;
  code: number;
  pop: number;
}

export interface DailyPoint {
  date: string;
  code: number;
  max: number;
  min: number;
  pop: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherRow {
  city_id: string;
  temperature_c: number;
  apparent_c: number;
  humidity: number;
  precipitation: number;
  cloud_cover: number;
  weather_code: number;
  is_day: boolean;
  wind_kph: number;
  wind_gust_kph: number;
  wind_dir: number;
  observed_at: string;
  forecast: { hourly?: HourlyPoint[]; daily?: DailyPoint[] };
  updated_at: string;
}

export interface WorkerRun {
  id: number;
  started_at: string;
  finished_at: string;
  status: "success" | "error";
  cities_checked: number;
  cities_changed: number;
  error: string | null;
}

export interface WeatherChange {
  id: number;
  city_id: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  created_at: string;
}
