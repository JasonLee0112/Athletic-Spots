export interface Review {
    id?: string;
    userId: string;
    rating: number;
    reviewText?: string;
    datePosted?: Date;
    helpful?: number;
    notHelpful?: number;
  }