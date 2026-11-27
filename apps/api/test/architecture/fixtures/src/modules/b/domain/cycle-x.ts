import { y } from "./cycle-y.js";
export const x = (): number => y() + 1;
