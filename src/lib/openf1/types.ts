import { z } from "zod";
import * as schemas from "./schemas";

export type ChampionshipDriver = z.infer<typeof schemas.ChampionshipDriverSchema>;
export type ChampionshipTeam = z.infer<typeof schemas.ChampionshipTeamSchema>;
export type Driver = z.infer<typeof schemas.DriverSchema>;
export type Interval = z.infer<typeof schemas.IntervalSchema>;
export type Lap = z.infer<typeof schemas.LapSchema>;
export type Meeting = z.infer<typeof schemas.MeetingSchema>;
export type Overtake = z.infer<typeof schemas.OvertakeSchema>;
export type Pit = z.infer<typeof schemas.PitSchema>;
export type Position = z.infer<typeof schemas.PositionSchema>;
export type RaceControl = z.infer<typeof schemas.RaceControlSchema>;
export type Session = z.infer<typeof schemas.SessionSchema>;
export type SessionResult = z.infer<typeof schemas.SessionResultSchema>;
export type Stint = z.infer<typeof schemas.StintSchema>;
export type TeamRadio = z.infer<typeof schemas.TeamRadioSchema>;
export type CarData = z.infer<typeof schemas.CarDataSchema>;
export type Location = z.infer<typeof schemas.LocationSchema>;
export type StartingGrid = z.infer<typeof schemas.StartingGridSchema>;
export type Weather = z.infer<typeof schemas.WeatherSchema>;

export type OpenF1Endpoint = keyof typeof schemas.EndpointSchemas;

export type OpenF1Response<T extends OpenF1Endpoint> = z.infer<
  typeof schemas.EndpointSchemas[T]
>[];
