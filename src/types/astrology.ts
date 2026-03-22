export interface BirthDataRequest {
  longitude: number;
  latitude: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  city: string;
  nation: string;
  name: string;
}

export interface CosmicElement {
  name: string;
  point_type?: string;
  sign: string;
  degree?: number;
  house?: string;
  element?: string;
  symbol?: string;
  [key: string]: unknown;
}

export interface CosmicAspect {
  p1_name: string;
  p2_name: string;
  aspect: string;
  orb?: number;
  [key: string]: unknown;
}

export interface ChartData {
  subject: Record<string, CosmicElement | null>;
  aspects: CosmicAspect[];
  lunar_phase?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BirthDataResponse {
  chart: string;
  chart_data: ChartData;
  [key: string]: unknown;
}
