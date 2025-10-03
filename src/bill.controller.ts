import axios from "axios";
import { Request, Response } from "express";

const FLW_BASE = "https://api.flutterwave.com/v3";

/**
 * GET /api/bills/categories
 * - optional query: country (default NG)
 */
export async function billCategories(req: Request, res: Response) {
  try {
    const country = (req.query.country as string) || "NG";
    const r = await axios.get(`${FLW_BASE}/top-bill-categories`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      params: { country },
    });
    return res.status(r.status).json(r.data);
  } catch (err: any) {
    console.error("billCategories error:", err.response?.data || err.message);
    return res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data || err.message });
  }
}

/**
 * GET /api/bills/billers?category=ELECTRICITY&country=NG
 * - If category provided we call the category-specific endpoint otherwise
 *   fallback to /billers (all agencies)
 */
export async function getBillers(req: Request, res: Response) {
  try {
    const category = (req.query.category as string) || undefined;
    const country = (req.query.country as string) || "NG";

    let url = `${FLW_BASE}/billers`;
    const config: any = {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      params: { country },
    };

    if (category) {
      // prefer category-specific endpoint (docs show /bills/{category}/billers)
      url = `${FLW_BASE}/bills/${encodeURIComponent(category)}/billers`;
      // keep country param
    }

    const r = await axios.get(url, config);
    return res.status(r.status).json(r.data);
  } catch (err: any) {
    console.error("getBillers error:", err.response?.data || err.message);
    return res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data || err.message });
  }
}

/**
 * GET /api/bills/billers/:biller_code/items
 * - fetch items (products/packages) for a biller (returns item/product codes)
 */
export async function getBillItems(req: Request, res: Response) {
  const biller_code = req.params.biller_code;
  if (!biller_code) return res.status(400).json({ error: "biller_code required" });

  try {
    const r = await axios.get(`${FLW_BASE}/billers/${encodeURIComponent(biller_code)}/items`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
    });
    return res.status(r.status).json(r.data);
  } catch (err: any) {
    console.error("getBillItems error:", err.response?.data || err.message);
    return res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data || err.message });
  }
}

/**
 * POST /api/bills/pay
 * body expects:
 * {
 *   "biller_code": "BILxxx",
 *   "item_code": "ITEMxxx",    // required: product/item id from /items endpoint
 *   "amount": 1000,
 *   "customer": "meter_or_account_number",
 *   "customer_email": "a@b.com",     // optional but recommended
 *   "customer_name": "Full name",    // optional
 *   "tx_ref": "your-unique-ref-123",
 *   "currency": "NGN",               // optional
 *   "country": "NG",                 // optional
 *   "callback_url": "https://yourdomain.com/webhook/flutterwave", // optional override
 *   "metadata": { ... }              // optional
 * }
 */
export async function initiatePayment(req: Request, res: Response) {
  const {
    biller_code,
    item_code,
    amount,
    customer,
    customer_email,
    customer_name,
    tx_ref,
    callback_url,
    currency,
    country,
    metadata,
  } = req.body;

  if (!biller_code || !item_code || !amount || !tx_ref) {
    return res.status(400).json({
      error: "biller_code, item_code, amount and tx_ref are required",
    });
  }

  try {
    // Build payload - Flutterwave accepts slightly different keys depending on the biller.
    // This is a general payload. If a biller needs specific keys (eg credentials),
    // include them in metadata or adapt the payload per biller.
    const payload: any = {
      amount: amount.toString(),
      tx_ref,
      currency: currency || "NGN",
      country: country || "NG",
      customer: {
        name: customer_name || customer || "Customer",
        email: customer_email,
      },
      customer_number: customer || undefined,
      callback_url: callback_url || process.env.WEBHOOK_URL,
      metadata: metadata || undefined,
    };

    // Remove undefined values
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const url = `${FLW_BASE}/billers/${encodeURIComponent(biller_code)}/items/${encodeURIComponent(item_code)}/payment`;

    const r = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    return res.status(r.status).json(r.data);
  } catch (err: any) {
    console.error("initiatePayment error:", err.response?.data || err.message);
    return res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data || err.message });
  }
}

/**
 * GET /api/bills/verify?tx_ref=...
 * Verify a transaction using the transactions verify_by_reference endpoint
 */
export async function verifyBill(req: Request, res: Response) {
  const tx_ref = req.query.tx_ref as string;
  if (!tx_ref) {
    return res.status(400).json({ error: "tx_ref is required" });
  }

  try {
    const r = await axios.get(`${FLW_BASE}/transactions/verify_by_reference`, {
      headers: { Authorization: `Bearer ${process.env.FLW_SECRET_KEY}` },
      params: { tx_ref },
    });
    return res.status(r.status).json(r.data);
  } catch (err: any) {
    console.error("verifyBill error:", err.response?.data || err.message);
    return res
      .status(err.response?.status || 500)
      .json({ error: err.response?.data || err.message });
  }
}
