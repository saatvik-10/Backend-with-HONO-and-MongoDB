import { Hono } from 'hono';
import { poweredBy } from 'hono/powered-by';
import { logger } from 'hono/logger';
import dbConnect from './config/connect';
import FavVidsModel from './schema/db';

const app = new Hono();

//middlewares
app.use(poweredBy());
app.use(logger());

dbConnect()
  .then(() => {
    //GET
    app.get('/', async (c) => {
      const docs = await FavVidsModel.find();
      return c.json(docs.map((doc) => doc.toObject(), 200));
    });

    //Creating a document
    app.post('/', async (c) => {
      const formData = await c.req.json();
      if (!formData.thumbnail) {
        delete formData.thumbnail;
      }

      const favVidsObj = new FavVidsModel(formData);
      try {
        const docs = await favVidsObj.save();
        return c.json(docs.toObject(), 201);
      } catch (err) {
        return c.json((err as any)?.message || 'Internal Server Error', 500);
      }
    });
  })
  .catch((err) => {
    app.get('/*', (c) => {
      return c.text(`Error connecting to database: ${err.message}`);
    });
  });

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

app.onError((err, c) => {
  return c.text(`App Error: ${err.message}`);
});

export default app;
