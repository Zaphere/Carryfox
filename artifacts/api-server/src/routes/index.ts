import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quotesRouter from "./quotes";
import bookingsRouter from "./bookings";
import driversRouter from "./drivers";
import vehiclesRouter from "./vehicles";
import trackingRouter from "./tracking";
import servicesRouter from "./services";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quotesRouter);
router.use(bookingsRouter);
router.use(driversRouter);
router.use(vehiclesRouter);
router.use(trackingRouter);
router.use(servicesRouter);
router.use(dashboardRouter);

export default router;
