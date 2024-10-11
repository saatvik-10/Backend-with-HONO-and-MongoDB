import { Hono } from 'hono';
import { poweredBy } from 'hono/powered-by';
import { logger } from 'hono/logger';
import dbConnect from './config/connect';
import FavVidsModel from './schema/db';
import { isValidObjectId } from 'mongoose';
import { stream, streamText, streamSSE } from 'hono/streaming';

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

    //View doc by ID

    //1st GET Route
    app.get('/:documentID', async (c) => {
      const id = c.req.param('documentID');
      if (!isValidObjectId(id)) {
        return c.json('Invalid ID', 400);
      }

      const doc = await FavVidsModel.findById(id);
      if (!doc) {
        return c.json('Document not found', 404);
      }
      return c.json(doc.toObject(), 200);
    });

    //2nd GET Route
    app.get('/d/:documentID', async (c) => {
      const id = c.req.param('documentID');
      if (!isValidObjectId(id)) {
        return c.json('Invalid ID', 400);
      }

      const doc = await FavVidsModel.findById(id);
      if (!doc) {
        return c.json('Document not found', 404);
      }

      return streamText(c, async (stream) => {
        stream.onAbort(() => {
          console.log('Aborted!');
        });
        for (let i = 0; i < doc.description.length; i++) {
          await stream.write(doc.description[i]);
          await stream.sleep(100);
        }
      });
    });

    //Update Route
    app.patch('/:documentID', async (c) => {
      const id = c.req.param('documentID');
      if (!isValidObjectId(id)) {
        return c.json('Invalid ID', 400);
      }

      const doc = await FavVidsModel.findById(id);
      if (!doc) {
        return c.json('Document not found', 404);
      }

      const formData = await c.req.json();

      if (!formData.thumbnail) {
        delete formData.thumbnail;
      }

      try {
        const updatedDoc = await FavVidsModel.findByIdAndUpdate(id, formData, {
          new: true, //this will give an updated result
        });
        return c.json(updatedDoc?.toObject(), 200);
      } catch (err) {
        return c.json((err as any)?.message || 'Internal Server Error', 500);
      }
    });

    //Delete Route
    app.delete('/:documentID', async (c) => {
      const id = c.req.param('documentID');
      if (!isValidObjectId) {
        return c.json('Invalid ID', 404);
      }

      try {
        const deletedDoc = await FavVidsModel.findByIdAndDelete(id);
        return c.json(deletedDoc?.toObject(), 200);
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
