export type MediaKind = "image" | "video" | "pdf" | "other";

export type MediaRecord = {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  kind: MediaKind;
  sizeBytes: number;
  storage: "db" | "blob" | "public";
  publicUrl: string | null;
  altText: string | null;
  caption: string | null;
  createdAt: string;
  createdBy: string | null;
};

export type CompanyPublic = {
  companyName: string;
  businessLine: string;
  tagline: string;
  aboutShort: string;
  aboutFull: string;
  engineeringFocus: string;
  manufacturingCapabilities: string;
  logoUrl: string;
  faviconUrl: string;
  phones: string[];
  whatsapp: string;
  email: string;
  address: string;
  mapsUrl: string;
  businessHours: string;
  heroTitle: string;
  heroDescription: string;
  heroImageUrl: string;
  heroVideoUrl: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  whyChooseUs: WhyChooseItem[];
  socialLinks: SocialLink[];
  seoTitle: string;
  seoDescription: string;
};

export type WhyChooseItem = {
  id: string;
  title: string;
  body: string;
};

export type SocialLink = {
  id: string;
  label: string;
  url: string;
};

export type SpecRow = {
  id: string;
  label: string;
  value: string;
  sortOrder: number;
  published: boolean;
};

export type MachineCard = {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  model: string | null;
  shortDescription: string | null;
  featured: boolean;
  published: boolean;
  archived: boolean;
  sortOrder: number;
  imageUrl: string | null;
  highlightSpec: SpecRow | null;
};

export type MachineDetail = MachineCard & {
  fullDescription: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  brochureUrl: string | null;
  brochureName: string | null;
  specs: SpecRow[];
  features: { id: string; body: string; sortOrder: number }[];
  applications: { id: string; body: string; sortOrder: number }[];
  images: { id: string; url: string; alt: string; caption: string | null }[];
  videos: {
    id: string;
    url: string;
    posterUrl: string | null;
    caption: string | null;
  }[];
};

export type ServiceItem = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  body: string | null;
  imageUrl: string | null;
  published: boolean;
  sortOrder: number;
};

export type ProjectItem = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  machineName: string | null;
  clientName: string | null;
  location: string | null;
  yearLabel: string | null;
  published: boolean;
  sortOrder: number;
  imageUrl: string | null;
  images: { id: string; url: string; alt: string; caption: string | null }[];
  videos: { id: string; url: string; posterUrl: string | null; caption: string | null }[];
};

export type GalleryItem = {
  id: string;
  mediaId: string;
  url: string;
  kind: MediaKind;
  caption: string | null;
  category: string | null;
  published: boolean;
  sortOrder: number;
  posterUrl: string | null;
};

export type EnquiryStatus =
  | "new"
  | "contacted"
  | "in_progress"
  | "quoted"
  | "won"
  | "closed";

export type EnquiryKind = "contact" | "quote";

export type EnquiryRecord = {
  id: string;
  kind: EnquiryKind;
  fullName: string;
  companyName: string | null;
  phone: string;
  whatsapp: string | null;
  email: string | null;
  machineName: string | null;
  quantity: string | null;
  location: string | null;
  requirements: string | null;
  message: string | null;
  status: EnquiryStatus;
  createdAt: string;
  files: { id: string; name: string; url: string; mimeType: string; sizeBytes: number }[];
};

export const ENQUIRY_STATUSES: { value: EnquiryStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_progress", label: "In Progress" },
  { value: "quoted", label: "Quoted" },
  { value: "won", label: "Won" },
  { value: "closed", label: "Closed" },
];
