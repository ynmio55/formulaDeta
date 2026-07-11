import { z } from "zod";

export const ChampionshipDriverSchema = z.object({
  meeting_key: z.number(),
  session_key: z.number(),
  driver_number: z.number(),
  position_start: z.number().nullable(),
  position_current: z.number().nullable(),
  points_start: z.number().nullable(),
  points_current: z.number().nullable(),
});

export const ChampionshipTeamSchema = z.object({
  meeting_key: z.number(),
  session_key: z.number(),
  team_name: z.string(),
  position_start: z.number().nullable(),
  position_current: z.number().nullable(),
  points_start: z.number().nullable(),
  points_current: z.number().nullable(),
});

export const DriverSchema = z.object({
  meeting_key: z.number(),
  session_key: z.number(),
  driver_number: z.number(),
  broadcast_name: z.string().nullable(),
  full_name: z.string(),
  name_acronym: z.string(),
  team_name: z.string().nullable(),
  team_colour: z.string().nullable(),
  first_name: z.string(),
  last_name: z.string(),
  headshot_url: z.string().nullable(),
  country_code: z.string().nullable(),
});

export const IntervalSchema = z.object({
  date: z.string(),
  session_key: z.number(),
  driver_number: z.number(),
  gap_to_leader: z.number().nullable(),
  interval: z.number().nullable(),
  meeting_key: z.number(),
});

export const LapSchema = z.object({
  meeting_key: z.number(),
  session_key: z.number(),
  driver_number: z.number(),
  lap_number: z.number(),
  date_start: z.string().nullable(),
  duration_sector_1: z.number().nullable(),
  duration_sector_2: z.number().nullable(),
  duration_sector_3: z.number().nullable(),
  i1_speed: z.number().nullable(),
  i2_speed: z.number().nullable(),
  is_pit_out_lap: z.boolean().nullable(),
  lap_duration: z.number().nullable(),
  st_speed: z.number().nullable(),
});

export const MeetingSchema = z.object({
  meeting_key: z.number(),
  meeting_name: z.string(),
  meeting_official_name: z.string(),
  location: z.string(),
  country_key: z.number(),
  country_code: z.string(),
  country_name: z.string(),
  country_flag: z.string().nullable(),
  circuit_key: z.number(),
  circuit_short_name: z.string(),
  circuit_type: z.string(),
  circuit_info_url: z.string().nullable(),
  circuit_image: z.string().nullable(),
  gmt_offset: z.string(),
  date_start: z.string(),
  date_end: z.string(),
  year: z.number(),
  is_cancelled: z.boolean().default(false),
});

export const OvertakeSchema = z.object({
  meeting_key: z.number(),
  session_key: z.number(),
  overtaking_driver_number: z.number(),
  overtaken_driver_number: z.number(),
  date: z.string(),
  position: z.number(),
});

export const PitSchema = z.object({
  date: z.string(),
  session_key: z.number(),
  stop_duration: z.number().nullable(),
  driver_number: z.number(),
  meeting_key: z.number(),
  lap_number: z.number().nullable(),
  pit_duration: z.number().nullable(),
  lane_duration: z.number().nullable(),
});

export const PositionSchema = z.object({
  date: z.string(),
  session_key: z.number(),
  meeting_key: z.number(),
  driver_number: z.number(),
  position: z.number(),
});

export const RaceControlSchema = z.object({
  meeting_key: z.number(),
  session_key: z.number(),
  date: z.string(),
  driver_number: z.number().nullable().optional(),
  lap_number: z.number().nullable().optional(),
  category: z.string(),
  flag: z.string().nullable(),
  scope: z.string().nullable(),
  message: z.string(),
});

export const SessionSchema = z.object({
  session_key: z.number(),
  session_type: z.string(),
  session_name: z.string(),
  date_start: z.string(),
  date_end: z.string(),
  meeting_key: z.number(),
  circuit_key: z.number(),
  circuit_short_name: z.string(),
  country_key: z.number(),
  country_code: z.string(),
  country_name: z.string(),
  location: z.string(),
  gmt_offset: z.string(),
  year: z.number(),
  is_cancelled: z.boolean().default(false),
});

export const SessionResultSchema = z.object({
  position: z.number(),
  driver_number: z.number(),
  number_of_laps: z.number(),
  dnf: z.boolean().nullable(),
  dns: z.boolean().nullable(),
  dsq: z.boolean().nullable(),
  duration: z.number().nullable(),
  gap_to_leader: z.number().nullable(),
  meeting_key: z.number(),
  session_key: z.number(),
});

export const StintSchema = z.object({
  meeting_key: z.number(),
  session_key: z.number(),
  stint_number: z.number(),
  driver_number: z.number(),
  lap_start: z.number(),
  lap_end: z.number(),
  compound: z.string().nullable(),
  tyre_age_at_start: z.number().nullable(),
});

export const TeamRadioSchema = z.object({
  meeting_key: z.number(),
  session_key: z.number(),
  driver_number: z.number(),
  date: z.string(),
  recording_url: z.string(),
});

// Infered manual schemas
export const CarDataSchema = z.object({
  meeting_key: z.number(),
  session_key: z.number(),
  driver_number: z.number(),
  date: z.string(),
  rpm: z.number().nullable(),
  speed: z.number().nullable(),
  n_gear: z.number().nullable(),
  throttle: z.number().nullable(),
  brake: z.number().nullable(),
  drs: z.number().nullable(),
});

export const LocationSchema = z.object({
  meeting_key: z.number(),
  session_key: z.number(),
  driver_number: z.number(),
  date: z.string(),
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export const StartingGridSchema = z.object({
  meeting_key: z.number(),
  session_key: z.number(),
  driver_number: z.number(),
  position: z.number(),
});

export const WeatherSchema = z.object({
  meeting_key: z.number(),
  session_key: z.number(),
  date: z.string(),
  air_temperature: z.number(),
  track_temperature: z.number(),
  humidity: z.number(),
  pressure: z.number(),
  wind_speed: z.number(),
  wind_direction: z.number(),
  rainfall: z.number(),
});

export const EndpointSchemas = {
  "/v1/car_data": CarDataSchema,
  "/v1/championship_drivers": ChampionshipDriverSchema,
  "/v1/championship_teams": ChampionshipTeamSchema,
  "/v1/drivers": DriverSchema,
  "/v1/intervals": IntervalSchema,
  "/v1/laps": LapSchema,
  "/v1/location": LocationSchema,
  "/v1/meetings": MeetingSchema,
  "/v1/overtakes": OvertakeSchema,
  "/v1/pit": PitSchema,
  "/v1/position": PositionSchema,
  "/v1/race_control": RaceControlSchema,
  "/v1/sessions": SessionSchema,
  "/v1/session_result": SessionResultSchema,
  "/v1/starting_grid": StartingGridSchema,
  "/v1/stints": StintSchema,
  "/v1/team_radio": TeamRadioSchema,
  "/v1/weather": WeatherSchema,
};
