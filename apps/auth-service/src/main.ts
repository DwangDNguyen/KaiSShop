import express from 'express';
import cors from 'cors';
import { errorMiddleware } from '../../../packages/error-handler/error-middleware';
import cookieParser from 'cookie-parser';
import router from './routes/auth.route';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
const loadJSON = (path: string) => {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(err);
    return {};
  }
};

const swaggerDocument = loadJSON('./apps/auth-service/src/swagger-output.json');
const app = express();

app.use(
  cors({
    origin: ['http://localhost:3000'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send({ message: 'Hello API' });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/docs-json', (req, res) => {
  res.json(swaggerDocument);
});
app.use('/api', router);

app.use(errorMiddleware);

const port = process.env.PORT || 6001;
const server = app.listen(port, () => {
  console.log(`[ ready ] Auth Service is running on http://localhost:${port}`);
  console.log(
    `[ ready ] Swagger is running on http://localhost:${port}/api-docs`
  );
});

server.on('error', (err) => {
  console.error(err);
});

export default server;
