-- Batch 4: Full-text search on properties table

-- Add tsvector column for search (if not exists)
alter table public.properties
  add column if not exists search_vector tsvector;

-- Create GIN index for fast full-text search
create index if not exists properties_search_vector_idx
  on public.properties
  using gin(search_vector);

-- Update trigger function to maintain search_vector
create or replace function public.properties_search_vector_trigger()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.address, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.city, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.state, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.description, '')), 'B');
  return new;
end;
$$ language plpgsql;

-- Drop existing trigger if present
drop trigger if exists properties_search_vector_update on public.properties;

-- Create trigger for new/updated rows
create trigger properties_search_vector_update
  before insert or update
  on public.properties
  for each row
  execute function public.properties_search_vector_trigger();

-- Backfill existing rows
update public.properties
set search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(address, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(city, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(state, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B')
where search_vector is null;

-- Search function: returns matching property ids for a query string
create or replace function public.search_properties(query text)
returns table(id uuid)
language sql
stable
security invoker
as $$
  select p.id
  from public.properties p
  where p.search_vector @@ plainto_tsquery('english', query)
  order by ts_rank(p.search_vector, plainto_tsquery('english', query)) desc;
$$;

grant execute on function public.search_properties(text) to anon, authenticated;
