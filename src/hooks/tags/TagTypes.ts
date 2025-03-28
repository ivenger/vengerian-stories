
export type TagData = {
  name: string;
  translations: {
    en: string;
    he: string;
    ru: string;
  };
};

export interface TagRecord {
  id: string;
  name: string;
  en: string | null;
  he: string | null;
  ru: string | null;
  created_at: string;
  updated_at: string;
}
