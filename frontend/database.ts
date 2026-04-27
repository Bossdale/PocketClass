import * as SQLite from 'expo-sqlite';
import scienceData from './data/g5_sci_q1.json';

// Open the local database (it creates 'pocketclass.db' if it doesn't exist)
const db = SQLite.openDatabaseSync('pocketclass.db');

export const initializeDatabase = async () => {
  try {
    // Execute your entire production schema
    db.execSync(`
                -- =============================================================================
        -- PocketClass Mobile App — Production-Ready SQLite Schema
        -- Hierarchy: Grade Level → Subject → Quarter → Lesson → Concept
        -- Generated from: g5_sci_q1.json (Grade 5 Science, Q1 sample)
        -- Naming Convention: snake_case throughout
        -- =============================================================================

        PRAGMA foreign_keys = ON;
        PRAGMA journal_mode = WAL;   -- Better concurrency for mobile (offline-first)
        PRAGMA synchronous = NORMAL; -- Balance between safety and performance

        -- =============================================================================
        -- SECTION 1: CORE HIERARCHY TABLES
        -- =============================================================================

        -- -----------------------------------------------------------------------------
        -- 1. grade_levels
        --    Root of the hierarchy. Represents a school grade (e.g., Grade 5).
        -- -----------------------------------------------------------------------------
        CREATE TABLE IF NOT EXISTS grade_levels (
            grade_id      INTEGER PRIMARY KEY AUTOINCREMENT,
            grade_level   INTEGER NOT NULL UNIQUE,         -- e.g., 5 (for Grade 5)
            created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
        );

        -- -----------------------------------------------------------------------------
        -- 2. subjects
        --    A subject belongs to a grade level (e.g., "Science" under Grade 5).
        -- -----------------------------------------------------------------------------
        CREATE TABLE IF NOT EXISTS subjects (
            subject_id    INTEGER PRIMARY KEY AUTOINCREMENT,
            grade_id      INTEGER NOT NULL,
            subject_name  TEXT    NOT NULL,               -- e.g., "Science"
            created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),

            CONSTRAINT fk_subjects_grade
                FOREIGN KEY (grade_id)
                REFERENCES grade_levels (grade_id)
                ON DELETE CASCADE,

            CONSTRAINT uq_subject_per_grade
                UNIQUE (grade_id, subject_name)
        );

        -- -----------------------------------------------------------------------------
        -- 3. quarters
        --    A quarter belongs to a subject (e.g., "Q1 — Materials and Matter").
        -- -----------------------------------------------------------------------------
        CREATE TABLE IF NOT EXISTS quarters (
            quarter_id    TEXT    PRIMARY KEY,            -- e.g., "Q1"
            subject_id    INTEGER NOT NULL,
            quarter_name  TEXT    NOT NULL,               -- e.g., "Materials and Matter"
            created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),

            CONSTRAINT fk_quarters_subject
                FOREIGN KEY (subject_id)
                REFERENCES subjects (subject_id)
                ON DELETE CASCADE
        );

        -- -----------------------------------------------------------------------------
        -- 4. lessons
        --    A lesson belongs to a quarter (e.g., "Introduction to Matter in Daily Life").
        -- -----------------------------------------------------------------------------
        CREATE TABLE IF NOT EXISTS lessons (
            lesson_id     TEXT    PRIMARY KEY,            -- e.g., "g5_sci_q1_l1"
            quarter_id    TEXT    NOT NULL,
            title         TEXT    NOT NULL,               -- e.g., "Introduction to Matter in Daily Life"
            created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),

            CONSTRAINT fk_lessons_quarter
                FOREIGN KEY (quarter_id)
                REFERENCES quarters (quarter_id)
                ON DELETE CASCADE
        );

        -- =============================================================================
        -- SECTION 2: CORE CONCEPT TABLE
        -- =============================================================================

        -- -----------------------------------------------------------------------------
        -- 5. concepts
        --    The primary data entity. Each concept belongs to a lesson and captures
        --    the full educational metadata including question-generation context.
        -- -----------------------------------------------------------------------------
        CREATE TABLE IF NOT EXISTS concepts (
            concept_id       TEXT    PRIMARY KEY,         -- e.g., "g5_sci_q1_l1_c1"
            lesson_id        TEXT    NOT NULL,
            concept_name     TEXT    NOT NULL,            -- e.g., "Definition of Matter"
            definition       TEXT    NOT NULL,            -- e.g., "Anything that has mass and takes up space."
            key_fact         TEXT    NOT NULL,            -- e.g., "Everything around us..."
            difficulty       TEXT    NOT NULL             -- Enum: 'easy' | 'medium' | 'hard'
                            CHECK  (difficulty IN ('easy', 'medium', 'hard')),
            answer           TEXT    NOT NULL,            -- e.g., "Matter"
            rationale        TEXT    NOT NULL,            -- Explanation for the correct answer
            concept_type     TEXT    NOT NULL,            -- From metadata.type e.g., "vocabulary", "property"
            blooms_taxonomy  TEXT    NOT NULL             -- From metadata.blooms_taxonomy e.g., "Remembering"
                            CHECK  (blooms_taxonomy IN (
                                        'Remembering', 'Understanding', 'Applying',
                                        'Analyzing', 'Evaluating', 'Creating'
                                    )),
            -- question_generation.variables stored as a JSON string
            -- e.g., '{"verb_phrase": ["has mass and takes up space", "..."]}'
            variables        TEXT    NOT NULL DEFAULT '{}',
            created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at       TEXT    NOT NULL DEFAULT (datetime('now')),

            CONSTRAINT fk_concepts_lesson
                FOREIGN KEY (lesson_id)
                REFERENCES lessons (lesson_id)
                ON DELETE CASCADE
        );

        -- =============================================================================
        -- SECTION 3: NORMALIZED CHILD TABLES (from JSON arrays)
        -- =============================================================================

        -- -----------------------------------------------------------------------------
        -- 6. concept_distractors
        --    Normalized from concepts[].distractors (array of wrong answer choices).
        -- -----------------------------------------------------------------------------
        CREATE TABLE IF NOT EXISTS concept_distractors (
            distractor_id    INTEGER PRIMARY KEY AUTOINCREMENT,
            concept_id       TEXT    NOT NULL,
            distractor_text  TEXT    NOT NULL,            -- e.g., "Energy", "Light"
            sort_order       INTEGER NOT NULL DEFAULT 0,  -- Preserve original array order

            CONSTRAINT fk_distractors_concept
                FOREIGN KEY (concept_id)
                REFERENCES concepts (concept_id)
                ON DELETE CASCADE,

            CONSTRAINT uq_distractor_per_concept
                UNIQUE (concept_id, distractor_text)
        );

        -- -----------------------------------------------------------------------------
        -- 7. concept_tags
        --    Normalized from concepts[].metadata.tags (array of classification labels).
        -- -----------------------------------------------------------------------------
        CREATE TABLE IF NOT EXISTS concept_tags (
            tag_id           INTEGER PRIMARY KEY AUTOINCREMENT,
            concept_id       TEXT    NOT NULL,
            tag              TEXT    NOT NULL,            -- e.g., "core_concept", "measurement"
            sort_order       INTEGER NOT NULL DEFAULT 0,

            CONSTRAINT fk_tags_concept
                FOREIGN KEY (concept_id)
                REFERENCES concepts (concept_id)
                ON DELETE CASCADE,

            CONSTRAINT uq_tag_per_concept
                UNIQUE (concept_id, tag)
        );

        -- -----------------------------------------------------------------------------
        -- 8. concept_supported_formats
        --    Normalized from concepts[].question_generation.supported_formats.
        -- -----------------------------------------------------------------------------
        CREATE TABLE IF NOT EXISTS concept_supported_formats (
            format_id        INTEGER PRIMARY KEY AUTOINCREMENT,
            concept_id       TEXT    NOT NULL,
            format_name      TEXT    NOT NULL             -- e.g., "multiple_choice", "fill_in_the_blank"
                            CHECK  (format_name IN (
                                        'multiple_choice',
                                        'fill_in_the_blank',
                                        'true_false',
                                        'short_answer',
                                        'matching'
                                    )),
            sort_order       INTEGER NOT NULL DEFAULT 0,

            CONSTRAINT fk_formats_concept
                FOREIGN KEY (concept_id)
                REFERENCES concepts (concept_id)
                ON DELETE CASCADE,

            CONSTRAINT uq_format_per_concept
                UNIQUE (concept_id, format_name)
        );

        -- -----------------------------------------------------------------------------
        -- 9. concept_templates
        --    Normalized from concepts[].question_generation.templates (prompt strings).
        -- -----------------------------------------------------------------------------
        CREATE TABLE IF NOT EXISTS concept_templates (
            template_id      INTEGER PRIMARY KEY AUTOINCREMENT,
            concept_id       TEXT    NOT NULL,
            template_text    TEXT    NOT NULL,            -- e.g., "What do we call anything that {verb_phrase}?"
            sort_order       INTEGER NOT NULL DEFAULT 0,  -- Preserve original template ordering

            CONSTRAINT fk_templates_concept
                FOREIGN KEY (concept_id)
                REFERENCES concepts (concept_id)
                ON DELETE CASCADE
        );

        -- =============================================================================
        -- SECTION 4: PERFORMANCE INDEXES
        -- =============================================================================

        -- Hierarchy traversal indexes
        CREATE INDEX IF NOT EXISTS idx_subjects_grade_id
            ON subjects (grade_id);

        CREATE INDEX IF NOT EXISTS idx_quarters_subject_id
            ON quarters (subject_id);

        CREATE INDEX IF NOT EXISTS idx_lessons_quarter_id
            ON lessons (quarter_id);

        CREATE INDEX IF NOT EXISTS idx_concepts_lesson_id
            ON concepts (lesson_id);

        -- Filtering indexes on concepts
        CREATE INDEX IF NOT EXISTS idx_concepts_difficulty
            ON concepts (difficulty);

        CREATE INDEX IF NOT EXISTS idx_concepts_blooms_taxonomy
            ON concepts (blooms_taxonomy);

        CREATE INDEX IF NOT EXISTS idx_concepts_concept_type
            ON concepts (concept_type);

        -- Child table lookup indexes
        CREATE INDEX IF NOT EXISTS idx_distractors_concept_id
            ON concept_distractors (concept_id);

        CREATE INDEX IF NOT EXISTS idx_tags_concept_id
            ON concept_tags (concept_id);

        CREATE INDEX IF NOT EXISTS idx_tags_tag
            ON concept_tags (tag);

        CREATE INDEX IF NOT EXISTS idx_formats_concept_id
            ON concept_supported_formats (concept_id);

        CREATE INDEX IF NOT EXISTS idx_templates_concept_id
            ON concept_templates (concept_id);

        -- =============================================================================
        -- SECTION 5: AUTOMATIC TIMESTAMP TRIGGERS
        -- =============================================================================

        CREATE TRIGGER IF NOT EXISTS trg_grade_levels_updated_at
            AFTER UPDATE ON grade_levels
            FOR EACH ROW
            BEGIN
                UPDATE grade_levels SET updated_at = datetime('now') WHERE grade_id = OLD.grade_id;
            END;

        CREATE TRIGGER IF NOT EXISTS trg_subjects_updated_at
            AFTER UPDATE ON subjects
            FOR EACH ROW
            BEGIN
                UPDATE subjects SET updated_at = datetime('now') WHERE subject_id = OLD.subject_id;
            END;

        CREATE TRIGGER IF NOT EXISTS trg_quarters_updated_at
            AFTER UPDATE ON quarters
            FOR EACH ROW
            BEGIN
                UPDATE quarters SET updated_at = datetime('now') WHERE quarter_id = OLD.quarter_id;
            END;

        CREATE TRIGGER IF NOT EXISTS trg_lessons_updated_at
            AFTER UPDATE ON lessons
            FOR EACH ROW
            BEGIN
                UPDATE lessons SET updated_at = datetime('now') WHERE lesson_id = OLD.lesson_id;
            END;

        CREATE TRIGGER IF NOT EXISTS trg_concepts_updated_at
            AFTER UPDATE ON concepts
            FOR EACH ROW
            BEGIN
                UPDATE concepts SET updated_at = datetime('now') WHERE concept_id = OLD.concept_id;
            END;

        -- =============================================================================
        -- SECTION 6: SAMPLE DATA (from g5_sci_q1.json — first concept only)
        -- =============================================================================

        INSERT OR IGNORE INTO grade_levels (grade_level) VALUES (5);

        INSERT OR IGNORE INTO subjects (grade_id, subject_name)
            VALUES (1, 'Science');

        INSERT OR IGNORE INTO quarters (quarter_id, subject_id, quarter_name)
            VALUES ('Q1', 1, 'Materials and Matter');

        INSERT OR IGNORE INTO lessons (lesson_id, quarter_id, title)
            VALUES ('g5_sci_q1_l1', 'Q1', 'Introduction to Matter in Daily Life');

        INSERT OR IGNORE INTO concepts (
            concept_id, lesson_id, concept_name, definition, key_fact,
            difficulty, answer, rationale, concept_type, blooms_taxonomy, variables
        ) VALUES (
            'g5_sci_q1_l1_c1',
            'g5_sci_q1_l1',
            'Definition of Matter',
            'Anything that has mass and takes up space.',
            'Everything around us that takes up space is matter.',
            'easy',
            'Matter',
            'Matter is fundamentally defined as any physical substance that occupies space (volume) and possesses mass.',
            'vocabulary',
            'Remembering',
            '{"verb_phrase": ["has mass and takes up space", "occupies space and possesses mass"]}'
        );

        INSERT OR IGNORE INTO concept_distractors (concept_id, distractor_text, sort_order)
            VALUES
            ('g5_sci_q1_l1_c1', 'Energy', 0),
            ('g5_sci_q1_l1_c1', 'Light',  1),
            ('g5_sci_q1_l1_c1', 'Sound',  2);

        INSERT OR IGNORE INTO concept_tags (concept_id, tag, sort_order)
            VALUES
            ('g5_sci_q1_l1_c1', 'core_concept', 0),
            ('g5_sci_q1_l1_c1', 'definition',   1);

        INSERT OR IGNORE INTO concept_supported_formats (concept_id, format_name, sort_order)
            VALUES
            ('g5_sci_q1_l1_c1', 'multiple_choice',    0),
            ('g5_sci_q1_l1_c1', 'fill_in_the_blank',  1);

        INSERT OR IGNORE INTO concept_templates (concept_id, template_text, sort_order)
            VALUES
            ('g5_sci_q1_l1_c1', 'What do we call anything that {verb_phrase}?',                    0),
            ('g5_sci_q1_l1_c1', 'In science, what is defined as something that {verb_phrase}?',    1),
            ('g5_sci_q1_l1_c1', 'Which term describes any substance that {verb_phrase}?',          2);

        -- =============================================================================
        -- END OF SCHEMA
        -- =============================================================================

    `);
    console.log("Database schema initialized successfully!");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
};

export const seedDatabaseFromJSON = async () => {
  try {
    // We use a transaction so all inserts happen in one fast batch
    await db.withTransactionAsync(async () => {
      
      // 1. Insert Grade Level
      db.runSync('INSERT OR IGNORE INTO grade_levels (grade_level) VALUES (?)', 
        [scienceData.grade_level]
      );
      // Fetch the generated grade_id to link to the subject
      const gradeRow = db.getFirstSync<{grade_id: number}>(
        'SELECT grade_id FROM grade_levels WHERE grade_level = ?', [scienceData.grade_level]
      );

      if (!gradeRow) return;

      // 2. Insert Subject
      db.runSync('INSERT OR IGNORE INTO subjects (grade_id, subject_name) VALUES (?, ?)', 
        [gradeRow.grade_id, scienceData.subject]
      );
      // Fetch the generated subject_id to link to the quarters
      const subjectRow = db.getFirstSync<{subject_id: number}>(
        'SELECT subject_id FROM subjects WHERE grade_id = ? AND subject_name = ?', 
        [gradeRow.grade_id, scienceData.subject]
      );

      if (!subjectRow) return;

      // 3. Loop through Quarters
      for (const q of scienceData.quarters) {
        db.runSync('INSERT OR IGNORE INTO quarters (quarter_id, subject_id, quarter_name) VALUES (?, ?, ?)', 
          [q.quarter_id, subjectRow.subject_id, q.quarter_name]
        );

        // 4. Loop through Lessons
        for (const l of q.lessons) {
          db.runSync('INSERT OR IGNORE INTO lessons (lesson_id, quarter_id, title) VALUES (?, ?, ?)', 
            [l.lesson_id, q.quarter_id, l.title]
          );

          // 5. Loop through Concepts
          for (const c of l.concepts) {
            db.runSync(`INSERT OR IGNORE INTO concepts 
              (concept_id, lesson_id, concept_name, definition, key_fact, difficulty, answer, rationale, concept_type, blooms_taxonomy, variables) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
              [
                c.concept_id, 
                l.lesson_id, 
                c.concept_name, 
                c.definition, 
                c.key_fact,
                c.difficulty, 
                c.answer, 
                c.rationale, 
                c.metadata.type, 
                c.metadata.blooms_taxonomy,
                JSON.stringify(c.question_generation.variables) // Convert the variables object to a string
              ]
            );

            // 6. Loop through arrays and populate the normalized child tables
            c.distractors.forEach((distractor: string, index: number) => {
              db.runSync('INSERT OR IGNORE INTO concept_distractors (concept_id, distractor_text, sort_order) VALUES (?, ?, ?)', 
                [c.concept_id, distractor, index]);
            });

            c.metadata.tags.forEach((tag: string, index: number) => {
              db.runSync('INSERT OR IGNORE INTO concept_tags (concept_id, tag, sort_order) VALUES (?, ?, ?)', 
                [c.concept_id, tag, index]);
            });

            c.question_generation.supported_formats.forEach((format: string, index: number) => {
              db.runSync('INSERT OR IGNORE INTO concept_supported_formats (concept_id, format_name, sort_order) VALUES (?, ?, ?)', 
                [c.concept_id, format, index]);
            });

            c.question_generation.templates.forEach((template: string, index: number) => {
              db.runSync('INSERT OR IGNORE INTO concept_templates (concept_id, template_text, sort_order) VALUES (?, ?, ?)', 
                [c.concept_id, template, index]);
            });
          }
        }
      }
    });

    console.log("Database successfully seeded with JSON data!");
  } catch (error) {
    console.error("Error seeding the database:", error);
  }
};

// Export the db instance so other files can query it later
export default db;