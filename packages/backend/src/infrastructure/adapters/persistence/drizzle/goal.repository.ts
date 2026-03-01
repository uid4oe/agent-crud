import { type AnyColumn, and, asc, count, desc, eq, ilike, inArray, or } from "drizzle-orm";
import {
  type CreateGoalProps,
  Goal,
  type GoalCategory,
  type GoalRepositoryPort,
  type GoalStatus,
  type MilestoneProps,
  type PaginatedResult,
  type PaginationInput,
  type UpdateGoalProps,
} from "../../../../domain/index.js";
import { type DbClient } from "./client.js";
import { goals, milestones } from "./schema.js";

export class DrizzleGoalRepository implements GoalRepositoryPort {
  constructor(private readonly db: DbClient) {}

  private getSortColumn(sortBy?: string): AnyColumn {
    const sortMap: Record<string, AnyColumn> = {
      updatedAt: goals.updatedAt,
      createdAt: goals.createdAt,
      title: goals.title,
      targetDate: goals.targetDate,
    };
    return sortMap[sortBy ?? ""] ?? goals.updatedAt;
  }

  async findAll(pagination?: PaginationInput): Promise<PaginatedResult<Goal>> {
    const limit = pagination?.limit ?? 50;
    const offset = pagination?.offset ?? 0;
    const sortCol = this.getSortColumn(pagination?.sortBy);
    const orderFn = pagination?.sortOrder === "asc" ? asc : desc;

    const [goalRecords, [{ total }]] = await Promise.all([
      this.db.select().from(goals).orderBy(orderFn(sortCol)).limit(limit).offset(offset),
      this.db.select({ total: count() }).from(goals),
    ]);

    const data = await this.withMilestones(goalRecords);
    return { data, total, limit, offset };
  }

  async findById(id: string): Promise<Goal | null> {
    const results = await this.db.select().from(goals).where(eq(goals.id, id));
    if (!results[0]) return null;
    const [goal] = await this.withMilestones([results[0]]);
    return goal;
  }

  async findByStatus(status: GoalStatus): Promise<Goal[]> {
    const goalRecords = await this.db
      .select()
      .from(goals)
      .where(eq(goals.status, status))
      .orderBy(desc(goals.updatedAt));
    return this.withMilestones(goalRecords);
  }

  async findByCategory(category: GoalCategory): Promise<Goal[]> {
    const goalRecords = await this.db
      .select()
      .from(goals)
      .where(eq(goals.category, category))
      .orderBy(desc(goals.updatedAt));
    return this.withMilestones(goalRecords);
  }

  async search(query: string, status?: GoalStatus): Promise<Goal[]> {
    const searchPattern = `%${query}%`;

    const textCondition = or(
      ilike(goals.title, searchPattern),
      ilike(goals.description, searchPattern)
    );

    const whereClause = status
      ? and(textCondition, eq(goals.status, status))
      : textCondition;

    const goalRecords = await this.db
      .select()
      .from(goals)
      .where(whereClause)
      .orderBy(desc(goals.updatedAt));

    return this.withMilestones(goalRecords);
  }

  async create(props: CreateGoalProps): Promise<Goal> {
    const goalId = await this.db.transaction(async (tx) => {
      const [goalRecord] = await tx
        .insert(goals)
        .values({
          title: props.title,
          description: props.description ?? null,
          status: props.status ?? "active",
          category: props.category ?? "other",
          targetDate: props.targetDate ?? null,
        })
        .returning();

      if (props.milestones && props.milestones.length > 0) {
        await tx.insert(milestones).values(
          props.milestones.map((m, i) => ({
            goalId: goalRecord.id,
            title: m.title,
            completed: m.completed ?? false,
            sortOrder: m.sortOrder ?? i,
          }))
        );
      }

      return goalRecord.id;
    });

    return this.findById(goalId) as Promise<Goal>;
  }

  async update(id: string, props: UpdateGoalProps): Promise<Goal | null> {
    const updated = await this.db.transaction(async (tx) => {
      const updateData: Partial<typeof goals.$inferInsert> = { updatedAt: new Date() };

      if (props.title !== undefined) updateData.title = props.title;
      if (props.description !== undefined) updateData.description = props.description;
      if (props.status !== undefined) updateData.status = props.status;
      if (props.category !== undefined) updateData.category = props.category;
      if (props.targetDate !== undefined) updateData.targetDate = props.targetDate;

      const results = await tx
        .update(goals)
        .set(updateData)
        .where(eq(goals.id, id))
        .returning();

      if (!results[0]) return false;

      if (props.milestones !== undefined) {
        await tx.delete(milestones).where(eq(milestones.goalId, id));

        if (props.milestones.length > 0) {
          await tx.insert(milestones).values(
            props.milestones.map((m, i) => ({
              goalId: id,
              title: m.title,
              completed: m.completed ?? false,
              sortOrder: m.sortOrder ?? i,
            }))
          );
        }
      }

      return true;
    });

    if (!updated) return null;
    return this.findById(id);
  }

  async toggleMilestone(goalId: string, milestoneId: string): Promise<Goal | null> {
    const [milestone] = await this.db
      .select()
      .from(milestones)
      .where(and(eq(milestones.id, milestoneId), eq(milestones.goalId, goalId)));

    if (!milestone) return null;

    await this.db
      .update(milestones)
      .set({ completed: !milestone.completed })
      .where(eq(milestones.id, milestoneId));

    await this.db
      .update(goals)
      .set({ updatedAt: new Date() })
      .where(eq(goals.id, goalId));

    return this.findById(goalId);
  }

  async delete(id: string): Promise<boolean> {
    await this.db.delete(goals).where(eq(goals.id, id));
    return true;
  }

  async bulkDelete(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const results = await this.db
      .delete(goals)
      .where(inArray(goals.id, ids))
      .returning();
    return results.length;
  }

  private async withMilestones(
    goalRecords: (typeof goals.$inferSelect)[]
  ): Promise<Goal[]> {
    if (goalRecords.length === 0) return [];

    const goalIds = goalRecords.map((g) => g.id);
    const allMilestones = await this.db
      .select()
      .from(milestones)
      .where(
        or(...goalIds.map((id) => eq(milestones.goalId, id)))!
      )
      .orderBy(asc(milestones.sortOrder));

    const milestonesByGoalId = new Map<string, MilestoneProps[]>();
    for (const m of allMilestones) {
      const list = milestonesByGoalId.get(m.goalId) ?? [];
      list.push({
        id: m.id,
        goalId: m.goalId,
        title: m.title,
        completed: m.completed,
        sortOrder: m.sortOrder,
        createdAt: m.createdAt,
      });
      milestonesByGoalId.set(m.goalId, list);
    }

    return goalRecords.map((record) =>
      Goal.reconstitute({
        id: record.id,
        title: record.title,
        description: record.description,
        status: record.status,
        category: record.category,
        targetDate: record.targetDate,
        milestones: milestonesByGoalId.get(record.id) ?? [],
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      })
    );
  }
}
