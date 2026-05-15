export const EVENT_TYPES = [
  "transit",
  "lodging",
  "food",
  "activity",
  "task",
  "other",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export type Trip = {
  id: string;
  owner_id: string;
  title: string;
  start_date: string;
  end_date: string;
  timezone: string;
  created_at: string;
  updated_at: string;
};

export type TripEvent = {
  id: string;
  owner_id: string;
  trip_id: string;
  title: string;
  type: EventType;
  start_at: string;
  end_at: string;
  location_name: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      trips: {
        Row: Trip;
        Insert: Omit<Trip, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Trip, "id" | "owner_id" | "created_at">>;
        Relationships: [];
      };
      events: {
        Row: TripEvent;
        Insert: Omit<TripEvent, "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<TripEvent, "id" | "owner_id" | "trip_id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "events_trip_id_fkey";
            columns: ["trip_id"];
            isOneToOne: false;
            referencedRelation: "trips";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      event_type: EventType;
    };
    CompositeTypes: Record<string, never>;
  };
};
