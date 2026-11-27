import { x } from "./cycle-x.js";
export const y = (): number => (Math.random() > 2 ? x() : 0);
