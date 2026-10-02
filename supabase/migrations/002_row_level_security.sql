-- ============================================================
-- 002_row_level_security.sql
-- Enable RLS on every table + create per-user policies
-- Users can ONLY access rows where user_id = auth.uid()
-- ============================================================

-- ── profiles ────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: owner select"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "profiles: owner insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles: owner update"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles: owner delete"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ── app_settings ─────────────────────────────────────────────
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings: owner select"
  ON app_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "app_settings: owner insert"
  ON app_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "app_settings: owner update"
  ON app_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "app_settings: owner delete"
  ON app_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ── attendance_records ───────────────────────────────────────
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_records: owner select"
  ON attendance_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "attendance_records: owner insert"
  ON attendance_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "attendance_records: owner update"
  ON attendance_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "attendance_records: owner delete"
  ON attendance_records FOR DELETE
  USING (auth.uid() = user_id);

-- ── company_loans ────────────────────────────────────────────
ALTER TABLE company_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_loans: owner select"
  ON company_loans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "company_loans: owner insert"
  ON company_loans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "company_loans: owner update"
  ON company_loans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "company_loans: owner delete"
  ON company_loans FOR DELETE
  USING (auth.uid() = user_id);

-- ── company_transactions ─────────────────────────────────────
ALTER TABLE company_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "company_transactions: owner select"
  ON company_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "company_transactions: owner insert"
  ON company_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "company_transactions: owner update"
  ON company_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "company_transactions: owner delete"
  ON company_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ── savings_goals ────────────────────────────────────────────
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "savings_goals: owner select"
  ON savings_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "savings_goals: owner insert"
  ON savings_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "savings_goals: owner update"
  ON savings_goals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "savings_goals: owner delete"
  ON savings_goals FOR DELETE
  USING (auth.uid() = user_id);

-- ── pocket_transactions ──────────────────────────────────────
ALTER TABLE pocket_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pocket_transactions: owner select"
  ON pocket_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "pocket_transactions: owner insert"
  ON pocket_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pocket_transactions: owner update"
  ON pocket_transactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pocket_transactions: owner delete"
  ON pocket_transactions FOR DELETE
  USING (auth.uid() = user_id);

-- ── career_records ───────────────────────────────────────────
ALTER TABLE career_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "career_records: owner select"
  ON career_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "career_records: owner insert"
  ON career_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "career_records: owner update"
  ON career_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "career_records: owner delete"
  ON career_records FOR DELETE
  USING (auth.uid() = user_id);
