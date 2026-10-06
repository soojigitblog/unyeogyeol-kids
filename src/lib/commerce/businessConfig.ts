/** Public business disclosure. Empty fields are not rendered: never invent review data. */
export const businessConfig = {
  name: process.env.BUSINESS_NAME?.trim(), representative: process.env.BUSINESS_OWNER?.trim(),
  registrationNo: process.env.BUSINESS_REGISTRATION_NUMBER?.trim(), mailOrderNo: process.env.ECOMMERCE_REGISTRATION_NUMBER?.trim(),
  address: process.env.BUSINESS_ADDRESS?.trim(), email: process.env.CUSTOMER_SERVICE_EMAIL?.trim(), support: process.env.CUSTOMER_SERVICE_PHONE?.trim(),
};
