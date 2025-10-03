import { Router } from "express";
import {
  initiatePayment,
  verifyBill,
  billCategories,
  getBillers,
  getBillItems,
} from "./bill.controller";

const router = Router();

router.get("/categories", billCategories); // /api/bills/categories
router.get("/billers", getBillers); // /api/bills/billers?category=ELECTRICITY&country=NG
router.get("/billers/:biller_code/items", getBillItems); // /api/bills/billers/:biller_code/items
router.post("/pay", initiatePayment); // /api/bills/pay
router.get("/verify", verifyBill); // /api/bills/verify?tx_ref=...

export default router;
