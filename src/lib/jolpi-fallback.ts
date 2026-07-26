export async function getJolpiFallback(endpoint: string, searchParams: URLSearchParams) {
  try {
    // Extract year from query params, default to 2026 if not found
    let year = searchParams.get("year");
    if (!year || year === "latest") {
      const sessionKey = searchParams.get("session_key");
      const meetingKey = searchParams.get("meeting_key");
      if (sessionKey === "latest" || meetingKey === "latest") {
        year = "2026"; 
      } else {
        year = "2026"; // Fallback to 2026
      }
    }

    if (endpoint === "championship_drivers") {
      const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`);
      if (!res.ok) return null;
      const data = await res.json();
      const standings = data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
      return standings.map((s: any) => ({
        driver_number: Number(s.Driver.permanentNumber) || 0,
        position_current: Number(s.position),
        points_current: Number(s.points)
      }));
    }

    if (endpoint === "championship_teams") {
      const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/constructorStandings.json`);
      if (!res.ok) return null;
      const data = await res.json();
      const standings = data.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
      
      const teamMap: Record<string, string> = {
        "red_bull": "Red Bull Racing",
        "aston_martin": "Aston Martin",
        "alpine": "Alpine",
        "haas": "Haas F1 Team",
        "mclaren": "McLaren",
        "mercedes": "Mercedes",
        "ferrari": "Ferrari",
        "williams": "Williams",
        "cadillac": "Cadillac",
        "audi": "Audi",
        "sauber": "Kick Sauber",
        "rb": "Racing Bulls"
      };

      return standings.map((s: any) => {
        let teamName = teamMap[s.Constructor.constructorId] || s.Constructor.name;
        if (teamName === "Racing Bulls") teamName = "Racing Bulls";
        return {
          team_name: teamName,
          position_current: Number(s.position),
          points_current: Number(s.points)
        };
      });
    }

    if (endpoint === "drivers") {
      const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/driverStandings.json`);
      if (!res.ok) return null;
      const data = await res.json();
      const standings = data.MRData.StandingsTable.StandingsLists[0]?.DriverStandings || [];
      
      const teamColorMap: Record<string, string> = {
        "mercedes": "27f4d2",
        "ferrari": "e8002d",
        "mclaren": "ff8000",
        "red_bull": "3671c6",
        "aston_martin": "229971",
        "alpine": "ff87bc",
        "williams": "64c4ff",
        "haas": "ffffff",
        "rb": "6692ff",
        "cadillac": "ffb800",
        "audi": "f40000",
        "sauber": "52e252"
      };

      const teamNameMap: Record<string, string> = {
        "red_bull": "Red Bull Racing",
        "aston_martin": "Aston Martin",
        "alpine": "Alpine",
        "haas": "Haas F1 Team",
        "mclaren": "McLaren",
        "mercedes": "Mercedes",
        "ferrari": "Ferrari",
        "williams": "Williams",
        "cadillac": "Cadillac",
        "audi": "Audi",
        "sauber": "Kick Sauber",
        "rb": "Racing Bulls"
      };

      const headshots: Record<number, string> = {
        44: "/drivers/2026ferrarilewham01right.avif",
        55: "/drivers/2026williamscarsai01right.avif",
        12: "/drivers/2026mercedesandant01right.avif",
        87: "/drivers/2026haasf1teamolibea01right.avif",
        43: "/drivers/2026alpinefracol01right.avif",
        11: "/drivers/2026cadillacserper01right.avif",
        77: "/drivers/2026cadillacvalbot01right.avif",
        27: "/drivers/2026audinichul01right.avif",
        30: "/drivers/2026racingbullslialaw01right.avif",
        41: "/drivers/2026racingbullsarvlin01right.avif",
        16: "/drivers/2026ferrarichalec01right.avif",
        3: "/drivers/2026redbullracingmaxver01right.avif",
        33: "/drivers/2026redbullracingmaxver01right.avif",
        6: "/drivers/2026redbullracingisahad01right.avif",
        1: "/drivers/2026mclarenlannor01right.avif",
        4: "/drivers/2026mclarenlannor01right.avif",
        81: "/drivers/2026mclarenoscpia01right.avif",
        63: "/drivers/2026mercedesgeorus01right.avif",
        14: "/drivers/2026astonmartinferalo01right.avif",
        23: "/drivers/2026williamsalealb01right.avif",
        10: "/drivers/2026alpinepiegas01right.avif",
        18: "/drivers/2026astonmartinlanstr01right.avif",
        31: "/drivers/2026haasf1teamestoco01right.avif",
        5: "/drivers/2026audigabbor01right.avif"
      };

      return standings.map((s: any) => {
        const d = s.Driver;
        const num = Number(d.permanentNumber) || 0;
        const cid = s.Constructors[0]?.constructorId;
        return {
          driver_number: num,
          full_name: `${d.givenName} ${d.familyName}`,
          name_acronym: d.code,
          team_name: teamNameMap[cid] || s.Constructors[0]?.name,
          team_colour: teamColorMap[cid] || "ffffff",
          headshot_url: headshots[num] || undefined
        };
      });
    }

    if (endpoint === "meetings") {
      const res = await fetch(`https://api.jolpi.ca/ergast/f1/${year}.json`);
      if (!res.ok) return null;
      const data = await res.json();
      const races = data.MRData.RaceTable.Races || [];
      return races.map((r: any) => ({
        meeting_key: Number(r.round), // use round as meeting key
        meeting_name: r.raceName,
        meeting_official_name: r.raceName,
        location: r.Circuit.Location.locality,
        country_name: r.Circuit.Location.country,
        circuit_short_name: r.Circuit.circuitName,
        date_start: `${r.date}T10:00:00Z`,
        date_end: `${r.date}T12:00:00Z`,
        year: Number(r.season),
        is_cancelled: false
      }));
    }

    return null;
  } catch (err) {
    console.error("Jolpi fallback failed:", err);
    return null;
  }
}
