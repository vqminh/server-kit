export interface Media {
  path: string;
  type?: string;
}

export interface VideoType extends Media {
  id?: string;
  pending?: any;
  duration: number;
  converted?: any;
  convertError?: any;
  videoWidth: number;
  videoHeight: number;
}

export interface PhotoType extends Media {
  src?: any;
  width?: number;
  height?: number;
}

export type MediaType = PhotoType | VideoType;