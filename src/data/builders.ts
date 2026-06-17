export type BuilderSeed = {
  id: string;
  name: string;
  communityName: string;
  minPrice: number;
  maxPrice: number;
  minBeds: number;
  maxBeds: number;
  bathsMin: number;
  sqftMin: number;
  sqftMax: number;
  schools: string[];
  utilityType: "Gas" | "Electric" | "Mixed";
  taxRate: number;
  hoa: string;
  quickAppeal: string;
  address: string;
  salesCounselorName?: string;
  salesCounselorEmail?: string;
  colorKey?: string;
  sponsored?: boolean;
  locationLat: number;
  locationLon: number;
  active?: boolean;
  dest?: string;
  notes?: string;
};

export const defaultBuilders: BuilderSeed[] = [
  {
    id: "kb-punta-verde",
    name: "KB Home",
    communityName: "Punta Verde",
    minPrice: 239990,
    maxPrice: 320000,
    minBeds: 3,
    maxBeds: 5,
    bathsMin: 2,
    sqftMin: 1243,
    sqftMax: 2246,
    schools: ["Harmony Elementary", "Heritage Middle", "East Central High"],
    utilityType: "Gas",
    taxRate: 2.41,
    hoa: "$360/year",
    quickAppeal: "Fast-growing new-home community with personalization options.",
    address: "10038 Punta Verde Ave, Converse, TX 78109",
    salesCounselorName: "Preferred KB Rep",
    salesCounselorEmail: "builder@example.com",
    colorKey: "kb",
    sponsored: false,
    locationLat: 29.5028,
    locationLon: -98.3218,
    active: true,
    dest: "builder@example.com",
  },
  {
    id: "dr-birch-spencer-ranch",
    name: "D.R. Horton",
    communityName: "Birch at Spencer Ranch",
    minPrice: 299990,
    maxPrice: 430000,
    minBeds: 3,
    maxBeds: 5,
    bathsMin: 2,
    sqftMin: 1500,
    sqftMax: 2800,
    schools: ["Kendall Elementary", "Boerne Middle School North", "Boerne High"],
    utilityType: "Gas",
    taxRate: 2.1,
    hoa: "$600/year",
    quickAppeal: "Boerne location with entry-level new construction pricing.",
    address: "109 Mahogany Rapids, Boerne, TX 78006",
    salesCounselorName: "Preferred DR Rep",
    salesCounselorEmail: "dr@example.com",
    colorKey: "dr",
    sponsored: true,
    locationLat: 29.8033,
    locationLon: -98.7196,
    active: true,
    dest: "dr@example.com",
  },
  {
    id: "perry-esperanza-50",
    name: "Perry Homes",
    communityName: "Esperanza 50'",
    minPrice: 530000,
    maxPrice: 730000,
    minBeds: 3,
    maxBeds: 5,
    bathsMin: 2,
    sqftMin: 2200,
    sqftMax: 3600,
    schools: ["Ferdinand Herff Elementary", "Boerne Middle School South", "Boerne Champion High"],
    utilityType: "Gas",
    taxRate: 2.12,
    hoa: "$750/year",
    quickAppeal: "Perry section in Esperanza with larger one-story and two-story plans.",
    address: "Esperanza, Boerne, TX",
    salesCounselorName: "Preferred Perry Rep",
    salesCounselorEmail: "perry@example.com",
    colorKey: "perry",
    sponsored: false,
    locationLat: 29.7954,
    locationLon: -98.7362,
    active: true,
    dest: "perry@example.com",
  },
  {
    id: "perry-esperanza-60",
    name: "Perry Homes",
    communityName: "Esperanza 60'",
    minPrice: 580000,
    maxPrice: 790000,
    minBeds: 4,
    maxBeds: 5,
    bathsMin: 3,
    sqftMin: 2500,
    sqftMax: 4100,
    schools: ["Ferdinand Herff Elementary", "Boerne Middle School South", "Boerne Champion High"],
    utilityType: "Gas",
    taxRate: 2.12,
    hoa: "$750/year",
    quickAppeal: "Larger 60-foot homesites inside Esperanza with higher-end plan mix.",
    address: "Esperanza, Boerne, TX",
    salesCounselorName: "Preferred Perry Rep",
    salesCounselorEmail: "perry@example.com",
    colorKey: "perry",
    sponsored: false,
    locationLat: 29.7966,
    locationLon: -98.7348,
    active: true,
    dest: "perry@example.com",
  },
  {
    id: "perry-esperanza-80",
    name: "Perry Homes",
    communityName: "Esperanza 80'",
    minPrice: 690000,
    maxPrice: 960000,
    minBeds: 4,
    maxBeds: 5,
    bathsMin: 3,
    sqftMin: 3000,
    sqftMax: 4700,
    schools: ["Ferdinand Herff Elementary", "Boerne Middle School South", "Boerne Champion High"],
    utilityType: "Gas",
    taxRate: 2.12,
    hoa: "$750/year",
    quickAppeal: "Premium oversized homesites in Esperanza for Perry's larger plans.",
    address: "Esperanza, Boerne, TX",
    salesCounselorName: "Preferred Perry Rep",
    salesCounselorEmail: "perry@example.com",
    colorKey: "perry",
    sponsored: false,
    locationLat: 29.7979,
    locationLon: -98.7334,
    active: true,
    dest: "perry@example.com",
  }
];
