export type PublicLeaderboardRow = {
  id: string;
  rank: number;
  totalPoints: number;
  scoredResultsCount: number;
  gender: "MALE" | "FEMALE";
  ageGroup: string | null;
  athleteName: string;
  telegramUsername: string | null;
  clubs: { id: string; name: string }[];
  coaches: { id: string; name: string }[];
  results: {
    id: string;
    competitionId: string | null;
    eventName: string;
    distanceLabel: string;
    finishTime: string;
    ageGroupPlacement: number | null;
    points: number;
    counted: boolean;
  }[];
};
