with cpi_monthly as (
    select
        date_trunc('month', obs_date)::date as obs_month,
        max(case when series_id = 'CPIAUCSL' then value end) as cpi_all,
        max(case when series_id = 'CPIUFDSL' then value end) as cpi_food,
        max(case when series_id = 'CPIENGSL' then value end) as cpi_energy,
        max(case when series_id = 'CPIMEDSL' then value end) as cpi_medical,
        max(case when series_id = 'CUSR0000SAE1' then value end) as cpi_education,
        max(case when series_id = 'CUUR0000SAT1' then value end) as cpi_transportation,
        max(case when series_id = 'CUSR0000SEHA' then value end) as cpi_rent
    from {{ ref('int_fred_topic_classified') }}
    where topic in ('cpi', 'housing')
    group by 1
),

with_yoy as (
    select
        obs_month,
        cpi_all, cpi_food, cpi_energy, cpi_medical, cpi_education, cpi_transportation, cpi_rent,
        round((cpi_all / nullif(lag(cpi_all, 12) over (order by obs_month), 0) - 1) * 100, 2) as cpi_all_yoy,
        round((cpi_food / nullif(lag(cpi_food, 12) over (order by obs_month), 0) - 1) * 100, 2) as cpi_food_yoy,
        round((cpi_energy / nullif(lag(cpi_energy, 12) over (order by obs_month), 0) - 1) * 100, 2) as cpi_energy_yoy,
        round((cpi_medical / nullif(lag(cpi_medical, 12) over (order by obs_month), 0) - 1) * 100, 2) as cpi_medical_yoy,
        round((cpi_education / nullif(lag(cpi_education, 12) over (order by obs_month), 0) - 1) * 100, 2) as cpi_education_yoy,
        round((cpi_transportation / nullif(lag(cpi_transportation, 12) over (order by obs_month), 0) - 1) * 100, 2) as cpi_transportation_yoy,
        round((cpi_rent / nullif(lag(cpi_rent, 12) over (order by obs_month), 0) - 1) * 100, 2) as cpi_rent_yoy,
        round(100.0 * first_value(cpi_all) over (order by obs_month) / nullif(cpi_all, 0), 2) as purchasing_power_index
    from cpi_monthly
    where cpi_all is not null
)

select * from with_yoy
