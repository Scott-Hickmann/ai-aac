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
  key: string;
  wordSense: string;
  label: string;
  imageUrl: string;
  pictogram: ArasaacPictogram;
  probability?: number;
}

