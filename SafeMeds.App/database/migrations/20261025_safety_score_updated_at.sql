-- Run once in the Supabase SQL Editor.
-- Safety scores remain manually maintained; this records when a score changes.
alter table public.safe_meds_pharmacies
  add column if not exists safety_score_updated_at timestamptz;

create or replace function public.set_pharmacy_safety_score_updated_at()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.safety_score is not null then
      new.safety_score_updated_at := now();
    end if;
  elsif new.safety_score is distinct from old.safety_score then
    new.safety_score_updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists set_pharmacy_safety_score_updated_at
  on public.safe_meds_pharmacies;

create trigger set_pharmacy_safety_score_updated_at
before insert or update of safety_score on public.safe_meds_pharmacies
for each row
execute function public.set_pharmacy_safety_score_updated_at();