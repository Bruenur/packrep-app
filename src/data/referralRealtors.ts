export type ReferralRealtor = {
  id: string;
  name: string;
  brokerage: string;
  city: string;
  state: string;
  email: string;
  phone?: string;
  notes?: string;
};

export const referralRealtors: ReferralRealtor[] = [
  {
    id: 'rr-orlando-1',
    name: 'Avery Flores',
    brokerage: 'Sunline Realty',
    city: 'Orlando',
    state: 'FL',
    email: 'avery@sunlinerealty.com',
    phone: '407-555-0188',
    notes: 'Relocation-friendly, strong with family buyers and school-area moves.',
  },
  {
    id: 'rr-tampa-1',
    name: 'Mia Gonzalez',
    brokerage: 'Bay Coast Homes',
    city: 'Tampa',
    state: 'FL',
    email: 'mia@baycoasthomes.com',
    phone: '813-555-0112',
    notes: 'Fast follow-up and good builder relationships across Tampa suburbs.',
  },
  {
    id: 'rr-miami-1',
    name: 'Jordan Vega',
    brokerage: 'Palm Route Realty',
    city: 'Miami',
    state: 'FL',
    email: 'jordan@palmroute.com',
    phone: '305-555-0117',
    notes: 'Handles out-of-state transfers and luxury/new-construction mix.',
  },
  {
    id: 'rr-jacksonville-1',
    name: 'Seth Carter',
    brokerage: 'North River Realty',
    city: 'Jacksonville',
    state: 'FL',
    email: 'seth@northriverrealty.com',
    phone: '904-555-0141',
    notes: 'Strong with military relocation and broader radius home search.',
  },
  {
    id: 'rr-sanantonio-1',
    name: 'Local Verified Realtor',
    brokerage: 'PackRep Network',
    city: 'San Antonio',
    state: 'TX',
    email: 'sa-referrals@packrep.local',
    phone: '210-555-0101',
    notes: 'Local fallback referral row for testing PackRep referral flows.',
  },
];
