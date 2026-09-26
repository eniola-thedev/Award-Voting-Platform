-- Sample data for NAQSS AWARD AND PROM NIGHT
-- Safe to run once; uses NOT EXISTS guards so re-running won't duplicate.

do $$
declare
  cat_male uuid;
  cat_female uuid;
  cat_entrepreneur uuid;
  cat_dressed uuid;
begin
  if not exists (select 1 from public.categories where name = 'Best Male Student') then
    insert into public.categories (name, description, status, sort_order)
    values ('Best Male Student', 'The most outstanding male student of the set.', 'active', 1)
    returning id into cat_male;

    insert into public.contestants (category_id, name, contestant_number, description, status) values
      (cat_male, 'John Doe', '#001', 'Final year Computer Science.', 'active'),
      (cat_male, 'Michael Smith', '#002', 'Final year Mechanical Engineering.', 'active'),
      (cat_male, 'David Ade', '#003', 'Final year Software Engineering.', 'active');
  end if;

  if not exists (select 1 from public.categories where name = 'Best Female Student') then
    insert into public.categories (name, description, status, sort_order)
    values ('Best Female Student', 'The most outstanding female student of the set.', 'active', 2)
    returning id into cat_female;

    insert into public.contestants (category_id, name, contestant_number, description, status) values
      (cat_female, 'Grace Johnson', '#001', 'Final year Law.', 'active'),
      (cat_female, 'Amaka Okafor', '#002', 'Final year Accounting.', 'active'),
      (cat_female, 'Zainab Bello', '#003', 'Final year Software Engineering.', 'active');
  end if;

  if not exists (select 1 from public.categories where name = 'Best Entrepreneur') then
    insert into public.categories (name, description, status, sort_order)
    values ('Best Entrepreneur', 'The student with the most impressive business venture.', 'active', 3)
    returning id into cat_entrepreneur;

    insert into public.contestants (category_id, name, contestant_number, description, status) values
      (cat_entrepreneur, 'Sarah Smith', '#001', 'Founder, a campus logistics startup.', 'active'),
      (cat_entrepreneur, 'Tunde Bakare', '#002', 'Runs a thriving thrift fashion brand.', 'active'),
      (cat_entrepreneur, 'Chidi Nwosu', '#003', 'Founder, a student tutoring platform.', 'active');
  end if;

  if not exists (select 1 from public.categories where name = 'Best Dressed') then
    insert into public.categories (name, description, status, sort_order)
    values ('Best Dressed', 'The most stylish student on campus.', 'active', 4)
    returning id into cat_dressed;

    insert into public.contestants (category_id, name, contestant_number, description, status) values
      (cat_dressed, 'David Ade', '#001', 'Known for effortless street style.', 'active'),
      (cat_dressed, 'Faith Eze', '#002', 'Campus fashion icon.', 'active'),
      (cat_dressed, 'Emeka Obi', '#003', 'Always sharp, always on trend.', 'active');
  end if;
end $$;

update public.award_settings
set award_name = 'NAQSS AWARD AND PROM NIGHT',
    description = 'Support your favourite contestant and be part of the NAQSS Award and Prom Night.'
where id = 1;
