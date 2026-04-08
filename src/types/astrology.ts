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

export interface MoonPhaseRequest {
  longitude: number;
  latitude: number;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export interface MoonPhaseResponse {
  status: string;
  moon_phase_overview: MoonPhaseOverview;
  [key: string]: unknown;
}

export interface MoonPhaseOverview {
  timestamp: number;
  datestamp: string;
  sun: SunData;
  moon: MoonData;
  location: LocationData;
}

export interface SunData {
  sunrise: number;
  sunrise_timestamp: string;
  sunset: number;
  sunset_timestamp: string;
  solar_noon: string;
  day_length: string;
  position: CelestialPosition;
  next_solar_eclipse: EclipseData;
}

export interface CelestialPosition {
  altitude: number;
  azimuth: number;
  distance: number;
}

export interface EclipseData {
  timestamp: number;
  datestamp: string;
  type: string;
  visibility_regions: string;
}

export interface MoonData {
  phase: number;
  phase_name: string;
  major_phase: string;
  stage: string;
  illumination: string;
  age_days: number;
  lunar_cycle: string;
  emoji: string;
  zodiac: ZodiacData;
  moonrise: string;
  moonrise_timestamp: number;
  moonset: string;
  moonset_timestamp: number;
  next_lunar_eclipse: EclipseData;
  detailed: MoonDetailed;
  events: MoonEvents;
}

export interface ZodiacData {
  sun_sign: string;
  moon_sign: string;
}

export interface MoonDetailed {
  position: DetailedPosition;
  visibility: MoonVisibility;
  upcoming_phases: UpcomingPhases;
  illumination_details: IlluminationDetails;
}

export interface DetailedPosition extends CelestialPosition {
  parallactic_angle: number;
  phase_angle: number;
}

export interface MoonVisibility {
  visible_hours: number;
  best_viewing_time: string;
  visibility_rating: string;
  illumination: string;
  viewing_conditions: ViewingConditions;
}

export interface ViewingConditions {
  phase_quality: string;
  recommended_equipment: RecommendedEquipment;
}

export interface RecommendedEquipment {
  filters: string;
  telescope: string;
  best_magnification: string;
}

export interface UpcomingPhases {
  new_moon: PhaseInfo;
  first_quarter: PhaseInfo;
  full_moon: PhaseInfo;
  last_quarter: PhaseInfo;
}

export interface PhaseInfo {
  last: PhaseDetail;
  next: PhaseDetail;
}

export interface PhaseDetail {
  timestamp: number;
  datestamp: string;
  days_ago: number;
  days_ahead: number;
  name: string;
  description: string;
}

export interface IlluminationDetails {
  percentage: number;
  visible_fraction: number;
  phase_angle: number;
}

export interface MoonEvents {
  moonrise_visible: boolean;
  moonset_visible: boolean;
  optimal_viewing_period: OptimalViewingPeriod;
}

export interface OptimalViewingPeriod {
  start_time: string;
  end_time: string;
  duration_hours: number;
  viewing_quality: string;
  recommendations: string[];
}

export interface LocationData {
  latitude: string;
  longitude: string;
  precision: number;
  using_default_location: boolean;
  note: string;
}
