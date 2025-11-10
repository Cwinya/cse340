-- Insert the following new record to the account table
INSERT INTO public.account(
    account_firstname,
    account_lastname,
    account_email,
    account_password
) VALUES(
    'Tony',
    'Stark',
    'tony@starkent.com',
    'Iam1ron@M@n'
);

-- Modify the Tony Stark record to change the account_type to "Admin"
UPDATE public.account 
    SET account_type = 'Admin'
    WHERE account_id = 1;


-- Delete the Tony Stark record from the database.
DELETE FROM account
WHERE account_id = 1;


-- Modify the "GM Hummer" record to read "a huge interior" rather than "small interiors" using a single query
UPDATE public.inventory
SET inv_description = REPLACE(inv_description, 'small interior', 'a huge interior' )
WHERE inv_model = 'Hummer';


-- Use an inner join to select the make and model fields from the inventory table and the classification name field from the classification table for inventory items that belong to the "Sport" category
SELECT
	inv_make,
	inv_model,
	classification_name
FROM
	inventory AS i
INNER JOIN
	classification AS c ON i.classification_id = c.classification_id
WHERE classification_name = 'Sport';


-- Update all records in the inventory table to add "/vehicles" to the middle of the file path in the inv_image and inv_thumbnail columns using a single query.
UPDATE inventory
SET
    inv_image = REGEXP_REPLACE(inv_image, '([^/]+)$', 'vehicles/\1'),
    inv_thumbnail = REGEXP_REPLACE(inv_thumbnail, '([^/]+)$', 'vehicles/\1');