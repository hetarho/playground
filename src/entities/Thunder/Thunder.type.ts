import { ThunderLinePoint } from './ThunderLinePoint';

export type ThunderData = {
  amplitude: number;
  frequency: number;
  startPoint: ThunderLinePoint;
  endPoint: ThunderLinePoint;
  color: string;
  width: number;
};
