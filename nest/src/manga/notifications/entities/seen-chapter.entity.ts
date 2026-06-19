import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * One row per Asura chapter we have already sent a notification for.
 * The PRIMARY KEY on `chapterId` doubles as a distributed lock: the cron
 * INSERT-IGNOREs a row before sending, so a chapter is never notified twice —
 * across PM2 cluster instances and across server restarts.
 */
@Entity({ name: 'seen_chapters' })
export class SeenChapterEntity {
  @PrimaryColumn({ name: 'chapter_id', type: 'varchar', length: 64 })
  chapterId!: string;

  @Column({ name: 'series_slug', type: 'varchar', length: 255, nullable: true })
  seriesSlug!: string | null;

  @Column({ name: 'chapter_number', type: 'varchar', length: 32, nullable: true })
  chapterNumber!: string | null;

  @Column({ name: 'title', type: 'varchar', length: 255, nullable: true })
  title!: string | null;

  @CreateDateColumn({ name: 'seen_at' })
  seenAt!: Date;
}
