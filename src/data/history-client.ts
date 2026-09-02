import type { HistoryEntry } from "../types";

export interface HistoryDuringPeriodResponse {
  [entityId: string]: Array<{
    entity_id: string;
    state: string;
    last_changed: string;
    last_updated?: string;
  }>;
}

export class HistoryClient {
  private generation = 0;

  constructor(
    private callWS: <T>(msg: Record<string, unknown>) => Promise<T>
  ) {}

  async fetchHistory(
    entityIds: string[],
    startTime: Date,
    endTime: Date
  ): Promise<{ generation: number; entries: HistoryEntry[] }> {
    const generation = ++this.generation;

    try {
      const response = await this.callWS<HistoryDuringPeriodResponse>({
        type: "history/history_during_period",
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        entity_ids: entityIds,
        include_start_time_state: true,
        significant_changes_only: true,
        minimal_response: true,
        no_attributes: true,
      });

      const entries: HistoryEntry[] = entityIds.map((entityId) => ({
        entity_id: entityId,
        states: (response[entityId] ?? []).map((s) => ({
          state: s.state,
          last_changed: s.last_changed,
          last_updated: s.last_updated,
        })),
      }));

      return { generation, entries };
    } catch {
      return { generation, entries: [] };
    }
  }

  getCurrentGeneration(): number {
    return this.generation;
  }

  invalidate(): void {
    this.generation++;
  }
}
