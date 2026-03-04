create or replace view public.saved_properties_with_details as
select
  sp.id,
  sp.user_id,
  sp.property_id,
  sp.created_at as saved_at,
  p.address,
  p.city,
  p.state,
  p."zipCode",
  p.price,
  p.bedrooms,
  p.bathrooms,
  p.sqft,
  p."propertyType",
  p."imageUrl",
  p.status
from public.saved_properties sp
join public.properties p on p.id = sp.property_id;
