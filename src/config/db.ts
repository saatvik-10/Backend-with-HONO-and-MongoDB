import { Schema, model } from 'mongoose';

export interface FavVidsSchema {
  title: string;
  description: string;
  watched: boolean;
  creatorName: string;
  thumbnail: string;
}

const FavVidsSchema = new Schema<FavVidsSchema>({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  watched: {
    type: Boolean,
    required: true,
    default: false,
  },
  creatorName: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: false,
    default:
      'https://cloudfront-us-east-2.images.arcpublishing.com/reuters/TVO76CDW5VOCXOIYBW67B76BVY.jpg',
  },
});

const FavVidsModel = model('FavVids', FavVidsSchema);

export default FavVidsModel;
