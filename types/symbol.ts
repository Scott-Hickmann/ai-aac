export interface ArasaacPictogram {
  _id: number;
  keywords: Array<{
    keyword: string;
    type: number;
    plural?: string;
  }>;
  categories?: string[];
  tags?: string[];
}

export interface Symbol {
  id: string;
  name: string;
  imageUrl: string;
  label: string;
  pictogram: ArasaacPictogram;
}

