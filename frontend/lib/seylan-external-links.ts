/**
 * Official Seylan Bank customer surfaces for handoff when live bank flows are completed outside Hub.
 * URLs validated against seylan.lk / seylanbank.lk marketing and IB flows.
 */

export const SEYLAN_LINKS = {
  internetBankingPersonalLogin:
    "https://www.seylanbank.lk/banking-internet-seylan-real/login",
  internetBankingSelfRegister:
    "https://www.seylanbank.lk/banking-internet-seylan-real/user-registration-form",
  internetBankingCorporateLogin: "https://www.seylanbank.lk/corporate/login",
  merchantPortalInfo:
    "https://digital.seylan.lk/index.php/digital-banking-channels/merchant-portal",
  branchLocator: "https://www.seylan.lk/branch-locator",
  mobileBankingIos:
    "https://apps.apple.com/lk/app/seylan-mobile-banking-app/id1061045338",
  mobileBankingAndroid:
    "https://play.google.com/store/apps/details?id=com.fg.seylan&hl=en",
} as const;

export const EXTERNAL_LINK_REL = "noopener noreferrer" as const;
