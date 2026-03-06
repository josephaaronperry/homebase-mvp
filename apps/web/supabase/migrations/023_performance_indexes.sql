-- Performance indexes for common query patterns (schema from SCHEMA.md and existing migrations)

-- Offers: filter by user (buyer), property, status
-- Offers: app uses "userId" (camelCase) per dashboard/offers query
CREATE INDEX IF NOT EXISTS offers_user_id_idx ON public.offers("userId");
CREATE INDEX IF NOT EXISTS offers_property_id_idx ON public.offers(property_id);
CREATE INDEX IF NOT EXISTS offers_status_idx ON public.offers(status);

-- Deals: filter by buyer, seller, status
CREATE INDEX IF NOT EXISTS deals_buyer_id_idx ON public.deals(buyer_id);
CREATE INDEX IF NOT EXISTS deals_seller_id_idx ON public.deals(seller_id);
CREATE INDEX IF NOT EXISTS deals_status_idx ON public.deals(status);

-- KYC submissions: filter by user, status (kyc_submissions_user_id_idx may already exist from 004)
CREATE INDEX IF NOT EXISTS kyc_submissions_user_id_idx ON public.kyc_submissions(user_id);
CREATE INDEX IF NOT EXISTS kyc_submissions_status_idx ON public.kyc_submissions(status);

-- Properties: filter by status, city
CREATE INDEX IF NOT EXISTS properties_status_idx ON public.properties(status);
CREATE INDEX IF NOT EXISTS properties_city_idx ON public.properties(city);

-- Seller listings: filter by user, status (seller_listings_user_id_idx may already exist from 006)
CREATE INDEX IF NOT EXISTS seller_listings_user_id_idx ON public.seller_listings(user_id);
CREATE INDEX IF NOT EXISTS seller_listings_status_idx ON public.seller_listings(status);
