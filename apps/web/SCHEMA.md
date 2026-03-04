# Database schema reference

Single source of truth for all Supabase table and column names. Use these exact names in queries.

## properties
id, externalId, source, address, city, state, zipCode, price, bedrooms, bathrooms, sqft, lotSize, yearBuilt, propertyType, status, description, images, features, rawData, listedAt, createdAt, updatedAt, title, zip, image_url, beds, baths, lot_size, property_type, created_at, updated_at, garage, hoa_fee, latitude, longitude, featured, seller_id

Prefer camelCase: zipCode, propertyType, imageUrl (legacy: zip, image_url, property_type).

## users
id, email, phone, fullName, avatarUrl, role, kycStatus, passwordHash, createdAt, updatedAt, is_admin

Use fullName (not full_name), kycStatus (not kyc_status), createdAt (not created_at), avatarUrl (not avatar_url).

## offers
id, userId, propertyId, offerPrice, earnestMoney, downPayment, financingType, contingencies, expirationDate, status, notes, createdAt, updatedAt, earnest_money, closing_date, down_payment_pct, inspection_contingency, financing_contingency, appraisal_contingency, sale_contingency, seller_message, pre_approval_url, transaction_stage, property_id, buyer_id

Use userId and propertyId (camelCase) for original columns. Use buyer_id and property_id when filtering for deals.

## saved_properties
id, userId, propertyId, notes, savedAt

CamelCase: userId, propertyId, savedAt. No created_at.

## showings
id, userId, propertyId, requestedAt, confirmedAt, status, notes, contactInfo, createdAt, updatedAt, tour_type

Mixed: userId, propertyId, createdAt, updatedAt, tour_type.

## seller_listings
id, user_id, property_id, status, created_at

Snake_case.

## buying_pipelines
id, user_id, property_id, offer_id, current_stage, stage_completed_at, created_at, updated_at

Snake_case.

## pre_approvals
id, user_id, employment_type, annual_income, monthly_debts, credit_score_range, down_payment, purchase_timeline, estimated_min, estimated_max, created_at

Snake_case.

## lender_selections
id, user_id, pipeline_id, lender_name, loan_type, rate, estimated_monthly_payment, created_at

Snake_case.

## inspections
id, user_id, pipeline_id, inspector_name, scheduled_date, time_slot, price, status, created_at

Snake_case.

## notifications
id, user_id, type, title, body, read, link, created_at

Snake_case.

## deals
id, property_id, offer_id, buyer_id, seller_id, agreed_price, status, lender_id, created_at, updated_at

Snake_case.

## lenders
id, name, loan_type, apr, points, monthly_payment_per_100k, min_down_payment_pct, active, created_at

Snake_case.
