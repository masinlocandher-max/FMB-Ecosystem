create or replace function public.enforce_news_perspective_separation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.story_type in ('news','advisory','explainer') then
    new.fmb_perspective := null;
    new.perspective_status := 'none';
  elsif new.story_type in ('analysis','opinion') and new.perspective_status <> 'approved' then
    new.perspective_status := case
      when char_length(trim(coalesce(new.fmb_perspective, ''))) >= 1 then 'draft'
      else 'none'
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_news_perspective_separation_trigger on public.news_articles;
create trigger enforce_news_perspective_separation_trigger
before insert or update of story_type, fmb_perspective, perspective_status
on public.news_articles
for each row
execute function public.enforce_news_perspective_separation();

update public.news_articles
set fmb_perspective = null,
    perspective_status = 'none'
where story_type in ('news','advisory','explainer');

comment on function public.enforce_news_perspective_separation() is 'Prevents factual news, advisories, and explainers from carrying an FMB personal perspective.';
