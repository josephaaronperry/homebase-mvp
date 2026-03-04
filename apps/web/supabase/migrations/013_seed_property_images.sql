-- Seed real property images for the 8 seeded properties (Unsplash house photos)
update public.properties set image_url = 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop' where address like '%Palm Canyon%';
update public.properties set image_url = 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop' where address like '%Lakeview%';
update public.properties set image_url = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&auto=format&fit=crop' where address like '%Magnolia%';
update public.properties set image_url = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop' where address like '%Oakridge%';
update public.properties set image_url = 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800&auto=format&fit=crop' where address like '%Riverside%';
update public.properties set image_url = 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&auto=format&fit=crop' where address like '%Sunset%';
update public.properties set image_url = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop' where address like '%Harbor%';
update public.properties set image_url = 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&auto=format&fit=crop' where address like '%Canyon%';
