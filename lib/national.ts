import nationalJson from "@/data/france-hotels.json";

export interface NationalHotel {
  slug: string;
  name: string;
  stationName: string | null;
  operator: string | null;
  city: string;
  dept: string | null;
  deptCode: string | null;
  postcode: string | null;
  street: string | null;
  lat: number;
  lng: number;
  kw: number | null;
  sockets: string[];
  points: number | null;
  free: boolean;
  hours: string | null;
  reservation: boolean;
  updated: string | null;
  stations: number;
  bookingUrl: string;
}

export interface Department {
  code: string;
  name: string | null;
  count: number;
  bestKw: number;
  cities: number;
}

const data = nationalJson as unknown as {
  generatedAt: string;
  source: string;
  hotels: NationalHotel[];
  departments: Department[];
};

export const nationalHotels = data.hotels;
export const departments = data.departments;
export const nationalSource = data.source;
export const nationalDate = data.generatedAt;

export const deptByCode = (code: string) => departments.find((d) => d.code === code);
export const hotelsInDept = (code: string) => nationalHotels.filter((h) => h.deptCode === code);

/** "Bourgogne" -> "bourgogne" ; le code sert de clé d'URL, le nom d'affichage. */
export const deptSlug = (d: Department) => d.code.toLowerCase();
