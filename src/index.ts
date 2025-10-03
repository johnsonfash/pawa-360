import cors from "cors"
import dotenv from "dotenv"
import express, { NextFunction, Request, Response } from "express"

dotenv.config()
const app = express()
const PORT = 8000

const notFound = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Not found - ${req.originalUrl}`)
  res.status(404)
  next(error)
}

const webhook = (req: Request, res: Response) => {
  try {
    // If you specified a secret hash, check for the signature
    const secretHash = process.env.FLW_SECRET_HASH;
    const signature = req.headers["flutterwave-signature"];
    if (!signature || (signature !== secretHash)) {
      res.status(401).end();
    }

    console.log('req.body', req.body);

    const { event, data, meta_data } = req.body;
    res.sendStatus(200);

  } catch (err: any) {
    console.error("Flutterwave webhook processing error:", err);
    res.status(500).json({ error: "Webhook handler failed" });
  }
}

app.set('trust proxy', 1);
app.get("/favicon.ico", (_, res) => res.status(204).end())
app.use(cors())

app.get('/', (_, res: Response) => {
  res.send('hello world');
})

app.use("/webhook", express.json({ type: "application/json" }), webhook)

app.use(notFound)

app.listen(PORT, () => {
  console.log(`Example app listening on port http://localhost:${PORT}`);
});
