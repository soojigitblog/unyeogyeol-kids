/** Public business disclosure. Empty fields are not rendered: never invent review data. */
export const businessConfig = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME?.trim(), representative: process.env.NEXT_PUBLIC_BUSINESS_REPRESENTATIVE?.trim(),
  registrationNo: process.env.NEXT_PUBLIC_BUSINESS_REGISTRATION_NO?.trim(), mailOrderNo: process.env.NEXT_PUBLIC_BUSINESS_MAIL_ORDER_NO?.trim(),
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS?.trim(), email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL?.trim(), support: process.env.NEXT_PUBLIC_BUSINESS_SUPPORT_CONTACT?.trim(),
};
